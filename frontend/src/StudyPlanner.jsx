import { useState, useRef, useCallback, useEffect } from "react";
import { Pencil, Zap, RotateCcw } from "lucide-react";

const HOUR_HEIGHT = 80;
const START_HOUR = 6;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_KEYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const PALETTE = [
  "#31487A", "#7B5EA7", "#4ecdc4", "#ff6b6b",
  "#fdcb6e", "#55efc4", "#fd79a8", "#74b9ff",
  "#a29bfe", "#e17055", "#00b894", "#6c5ce7",
];

function getWeekDates(baseDate) {
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatTime(hour, minute = 0) {
  const h = Math.floor(hour);
  const m = minute || (hour % 1) * 60;
  return `${String(h).padStart(2, "0")}:${String(Math.round(m)).padStart(2, "0")}`;
}

function pxToHour(px) { return px / HOUR_HEIGHT + START_HOUR; }
function hourToPx(hour) { return (hour - START_HOUR) * HOUR_HEIGHT; }
function snapToHalf(hour) { return Math.round(hour * 2) / 2; }
function isToday(date) { return date.toDateString() === new Date().toDateString(); }

function slotsOverlap(a, b) {
  return a.startHour < b.endHour && a.endHour > b.startHour;
}

const API_BASE = "http://localhost:8080";
const USER_ID = 1;

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
  } catch {
    return null;
  }
}

function buildSchedulerSettings(availability) {
  const result = {};
  for (const [dayKey, slots] of Object.entries(availability)) {
    if (!slots || slots.length === 0) continue;
    result[dayKey] = {
      slots: slots.map(s => ({
        start: formatTime(s.startHour) + ":00",
        end:   formatTime(s.endHour)   + ":00",
      })),
    };
  }
  return { availability: result };
}


