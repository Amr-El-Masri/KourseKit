import { useState, useRef, useCallback, useEffect } from "react";
import { Pencil, Zap, RotateCcw } from "lucide-react";

const HOUR_HEIGHT = 80;
const START_HOUR = 6;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_KEYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const PALETTE = [
    // dark
    "#c0392b", "#e67e22", "#f1c40f", "#27ae60", "#2980b9", "#8e44ad", "#d81b60",
    // mid
    "#e74c3c", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#ab47bc", "#f06292",
    // light
    "#ef9a9a", "#ffcc80", "#fff59d", "#a5d6a7", "#90caf9", "#ce93d8", "#f48fb1",
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

// Use local date parts to avoid UTC offset shifting the date (e.g. Lebanon UTC+2)
function toLocalDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatTime(hour, minute = 0) {
    const h = Math.floor(hour);
    const m = minute || (hour % 1) * 60;
    return `${String(h).padStart(2, "0")}:${String(Math.round(m)).padStart(2, "0")}`;
}

function fmtDeadline(iso) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            + " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch { return iso; }
}
function pxToHour(px) { return px / HOUR_HEIGHT + START_HOUR; }
function hourToPx(hour) { return (hour - START_HOUR) * HOUR_HEIGHT; }
function snapToHalf(hour) { return Math.round(hour * 2) / 2; }
function isToday(date) { return date.toDateString() === new Date().toDateString(); }

function slotsOverlap(a, b) {
    return a.startHour < b.endHour && a.endHour > b.startHour;
}

const API_BASE = "http://localhost:8080";
function getUserId() {
    try {
        const t = localStorage.getItem("kk_token");
        return t ? JSON.parse(atob(t.split(".")[1])).sub : null;
    } catch { return null; }
}