function normalizeBlock(block) {
  let startTime = block.startTime;
  
  if (Array.isArray(startTime)) {
    const [h, m, s = 0] = startTime;
    startTime = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  return { ...block, startTime };
}

function normalizeWeeklyData(data) {
  if (!data) return {};
  const normalized = {};
  for (const [day, blocks] of Object.entries(data)) {
    normalized[day] = blocks.map(normalizeBlock);
  }
  return normalized;
}

function TimeGutter() {
  return (
      <div className="sp-time-gutter">
        {Array.from({ length: TOTAL_HOURS }, (_, i) => {
          const hour = START_HOUR + i;
          if (hour === START_HOUR) return <div key={hour} className="sp-time-label" style={{ top: 0 }} />;
          return (
              <div key={hour} className="sp-time-label" style={{ top: hourToPx(hour) }}>
                <span>{hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}</span>
              </div>
          );
        })}
      </div>
  );
}

function StudyBlockEvent({ block, color, onComplete, onDelete, onUncomplete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const top = hourToPx(parseFloat(block.startTime.split(":")[0]) + parseFloat(block.startTime.split(":")[1]) / 60);
  const height = Math.max(block.duration * HOUR_HEIGHT - 4, 20);

  return (
      <div
          className={`sp-study-block ${block.completed ? "completed" : ""}`}
          style={{
            top: top + 2, height,
            background: block.completed ? "rgba(49,72,122,0.05)" : color + "22",
            borderLeft: `3px solid ${block.completed ? "#ccc" : color}`,
          }}
          onClick={() => setShowMenu(!showMenu)}
      >
        <div className="sp-block-title" style={{ color: block.completed ? "#aaa" : color }}>
          {block.completed && <span>✓ </span>}
          {block.course || "Study"}
        </div>
        <div className="sp-block-time">
          {block.startTime.slice(0, 5)} · {block.duration}h
        </div>
        {showMenu && (
            <div className="sp-block-menu" onClick={e => e.stopPropagation()}>
              {!block.completed
                  ? <button onClick={() => { onComplete(block.id); setShowMenu(false); }}>✓ Complete</button>
                  : <button onClick={() => { onUncomplete(block.id); setShowMenu(false); }}>↩ Undo</button>
              }
              <button onClick={() => { onEdit(block); setShowMenu(false); }}><Pencil size={13} style={{verticalAlign:"middle",marginRight:4}}/>Edit</button>
              <button className="danger" onClick={() => { onDelete(block.id); setShowMenu(false); }}>✕ Delete</button>
            </div>
        )}
      </div>
  );
}

function EditBlockModal({ block, onClose, onSave }) {
  const [startTime, setStartTime] = useState(block.startTime.slice(0, 5));
  const [duration, setDuration]   = useState(String(block.duration));

  const handleSave = () => {
    const [h, m] = startTime.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const dur = parseFloat(duration);
    if (!dur || dur <= 0) return;
    onSave(block.id, { startTime: startTime + ":00", duration: dur });
    onClose();
  };

  return (
      <div className="sp-modal-backdrop" onClick={onClose}>
        <div className="sp-modal" onClick={e => e.stopPropagation()}>
          <h2>Edit Block</h2>
          <p>{block.course || "Study block"}</p>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#2a2050", marginBottom: 6 }}>
              Start Time
            </label>
            <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #E0E0E8", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2a2050", outline: "none" }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#2a2050", marginBottom: 6 }}>
              Duration (hours)
            </label>
            <input
                type="number"
                value={duration}
                min="0.5"
                max="8"
                step="0.5"
                onChange={e => setDuration(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #E0E0E8", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2a2050", outline: "none" }}
            />
          </div>
          <div className="sp-modal-actions">
            <button className="sp-btn sp-btn-ghost" onClick={onClose}>Cancel</button>
            <button className="sp-btn sp-btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
  );
}

function AvailabilitySlot({ slot, dayKey, onDelete }) {
  const top = hourToPx(slot.startHour);
  const height = (slot.endHour - slot.startHour) * HOUR_HEIGHT;
  return (
      <div
          className="sp-avail-slot"
          style={{ top: top + 2, height: Math.max(height - 4, 10) }}
          title={`${formatTime(slot.startHour)} – ${formatTime(slot.endHour)}`}
      >
        <span className="sp-slot-time">{formatTime(slot.startHour)}–{formatTime(slot.endHour)}</span>
        <button className="sp-slot-delete" onClick={() => onDelete(dayKey, slot.id)}>×</button>
      </div>
  );
}

function DayColumn({
                     date, dayKey, blocks, colorMap,
                     availabilitySlots, onCompleteBlock, onDeleteBlock, onUncompleteBlock,
                     onAddSlot, onDeleteSlot, isAvailabilityMode, onEditBlock,
                   }) {
  const columnRef = useRef(null);
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const getHourFromEvent = useCallback((e) => {
    const rect = columnRef.current.getBoundingClientRect();
    return snapToHalf(pxToHour(e.clientY - rect.top));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!isAvailabilityMode) return;
    if (e.target.closest(".sp-avail-slot") || e.target.closest(".sp-study-block")) return;
    e.preventDefault();
    const startHour = getHourFromEvent(e);
    dragRef.current = { startHour, endHour: startHour + 0.5 };
    setDragging({ startHour, endHour: startHour + 0.5 });
  }, [isAvailabilityMode, getHourFromEvent]);

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current) return;
    const currentHour = getHourFromEvent(e);
    const endHour = Math.max(snapToHalf(currentHour), dragRef.current.startHour + 0.5);
    dragRef.current.endHour = endHour;
    setDragging({ startHour: dragRef.current.startHour, endHour });
  }, [getHourFromEvent]);

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return;
    const { startHour, endHour } = dragRef.current;
    if (endHour - startHour >= 0.5) {
      onAddSlot(dayKey, { startHour, endHour, id: Date.now() });
    }
    dragRef.current = null;
    setDragging(null);
  }, [dayKey, onAddSlot]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
      <div
          className={`sp-day-column ${isToday(date) ? "today" : ""} ${isAvailabilityMode ? "avail-mode" : ""}`}
          ref={columnRef}
          onMouseDown={handleMouseDown}
      >
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div key={i} className="sp-hour-line" style={{ top: i * HOUR_HEIGHT }} />
        ))}
        {(availabilitySlots || []).map(slot => (
            <AvailabilitySlot key={slot.id} slot={slot} dayKey={dayKey} onDelete={onDeleteSlot} />
        ))}
        {dragging && (
            <div className="sp-drag-preview" style={{
              top: hourToPx(dragging.startHour) + 2,
              height: (dragging.endHour - dragging.startHour) * HOUR_HEIGHT - 4,
            }}>
              {formatTime(dragging.startHour)} – {formatTime(dragging.endHour)}
            </div>
        )}
        {(blocks || []).map(block => (
            <StudyBlockEvent
                key={block.id}
                block={block}
                color={colorMap[block.studyPlanEntryId] || "#31487A"}
                onComplete={onCompleteBlock}
                onDelete={onDeleteBlock}
                onUncomplete={onUncompleteBlock}
                onEdit={onEditBlock}
            />
        ))}
      </div>
  );
}

function EntryPanel({ entries, onAdd, onDelete, colorMap, onColorChange, userId }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  useEffect(() => {
    apiFetch(`/api/tasks/${userId}/list-all`).then(data => {
      if (data) setTasks(data);
    });
  }, [userId]);

  const selectedTask = tasks.find(t => String(t.id) === String(selectedTaskId));
  const addedTaskIds = new Set(entries.map(e => String(e.taskId)));
  const availableTasks = tasks.filter(t => !addedTaskIds.has(String(t.id)));

  const priorityColor = p => p === "HIGH" ? "#c0392b" : p === "MEDIUM" ? "#b7680a" : "#2d7a4a";
  const priorityBg    = p => p === "HIGH" ? "#fef0f0" : p === "MEDIUM" ? "#fef9ee" : "#eef7f0";

  const handleAdd = () => {
    if (!selectedTask) return;
    onAdd({
      name: `${selectedTask.course} — ${selectedTask.title}`,
      taskId: selectedTask.id,
      workload: selectedTask.priority === "HIGH" ? "heavy"
          : selectedTask.priority === "MEDIUM" ? "medium" : "light",
      hoursPerWeek: parseFloat(hoursPerWeek) || 2,
      color,
    });
    setSelectedTaskId("");
    setHoursPerWeek("");
    setColor(PALETTE[(entries.length + 1) % PALETTE.length]);
  };

  return (
      <div className="sp-entry-panel">
        <div className="sp-panel-title">Study Entries</div>

        <div className="sp-entry-form">
          {availableTasks.length === 0 && tasks.length === 0 && (
              <div className="sp-empty-hint" style={{ marginBottom: 8 }}>
                No tasks found. Add tasks in the Task Manager first.
              </div>
          )}
          {availableTasks.length === 0 && tasks.length > 0 && (
              <div className="sp-empty-hint" style={{ marginBottom: 8 }}>
                All your tasks are already added.
              </div>
          )}
          {availableTasks.length > 0 && (
              <select
                  className="sp-input sp-select"
                  value={selectedTaskId}
                  onChange={e => setSelectedTaskId(e.target.value)}
              >
                <option value="">— Pick a task —</option>
                {availableTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.course}] {t.title}
                    </option>
                ))}
              </select>
          )}

          {selectedTask && (
              <div className="sp-task-preview">
                <div className="sp-task-preview-row">
                  <span className="sp-task-course">{selectedTask.course}</span>
                  <span className="sp-workload-badge" style={{
                    background: priorityBg(selectedTask.priority),
                    color: priorityColor(selectedTask.priority),
                  }}>{selectedTask.priority}</span>
                </div>
                <div className="sp-task-title">{selectedTask.title}</div>
                <div className="sp-task-deadline">
                  Due: {selectedTask.deadline}
                </div>
              </div>
          )}

          <input
              className="sp-input"
              type="number"
              placeholder="Hours per week"
              min="0.5"
              max="40"
              step="0.5"
              value={hoursPerWeek}
              onChange={e => setHoursPerWeek(e.target.value)}
          />

          <div className="sp-color-row">
            {PALETTE.map(c => (
                <button
                    key={c}
                    className={`sp-color-dot ${color === c ? "selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                />
            ))}
          </div>
          <button className="sp-add-btn" onClick={handleAdd} disabled={!selectedTask || !hoursPerWeek}>
            + Add Entry
          </button>
        </div>

        <div className="sp-entry-list">
          {entries.length === 0 && (
              <div className="sp-empty-hint">No entries yet. Add a course above.</div>
          )}
          {entries.map(entry => (
              <div key={entry.id} className="sp-entry-item">
                <div className="sp-entry-color-col">
                  <div className="sp-entry-swatch" style={{ background: colorMap[entry.id] || entry.color }}>
                    <div className="sp-swatch-picker">
                      {PALETTE.map(c => (
                          <button
                              key={c}
                              className="sp-color-dot"
                              style={{ background: c }}
                              onClick={() => onColorChange(entry.id, c)}
                          />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="sp-entry-info">
                  <div className="sp-entry-name">{entry.name}</div>
                  <div className="sp-entry-meta">
                    <span className={`sp-workload-badge ${entry.workload}`}>{entry.workload}</span>
                    {entry.hoursPerWeek && <span className="sp-hours-badge">{entry.hoursPerWeek}h/wk</span>}
                  </div>
                </div>
                <button className="sp-entry-delete" onClick={() => onDelete(entry.id)}>×</button>
              </div>
          ))}
        </div>
      </div>
  );
}

function SlotPanel({ availability, onDeleteSlot, onClearAll }) {
  const allSlots = Object.entries(availability).flatMap(([dayKey, slots]) =>
      slots.map(s => ({ ...s, dayKey }))
  );

  return (
      <div className="sp-slot-panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="sp-panel-title" style={{ marginBottom: 0 }}>Availability Slots</div>
          {allSlots.length > 0 && (
              <button className="sp-clear-btn" onClick={onClearAll}>Clear all</button>
          )}
        </div>
        {allSlots.length === 0 && (
            <div className="sp-empty-hint">Drag on the calendar to add free slots.</div>
        )}
        {allSlots.map(slot => (
            <div key={slot.id} className="sp-slot-row">
              <div className="sp-slot-day">{slot.dayKey.slice(0, 3)}</div>
              <div className="sp-slot-time-text">{formatTime(slot.startHour)} – {formatTime(slot.endHour)}</div>
              <button className="sp-entry-delete" onClick={() => onDeleteSlot(slot.dayKey, slot.id)}>×</button>
            </div>
        ))}
      </div>
  );
}

export default function StudyPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekBlocks, setWeekBlocks] = useState({});
  const [availability, setAvailability] = useState({});
  const [isAvailabilityMode, setIsAvailabilityMode] = useState(false);
  const [colorMap, setColorMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [entries, setEntries] = useState([]);
  const [activePanel, setActivePanel] = useState("entries"); // "entries" | "slots"
  const [editingBlock, setEditingBlock] = useState(null);

  const weekDates = getWeekDates(currentDate);
  const weekStart = weekDates[0].toISOString().split("T")[0];

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

 
  const loadEntries = useCallback(async () => {
    const data = await apiFetch(`/api/study-plan/${USER_ID}/entries`);
    if (data && data.length > 0) {
      const mapped = data.map((entry, i) => ({
        id: entry.id,
        taskId: entry.task?.id,
  
        name: entry.task?.course
            ? `${entry.task.course} — ${entry.task.title}`
            : `Entry ${entry.id}`,
        workload: entry.estimatedWorkload >= 8 ? "heavy"
            : entry.estimatedWorkload >= 4 ? "medium" : "light",
        hoursPerWeek: entry.estimatedWorkload,
        completedHours: entry.completedHours,
        color: PALETTE[i % PALETTE.length],
      }));
      setEntries(mapped);
      setColorMap(Object.fromEntries(mapped.map(e => [e.id, e.color])));
    }
  }, []);

  const loadWeeklyView = useCallback(async () => {
    setLoading(true);
    const data = await apiFetch(`/api/study-plan/${USER_ID}/weekly?weekStart=${weekStart}`);
    if (data) {
      setWeekBlocks(normalizeWeeklyData(data));
    } else {
      setWeekBlocks({
        MONDAY: [
          { id: 1, studyPlanEntryId: 1, startTime: "09:00:00", duration: 2, completed: false, course: "Mathematics" },
          { id: 2, studyPlanEntryId: 2, startTime: "14:00:00", duration: 1.5, completed: true, course: "Physics" },
        ],
        WEDNESDAY: [
          { id: 3, studyPlanEntryId: 1, startTime: "10:00:00", duration: 3, completed: false, course: "Mathematics" },
        ],
        FRIDAY: [
          { id: 4, studyPlanEntryId: 3, startTime: "15:00:00", duration: 2, completed: false, course: "History" },
          { id: 5, studyPlanEntryId: 2, startTime: "09:00:00", duration: 1, completed: false, course: "Physics" },
        ],
      });
      setColorMap({ 1: "#31487A", 2: "#7B5EA7", 3: "#4ecdc4" });
      setEntries([
        { id: 1, name: "Mathematics", workload: "heavy", hoursPerWeek: 6, color: "#31487A" },
        { id: 2, name: "Physics", workload: "medium", hoursPerWeek: 4, color: "#7B5EA7" },
        { id: 3, name: "History", workload: "light", hoursPerWeek: 2, color: "#4ecdc4" },
      ]);
    }
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    loadEntries();
    loadWeeklyView();
  }, [weekStart]);

  const handleCompleteBlock = useCallback(async (blockId) => {
    await apiFetch(`/api/study-plan/blocks/${blockId}/complete`, { method: "PATCH" });
    setWeekBlocks(prev => {
      const next = {};
      for (const [day, blocks] of Object.entries(prev))
        next[day] = blocks.map(b => b.id === blockId ? { ...b, completed: true } : b);
      return next;
    });
    showToast("Marked complete ✓", "success");
  }, [showToast]);

  const handleUncompleteBlock = useCallback(async (blockId) => {
    await apiFetch(`/api/study-plan/blocks/${blockId}/uncomplete`, { method: "PATCH" });
    setWeekBlocks(prev => {
      const next = {};
      for (const [day, blocks] of Object.entries(prev))
        next[day] = blocks.map(b => b.id === blockId ? { ...b, completed: false } : b);
      return next;
    });
  }, []);

  const handleDeleteBlock = useCallback(async (blockId) => {
    await apiFetch(`/api/study-plan/blocks/${blockId}`, { method: "DELETE" });
    setWeekBlocks(prev => {
      const next = {};
      for (const [day, blocks] of Object.entries(prev))
        next[day] = blocks.filter(b => b.id !== blockId);
      return next;
    });
    showToast("Block deleted", "info");
  }, [showToast]);

  const handleSaveEditedBlock = useCallback(async (blockId, changes) => {
    const res = await apiFetch(`/api/study-plan/blocks/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    setWeekBlocks(prev => {
      const next = {};
      for (const [day, blocks] of Object.entries(prev))
        next[day] = blocks.map(b => b.id === blockId ? { ...b, ...changes } : b);
      return next;
    });
    showToast("Block updated", "success");
  }, [showToast]);

  const handleAddSlot = useCallback((dayKey, newSlot) => {
    setAvailability(prev => {
      const existing = prev[dayKey] || [];
      const overlaps = existing.some(s => slotsOverlap(s, newSlot));
      if (overlaps) {
        showToast("Slots can't overlap — adjust the existing one first", "error");
        return prev;
      }
      return { ...prev, [dayKey]: [...existing, newSlot] };
    });
  }, [showToast]);

  const handleDeleteSlot = useCallback((dayKey, slotId) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter(s => s.id !== slotId),
    }));
  }, []);

  const handleClearAllSlots = useCallback(() => {
    setAvailability({});
    showToast("All slots cleared", "info");
  }, [showToast]);

  const handleAddEntry = useCallback(async (entry) => {
    if (entry.taskId) {
      const data = await apiFetch(
          `/api/study-plan/${USER_ID}/entries/add?taskId=${entry.taskId}&estimatedWorkload=${entry.hoursPerWeek}`,
          { method: "POST" }
      );
      if (data) {
        await loadEntries();
        showToast(`Added "${entry.name}"`, "success");
        return;
      }
    }
    const id = Date.now();
    setEntries(prev => [...prev, { ...entry, id }]);
    setColorMap(prev => ({ ...prev, [id]: entry.color }));
    showToast(`Added "${entry.name}" (local only)`, "info");
  }, [showToast, loadEntries]);

  const handleDeleteEntry = useCallback(async (entryId) => {
    await apiFetch(`/api/study-plan/entries/${entryId}`, { method: "DELETE" });
    setEntries(prev => prev.filter(e => e.id !== entryId));
    setColorMap(prev => { const next = { ...prev }; delete next[entryId]; return next; });
    showToast("Entry removed", "info");
  }, [showToast]);

  const handleColorChange = useCallback((entryId, color) => {
    setColorMap(prev => ({ ...prev, [entryId]: color }));
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, color } : e));
  }, []);

 
  const buildSettingsPayload = useCallback(() => {
    return buildSchedulerSettings(availability);
  }, [availability]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setShowGenerateModal(false);
    const payload = buildSettingsPayload();
    const data = await apiFetch(`/api/study-plan/${USER_ID}/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data) {
      setWeekBlocks(normalizeWeeklyData(data));
      showToast("Plan generated!", "success");
    } else {
      showToast("Backend not connected — showing demo data", "info");
    }
    setLoading(false);
  }, [buildSettingsPayload, showToast]);

  const handleRebalance = useCallback(async () => {
    setLoading(true);
    const data = await apiFetch(`/api/study-plan/${USER_ID}/rebalance`, {
      method: "POST",
      body: JSON.stringify(buildSettingsPayload()),
    });
    if (data) {
      setWeekBlocks(normalizeWeeklyData(data));
      showToast("Plan rebalanced!", "success");
    } else {
      showToast("Backend not connected", "info");
    }
    setLoading(false);
  }, [buildSettingsPayload, showToast]);

  const slotCount = Object.values(availability).flat().length;

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sp-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background: #F4F4F8;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Header ── */
        .sp-header {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-bottom: 1px solid #E0E0E8;
          background: #fff;
          flex-shrink: 0;
          gap: 16px;
        }

        .sp-header-left { display: flex; align-items: center; gap: 16px; }

        .sp-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 20px;
          color: #31487A;
          letter-spacing: -0.3px;
        }

        .sp-week-nav { display: flex; align-items: center; gap: 6px; }

        .sp-nav-btn {
          background: #F4F4F8;
          border: 1px solid #E0E0E8;
          color: #31487A;
          width: 30px; height: 30px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .sp-nav-btn:hover { background: #E8EDF5; }

        .sp-week-label {
          font-size: 12px;
          font-weight: 600;
          color: #7B8DB0;
          min-width: 140px;
          text-align: center;
        }

        .sp-header-actions { display: flex; align-items: center; gap: 8px; }

        .sp-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid #E0E0E8;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .sp-btn-ghost { background: transparent; color: #7B8DB0; }
        .sp-btn-ghost:hover { background: #F4F4F8; color: #31487A; }
        .sp-btn-outline { background: #fff; color: #31487A; }
        .sp-btn-outline:hover { background: #F4F4F8; }
        .sp-btn-primary { background: #31487A; color: #fff; border-color: #31487A; }
        .sp-btn-primary:hover { background: #253a63; }
        .sp-btn-active { background: #EEF2FB; color: #31487A; border-color: #31487A; }

        .sp-slot-badge {
          background: #31487A;
          color: #fff;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 99px;
          margin-left: 6px;
        }

        /* ── Layout ── */
        .sp-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .sp-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #E0E0E8;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sp-sidebar-tabs {
          display: flex;
          border-bottom: 1px solid #E0E0E8;
          flex-shrink: 0;
        }

        .sp-sidebar-tab {
          flex: 1;
          padding: 12px 8px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          color: #A59AC9;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
          font-family: 'DM Sans', sans-serif;
        }
        .sp-sidebar-tab.active { color: #31487A; border-bottom-color: #31487A; }
        .sp-sidebar-tab:hover:not(.active) { color: #31487A; background: #F8F8FB; }

        .sp-sidebar-content { flex: 1; overflow-y: auto; padding: 16px; }

        /* ── Panel shared ── */
        .sp-panel-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 14px;
          color: #31487A;
          margin-bottom: 12px;
        }

        .sp-empty-hint {
          font-size: 12px;
          color: #B8A9C9;
          text-align: center;
          padding: 20px 0;
          line-height: 1.6;
        }

        /* ── Entry Form ── */
        .sp-entry-form {
          background: #F8F8FB;
          border: 1px solid #E0E0E8;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 14px;
        }

        .sp-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #E0E0E8;
          border-radius: 8px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          color: #2a2050;
          background: #fff;
          margin-bottom: 8px;
          outline: none;
          transition: border-color 0.15s;
        }
        .sp-input:focus { border-color: #8FB3E2; }

        .sp-form-row { display: flex; gap: 6px; }
        .sp-form-row .sp-input { flex: 1; margin-bottom: 8px; }
        .sp-select { cursor: pointer; }

        .sp-color-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }

        .sp-color-dot {
          width: 20px; height: 20px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.1s, border-color 0.1s;
          padding: 0;
        }
        .sp-color-dot:hover { transform: scale(1.15); }
        .sp-color-dot.selected { border-color: #2a2050; transform: scale(1.1); }

        .sp-add-btn {
          width: 100%;
          padding: 8px;
          background: #31487A;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s;
        }
        .sp-add-btn:hover:not(:disabled) { background: #253a63; }
        .sp-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Task preview card ── */
        .sp-task-preview {
          background: #fff;
          border: 1px solid #D4D4DC;
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 8px;
        }
        .sp-task-preview-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .sp-task-course {
          font-size: 11px;
          font-weight: 700;
          color: #31487A;
          letter-spacing: 0.3px;
        }
        .sp-task-title {
          font-size: 12px;
          color: #2a2050;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .sp-task-deadline {
          font-size: 10px;
          color: #B8A9C9;
        }

        /* ── Entry List ── */
        .sp-entry-list { display: flex; flex-direction: column; gap: 8px; }

        .sp-entry-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F8F8FB;
          border: 1px solid #E0E0E8;
          border-radius: 10px;
          padding: 10px;
        }

        .sp-entry-color-col { flex-shrink: 0; position: relative; }

        .sp-entry-swatch {
          width: 24px; height: 24px;
          border-radius: 6px;
          cursor: pointer;
          position: relative;
        }
        .sp-entry-swatch:hover .sp-swatch-picker { display: flex; }

        .sp-swatch-picker {
          display: none;
          flex-wrap: wrap;
          gap: 4px;
          position: absolute;
          left: 28px;
          top: 0;
          background: #fff;
          border: 1px solid #E0E0E8;
          border-radius: 10px;
          padding: 8px;
          z-index: 50;
          width: 110px;
          box-shadow: 0 4px 16px rgba(49,72,122,0.12);
        }

        .sp-entry-info { flex: 1; min-width: 0; }

        .sp-entry-name {
          font-size: 12px;
          font-weight: 600;
          color: #2a2050;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sp-entry-meta { display: flex; gap: 6px; margin-top: 3px; }

        .sp-workload-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: capitalize;
        }
        .sp-workload-badge.light { background: #eef7f0; color: #2d7a4a; }
        .sp-workload-badge.medium { background: #EEF2FB; color: #31487A; }
        .sp-workload-badge.heavy { background: #fef0f0; color: #c0392b; }

        .sp-hours-badge {
          font-size: 10px;
          color: #A59AC9;
          padding: 2px 6px;
          background: #F0EEF7;
          border-radius: 4px;
        }

        .sp-entry-delete {
          background: none;
          border: none;
          color: #C8C0D8;
          font-size: 16px;
          cursor: pointer;
          padding: 0 2px;
          line-height: 1;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .sp-entry-delete:hover { color: #c0392b; }

        /* ── Slot Panel ── */
        .sp-slot-panel { }

        .sp-clear-btn {
          font-size: 11px;
          color: #c0392b;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          padding: 2px 6px;
        }
        .sp-clear-btn:hover { text-decoration: underline; }

        .sp-slot-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #F8F8FB;
          border: 1px solid #E0E0E8;
          border-radius: 8px;
          margin-bottom: 6px;
        }

        .sp-slot-day {
          font-size: 10px;
          font-weight: 700;
          color: #31487A;
          background: #EEF2FB;
          border-radius: 4px;
          padding: 2px 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .sp-slot-time-text {
          font-size: 12px;
          color: #5A3B7B;
          flex: 1;
        }

        /* ── Calendar area ── */
        .sp-calendar-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sp-day-header-row {
          display: flex;
          flex-shrink: 0;
          border-bottom: 1px solid #E0E0E8;
          background: #fff;
          scrollbar-gutter: stable;
        }

        .sp-gutter-spacer {
          width: 56px;
          flex-shrink: 0;
          border-right: 1px solid #E0E0E8;
        }

        .sp-day-header {
          flex: 1;
          padding: 10px 6px;
          text-align: center;
          border-right: 1px solid #E0E0E8;
        }
        .sp-day-header:last-child { border-right: none; }

        .sp-day-name {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #A59AC9;
          text-transform: uppercase;
        }

        .sp-day-number {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 700;
          color: #31487A;
          margin-top: 2px;
        }

        .sp-day-header.today .sp-day-number { color: #7B5EA7; }
        .sp-day-header.today .sp-day-name { color: #7B5EA7; }

        /* ── Calendar body ── */
        .sp-cal-body {
          display: flex;
          flex: 1;
          overflow-y: scroll;
          overflow-x: hidden;
        }
        /* Gutter spacer in header must match time-gutter + scrollbar width */
        .sp-day-header-row {
          overflow-y: scroll;
          scrollbar-gutter: stable;
        }
        .sp-day-header-row::-webkit-scrollbar { display: none; }
        .sp-day-header-row { scrollbar-width: none; }

        .sp-time-gutter {
          width: 56px;
          flex-shrink: 0;
          position: relative;
          height: ${TOTAL_HOURS * HOUR_HEIGHT}px;
          border-right: 1px solid #E0E0E8;
          background: #fff;
        }

        .sp-time-label {
          position: absolute;
          right: 8px;
          transform: translateY(-50%);
          font-size: 10px;
          color: #B8A9C9;
          white-space: nowrap;
          user-select: none;
        }

        .sp-days-grid { display: flex; flex: 1; }

        /* ── Day Column ── */
        .sp-day-column {
          flex: 1;
          position: relative;
          height: ${TOTAL_HOURS * HOUR_HEIGHT}px;
          border-right: 1px solid #E0E0E8;
          cursor: default;
          user-select: none;
          background: #fff;
        }
        .sp-day-column:last-child { border-right: none; }
        .sp-day-column.avail-mode { cursor: crosshair; }
        .sp-day-column.today { background: #FDFBFF; }

        .sp-hour-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: #F0EEF7;
          pointer-events: none;
        }

        /* ── Study Block ── */
        .sp-study-block {
          position: absolute;
          left: 4px; right: 4px;
          border-radius: 6px;
          padding: 5px 8px;
          cursor: pointer;
          transition: filter 0.15s;
          overflow: hidden;
          z-index: 2;
        }
        .sp-study-block:hover { filter: brightness(0.95); }

        .sp-block-title {
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sp-block-time {
          font-size: 10px;
          color: #7B8DB0;
          margin-top: 2px;
        }

        .sp-block-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          background: #fff;
          border: 1px solid #E0E0E8;
          border-radius: 8px;
          overflow: hidden;
          z-index: 100;
          box-shadow: 0 8px 24px rgba(49,72,122,0.12);
          min-width: 130px;
        }

        .sp-block-menu button {
          display: block;
          width: 100%;
          padding: 9px 14px;
          background: none;
          border: none;
          color: #2a2050;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: background 0.1s;
        }
        .sp-block-menu button:hover { background: #F4F4F8; }
        .sp-block-menu button.danger { color: #c0392b; }
        .sp-block-menu button.danger:hover { background: #fef0f0; }

        /* ── Availability slot ── */
        .sp-avail-slot {
          position: absolute;
          left: 4px; right: 4px;
          background: rgba(123,94,167,0.08);
          border: 1px dashed rgba(123,94,167,0.35);
          border-radius: 6px;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 4px 6px;
        }

        .sp-slot-time { font-size: 9px; color: #7B5EA7; }
        .sp-slot-delete {
          background: rgba(192,57,43,0.1);
          border: none;
          color: #c0392b;
          width: 16px; height: 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
          line-height: 1;
          padding: 0;
        }
        .sp-avail-slot:hover .sp-slot-delete { opacity: 1; }

        .sp-drag-preview {
          position: absolute;
          left: 4px; right: 4px;
          background: rgba(123,94,167,0.12);
          border: 1px dashed #7B5EA7;
          border-radius: 6px;
          z-index: 10;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          color: #7B5EA7;
          pointer-events: none;
        }

        /* ── Legend ── */
        .sp-legend {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sp-legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #7B8DB0;
        }

        .sp-legend-dot {
          width: 8px; height: 8px;
          border-radius: 2px;
        }

        /* ── Toast ── */
        .sp-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          border: 1px solid #E0E0E8;
          color: #2a2050;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 12px;
          z-index: 1000;
          box-shadow: 0 4px 24px rgba(49,72,122,0.12);
          animation: spFadeUp 0.2s ease;
        }
        .sp-toast.success { border-color: #2d7a4a; color: #2d7a4a; }
        .sp-toast.error   { border-color: #c0392b; color: #c0392b; }

        @keyframes spFadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Loading ── */
        .sp-loading-bar {
          position: fixed;
          top: 0; left: 0;
          height: 2px;
          background: #31487A;
          animation: spLoading 1s ease infinite alternate;
          z-index: 999;
        }
        @keyframes spLoading { from { width: 20%; } to { width: 90%; } }

        /* ── Modal ── */
        .sp-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(49,72,122,0.15);
          display: flex; align-items: center; justify-content: center;
          z-index: 200;
          backdrop-filter: blur(2px);
        }

        .sp-modal {
          background: #fff;
          border: 1px solid #E0E0E8;
          border-radius: 16px;
          padding: 28px;
          width: 360px;
          box-shadow: 0 24px 64px rgba(49,72,122,0.18);
        }

        .sp-modal h2 {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 18px;
          color: #31487A;
          margin-bottom: 8px;
        }

        .sp-modal p {
          font-size: 13px;
          color: #7B8DB0;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .sp-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        /* ── Availability tip ── */
        .sp-avail-tip {
          position: fixed;
          bottom: 24px; right: 24px;
          background: #fff;
          border: 1px solid #E0E0E8;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 11px;
          color: #7B8DB0;
          max-width: 200px;
          line-height: 1.5;
          box-shadow: 0 4px 16px rgba(49,72,122,0.08);
        }
        .sp-avail-tip strong { color: #31487A; display: block; margin-bottom: 4px; }
      `}</style>

        <div className="sp-root">
          {loading && <div className="sp-loading-bar" />}

          {/* Header */}
          <div className="sp-header">
            <div className="sp-header-left">
              <div className="sp-title">Study Planner</div>
              <div className="sp-week-nav">
                <button className="sp-nav-btn" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }}>‹</button>
                <div className="sp-week-label">
                  {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" – "}
                  {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <button className="sp-nav-btn" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }}>›</button>
                <button className="sp-btn sp-btn-ghost" onClick={() => setCurrentDate(new Date())}>Today</button>
              </div>
            </div>

            <div className="sp-legend">
              {Object.entries(colorMap).map(([entryId, color]) => {
                const entry = entries.find(e => e.id === parseInt(entryId));
                if (!entry) return null;
                return (
                    <div key={entryId} className="sp-legend-item">
                      <div className="sp-legend-dot" style={{ background: color }} />
                      {entry.name}
                    </div>
                );
              })}
            </div>

            <div className="sp-header-actions">
              <button
                  className={`sp-btn ${isAvailabilityMode ? "sp-btn-active" : "sp-btn-outline"}`}
                  onClick={() => setIsAvailabilityMode(!isAvailabilityMode)}
              >
                {isAvailabilityMode ? <><Pencil size={13} style={{verticalAlign:"middle",marginRight:4}}/>Editing slots</> : "＋ Set availability"}
                {slotCount > 0 && <span className="sp-slot-badge">{slotCount}</span>}
              </button>
              {slotCount > 0 && (
                  <>
                    <button className="sp-btn sp-btn-outline" onClick={handleRebalance}><RotateCcw size={13} style={{verticalAlign:"middle",marginRight:4}}/>Rebalance</button>
                    <button className="sp-btn sp-btn-primary" onClick={() => setShowGenerateModal(true)}><Zap size={13} style={{verticalAlign:"middle",marginRight:4}}/>Generate</button>
                  </>
              )}
            </div>
          </div>

          <div className="sp-body">
            <div className="sp-sidebar">
              <div className="sp-sidebar-tabs">
                <button
                    className={`sp-sidebar-tab ${activePanel === "entries" ? "active" : ""}`}
                    onClick={() => setActivePanel("entries")}
                >
                  Entries {entries.length > 0 && `(${entries.length})`}
                </button>
                <button
                    className={`sp-sidebar-tab ${activePanel === "slots" ? "active" : ""}`}
                    onClick={() => setActivePanel("slots")}
                >
                  Slots {slotCount > 0 && `(${slotCount})`}
                </button>
              </div>
              <div className="sp-sidebar-content">
                {activePanel === "entries" && (
                    <EntryPanel
                        entries={entries}
                        onAdd={handleAddEntry}
                        onDelete={handleDeleteEntry}
                        colorMap={colorMap}
                        onColorChange={handleColorChange}
                        userId={USER_ID}
                    />
                )}
                {activePanel === "slots" && (
                    <SlotPanel
                        availability={availability}
                        onDeleteSlot={handleDeleteSlot}
                        onClearAll={handleClearAllSlots}
                    />
                )}
              </div>
            </div>

            <div className="sp-calendar-area">
              <div className="sp-day-header-row">
                <div className="sp-gutter-spacer" />
                {weekDates.map((date, i) => (
                    <div key={i} className={`sp-day-header ${isToday(date) ? "today" : ""}`}>
                      <div className="sp-day-name">{DAYS[i]}</div>
                      <div className="sp-day-number">{date.getDate()}</div>
                    </div>
                ))}
              </div>

              <div className="sp-cal-body">
                <TimeGutter />
                <div className="sp-days-grid">
                  {weekDates.map((date, i) => {
                    const dayKey = DAY_KEYS[i];
                    return (
                        <DayColumn
                            key={dayKey}
                            date={date}
                            dayKey={dayKey}
                            dayIndex={i}
                            blocks={weekBlocks[dayKey] || []}
                            colorMap={colorMap}
                            availabilitySlots={availability[dayKey] || []}
                            onCompleteBlock={handleCompleteBlock}
                            onDeleteBlock={handleDeleteBlock}
                            onUncompleteBlock={handleUncompleteBlock}
                            onAddSlot={handleAddSlot}
                            onDeleteSlot={handleDeleteSlot}
                            isAvailabilityMode={isAvailabilityMode}
                            onEditBlock={setEditingBlock}
                        />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {showGenerateModal && (
              <div className="sp-modal-backdrop" onClick={() => setShowGenerateModal(false)}>
                <div className="sp-modal" onClick={e => e.stopPropagation()}>
                  <h2>Generate new plan?</h2>
                  <p>
                    This will delete all existing blocks and create a fresh schedule
                    based on your {slotCount} availability slot{slotCount !== 1 ? "s" : ""} and your task entries.
                  </p>
                  <div className="sp-modal-actions">
                    <button className="sp-btn sp-btn-ghost" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                    <button className="sp-btn sp-btn-primary" onClick={handleGenerate}>Generate</button>
                  </div>
                </div>
              </div>
          )}

          {isAvailabilityMode && (
              <div className="sp-avail-tip">
                <strong>Drag to add slots</strong>
                Click × or go to the Slots tab to remove them. Overlapping slots are not allowed.
              </div>
          )}

          {toast && <div className={`sp-toast ${toast.type}`}>{toast.msg}</div>}

          {editingBlock && (
              <EditBlockModal
                  block={editingBlock}
                  onClose={() => setEditingBlock(null)}
                  onSave={handleSaveEditedBlock}
              />
          )}
        </div>
      </>
  );
}