async function apiFetch(path, options = {}) {
    const t = localStorage.getItem("kk_token");
    if (!t) throw new Error("Not logged in — please refresh and log in again");
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${t}`,
        },
        ...options,
    });
    if (res.status === 204) return null;
    if (!res.ok) {
        const text = await res.text();
        console.error(`API ERROR ${res.status} ${path}:`, text);
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(text).message || msg; } catch {}
        throw new Error(msg);
    }
    return res.json();
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

const DAY_OF_WEEK_MAP = {
    "1": "MONDAY", "2": "TUESDAY", "3": "WEDNESDAY",
    "4": "THURSDAY", "5": "FRIDAY", "6": "SATURDAY", "7": "SUNDAY",
    "MONDAY": "MONDAY", "TUESDAY": "TUESDAY", "WEDNESDAY": "WEDNESDAY",
    "THURSDAY": "THURSDAY", "FRIDAY": "FRIDAY", "SATURDAY": "SATURDAY", "SUNDAY": "SUNDAY"
};

function normalizeWeeklyData(data) {
    if (!data) return {};
    const normalized = {};
    for (const [day, blocks] of Object.entries(data)) {
        const key = DAY_OF_WEEK_MAP[day] || day;
        normalized[key] = blocks.map(normalizeBlock);
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

function StudyBlockEvent({ block, color, entryName, onComplete, onDelete, onUncomplete, onEdit, colIndex = 0, totalCols = 1 }) {
    const [showMenu, setShowMenu] = useState(false);
    useEffect(() => {
        if (!showMenu) return;
        const close = () => setShowMenu(false);
        const timer = setTimeout(() => window.addEventListener("click", close), 0);
        return () => { clearTimeout(timer); window.removeEventListener("click", close); };
    }, [showMenu]);
    const top = hourToPx(parseFloat(block.startTime.split(":")[0]) + parseFloat(block.startTime.split(":")[1]) / 60);
    const height = Math.max(block.duration * HOUR_HEIGHT - 4, 20);

    const colWidth = 100 / totalCols;
    const leftPct = colIndex * colWidth;
    return (
        <div
            className={`sp-study-block ${block.completed ? "completed" : ""}`}
            style={{
                top: top + 2, height,
                left: `calc(${leftPct}% + 4px)`,
                right: `calc(${100 - leftPct - colWidth}% + 4px)`,
                background: block.completed ? "rgba(49,72,122,0.05)" : color + "22",
                borderLeft: `3px solid ${block.completed ? "#ccc" : color}`,
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
        >
            <div className="sp-block-title" style={{ color: block.completed ? "#aaa" : color }}>
                {block.completed && <span>✓ </span>}
                {entryName}
            </div>
            <div className="sp-block-time">
                {block.startTime.slice(0, 5)} · {block.duration}h
            </div>
            <div className="sp-block-actions">
                {!block.completed
                    ? <button className="sp-block-action-btn" title="Mark complete" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onComplete(block.id); }}>✓</button>
                    : <button className="sp-block-action-btn" title="Undo complete" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onUncomplete(block.id); }}>↩</button>
                }
                <button className="sp-block-action-btn" title="Edit" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onEdit(block); }}>✎</button>
                <button className="sp-block-action-btn danger" title="Delete" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(block.id); }}>✕</button>
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

function EditBlockModal({ block, entries, dayBlocks, onClose, onSave }) {
    const [startTime, setStartTime]   = useState(block.startTime.slice(0, 5));
    const [duration, setDuration]     = useState(String(block.duration));
    const [entryId, setEntryId]       = useState(String(block.studyPlanEntryId));
    const [error, setError]           = useState("");

    const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #E0E0E8", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2a2050", outline: "none" };
    const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#2a2050", marginBottom: 6 };

    const handleSave = () => {
        setError("");
        const [h, m] = startTime.split(":").map(Number);
        if (isNaN(h) || isNaN(m)) { setError("Invalid start time"); return; }
        const dur = parseFloat(duration);
        if (!dur || dur <= 0) { setError("Invalid duration"); return; }

        const newStart = h + m / 60;
        const newEnd   = newStart + dur;

        // Check overlap with other blocks on same day
        const overlaps = (dayBlocks || []).some(b => {
            if (b.id === block.id) return false;
            const bStart = parseFloat(b.startTime.split(":")[0]) + parseFloat(b.startTime.split(":")[1]) / 60;
            const bEnd   = bStart + b.duration;
            return newStart < bEnd && newEnd > bStart;
        });

        if (overlaps) { setError("This time overlaps with another block on the same day"); return; }

        onSave(block.id, { startTime: startTime + ":00", duration: dur, studyPlanEntryId: parseInt(entryId) });
        onClose();
    };

    return (
        <div className="sp-modal-backdrop" onClick={onClose}>
            <div className="sp-modal" onClick={e => e.stopPropagation()}>
                <h2>Edit Block</h2>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Entry</label>
                    <select value={entryId} onChange={e => setEntryId(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
                        {entries.map(e => (
                            <option key={e.id} value={String(e.id)}>[{e.course}] {e.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: error ? 10 : 20 }}>
                    <label style={labelStyle}>Duration (hours)</label>
                    <input type="number" value={duration} min="0.5" max="12" step="0.5" onChange={e => setDuration(e.target.value)} style={inputStyle} />
                </div>
                {error && <div style={{ marginBottom: 14, fontSize: 12, color: "#c0392b", background: "#fef0f0", borderRadius: 6, padding: "8px 12px" }}>{error}</div>}
                <div className="sp-modal-actions">
                    <button className="sp-btn sp-btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="sp-btn sp-btn-primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}

function AvailabilitySlot({ slot, dayKey, onDelete, onResize }) {
    const [liveEndHour, setLiveEndHour] = useState(null);
    const liveEndHourRef = useRef(null);
    const dragRef = useRef(null);
    const endHour = liveEndHour ?? slot.endHour;
    const top = hourToPx(slot.startHour);
    const height = (endHour - slot.startHour) * HOUR_HEIGHT;

    const handleResizeStart = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        dragRef.current = { startY: e.clientY, startEndHour: slot.endHour };
        liveEndHourRef.current = slot.endHour;
        const onMove = (ev) => {
            const diff = (ev.clientY - dragRef.current.startY) / HOUR_HEIGHT;
            const newEnd = Math.max(snapToHalf(dragRef.current.startEndHour + diff), slot.startHour + 0.5);
            liveEndHourRef.current = newEnd;
            setLiveEndHour(newEnd);
        };
        const onUp = () => {
            if (dragRef.current) {
                onResize(dayKey, slot.id, liveEndHourRef.current);
                setLiveEndHour(null);
                liveEndHourRef.current = null;
            }
            dragRef.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [slot, dayKey, onResize]);

    return (
        <div
            className="sp-avail-slot"
            style={{ top: top + 2, height: Math.max(height - 4, 10) }}
            title={`${formatTime(slot.startHour)} – ${formatTime(endHour)}`}
            onMouseDown={e => e.stopPropagation()}
        >
            <span className="sp-slot-time">{formatTime(slot.startHour)}–{formatTime(endHour)}</span>
            <button className="sp-slot-delete" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(dayKey, slot.id); }}>×</button>
            <div onMouseDown={handleResizeStart} style={{ position:"absolute", bottom:0, left:0, right:0, height:8, cursor:"ns-resize", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:24, height:3, borderRadius:2, background:"rgba(123,94,167,0.4)" }} />
            </div>
        </div>
    );
}

function DayColumn({
                       date, dayKey, blocks, colorMap, entries,
                       availabilitySlots, onCompleteBlock, onDeleteBlock, onUncompleteBlock,
                       onAddSlot, onDeleteSlot, onResizeSlot, isAvailabilityMode, onEditBlock,
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
            onAddSlot(dayKey, { startHour, endHour, id: Date.now(), date });
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
                <AvailabilitySlot key={slot.id} slot={slot} dayKey={dayKey} onDelete={onDeleteSlot} onResize={onResizeSlot} />
            ))}
            {dragging && (
                <div className="sp-drag-preview" style={{
                    top: hourToPx(dragging.startHour) + 2,
                    height: (dragging.endHour - dragging.startHour) * HOUR_HEIGHT - 4,
                }}>
                    {formatTime(dragging.startHour)} – {formatTime(dragging.endHour)}
                </div>
            )}
            {(() => {
                const blockList = blocks || [];
                // Group overlapping blocks into columns
                const columns = [];
                blockList.forEach(block => {
                    const bStart = parseFloat(block.startTime.split(":")[0]) + parseFloat(block.startTime.split(":")[1]) / 60;
                    const bEnd = bStart + block.duration;
                    let placed = false;
                    for (const col of columns) {
                        const last = col[col.length - 1];
                        const lStart = parseFloat(last.startTime.split(":")[0]) + parseFloat(last.startTime.split(":")[1]) / 60;
                        const lEnd = lStart + last.duration;
                        if (bStart >= lEnd) { col.push(block); placed = true; break; }
                    }
                    if (!placed) columns.push([block]);
                });
                const totalCols = columns.length;
                return columns.map((col, colIdx) =>
                    col.map(block => (
                        <StudyBlockEvent
                            key={block.id}
                            block={block}
                            color={colorMap[String(block.studyPlanEntryId)] || "#31487A"}
                            entryName={(() => { const e = entries.find(en => String(en.id) === String(block.studyPlanEntryId)); return e ? (e.name || e.course || "Study") : (block.taskTitle || block.course || "Study"); })()}
                            onComplete={onCompleteBlock}
                            onDelete={onDeleteBlock}
                            onUncomplete={onUncompleteBlock}
                            onEdit={onEditBlock}
                            colIndex={colIdx}
                            totalCols={totalCols}
                        />
                    ))
                );
            })()}
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

    const handleAdd = () => {
        if (!selectedTask) return;
        onAdd({
            name: selectedTask.title,
            course: selectedTask.course,
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
                        </div>
                        <div className="sp-task-title">{selectedTask.title}</div>
                        <div className="sp-task-deadline">
                            Due: {fmtDeadline(selectedTask.deadline)}
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
                {entries.map(entry => {
                    return (
                        <div key={entry.id} className="sp-entry-item">
                            <div className="sp-entry-color-col">
                                <div style={{ position:"relative" }}>
                                    <div
                                        onClick={e => { e.stopPropagation(); const el = e.currentTarget.nextSibling; el.style.display = el.style.display === "grid" ? "none" : "grid"; }}
                                        style={{ width:20, height:20, borderRadius:6, background: colorMap[String(entry.id)] || entry.color, cursor:"pointer", border:"2px solid #E0E0E8" }}
                                    />
                                    <div style={{ display:"none", position:"absolute", left:24, top:0, zIndex:50, background:"#fff", border:"1px solid #E0E0E8", borderRadius:10, padding:8, gridTemplateColumns:"repeat(7,1fr)", gap:4, width:180, boxShadow:"0 4px 16px rgba(49,72,122,0.12)" }}>
                                        {PALETTE.map(c => (
                                            <button key={c} onClick={() => onColorChange(entry.id, c)}
                                                    style={{ width:20, height:20, borderRadius:"50%", background:c, border: (colorMap[String(entry.id)]||entry.color)===c?"2px solid #2a2050":"2px solid transparent", cursor:"pointer", padding:0 }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="sp-entry-info">
                                <div className="sp-entry-name">{entry.name}</div>
                                {entry.course && <div style={{ fontSize:10, color:"#A59AC9", marginTop:1, marginBottom:2 }}>{entry.course}</div>}
                                <div className="sp-entry-meta">
                                    <span className="sp-hours-badge">{entry.hoursPerWeek}h/wk</span>
                                </div>
                            </div>
                            <button className="sp-entry-delete" onClick={() => onDelete(entry.id)}>×</button>
                        </div>
                    );
                })}
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
                    <button
                        onClick={() => onDeleteSlot(slot.dayKey, slot.id)}
                        style={{ background:"rgba(192,57,43,0.1)", border:"none", color:"#c0392b", borderRadius:4, width:20, height:20, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
                    >×</button>
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
    const [showClearModal, setShowClearModal] = useState(false);
    const [entries, setEntries] = useState([]);
    const [activePanel, setActivePanel] = useState("entries"); // "entries" | "slots"
    const [editingBlock, setEditingBlock] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [showSlotOverlay, setShowSlotOverlay] = useState(true);

    const weekDates = getWeekDates(currentDate);
    const weekStart = toLocalDateString(weekDates[0]);

    const showToast = useCallback((msg, type = "info") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);


    useEffect(() => {
        if (Object.keys(colorMap).length > 0) {
            localStorage.setItem('kk_colorMap', JSON.stringify(colorMap));
        }
    }, [colorMap]);

    const loadEntries = useCallback(async (preserveColors = false) => {
        const data = await apiFetch(`/api/study-plan/${getUserId()}/entries?weekStart=${weekStart}`);
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((entry, i) => ({
            id: entry.id,
            taskId: entry.task?.id,
            name: entry.task?.title || "Untitled",
            course: entry.task?.course || "",
            workload: entry.estimatedWorkload >= 8 ? "heavy"
                : entry.estimatedWorkload >= 4 ? "medium" : "light",
            hoursPerWeek: entry.estimatedWorkload,
            completedHours: entry.completedHours,
            color: PALETTE[i % PALETTE.length],
        }));
        setEntries(mapped);
        setColorMap(prev => {
            const savedColors = (() => {
                try { return JSON.parse(localStorage.getItem('kk_colorMap') || '{}'); } catch { return {}; }
            })();
            const next = Object.fromEntries(mapped.map(e => [String(e.id), e.color]));
            if (preserveColors) Object.assign(next, prev);
            Object.assign(next, savedColors);
            return next;
        });
    }, [weekStart]);

    const loadWeeklyView = useCallback(async () => {
        setLoading(true);
        const data = await apiFetch(`/api/study-plan/${getUserId()}/weekly?weekStart=${weekStart}`);
        if (data) {
            const normalized = normalizeWeeklyData(data);
            setWeekBlocks(normalized);
            const hasBlocks = Object.values(normalized).some(arr => arr.length > 0);
            if (!hasBlocks) {
                setHasGenerated(false);
                setShowSlotOverlay(true);
                localStorage.removeItem(`kk_hasGenerated_${weekStart}`);
            }
        }
        setLoading(false);
    }, [weekStart]);

    const loadSlots = useCallback(async () => {
        const data = await apiFetch(`/api/study-plan/${getUserId()}/slots?weekStart=${weekStart}`);
        if (data) {
            const map = {};
            data.forEach(s => {
                if (!map[s.dayKey]) map[s.dayKey] = [];
                map[s.dayKey].push({
                    id: s.id,
                    dayKey: s.dayKey,
                    startHour: parseFloat(s.startTime.split(":")[0]) + parseFloat(s.startTime.split(":")[1]) / 60,
                    endHour: parseFloat(s.endTime.split(":")[0]) + parseFloat(s.endTime.split(":")[1]) / 60,
                });
            });
            setAvailability(map);
        }
    }, [weekStart]);

    // Restore per-week generated state when week changes
    useEffect(() => {
        const stored = localStorage.getItem(`kk_hasGenerated_${weekStart}`) === 'true';
        setHasGenerated(stored);
        setShowSlotOverlay(!stored);
    }, [weekStart]);

    const persistSlots = useCallback(async (newAvailability) => {
        const userId = getUserId();
        if (!userId) return;
        const slots = [];
        const toTime = h => {
            const hrs = Math.floor(h);
            const mins = Math.round((h - hrs) * 60);
            return `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:00`;
        };
        Object.entries(newAvailability).forEach(([dayKey, daySlots]) => {
            daySlots.forEach(s => slots.push({ dayKey, startTime: toTime(s.startHour), endTime: toTime(s.endHour) }));
        });
        try {
            await apiFetch(`/api/study-plan/${userId}/slots?weekStart=${weekStart}`, {
                method: "POST",
                body: JSON.stringify(slots),
            });
            // Reload slots to get backend-assigned IDs
            await loadSlots();
        } catch (e) {
            console.error("Failed to persist slots:", e.message);
        }
    }, [weekStart, showToast]);

    useEffect(() => {
        loadEntries();
        loadWeeklyView();
        loadSlots();
    }, [weekStart]);

    const handleCompleteBlock = useCallback(async (blockId) => {
        await apiFetch(`/api/study-plan/blocks/${blockId}/complete`, { method: "PATCH" });
        setWeekBlocks(prev => {
            const next = {};
            for (const [day, blocks] of Object.entries(prev))
                next[day] = blocks.map(b => String(b.id) === String(blockId) ? { ...b, completed: true } : b);
            return next;
        });
        showToast("Marked complete ✓", "success");
    }, [showToast]);

    const handleUncompleteBlock = useCallback(async (blockId) => {
        await apiFetch(`/api/study-plan/blocks/${blockId}/uncomplete`, { method: "PATCH" });
        setWeekBlocks(prev => {
            const next = {};
            for (const [day, blocks] of Object.entries(prev))
                next[day] = blocks.map(b => String(b.id) === String(blockId) ? { ...b, completed: false } : b);
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
        // Reload slots so the UI reflects any slot shrinkage/deletion
        await loadSlots();
        showToast("Block deleted", "info");
    }, [showToast, loadSlots]);

    const handleSaveEditedBlock = useCallback(async (blockId, changes) => {
        try {
            await apiFetch(`/api/study-plan/blocks/${blockId}`, {
                method: "PATCH",
                body: JSON.stringify(changes),
            });
            await loadWeeklyView();
            await loadEntries(true);
            showToast("Block updated", "success");
        } catch (e) {
            showToast(e.message || "Failed to update block", "error");
        }
    }, [showToast, loadWeeklyView, loadEntries]);

    const handleAddSlot = useCallback((dayKey, newSlot) => {
        // Check if slot is in the past using the actual date
        const now = new Date();
        if (newSlot.date) {
            const slotDate = new Date(newSlot.date);
            slotDate.setHours(0, 0, 0, 0);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            if (slotDate < today) {
                showToast("Can't add a slot on a past day", "error");
                return;
            }
            if (slotDate.getTime() === today.getTime()) {
                const nowHour = now.getHours() + now.getMinutes() / 60;
                if (newSlot.endHour <= nowHour) {
                    showToast("Can't add a slot that's already in the past", "error");
                    return;
                }
            }
        }

        setAvailability(prev => {
            const existing = prev[dayKey] || [];
            if (existing.some(s => slotsOverlap(s, newSlot))) {
                showToast("Slots can't overlap — adjust the existing one first", "error");
                return prev;
            }
            const next = { ...prev, [dayKey]: [...existing, newSlot] };
            setTimeout(() => persistSlots(next), 0);
            return next;
        });
    }, [showToast, persistSlots]);

    const handleDeleteSlot = useCallback((dayKey, slotId) => {
        setAvailability(prev => {
            const next = { ...prev, [dayKey]: (prev[dayKey] || []).filter(s => s.id !== slotId) };
            persistSlots(next);
            return next;
        });
    }, [persistSlots]);

    const handleClearAllSlots = useCallback(async () => {
        const userId = getUserId();
        await apiFetch(`/api/study-plan/${userId}/slots?weekStart=${weekStart}`, { method: "DELETE" });
        await apiFetch(`/api/study-plan/${userId}/blocks?weekStart=${weekStart}`, { method: "DELETE" });
        setAvailability({});
        setWeekBlocks({});
        setHasGenerated(false);
        localStorage.removeItem(`kk_hasGenerated_${weekStart}`);
        setShowSlotOverlay(true);
        showToast("All slots cleared", "info");
    }, [showToast, weekStart]);

    const handleResizeSlot = useCallback((dayKey, slotId, newEndHour) => {
        setAvailability(prev => {
            const next = { ...prev, [dayKey]: (prev[dayKey] || []).map(s => s.id === slotId ? { ...s, endHour: newEndHour } : s) };
            persistSlots(next);
            return next;
        });
    }, [persistSlots]);

    const handleAddEntry = useCallback(async (entry) => {
        if (!entry.taskId) { showToast("No task selected", "error"); return; }
        try {
            await apiFetch(
                `/api/study-plan/${getUserId()}/entries/add?taskId=${entry.taskId}&estimatedWorkload=${entry.hoursPerWeek}&weekStart=${weekStart}`,
                { method: "POST" }
            );
            await loadEntries(true);
            setEntries(prev => {
                const match = prev.find(e => String(e.taskId) === String(entry.taskId));
                if (match) setColorMap(cm => ({ ...cm, [String(match.id)]: entry.color }));
                return prev;
            });
            showToast(`Added "${entry.name}"`, "success");
        } catch (e) {
            showToast(e.message || "Failed to add entry", "error");
        }
    }, [showToast, loadEntries]);

    const handleDeleteEntry = useCallback(async (entryId) => {
        try {
            await apiFetch(`/api/study-plan/entries/${entryId}`, { method: "DELETE" });
            setEntries(prev => prev.filter(e => e.id !== entryId));
            setColorMap(prev => { const next = { ...prev }; delete next[String(entryId)]; return next; });
            showToast("Entry removed", "info");
        } catch (e) {
            showToast(e.message || "Failed to remove entry", "error");
        }
    }, [showToast]);

    const handleColorChange = useCallback((entryId, color) => {
        setColorMap(prev => {
            const next = { ...prev, [String(entryId)]: color };
            localStorage.setItem('kk_colorMap', JSON.stringify(next));
            return next;
        });
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, color } : e));
    }, []);


    const buildSettingsPayload = useCallback(() => {
        return buildSchedulerSettings(availability);
    }, [availability]);

    const handleGenerate = useCallback(async () => {
        setLoading(true);
        setShowGenerateModal(false);
        try {
            const payload = buildSettingsPayload();
            const data = await apiFetch(`/api/study-plan/${getUserId()}/generate?weekStart=${weekStart}`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            if (data) {
                const weeklyView = data.weeklyView ?? data;
                setWeekBlocks(normalizeWeeklyData(weeklyView));
                setHasGenerated(true);
                localStorage.setItem(`kk_hasGenerated_${weekStart}`, 'true');
                setIsAvailabilityMode(false);
                setShowSlotOverlay(false);
                await loadEntries(true);
                showToast("Plan generated!", "success");
            } else {
                showToast("Failed to generate plan", "error");
            }
        } catch (e) {
            showToast(e.message || "Failed to generate plan", "error");
        }
        setLoading(false);
    }, [buildSettingsPayload, showToast, loadEntries]);

    const handleMarkPastDone = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/study-plan/${getUserId()}/blocks/complete-past`, { method: "POST" });
            const count = res?.marked ?? 0;
            if (count === 0) {
                showToast("No past blocks to mark done", "info");
            } else {
                showToast(`Marked ${count} block${count !== 1 ? "s" : ""} as done ✓`, "success");
                await loadWeeklyView();
                await loadEntries(true);
            }
        } catch (e) {
            showToast(e.message || "Failed to mark past blocks", "error");
        }
        setLoading(false);
    }, [showToast, loadWeeklyView, loadEntries]);

    const handleClearPlan = useCallback(() => {
        setShowClearModal(true);
    }, []);

    const handleClearPlanConfirmed = useCallback(async () => {
        const userId = getUserId();
        if (!userId) { showToast("Not logged in", "error"); return; }
        setShowClearModal(false);
        setLoading(true);
        try {
            await apiFetch(`/api/study-plan/${userId}/blocks?weekStart=${weekStart}`, { method: "DELETE" });
            await apiFetch(`/api/study-plan/${userId}/slots?weekStart=${weekStart}`, { method: "DELETE" });
            setWeekBlocks({});
            setAvailability({});
            setHasGenerated(false);
            localStorage.removeItem(`kk_hasGenerated_${weekStart}`);
            setShowSlotOverlay(true);
            showToast("Plan cleared", "info");
        } catch (e) {
            showToast(e.message || "Failed to clear plan", "error");
        }
        setLoading(false);
    }, [showToast, weekStart]);

    const handleRebalance = useCallback(async () => {
        setLoading(true);
        try {
            const payload = buildSettingsPayload();
            console.log("REBALANCE PAYLOAD:", JSON.stringify(payload, null, 2));
            const data = await apiFetch(`/api/study-plan/${getUserId()}/rebalance?weekStart=${weekStart}`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            if (data) {
                const weeklyView = data.weeklyView ?? data;
                setWeekBlocks(normalizeWeeklyData(weeklyView));
                setIsAvailabilityMode(false);
                setShowSlotOverlay(false);
                await loadEntries(true);
                showToast("Plan rebalanced!", "success");
            } else {
                showToast("Failed to rebalance plan", "error");
            }
        } catch (e) {
            showToast(e.message || "Failed to rebalance plan", "error");
        }
        setLoading(false);
    }, [buildSettingsPayload, showToast, loadEntries]);

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
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          border-bottom: 1px solid #E0E0E8;
          background: #fff;
          flex-shrink: 0;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sp-header-left { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        .sp-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 18px;
          color: #31487A;
          letter-spacing: -0.3px;
          white-space: nowrap;
        }

        .sp-week-nav { display: flex; align-items: center; gap: 4px; }

        .sp-nav-btn {
          background: #F4F4F8;
          border: 1px solid #E0E0E8;
          color: #31487A;
          width: 28px; height: 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .sp-nav-btn:hover { background: #E8EDF5; }

        .sp-week-label {
          font-size: 11px;
          font-weight: 600;
          color: #7B8DB0;
          min-width: 110px;
          text-align: center;
          white-space: nowrap;
        }

        .sp-header-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

        .sp-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 10px;
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
          width: 240px;
          min-width: 180px;
          flex-shrink: 1;
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
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
          margin-bottom: 10px;
          background: #F8F8FB;
          border: 1px solid #E0E0E8;
          border-radius: 10px;
          padding: 8px;
        }

        .sp-color-dot {
          width: 100%; aspect-ratio: 1;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.1s, border-color 0.1s, box-shadow 0.1s;
          padding: 0;
        }
        .sp-color-dot:hover { transform: scale(1.2); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        .sp-color-dot.selected { border-color: #fff; box-shadow: 0 0 0 2px #2a2050; transform: scale(1.1); }

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
          width: 200px;
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
          min-width: 0;
        }

        .sp-calendar-scroll-wrapper {
          flex: 1;
          overflow-x: auto;
          overflow-y: hidden;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
        }

        .sp-calendar-inner {
          min-width: 560px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .sp-day-header-row {
          display: flex;
          flex-shrink: 0;
          border-bottom: 1px solid #E0E0E8;
          background: #fff;
          scrollbar-gutter: stable;
          min-width: 560px;
        }

        .sp-gutter-spacer {
          width: 56px;
          flex-shrink: 0;
          border-right: 1px solid #E0E0E8;
        }

        .sp-day-header {
          flex: 1;
          min-width: 70px;
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
          min-height: 0;
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

        .sp-days-grid { display: flex; flex: 1; min-width: 0; }

        /* ── Day Column ── */
        .sp-day-column {
          flex: 1;
          min-width: 70px;
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
          border-radius: 6px;
          padding: 5px 8px;
          cursor: pointer;
          transition: filter 0.15s;
          overflow: hidden;
          z-index: 2;
        }
        .sp-study-block:hover { filter: brightness(0.95); }
        .sp-study-block:hover .sp-block-actions { opacity: 1; }

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

        .sp-block-actions {
          position: absolute;
          top: 3px;
          right: 3px;
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .sp-block-action-btn {
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 4px;
          width: 18px;
          height: 18px;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #31487A;
          padding: 0;
          line-height: 1;
          transition: background 0.1s;
        }
        .sp-block-action-btn:hover { background: #EEF2FB; }
        .sp-block-action-btn.danger { color: #c0392b; }
        .sp-block-action-btn.danger:hover { background: #fef0f0; }

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
          opacity: 1;
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

                    <div className="sp-header-actions">
                        <button
                            className={`sp-btn ${isAvailabilityMode ? "sp-btn-active" : "sp-btn-outline"}`}
                            onClick={() => {
                                const entering = !isAvailabilityMode;
                                setIsAvailabilityMode(entering);
                                if (entering) {
                                    setShowSlotOverlay(true);
                                } else {
                                    persistSlots(availability);
                                    if (hasGenerated) setShowSlotOverlay(false);
                                }
                            }}
                        >
                            {isAvailabilityMode ? <><Pencil size={13} style={{verticalAlign:"middle",marginRight:4}}/>Editing slots</> : "＋ Set availability"}
                            {slotCount > 0 && <span className="sp-slot-badge">{slotCount}</span>}
                        </button>
                        {slotCount > 0 && (
                            <>
                                {hasGenerated && entries.length > 0 && (
                                    <button className="sp-btn sp-btn-outline" onClick={handleRebalance}><RotateCcw size={13} style={{verticalAlign:"middle",marginRight:4}}/>Rebalance</button>
                                )}
                                {hasGenerated && entries.length > 0 && (
                                    <button className="sp-btn sp-btn-outline" onClick={handleMarkPastDone} title="Mark all blocks that have already started as complete" style={{color:"#2d7a4a",borderColor:"#b7dfc4"}}>✓ Mark past done</button>
                                )}
                                {hasGenerated && (
                                    <button className="sp-btn sp-btn-ghost" onClick={handleClearPlan} style={{color:"#c0392b",borderColor:"#f5c6c6"}}>✕ Clear Plan</button>
                                )}
                                {!hasGenerated && (
                                    <button className="sp-btn sp-btn-primary" onClick={() => setShowGenerateModal(true)}><Zap size={13} style={{verticalAlign:"middle",marginRight:4}}/>Generate</button>
                                )}
                                {hasGenerated && (
                                    <button className="sp-btn sp-btn-primary" disabled style={{opacity:0.4,cursor:"not-allowed"}}><Zap size={13} style={{verticalAlign:"middle",marginRight:4}}/>Generated</button>
                                )}
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
                                    userId={getUserId()}
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
                        <div className="sp-calendar-scroll-wrapper">
                            <div className="sp-calendar-inner">
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
                                                    entries={entries}
                                                    availabilitySlots={(isAvailabilityMode || showSlotOverlay) ? (availability[dayKey] || []) : []}
                                                    onCompleteBlock={handleCompleteBlock}
                                                    onDeleteBlock={handleDeleteBlock}
                                                    onUncompleteBlock={handleUncompleteBlock}
                                                    onAddSlot={handleAddSlot}
                                                    onDeleteSlot={handleDeleteSlot}
                                                    onResizeSlot={handleResizeSlot}
                                                    isAvailabilityMode={isAvailabilityMode}
                                                    onEditBlock={setEditingBlock}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showClearModal && (
                    <div className="sp-modal-backdrop" onClick={() => setShowClearModal(false)}>
                        <div className="sp-modal" onClick={e => e.stopPropagation()}>
                            <h2>Clear This Week's Plan?</h2>
                            <p>This will delete all study blocks and availability slots for this week. This cannot be undone.</p>
                            <div className="sp-modal-actions">
                                <button className="sp-btn sp-btn-ghost" onClick={() => setShowClearModal(false)}>Cancel</button>
                                <button className="sp-btn sp-btn-primary" style={{background:"#c0392b",borderColor:"#c0392b"}} onClick={handleClearPlanConfirmed}>Clear Plan</button>
                            </div>
                        </div>
                    </div>
                )}

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
                        entries={entries}
                        dayBlocks={(() => {
                            const entry = Object.entries(weekBlocks).find(([, blocks]) => blocks.some(b => b.id === editingBlock.id));
                            return entry ? entry[1] : [];
                        })()}
                        onClose={() => setEditingBlock(null)}
                        onSave={handleSaveEditedBlock}
                    />
                )}
            </div>
        </>
    );
}