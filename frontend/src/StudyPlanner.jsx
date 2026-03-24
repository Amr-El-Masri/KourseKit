import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Pencil, Zap, RotateCcw } from "lucide-react";

const HOUR_HEIGHT = 80;
const START_HOUR = 0;
const END_HOUR = 24;
const VISIBLE_HOURS = 8;
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
function snapToQuarter(hour) { return Math.round(hour * 4) / 4; }
function isToday(date) { return date.toDateString() === new Date().toDateString(); }

function slotsOverlap(a, b) {
    return a.startHour < b.endHour && a.endHour > b.startHour;
}

const COURSE_COLORS = ["#c0392b","#e67e22","#f1c40f","#27ae60","#2980b9","#8e44ad","#d81b60"];
const COURSE_PICKER_COLORS = PALETTE.slice(0, 7);
const SECTION_DAY_MAP = { M:"MONDAY", T:"TUESDAY", W:"WEDNESDAY", R:"THURSDAY", F:"FRIDAY", S:"SATURDAY", U:"SUNDAY" };
function parseSectionTime(t) {
    if (!t || t === "0000" || !t.trim() || t.trim() === ".") return null;
    if (t.includes(":")) { const [h,m] = t.split(":"); return parseInt(h) + parseInt(m)/60; }
    const p = t.padStart(4,"0"); return parseInt(p.slice(0,2)) + parseInt(p.slice(2,4))/60;
}
function getSectionTimeSlots(section) {
    const slots = [];
    if (section?.days1 && section.beginTime1) {
        const s = parseSectionTime(section.beginTime1), e = parseSectionTime(section.endTime1);
        if (s !== null && e !== null) section.days1.split(" ").forEach(d => { if (SECTION_DAY_MAP[d]) slots.push({ dayKey: SECTION_DAY_MAP[d], startHour: s, endHour: e }); });
    }
    if (section?.days2 && section.beginTime2 && section.beginTime2 !== "0000" && section.beginTime2.trim() !== ".") {
        const s = parseSectionTime(section.beginTime2), e = parseSectionTime(section.endTime2);
        if (s !== null && e !== null) section.days2.split(" ").forEach(d => { if (SECTION_DAY_MAP[d]) slots.push({ dayKey: SECTION_DAY_MAP[d], startHour: s, endHour: e }); });
    }
    return slots;
}
function subtractBusyFromSlots(slots, busyPeriods) {
    let remaining = [...slots];
    for (const busy of busyPeriods) {
        const next = [];
        for (const slot of remaining) {
            if (slot.endHour <= busy.startHour || slot.startHour >= busy.endHour) {
                next.push(slot);
            } else {
                if (slot.startHour < busy.startHour) next.push({ ...slot, endHour: busy.startHour });
                if (slot.endHour > busy.endHour) next.push({ ...slot, startHour: busy.endHour });
            }
        }
        remaining = next;
    }
    return remaining;
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
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
                const hour = START_HOUR + i;
                const label = hour === 0 || hour === 24 ? "12am" : hour === 12 ? "12pm" : hour > 12 ? `${hour - 12}pm` : `${hour}am`;
                return (
                    <div key={hour} className={`sp-time-label${i === 0 ? " sp-time-label-first" : ""}`} style={{ top: i * HOUR_HEIGHT }}>
                        <span>{label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function StudyBlockEvent({ block, color, entryName, onComplete, onDelete, onUncomplete, onEdit, onResizeBlock, isPast, isAvailabilityMode, dayBlocks, courseBlocks, colIndex = 0, totalCols = 1 }) {
    const [showMenu, setShowMenu] = useState(false);
    const [liveStart, setLiveStart] = useState(null);
    const [liveDur, setLiveDur] = useState(null);
    const topRef = useRef(null);
    const botRef = useRef(null);

    useEffect(() => {
        if (!showMenu) return;
        const close = () => setShowMenu(false);
        const timer = setTimeout(() => window.addEventListener("click", close), 0);
        return () => { clearTimeout(timer); window.removeEventListener("click", close); };
    }, [showMenu]);

    const blockStartH = parseFloat(block.startTime.split(":")[0]) + parseFloat(block.startTime.split(":")[1]) / 60;
    const displayStart = liveStart ?? blockStartH;
    const displayDur = liveDur ?? block.duration;

    const top = hourToPx(displayStart);
    const height = Math.max(displayDur * HOUR_HEIGHT - 4, 20);
    const colWidth = 100 / totalCols;
    const leftPct = colIndex * colWidth;

    const handleTopResize = useCallback((e) => {
        if (block.completed) return;
        e.stopPropagation(); e.preventDefault();
        const origEnd = blockStartH + block.duration;
        const others = (dayBlocks || []).filter(b => b.id !== block.id).map(b => {
            const s = parseFloat(b.startTime.split(":")[0]) + parseFloat(b.startTime.split(":")[1]) / 60;
            return { start: s, end: s + b.duration };
        });
        const courseObs = (courseBlocks || []).map(cb => ({ start: cb.startHour, end: cb.endHour }));
        const allObs = [...others, ...courseObs];
        const minStart = Math.max(START_HOUR, ...allObs.filter(o => o.end <= origEnd).map(o => o.end));
        topRef.current = { startY: e.clientY, origStartH: blockStartH, origEnd, curStart: blockStartH, curDur: block.duration };
        const onMove = (ev) => {
            const diff = (ev.clientY - topRef.current.startY) / HOUR_HEIGHT;
            const newStart = Math.max(snapToQuarter(topRef.current.origStartH + diff), minStart);
            const newDur = Math.max(0.5, topRef.current.origEnd - newStart);
            topRef.current.curStart = newStart;
            topRef.current.curDur = newDur;
            setLiveStart(newStart);
            setLiveDur(newDur);
        };
        const onUp = () => {
            if (topRef.current) {
                const { curStart, curDur } = topRef.current;
                const hh = Math.floor(curStart);
                const mm = Math.round((curStart - hh) * 60);
                onResizeBlock(block.id, { startTime: `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:00`, duration: curDur });
                setLiveStart(null); setLiveDur(null);
            }
            topRef.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [block, blockStartH, onResizeBlock]);

    const handleBotResize = useCallback((e) => {
        if (block.completed) return;
        e.stopPropagation(); e.preventDefault();
        const others = (dayBlocks || []).filter(b => b.id !== block.id).map(b => {
            const s = parseFloat(b.startTime.split(":")[0]) + parseFloat(b.startTime.split(":")[1]) / 60;
            return { start: s, end: s + b.duration };
        });
        const courseObs = (courseBlocks || []).map(cb => ({ start: cb.startHour, end: cb.endHour }));
        const allObs = [...others, ...courseObs];
        const maxEnd = Math.min(END_HOUR, ...allObs.filter(o => o.start >= blockStartH).map(o => o.start));
        const maxDur = maxEnd - blockStartH;
        botRef.current = { startY: e.clientY, origDur: block.duration, curDur: block.duration };
        const onMove = (ev) => {
            const diff = (ev.clientY - botRef.current.startY) / HOUR_HEIGHT;
            const newDur = Math.min(Math.max(0.5, snapToQuarter(botRef.current.origDur + diff)), maxDur);
            botRef.current.curDur = newDur;
            setLiveDur(newDur);
        };
        const onUp = () => {
            if (botRef.current) {
                onResizeBlock(block.id, { duration: botRef.current.curDur });
                setLiveDur(null);
            }
            botRef.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [block, onResizeBlock]);

    return (
        <div
            className={`sp-study-block ${block.completed ? "completed" : ""}`}
            style={{
                top: top + 2, height,
                left: `calc(${leftPct}% + 4px)`,
                right: `calc(${100 - leftPct - colWidth}% + 4px)`,
                background: block.completed ? "var(--surface2)" : color + "22",
                borderLeft: `3px solid ${block.completed ? "var(--border)" : color}`,
                pointerEvents: isPast ? "none" : "auto",
                filter: isPast ? "grayscale(1)" : undefined,
                opacity: isPast ? 0.65 : 1,
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); if (!isAvailabilityMode && !topRef.current && !botRef.current) setShowMenu(v => !v); }}
        >
            {!block.completed && (
                <div
                    onMouseDown={handleTopResize}
                    style={{ position:"absolute", top:0, left:0, right:0, height:7, cursor:"n-resize", zIndex:10, borderRadius:"5px 5px 0 0" }}
                />
            )}
            <div className="sp-block-title" style={{ color: block.completed ? "var(--text3)" : color }}>
                {block.completed && <span>✓ </span>}
                {entryName}
            </div>
            <div className="sp-block-time">
                {formatTime(displayStart)} · {displayDur}h
            </div>
            {!isAvailabilityMode && <div className="sp-block-actions">
                {!block.completed
                    ? <button className="sp-block-action-btn" title="Mark complete" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onComplete(block.id); }}>✓</button>
                    : <button className="sp-block-action-btn" title="Undo complete" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onUncomplete(block.id); }}>↩</button>
                }
                <button className="sp-block-action-btn" title="Edit" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onEdit(block); }}>✎</button>
                <button className="sp-block-action-btn danger" title="Delete" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(block.id); }}>✕</button>
            </div>}
            {!isAvailabilityMode && showMenu && (
                <div className="sp-block-menu" onClick={e => e.stopPropagation()}>
                    {!block.completed
                        ? <button onClick={() => { onComplete(block.id); setShowMenu(false); }}>✓ Complete</button>
                        : <button onClick={() => { onUncomplete(block.id); setShowMenu(false); }}>↩ Undo</button>
                    }
                    <button onClick={() => { onEdit(block); setShowMenu(false); }}><Pencil size={13} style={{verticalAlign:"middle",marginRight:4}}/>Edit</button>
                    <button className="danger" onClick={() => { onDelete(block.id); setShowMenu(false); }}>✕ Delete</button>
                </div>
            )}
            {!block.completed && (
                <div
                    onMouseDown={handleBotResize}
                    style={{ position:"absolute", bottom:0, left:0, right:0, height:7, cursor:"s-resize", zIndex:10, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"0 0 5px 5px" }}
                >
                    <div style={{ width:20, height:3, borderRadius:2, background: color + "55" }} />
                </div>
            )}
        </div>
    );
}

function EditBlockModal({ block, entries, dayBlocks, courseBlocks, onClose, onSave }) {
    const [startTime, setStartTime]   = useState(block.startTime.slice(0, 5));
    const [duration, setDuration]     = useState(String(block.duration));
    const [entryId, setEntryId]       = useState(String(block.studyPlanEntryId));
    const [error, setError]           = useState("");

    const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "var(--text)", outline: "none", background: "var(--surface)" };
    const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 };

    const handleSave = () => {
        setError("");
        const [h, m] = startTime.split(":").map(Number);
        if (isNaN(h) || isNaN(m)) { setError("Invalid start time"); return; }
        const dur = parseFloat(duration);
        if (!dur || dur <= 0) { setError("Invalid duration"); return; }

        const newStart = h + m / 60;
        const newEnd   = newStart + dur;

        // Check overlap with other blocks on same day
        const overlapsBlock = (dayBlocks || []).some(b => {
            if (b.id === block.id) return false;
            const bStart = parseFloat(b.startTime.split(":")[0]) + parseFloat(b.startTime.split(":")[1]) / 60;
            const bEnd   = bStart + b.duration;
            return newStart < bEnd && newEnd > bStart;
        });
        if (overlapsBlock) { setError("This time overlaps with another block on the same day"); return; }

        // Check overlap with course blocks
        const overlapsCourse = (courseBlocks || []).some(cb => newStart < cb.endHour && newEnd > cb.startHour);
        if (overlapsCourse) { setError("This time overlaps with a class"); return; }

        onSave(block.id, { startTime: startTime + ":00", duration: dur, studyPlanEntryId: parseInt(entryId) });
        onClose();
    };

    return (
        <div className="sp-modal-backdrop" onClick={onClose}>
            <div className="sp-modal" onClick={e => e.stopPropagation()}>
                <h2>Edit Block</h2>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Entry</label>
                    <select value={entryId} onChange={e => setEntryId(e.target.value)} style={{ ...inputStyle }}>
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
                {error && <div style={{ marginBottom: 14, fontSize: 12, color: "var(--error)", background: "var(--error-bg)", borderRadius: 6, padding: "8px 12px" }}>{error}</div>}
                <div className="sp-modal-actions">
                    <button className="sp-btn sp-btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="sp-btn sp-btn-primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}

function AvailabilitySlot({ slot, dayKey, onDelete, onResize }) {
    const [liveStartHour, setLiveStartHour] = useState(null);
    const [liveEndHour, setLiveEndHour] = useState(null);
    const topDragRef = useRef(null);
    const botDragRef = useRef(null);
    const moveDragRef = useRef(null);
    const slotRef = useRef(null);
    const startHour = liveStartHour ?? slot.startHour;
    const endHour = liveEndHour ?? slot.endHour;
    const top = hourToPx(startHour);
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 10);

    const autoScroll = useCallback((ev) => {
        const scrollEl = slotRef.current?.closest(".sp-cal-body");
        if (!scrollEl) return;
        const { top: st, bottom: sb } = scrollEl.getBoundingClientRect();
        const ZONE = 80;
        if (ev.clientY > sb - ZONE) scrollEl.scrollTop += Math.round((ZONE - (sb - ev.clientY)) / 4);
        else if (ev.clientY < st + ZONE) scrollEl.scrollTop -= Math.round((ZONE - (ev.clientY - st)) / 4);
    }, []);

    const handleTopResizeStart = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        const scrollEl = slotRef.current?.closest(".sp-cal-body");
        topDragRef.current = { startY: e.clientY, startScroll: scrollEl?.scrollTop ?? 0, origStart: slot.startHour, curStart: slot.startHour };
        const onMove = (ev) => {
            const scrollDelta = (scrollEl?.scrollTop ?? 0) - topDragRef.current.startScroll;
            const diff = (ev.clientY - topDragRef.current.startY + scrollDelta) / HOUR_HEIGHT;
            const newStart = Math.min(Math.max(snapToQuarter(topDragRef.current.origStart + diff), START_HOUR), slot.endHour - 0.25);
            topDragRef.current.curStart = newStart;
            setLiveStartHour(newStart);
            autoScroll(ev);
        };
        const onUp = () => {
            if (topDragRef.current) { onResize(dayKey, slot.id, { startHour: topDragRef.current.curStart }); setLiveStartHour(null); }
            topDragRef.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [slot, dayKey, onResize, autoScroll]);

    const handleBotResizeStart = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        const scrollEl = slotRef.current?.closest(".sp-cal-body");
        botDragRef.current = { startY: e.clientY, startScroll: scrollEl?.scrollTop ?? 0, origEnd: slot.endHour, curEnd: slot.endHour };
        const onMove = (ev) => {
            const scrollDelta = (scrollEl?.scrollTop ?? 0) - botDragRef.current.startScroll;
            const diff = (ev.clientY - botDragRef.current.startY + scrollDelta) / HOUR_HEIGHT;
            const newEnd = Math.max(snapToQuarter(botDragRef.current.origEnd + diff), slot.startHour + 0.25);
            botDragRef.current.curEnd = newEnd;
            setLiveEndHour(newEnd);
            autoScroll(ev);
        };
        const onUp = () => {
            if (botDragRef.current) { onResize(dayKey, slot.id, { endHour: botDragRef.current.curEnd }); setLiveEndHour(null); }
            botDragRef.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [slot, dayKey, onResize, autoScroll]);

    const handleMoveStart = useCallback((e) => {
        if (e.target.closest("[data-resize]")) return;
        e.stopPropagation();
        e.preventDefault();
        const scrollEl = slotRef.current?.closest(".sp-cal-body");
        const dur = slot.endHour - slot.startHour;
        moveDragRef.current = { startY: e.clientY, startScroll: scrollEl?.scrollTop ?? 0, origStart: slot.startHour, dur, curStart: null, curEnd: null };
        const onMove = (ev) => {
            if (!moveDragRef.current) return;
            const scrollDelta = (scrollEl?.scrollTop ?? 0) - moveDragRef.current.startScroll;
            const diff = (ev.clientY - moveDragRef.current.startY + scrollDelta) / HOUR_HEIGHT;
            const newStart = Math.min(Math.max(snapToQuarter(moveDragRef.current.origStart + diff), START_HOUR), END_HOUR - moveDragRef.current.dur);
            const newEnd = newStart + moveDragRef.current.dur;
            moveDragRef.current.curStart = newStart;
            moveDragRef.current.curEnd = newEnd;
            setLiveStartHour(newStart);
            setLiveEndHour(newEnd);
            autoScroll(ev);
        };
        const onUp = () => {
            if (moveDragRef.current?.curStart != null) {
                onResize(dayKey, slot.id, { startHour: moveDragRef.current.curStart, endHour: moveDragRef.current.curEnd });
            }
            setLiveStartHour(null);
            setLiveEndHour(null);
            moveDragRef.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [slot, dayKey, onResize, autoScroll]);

    return (
        <div
            ref={slotRef}
            className="sp-avail-slot"
            style={{ top: top + 2, height: Math.max(height - 4, 10), cursor: "grab" }}
            title={`${formatTime(startHour)} – ${formatTime(endHour)}`}
            onMouseDown={handleMoveStart}
        >
            <div data-resize="top" onMouseDown={handleTopResizeStart} style={{ position:"absolute", top:0, left:0, right:0, height:8, cursor:"n-resize", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:24, height:3, borderRadius:2, background:"var(--border2)" }} />
            </div>
            <span className="sp-slot-time">{formatTime(startHour)}–{formatTime(endHour)}</span>
            <button className="sp-slot-delete" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(dayKey, slot.id); }}>×</button>
            <div data-resize="bot" onMouseDown={handleBotResizeStart} style={{ position:"absolute", bottom:0, left:0, right:0, height:8, cursor:"s-resize", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:24, height:3, borderRadius:2, background:"var(--border2)" }} />
            </div>
        </div>
    );
}

function CourseBlock({ startHour, endHour, courseCode, sectionNumber, color, onDismiss, isPast }) {
    const top = hourToPx(startHour);
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT - 4, 20);
    return (
        <div
            style={{ position:"absolute", top:top+2, height, left:4, right:4, zIndex:2, background:color, borderRadius:6, padding:"4px 6px", overflow:"hidden", boxShadow:`0 2px 6px ${color}55`, pointerEvents: isPast ? "none" : "auto" }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:2, height:"100%" }}>
                <div style={{ minWidth:0, overflow:"hidden" }}>
                    <div style={{ fontSize:10, fontWeight:800, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", textShadow:"0 1px 2px rgba(0,0,0,0.2)" }}>{courseCode} {sectionNumber}</div>
                    {height > 26 && <div style={{ fontSize:9, color:"rgba(255,255,255,0.85)" }}>{formatTime(startHour)} – {formatTime(endHour)}</div>}
                </div>
                {onDismiss && height > 26 && (
                    <button onClick={e => { e.stopPropagation(); onDismiss(); }} style={{ background:"rgba(0,0,0,0.15)", border:"none", color:"#fff", cursor:"pointer", fontSize:11, padding:"1px 4px", lineHeight:1, borderRadius:3, flexShrink:0 }} title="Remove for today">×</button>
                )}
            </div>
        </div>
    );
}

function DayColumn({
                       date, dayKey, blocks, colorMap, entries,
                       availabilitySlots, onCompleteBlock, onDeleteBlock, onUncompleteBlock,
                       onAddSlot, onDeleteSlot, onResizeSlot, isAvailabilityMode, showSlotOverlay, onEditBlock,
                       onResizeBlock, courseBlocks, onDismissCourse, nowTime,
                   }) {
    const columnRef = useRef(null);
    const dragRef = useRef(null);
    const [dragging, setDragging] = useState(null);

    const getHourFromEvent = useCallback((e) => {
        const rect = columnRef.current.getBoundingClientRect();
        return snapToQuarter(pxToHour(e.clientY - rect.top));
    }, []);

    const handleMouseDown = useCallback((e) => {
        if (!isAvailabilityMode && !showSlotOverlay) return;
        if (e.target.closest(".sp-avail-slot") || e.target.closest(".sp-study-block")) return;
        e.preventDefault();
        const startHour = Math.min(getHourFromEvent(e), END_HOUR - 0.25);
        dragRef.current = { startHour, endHour: Math.min(startHour + 0.25, END_HOUR) };
        setDragging({ startHour, endHour: Math.min(startHour + 0.25, END_HOUR) });
    }, [isAvailabilityMode, getHourFromEvent]);

    const handleMouseMove = useCallback((e) => {
        if (!dragRef.current) return;
        const currentHour = getHourFromEvent(e);
        const endHour = Math.min(Math.max(snapToQuarter(currentHour), dragRef.current.startHour + 0.25), END_HOUR);
        dragRef.current.endHour = endHour;
        setDragging({ startHour: dragRef.current.startHour, endHour });
        const scrollEl = columnRef.current?.closest(".sp-cal-body");
        if (scrollEl) {
            const { top, bottom } = scrollEl.getBoundingClientRect();
            const ZONE = 80;
            if (e.clientY > bottom - ZONE) scrollEl.scrollTop += Math.round((ZONE - (bottom - e.clientY)) / 4);
            else if (e.clientY < top + ZONE) scrollEl.scrollTop -= Math.round((ZONE - (e.clientY - top)) / 4);
        }
    }, [getHourFromEvent]);

    const handleMouseUp = useCallback(() => {
        if (!dragRef.current) return;
        const { startHour, endHour } = dragRef.current;
        if (endHour - startHour >= 0.25) {
            const overlapsCourse = (courseBlocks || []).some(cb => startHour < cb.endHour && endHour > cb.startHour);
            if (!overlapsCourse) onAddSlot(dayKey, { startHour, endHour, id: Date.now(), date });
        }
        dragRef.current = null;
        setDragging(null);
    }, [dayKey, onAddSlot, courseBlocks]);

    useEffect(() => {
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [handleMouseMove, handleMouseUp]);

    const _colToday = new Date(); _colToday.setHours(0,0,0,0);
    const _colDate  = new Date(date); _colDate.setHours(0,0,0,0);
    const isPastDay = _colDate < _colToday;

    return (
        <div
            className={`sp-day-column ${isToday(date) ? "today" : ""} ${isAvailabilityMode ? "avail-mode" : ""}`}
            style={isPastDay ? { background: "var(--divider)" } : undefined}
            ref={columnRef}
            onMouseDown={handleMouseDown}
        >
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="sp-hour-line" style={{ top: i * HOUR_HEIGHT }} />
            ))}
            {(availabilitySlots || []).map(slot => (
                <AvailabilitySlot key={slot.id} slot={slot} dayKey={dayKey} onDelete={onDeleteSlot} onResize={onResizeSlot} />
            ))}
            {(courseBlocks || []).map((cb, i) => (
                <CourseBlock key={`course-${i}`} startHour={cb.startHour} endHour={cb.endHour} courseCode={cb.courseCode} sectionNumber={cb.sectionNumber} color={cb.color}
                    onDismiss={onDismissCourse ? () => onDismissCourse(cb.crn) : null} isPast={isPastDay} />
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
                            color={colorMap[String(block.studyPlanEntryId)] || "var(--primary)"}
                            entryName={(() => { const e = entries.find(en => String(en.id) === String(block.studyPlanEntryId)); return e ? (e.name || e.course || "Study") : (block.taskTitle || block.course || "Study"); })()}
                            onComplete={onCompleteBlock}
                            onDelete={onDeleteBlock}
                            onUncomplete={onUncompleteBlock}
                            onEdit={onEditBlock}
                            onResizeBlock={onResizeBlock}
                            isPast={isPastDay}
                            isAvailabilityMode={isAvailabilityMode}
                            dayBlocks={blockList}
                            courseBlocks={courseBlocks}
                            colIndex={colIdx}
                            totalCols={totalCols}
                        />
                    ))
                );
            })()}
            {nowTime && (
                <div style={{
                    position:"absolute", top: hourToPx(nowTime.getHours() + nowTime.getMinutes() / 60),
                    left:0, right:0, zIndex:15, pointerEvents:"none", display:"flex", alignItems:"center",
                }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#e53935", flexShrink:0, marginLeft:-4 }} />
                    <div style={{ flex:1, height:2, background:"#e53935", opacity:0.85 }} />
                </div>
            )}
        </div>
    );
}

function EntryPanel({ entries, onAdd, onDelete, onUpdateHours, colorMap, onColorChange, userId, weekStart, isPastWeek, entriesLoading, onCarryOver }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [hoursPerWeek, setHoursPerWeek] = useState("");
    const [color, setColor] = useState(PALETTE[0]);
    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingHoursId, setEditingHoursId] = useState(null);
    const [draftHours, setDraftHours] = useState("");
    const [taskDropOpen, setTaskDropOpen] = useState(false);

    useEffect(() => {
        if (!openColorPickerId) return;
        const close = () => setOpenColorPickerId(null);
        const timer = setTimeout(() => window.addEventListener("click", close), 0);
        return () => { clearTimeout(timer); window.removeEventListener("click", close); };
    }, [openColorPickerId]);


    useEffect(() => {
        apiFetch(`/api/tasks/list-all`).then(data => {
            if (data) setTasks(data);
        });
    }, [userId]);

    const selectedTask = tasks.find(t => String(t.id) === String(selectedTaskId));
    const addedTaskIds = new Set(entries.map(e => String(e.taskId)));

    // Filter out tasks already added AND tasks whose deadline has passed before this week
    const weekStartDate = weekStart ? new Date(weekStart) : null;
    const availableTasks = tasks.filter(t => {
        if (addedTaskIds.has(String(t.id))) return false;
        if (t.completed) return false;
        if (weekStartDate && t.deadline) {
            const deadline = new Date(t.deadline);
            if (deadline < weekStartDate) return false;
        }
        return true;
    });

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

            {!isPastWeek && <div className="sp-entry-form">
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
                    <div style={{ position:"relative", marginBottom:12 }}>
                        <button onClick={() => setTaskDropOpen(o => !o)} style={{
                            padding:"8px 14px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                            display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                            background:"var(--surface)", border:"1px solid var(--border)", color: selectedTaskId ? "var(--text)" : "var(--text3)",
                            fontFamily:"'DM Sans',sans-serif",
                        }}>
                            {selectedTaskId
                                ? (() => { const t = availableTasks.find(t => String(t.id) === String(selectedTaskId)); return t ? `${t.title} - ${t.course}` : "Pick a task"; })()
                                : "Pick a task"}
                            <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: taskDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                        </button>
                        {taskDropOpen && (
                            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                                <div onClick={() => { setSelectedTaskId(""); setTaskDropOpen(false); }}
                                    className="kk-option"
                                    style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                                        transition:"background .15s",
                                        background: !selectedTaskId ? "var(--divider)" : "transparent",
                                        color:      !selectedTaskId ? "var(--accent)"  : "var(--primary)" }}>
                                    Pick a task
                                </div>
                                {availableTasks.map(t => (
                                    <div key={t.id} onClick={() => { setSelectedTaskId(t.id); setTaskDropOpen(false); }}
                                        className="kk-option"
                                        style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                                            transition:"background .15s",
                                            background: String(selectedTaskId) === String(t.id) ? "var(--divider)" : "transparent",
                                            color:      String(selectedTaskId) === String(t.id) ? "var(--accent)"  : "var(--primary)" }}>
                                        {t.title} - {t.course}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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

                {selectedTask && (
                    <input
                        className="sp-input"
                        type="number"
                        placeholder="Hours per week"
                        min="0.5"
                        max="40"
                        step="0.5"
                        value={hoursPerWeek}
                        onChange={e => setHoursPerWeek(e.target.value)}
                        onKeyDown={e => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
                    />
                )}

                <div className="sp-color-row">
                    {PALETTE.slice(0, 7).map(c => (
                        <button
                            key={c}
                            className={`sp-color-dot ${color === c ? "selected" : ""}`}
                            style={{ background: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                    <label title="Custom color" style={{ width:"100%", aspectRatio:"1", borderRadius:"50%", border:"2px dashed var(--text3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
                        <span style={{ fontSize:13, color:"var(--text3)", lineHeight:1, pointerEvents:"none" }}>+</span>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)}
                            style={{ position:"absolute", opacity:0, width:"100%", height:"100%", cursor:"pointer", top:0, left:0 }} />
                    </label>
                </div>
                <button className="sp-add-btn" onClick={handleAdd} disabled={!selectedTask || !hoursPerWeek}>
                    + Add Entry
                </button>
            </div>}

            {isPastWeek && (() => {
                const incomplete = entries.filter(e => (e.completedHours || 0) < e.hoursPerWeek);
                if (incomplete.length === 0) return null;
                return (
                    <div style={{ margin:"0 0 12px 0", padding:"10px 12px", background:"var(--surface2)", borderRadius:8, border:"1px solid var(--border)" }}>
                        <div style={{ fontSize:11, color:"var(--text2)", marginBottom:8, fontWeight:500 }}>
                            {incomplete.length} {incomplete.length === 1 ? "entry" : "entries"} not fully completed
                        </div>
                        <button
                            style={{ width:"100%", cursor:"pointer", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", border:"none", borderRadius:7, padding:"7px 0", fontSize:11, fontWeight:600, fontFamily:"'DM Sans', sans-serif" }}
                            onClick={() => onCarryOver(incomplete)}
                        >
                            Carry over to current week →
                        </button>
                    </div>
                );
            })()}
            <div className="sp-entry-list">
                {!entriesLoading && entries.length === 0 && (
                    <div className="sp-empty-hint">No study entries for this week.</div>
                )}
                {entries.map(entry => {
                    const isOpen = openColorPickerId === entry.id;
                    const entryColor = colorMap[String(entry.id)] || entry.color;
                    const completed = Math.min(entry.completedHours || 0, entry.hoursPerWeek);
                    const remaining = Math.max(0, entry.hoursPerWeek - completed);
                    return (
                        <div key={entry.id} className="sp-entry-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div className="sp-entry-color-col">
                                    <div
                                        onClick={e => { if (isPastWeek) return; e.stopPropagation(); setOpenColorPickerId(isOpen ? null : entry.id); }}
                                        style={{ width:20, height:20, borderRadius:6, background: entryColor, cursor: isPastWeek ? "default" : "pointer", border:"2px solid var(--border)" }}
                                    />
                                </div>
                                <div className="sp-entry-info">
                                    <div className="sp-entry-name">{entry.name}</div>
                                    {entry.course && <div style={{ fontSize:10, color:"var(--text2)", marginTop:1, marginBottom:2 }}>{entry.course}</div>}
                                    <div className="sp-entry-meta">
                                        {isPastWeek ? (
                                            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                                                <span style={{ fontSize:11, color:"var(--text2)" }}>Completed: <b>{completed}h</b> / {entry.hoursPerWeek}h</span>
                                                {remaining > 0 && <span style={{ fontSize:10, color:"var(--error)" }}>{remaining}h not completed</span>}
                                            </div>
                                        ) : editingHoursId === entry.id ? (
                                            <input
                                                type="number"
                                                value={draftHours}
                                                min="0.5" max="40" step="0.5"
                                                autoFocus
                                                onChange={e => setDraftHours(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter") {
                                                        const h = parseFloat(draftHours);
                                                        if (h > 0) onUpdateHours(entry.id, h);
                                                        setEditingHoursId(null);
                                                    }
                                                    if (e.key === "Escape") setEditingHoursId(null);
                                                    ["e","E","+","-"].includes(e.key) && e.preventDefault();
                                                }}
                                                onBlur={() => {
                                                    const h = parseFloat(draftHours);
                                                    if (h > 0) onUpdateHours(entry.id, h);
                                                    setEditingHoursId(null);
                                                }}
                                                style={{ width: 52, padding: "1px 5px", fontSize: 11, borderRadius: 5, border: "1px solid var(--primary)", outline: "none", fontFamily: "'DM Sans', sans-serif", color: "var(--text)", background: "var(--surface)" }}
                                            />
                                        ) : (
                                            <span
                                                className="sp-hours-badge"
                                                title="Click to edit hours"
                                                style={{ cursor: "pointer", display:"inline-flex", alignItems:"center", gap:3 }}
                                                onClick={() => { setEditingHoursId(entry.id); setDraftHours(String(entry.hoursPerWeek)); }}
                                            >
                                                {entry.hoursPerWeek}h/wk
                                                <Pencil size={9} style={{ opacity: 0.45, flexShrink:0 }} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!isPastWeek && <button className="sp-entry-delete" onClick={() => onDelete(entry.id)}>×</button>}
                            </div>
                            {!isPastWeek && isOpen && (
                                <div onClick={e => e.stopPropagation()} style={{ display:"flex", gap:4, marginTop:8, padding:"6px 4px 2px", borderTop:"1px solid var(--border)", alignItems:"center", flexWrap:"nowrap" }}>
                                    {PALETTE.slice(0, 7).map(c => (
                                        <button key={c} onClick={e => { e.stopPropagation(); onColorChange(entry.id, c); }}
                                                style={{ width:18, height:18, borderRadius:"50%", background:c, border: entryColor===c?"2px solid var(--text)":"2px solid transparent", cursor:"pointer", padding:0, flexShrink:0 }}
                                        />
                                    ))}
                                    <label title="Custom color" style={{ width:18, height:18, borderRadius:"50%", border:"2px dashed var(--text3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative", flexShrink:0 }}>
                                        <span style={{ fontSize:12, color:"var(--text3)", lineHeight:1, pointerEvents:"none" }}>+</span>
                                        <input type="color" value={entryColor} onChange={e => onColorChange(entry.id, e.target.value)}
                                            style={{ position:"absolute", opacity:0, width:"100%", height:"100%", cursor:"pointer", top:0, left:0 }} />
                                    </label>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SlotPanel({ availability, onDeleteSlot, onClearAll }) {
    const allSlots = DAY_KEYS.flatMap(dayKey =>
        (availability[dayKey] || []).slice().sort((a, b) => a.startHour - b.startHour).map(s => ({ ...s, dayKey }))
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
                        style={{ background:"var(--error-bg)", border:"none", color:"var(--error)", borderRadius:4, width:20, height:20, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
                    >×</button>
                </div>
            ))}
        </div>
    );
}

function CoursesPanel({ enrolledSections, courseColorOverrides, onColorChange, dismissedSections, onRestore, weekDateStrings }) {
    const [openCrn, setOpenCrn] = useState(null);

    useEffect(() => {
        if (!openCrn) return;
        const close = () => setOpenCrn(null);
        const timer = setTimeout(() => window.addEventListener("click", close), 0);
        return () => { clearTimeout(timer); window.removeEventListener("click", close); };
    }, [openCrn]);

    if (enrolledSections.length === 0) {
        return (
            <div className="sp-slot-panel">
                <div className="sp-panel-title">My Courses</div>
                <div className="sp-empty-hint">No courses with sections found for this semester.</div>
            </div>
        );
    }

    const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat", SUNDAY:"Sun" };

    const weekSet = new Set(weekDateStrings || []);
    const dismissedThisWeek = [...(dismissedSections || [])].filter(key => {
        const dateStr = key.split("_")[0];
        return weekSet.has(dateStr) && enrolledSections.some(es => key.endsWith(`_${es.crn}`));
    });

    return (
        <div className="sp-slot-panel">
            {/* Section 1: Cancelled classes */}
            <div style={{ marginBottom:18 }}>
                <div className="sp-panel-title" style={{ marginBottom:8 }}>Skipped Classes</div>
                {dismissedThisWeek.length === 0 ? (
                    <div className="sp-empty-hint">No skipped classes this week.</div>
                ) : dismissedThisWeek.map(key => {
                    const [dateStr, ...crnParts] = key.split("_");
                    const crn = crnParts.join("_");
                    const es = enrolledSections.find(e => e.crn === crn);
                    const esIdx = enrolledSections.findIndex(e => e.crn === crn);
                    const color = courseColorOverrides[crn] || (esIdx >= 0 ? COURSE_COLORS[esIdx % COURSE_COLORS.length] : "var(--text3)");
                    const d = new Date(dateStr + "T00:00:00");
                    const label = d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });
                    return (
                        <div key={key} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px", background:"var(--surface2)", borderRadius:8, marginBottom:4 }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }} />
                            <div style={{ flex:1, minWidth:0 }}>
                                <span style={{ fontSize:11, fontWeight:600, color:"var(--text)" }}>{es?.courseCode}</span>
                                <span style={{ fontSize:10, color:"var(--text3)", marginLeft:6 }}>{label}</span>
                            </div>
                            <button onClick={() => onRestore(key)} style={{ fontSize:10, background:"var(--blue-light-bg)", color:"var(--primary)", border:"none", borderRadius:5, padding:"2px 7px", cursor:"pointer", fontWeight:600 }}>Restore</button>
                        </div>
                    );
                })}
            </div>
            {/* Divider */}
            <div style={{ borderTop:"1px solid var(--border)", marginBottom:14 }} />
            {/* Section 2: Course colors */}
            <div className="sp-panel-title" style={{ marginBottom:8 }}>Course Colors</div>
            <div style={{ fontSize:10, color:"var(--text3)", marginBottom:10, lineHeight:1.4 }}>Click the color circle to change a course color.</div>
            {enrolledSections.map((es, idx) => {
                const color = courseColorOverrides[es.crn] || COURSE_COLORS[idx % COURSE_COLORS.length];
                const slots = getSectionTimeSlots(es.section);
                const isOpen = openCrn === es.crn;
                return (
                    <div key={es.crn} style={{ marginBottom:12, background:"var(--surface2)", borderRadius:10, overflow:"hidden", border:"1px solid var(--border)" }}>
                        {/* Course row */}
                        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px" }}>
                            {/* Color swatch — click to open picker */}
                            <button
                                onClick={() => setOpenCrn(isOpen ? null : es.crn)}
                                style={{ width:18, height:18, borderRadius:"50%", background:color, border: isOpen ? "2px solid var(--text)" : "2px solid transparent", cursor:"pointer", padding:0, flexShrink:0, boxShadow:`0 1px 4px ${color}66` }}
                                title="Change color"
                            />
                            <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{es.courseCode}</div>
                                <div style={{ fontSize:10, color:"var(--text2)" }}>Section {es.section?.sectionNumber}</div>
                            </div>
                        </div>
                        {/* Schedule times */}
                        {slots.length > 0 && (
                            <div style={{ padding:"0 10px 8px", display:"flex", flexDirection:"column", gap:2 }}>
                                {slots.map((sl, si) => (
                                    <div key={si} style={{ fontSize:10, color:"var(--text3)", display:"flex", gap:6 }}>
                                        <span style={{ fontWeight:600, color:"var(--text2)", minWidth:28 }}>{DAY_SHORT[sl.dayKey]}</span>
                                        <span>{formatTime(sl.startHour)} – {formatTime(sl.endHour)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Color picker */}
                        {isOpen && (
                            <div style={{ padding:"8px 10px 10px", borderTop:"1px solid var(--border)", display:"flex", flexWrap:"nowrap", gap:4, alignItems:"center" }}>
                                {COURSE_PICKER_COLORS.map(c => (
                                    <button key={c} onClick={e => { e.stopPropagation(); onColorChange(es.crn, c); }}
                                        style={{ width:18, height:18, borderRadius:"50%", background:c, border: c === color ? "2px solid var(--text)" : "2px solid transparent", cursor:"pointer", padding:0, outline:"none", flexShrink:0 }} />
                                ))}
                                {/* Custom color — native OS picker */}
                                <label title="Custom color" style={{ width:18, height:18, borderRadius:"50%", border:"2px dashed var(--text3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative", flexShrink:0 }}>
                                    <span style={{ fontSize:12, color:"var(--text3)", lineHeight:1, pointerEvents:"none" }}>+</span>
                                    <input type="color" value={color} onChange={e => onColorChange(es.crn, e.target.value)}
                                        style={{ position:"absolute", opacity:0, width:"100%", height:"100%", cursor:"pointer", top:0, left:0 }} />
                                </label>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function StudyPlanner({ enrolledSections = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekBlocks, setWeekBlocks] = useState({});
    const [availability, setAvailability] = useState({});
    const [isAvailabilityMode, setIsAvailabilityMode] = useState(false);
    const [colorMap, setColorMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [nowTime, setNowTime] = useState(new Date());
    const [toast, setToast] = useState(null);
    const [undoToast, setUndoToast] = useState(null); // { msg }
    const undoPendingRef = useRef(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [postGenWarnings, setPostGenWarnings] = useState([]);
    const [entries, setEntries] = useState([]);
    const [entriesLoading, setEntriesLoading] = useState(true);
    const [activePanel, setActivePanel] = useState("entries"); // "entries" | "slots"
    const [editingBlock, setEditingBlock] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [showSlotOverlay, setShowSlotOverlay] = useState(true);
    const [dismissedSections, setDismissedSections] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem("kk_dismissed_sections") || "[]")); } catch { return new Set(); }
    });
    const clearUndo = useCallback(() => {
        if (undoPendingRef.current) {
            clearTimeout(undoPendingRef.current.timer);
            const pending = undoPendingRef.current;
            undoPendingRef.current = null;
            // Commit the pending action immediately so it isn't silently dropped
            if (pending.commitFn) pending.commitFn().catch(() => {});
        }
        setUndoToast(null);
    }, []);

    const triggerUndo = useCallback(() => {
        if (undoPendingRef.current) {
            clearTimeout(undoPendingRef.current.timer);
            undoPendingRef.current.restoreFn();
            undoPendingRef.current = null;
        }
        setUndoToast(null);
    }, []);

    const restoreSection = useCallback((key) => {
        setDismissedSections(prev => {
            const next = new Set(prev);
            next.delete(key);
            localStorage.setItem("kk_dismissed_sections", JSON.stringify([...next]));
            return next;
        });
    }, []);
    const dismissSection = useCallback((dateStr, crn) => {
        const key = `${dateStr}_${crn}`;
        setDismissedSections(prev => {
            const next = new Set(prev);
            next.add(key);
            localStorage.setItem("kk_dismissed_sections", JSON.stringify([...next]));
            return next;
        });
        clearUndo();
        setUndoToast({ msg: "Class hidden" });
        undoPendingRef.current = {
            restoreFn: () => restoreSection(key),
            timer: setTimeout(() => {
                undoPendingRef.current = null;
                setUndoToast(null);
            }, 5000),
        };
    }, [clearUndo, restoreSection]);
    const [courseColorOverrides, setCourseColorOverrides] = useState(() => {
        try { return JSON.parse(localStorage.getItem("kk_course_section_colors") || "{}"); } catch { return {}; }
    });
    const setCourseColor = useCallback((crn, color) => {
        setCourseColorOverrides(prev => {
            const next = { ...prev, [crn]: color };
            localStorage.setItem("kk_course_section_colors", JSON.stringify(next));
            return next;
        });
    }, []);

    const calBodyRef = useCallback((el) => {
        if (el) {
            const now = new Date();
            const todayInWeek = getWeekDates(currentDate).some(d => {
                const a = new Date(d); a.setHours(0,0,0,0);
                const b = new Date(); b.setHours(0,0,0,0);
                return a.getTime() === b.getTime();
            });
            const scrollHour = todayInWeek ? Math.max(0, now.getHours() + now.getMinutes() / 60 - 1.5) : 8;
            el.scrollTop = scrollHour * HOUR_HEIGHT;
            const main = document.querySelector("main");
            if (main) main.scrollTop = 0;
        }
    }, []);

    const weekDates = getWeekDates(currentDate);
    const weekStart = toLocalDateString(weekDates[0]);

    const courseBlocksPerDay = useMemo(() => {
        const map = {};
        enrolledSections.forEach((es, idx) => {
            const color = courseColorOverrides[es.crn] || COURSE_COLORS[idx % COURSE_COLORS.length];
            getSectionTimeSlots(es.section).forEach(({ dayKey, startHour, endHour }) => {
                if (!map[dayKey]) map[dayKey] = [];
                map[dayKey].push({ startHour, endHour, courseCode: es.courseCode, sectionNumber: es.sectionNumber, color, crn: es.crn });
            });
        });
        return map;
    }, [enrolledSections, courseColorOverrides]);

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
        setEntriesLoading(true);
        const data = await apiFetch(`/api/study-plan/entries?weekStart=${weekStart}`);
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((entry, i) => ({
            id: entry.id,
            taskId: entry.task?.id,
            name: entry.task?.title || "Untitled",
            course: entry.task?.course || "",
            deadline: entry.task?.deadline ?? entry.deadline ?? null,
            workload: entry.estimatedWorkload >= 8 ? "heavy"
                : entry.estimatedWorkload >= 4 ? "medium" : "light",
            hoursPerWeek: entry.estimatedWorkload,
            completedHours: entry.completedHours,
            color: PALETTE[i % PALETTE.length],
        }));
        setEntries(mapped);
        setEntriesLoading(false);
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
        const data = await apiFetch(`/api/study-plan/weekly?weekStart=${weekStart}`);
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
        const data = await apiFetch(`/api/study-plan/slots?weekStart=${weekStart}`);
        if (data) {
            const today = new Date(); today.setHours(0,0,0,0);
            const weekStartDate = new Date(weekStart);
            const dayOffset = { MONDAY:0, TUESDAY:1, WEDNESDAY:2, THURSDAY:3, FRIDAY:4, SATURDAY:5, SUNDAY:6 };
            const map = {};
            let hadPastSlots = false;
            data.forEach(s => {
                const offset = dayOffset[s.dayKey] ?? 0;
                const slotDate = new Date(weekStartDate); slotDate.setDate(weekStartDate.getDate() + offset); slotDate.setHours(0,0,0,0);
                if (slotDate < today) { hadPastSlots = true; return; }
                if (!map[s.dayKey]) map[s.dayKey] = [];
                map[s.dayKey].push({
                    id: s.id,
                    dayKey: s.dayKey,
                    startHour: parseFloat(s.startTime.split(":")[0]) + parseFloat(s.startTime.split(":")[1]) / 60,
                    endHour: parseFloat(s.endTime.split(":")[0]) + parseFloat(s.endTime.split(":")[1]) / 60,
                });
            });
            if (hadPastSlots) {
                const toTime = h => { const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); return `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:00`; };
                const slots = [];
                Object.entries(map).forEach(([dk, daySlots]) => daySlots.forEach(s => slots.push({ dayKey: dk, startTime: toTime(s.startHour), endTime: toTime(s.endHour) })));
                apiFetch(`/api/study-plan/slots?weekStart=${weekStart}`, { method: "POST", body: JSON.stringify(slots) }).catch(() => {});
            }
            setAvailability(map);
            return map;
        }
        return null;
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
            await apiFetch(`/api/study-plan/slots?weekStart=${weekStart}`, {
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
        setPostGenWarnings([]);
    }, [weekStart]);

    useEffect(() => {
        const tick = () => setNowTime(new Date());
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, []);

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

    const handleDeleteBlock = useCallback((blockId) => {
        let deletedBlock = null, deletedDay = null;
        let allGone = false;
        setWeekBlocks(prev => {
            const next = {};
            for (const [day, blocks] of Object.entries(prev)) {
                const found = blocks.find(b => String(b.id) === String(blockId));
                if (found) { deletedBlock = found; deletedDay = day; }
                next[day] = blocks.filter(b => String(b.id) !== String(blockId));
            }
            allGone = Object.values(next).every(arr => arr.length === 0);
            return next;
        });
        if (allGone) {
            setHasGenerated(false);
            setShowSlotOverlay(true);
            localStorage.removeItem(`kk_hasGenerated_${weekStart}`);
        }
        clearUndo();
        setUndoToast({ msg: "Study block deleted" });
        const commitFn = async () => {
            try { await apiFetch(`/api/study-plan/blocks/${blockId}`, { method: "DELETE" }); } catch { /* may already be gone */ }
            return await loadSlots();
        };
        undoPendingRef.current = {
            restoreFn: () => {
                if (deletedBlock && deletedDay) {
                    setWeekBlocks(prev => {
                        const dayBlocks = [...(prev[deletedDay] || []), deletedBlock];
                        dayBlocks.sort((a, b) => a.startHour - b.startHour);
                        return { ...prev, [deletedDay]: dayBlocks };
                    });
                    setHasGenerated(true);
                    localStorage.setItem(`kk_hasGenerated_${weekStart}`, 'true');
                }
            },
            commitFn,
            timer: setTimeout(async () => {
                undoPendingRef.current = null;
                setUndoToast(null);
                await commitFn();
            }, 5000),
        };
    }, [clearUndo, loadSlots, weekStart]);

    const handleSaveEditedBlock = useCallback(async (blockId, changes) => {
        // Optimistic update so the block visually moves immediately
        setWeekBlocks(prev => {
            const next = {};
            for (const [day, blocks] of Object.entries(prev))
                next[day] = blocks.map(b => String(b.id) === String(blockId) ? { ...b, ...changes } : b);
            return next;
        });
        try {
            await apiFetch(`/api/study-plan/blocks/${blockId}`, {
                method: "PATCH",
                body: JSON.stringify(changes),
            });
            await Promise.all([loadEntries(true), loadSlots()]);
            showToast("Block updated", "success");
        } catch (e) {
            // Revert on failure
            await loadWeeklyView();
            showToast(e.message || "Failed to update block", "error");
        }
    }, [showToast, loadWeeklyView, loadEntries, loadSlots]);

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
            if (newSlot.endHour - newSlot.startHour < 0.5) {
                showToast("Slot is under 30 min and won't be used for scheduling", "warning");
            }
            return next;
        });
    }, [showToast, persistSlots]);

    const handleDeleteSlot = useCallback((dayKey, slotId) => {
        let deletedSlot = null;
        setAvailability(prev => {
            deletedSlot = (prev[dayKey] || []).find(s => s.id === slotId) || null;
            return { ...prev, [dayKey]: (prev[dayKey] || []).filter(s => s.id !== slotId) };
        });
        clearUndo();
        setUndoToast({ msg: "Slot deleted" });
        const commitFn = async () => {
            setAvailability(prev => { persistSlots(prev); return prev; });
        };
        undoPendingRef.current = {
            restoreFn: () => {
                if (deletedSlot) {
                    setAvailability(prev => {
                        const next = { ...prev, [dayKey]: [...(prev[dayKey] || []), deletedSlot] };
                        return next;
                    });
                }
            },
            commitFn,
            timer: setTimeout(() => {
                undoPendingRef.current = null;
                setUndoToast(null);
                commitFn();
            }, 5000),
        };
    }, [clearUndo, persistSlots]);

    const handleClearAllSlots = useCallback(async () => {
        const userId = getUserId();
        await apiFetch(`/api/study-plan/slots?weekStart=${weekStart}`, { method: "DELETE" });
        await apiFetch(`/api/study-plan/blocks?weekStart=${weekStart}`, { method: "DELETE" });
        setAvailability({});
        setWeekBlocks({});
        setHasGenerated(false);
        localStorage.removeItem(`kk_hasGenerated_${weekStart}`);
        setShowSlotOverlay(true);
        showToast("All slots cleared", "info");
    }, [showToast, weekStart]);

    const handleResizeSlot = useCallback((dayKey, slotId, update) => {
        setAvailability(prev => {
            const existing = prev[dayKey] || [];
            const updatedSlot = { ...existing.find(s => s.id === slotId), ...update };
            const otherSlots = existing.filter(s => s.id !== slotId);
            if (otherSlots.some(s => slotsOverlap(s, updatedSlot))) {
                showToast("Slots can't overlap", "error");
                return prev;
            }
            const dayCourses = courseBlocksPerDay[dayKey] || [];
            if (dayCourses.some(cb => updatedSlot.startHour < cb.endHour && updatedSlot.endHour > cb.startHour)) {
                showToast("Slots can't overlap a class", "error");
                return prev;
            }
            const next = { ...prev, [dayKey]: existing.map(s => s.id === slotId ? updatedSlot : s) };
            persistSlots(next);
            return next;
        });
    }, [persistSlots, showToast, courseBlocksPerDay]);

    const handleCarryOver = useCallback(async (incompleteEntries) => {
        const currentWeekStart = toLocalDateString(getWeekDates(new Date())[0]);
        const carriedNames = [], skippedNames = [], expiredNames = [];
        const savedColors = (() => { try { return JSON.parse(localStorage.getItem('kk_colorMap') || '{}'); } catch { return {}; } })();
        for (const entry of incompleteEntries) {
            const remaining = Math.max(0.5, entry.hoursPerWeek - (entry.completedHours || 0));
            if (entry.deadline && new Date(entry.deadline) < new Date(currentWeekStart)) { expiredNames.push(entry.name); continue; }
            try {
                const res = await apiFetch(`/api/study-plan/entries/add?taskId=${entry.taskId}&estimatedWorkload=${remaining}&weekStart=${currentWeekStart}`, { method: "POST" });
                carriedNames.push(entry.name);
                const oldColor = colorMap[String(entry.id)];
                if (oldColor && res?.id) savedColors[String(res.id)] = oldColor;
            } catch { skippedNames.push(entry.name); }
        }
        if (carriedNames.length > 0) localStorage.setItem('kk_colorMap', JSON.stringify(savedColors));
        const parts = [];
        if (carriedNames.length > 0) parts.push(`${carriedNames.join(", ")} carried`);
        if (skippedNames.length > 0) parts.push(`${skippedNames.join(", ")} already in current week`);
        if (expiredNames.length > 0) parts.push(`${expiredNames.join(", ")} deadline passed`);
        if (carriedNames.length > 0) {
            showToast(parts.join(" · "), "success");
            setCurrentDate(new Date());
        } else {
            showToast(parts.length ? parts.join(" · ") : "Nothing to carry over", "info");
        }
    }, [showToast]);

    const handleAddEntry = useCallback(async (entry) => {
        if (!entry.taskId) { showToast("No task selected", "error"); return; }
        try {
            await apiFetch(
                `/api/study-plan/entries/add?taskId=${entry.taskId}&estimatedWorkload=${entry.hoursPerWeek}&weekStart=${weekStart}`,
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

    const handleDeleteEntry = useCallback((entryId) => {
        let deletedEntry = null, deletedColor = null, deletedBlocks = {};
        setEntries(prev => {
            deletedEntry = prev.find(e => e.id === entryId) || null;
            return prev.filter(e => e.id !== entryId);
        });
        setColorMap(prev => {
            deletedColor = prev[String(entryId)] || null;
            const next = { ...prev };
            delete next[String(entryId)];
            return next;
        });
        let allGone = false;
        setWeekBlocks(prev => {
            const next = {};
            for (const [day, blocks] of Object.entries(prev)) {
                const removed = blocks.filter(b => String(b.studyPlanEntryId) === String(entryId));
                if (removed.length) deletedBlocks[day] = removed;
                next[day] = blocks.filter(b => String(b.studyPlanEntryId) !== String(entryId));
            }
            allGone = Object.values(next).every(arr => arr.length === 0);
            return next;
        });
        if (allGone) {
            setHasGenerated(false);
            setShowSlotOverlay(true);
            localStorage.removeItem(`kk_hasGenerated_${weekStart}`);
        }
        clearUndo();
        setUndoToast({ msg: "Entry removed" });
        const commitFn = async () => {
            try { await apiFetch(`/api/study-plan/entries/${entryId}`, { method: "DELETE" }); }
            catch (e) { showToast(e.message || "Failed to remove entry", "error"); }
            return null;
        };
        undoPendingRef.current = {
            restoreFn: () => {
                if (deletedEntry) {
                    setEntries(prev => [...prev, deletedEntry]);
                    if (deletedColor) setColorMap(prev => ({ ...prev, [String(entryId)]: deletedColor }));
                    setWeekBlocks(prev => {
                        const next = { ...prev };
                        for (const [day, blocks] of Object.entries(deletedBlocks)) {
                            next[day] = [...(prev[day] || []), ...blocks];
                        }
                        return next;
                    });
                    if (Object.keys(deletedBlocks).length > 0) {
                        setHasGenerated(true);
                        localStorage.setItem(`kk_hasGenerated_${weekStart}`, 'true');
                    }
                }
            },
            commitFn,
            timer: setTimeout(async () => {
                undoPendingRef.current = null;
                setUndoToast(null);
                await commitFn();
            }, 5000),
        };
    }, [clearUndo, showToast, weekStart]);

    const handleUpdateEntryHours = useCallback(async (entryId, newHours) => {
        try {
            await apiFetch(`/api/study-plan/entries/${entryId}`, {
                method: "PATCH",
                body: JSON.stringify({ estimatedWorkload: newHours }),
            });
            setEntries(prev => prev.map(e => e.id === entryId ? { ...e, hoursPerWeek: newHours } : e));
            showToast("Hours updated", "success");
        } catch (e) {
            showToast(e.message || "Failed to update hours", "error");
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


    const buildSettingsPayload = useCallback((availOverride = null) => {
        // Subtract enrolled course times from availability so planner doesn't schedule during class
        const avail = availOverride ?? availability;
        const adjusted = {};
        for (const [dayKey, slots] of Object.entries(avail)) {
            const busySlots = enrolledSections.flatMap(es => getSectionTimeSlots(es.section).filter(ts => ts.dayKey === dayKey));
            const free = subtractBusyFromSlots(slots, busySlots);
            if (free.length > 0) adjusted[dayKey] = free;
        }
        return buildSchedulerSettings(adjusted);
    }, [availability, enrolledSections]);

    const handleGenerate = useCallback(async () => {
        clearUndo();
        setLoading(true);
        setShowGenerateModal(false);
        try {
            const payload = buildSettingsPayload();
            const data = await apiFetch(`/api/study-plan/generate?weekStart=${weekStart}`, {
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
                // Generate resets completedHours to 0 — update locally, no extra fetch needed
                setEntries(prev => prev.map(e => ({ ...e, completedHours: 0 })));
                const warns = (data.warnings || []).filter(w => (w.shortfall || 0) > 0.1);
                setPostGenWarnings(warns);
                if (warns.length > 0) {
                    showToast(`Plan generated, but ${warns.length} task${warns.length > 1 ? "s" : ""} couldn't be fully scheduled`, "warning");
                } else {
                    showToast("Plan generated!", "success");
                }
            } else {
                showToast("Failed to generate plan", "error");
            }
        } catch (e) {
            showToast(e.message || "Failed to generate plan", "error");
        }
        setLoading(false);
    }, [buildSettingsPayload, showToast, clearUndo]);

    const handleMarkPastDone = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/study-plan/blocks/complete-past`, { method: "POST" });
            const count = res?.marked ?? 0;
            if (count === 0) {
                showToast("No past blocks to mark done", "info");
            } else {
                showToast(`Marked ${count} block${count !== 1 ? "s" : ""} as done ✓`, "success");
                await Promise.all([loadWeeklyView(), loadEntries(true)]);
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
            await apiFetch(`/api/study-plan/blocks?weekStart=${weekStart}`, { method: "DELETE" });
            await apiFetch(`/api/study-plan/slots?weekStart=${weekStart}`, { method: "DELETE" });
            setWeekBlocks({});
            setHasGenerated(false);
            setPostGenWarnings([]);
            localStorage.removeItem(`kk_hasGenerated_${weekStart}`);
            setShowSlotOverlay(true);
            await loadSlots(); // re-seeds from default since slots were just cleared
            showToast("Plan cleared", "info");
        } catch (e) {
            showToast(e.message || "Failed to clear plan", "error");
        }
        setLoading(false);
    }, [showToast, weekStart, loadSlots]);

    const handleRebalance = useCallback(async () => {
        if (entries.length === 0) {
            showToast("No tasks to rebalance", "info");
            return;
        }
        const totalSlotHours = Object.values(availability).flat().reduce((sum, s) => sum + (s.endHour - s.startHour), 0);
        if (totalSlotHours === 0) {
            showToast("No availability slots to schedule into", "info");
            return;
        }
        const totalRemaining = entries.reduce((sum, e) => sum + Math.max(0, (e.hoursPerWeek || 0) - (e.completedHours || 0)), 0);
        if (totalRemaining <= 0.01) {
            showToast("Nothing to rebalance, all tasks are fully done", "info");
            return;
        }
        const scheduleFingerprint = (blocks) =>
            Object.entries(blocks)
                .flatMap(([day, dayBlocks]) =>
                    (dayBlocks || []).filter(b => !b.completed)
                        .map(b => `${day}:${b.startTime}:${b.duration}:${b.studyPlanEntryId}`)
                )
                .sort()
                .join("|");
        const beforePrint = scheduleFingerprint(weekBlocks);

        // Flush any pending undo (block/entry deletion) before rebalancing so the backend is in sync
        let freshAvail = null;
        if (undoPendingRef.current?.commitFn) {
            clearTimeout(undoPendingRef.current.timer);
            const commit = undoPendingRef.current.commitFn;
            undoPendingRef.current = null;
            setUndoToast(null);
            freshAvail = await commit();
        }

        setLoading(true);
        try {
            const payload = buildSettingsPayload(freshAvail);
            const data = await apiFetch(`/api/study-plan/rebalance?weekStart=${weekStart}`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            if (data) {
                const weeklyView = data.weeklyView ?? data;
                const normalized = normalizeWeeklyData(weeklyView);
                const afterPrint = scheduleFingerprint(normalized);
                const changed = beforePrint !== afterPrint;

                setWeekBlocks(normalized);
                setIsAvailabilityMode(false);
                setShowSlotOverlay(false);
                // Rebalance doesn't change entry data — skip the extra fetch

                if (!changed) {
                    // keep existing warnings visible — nothing was fixed
                    showToast("Nothing changed, the plan is already optimal", "info");
                } else {
                    const warns = (data.warnings || []).filter(w => (w.shortfall || 0) > 0.1);
                    setPostGenWarnings(warns);
                    if (warns.length > 0) {
                        showToast(`Rebalanced, but ${warns.length} task${warns.length > 1 ? "s" : ""} couldn't be fully scheduled`, "warning");
                    } else {
                        showToast("Plan rebalanced!", "success");
                    }
                }
            } else {
                showToast("Failed to rebalance plan", "error");
            }
        } catch (e) {
            showToast(e.message || "Failed to rebalance plan", "error");
        }
        setLoading(false);
    }, [buildSettingsPayload, showToast, entries, availability, weekBlocks, clearUndo]);

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
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Header ── */
        .sp-header {
          min-height: 71px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          flex-shrink: 0;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sp-header-left { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        .sp-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 18px;
          color: var(--primary);
          letter-spacing: -0.3px;
          white-space: nowrap;
        }

        .sp-week-nav { display: flex; align-items: center; gap: 4px; }

        .sp-nav-btn {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--primary);
          width: 28px; height: 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .sp-nav-btn:hover { background: var(--surface3); }

        .sp-week-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text2);
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
          border: 1px solid var(--border);
          transition: all 0.15s;
          white-space: nowrap;
        }
        .sp-btn-ghost { background: transparent; color: var(--text2); }
        .sp-btn-ghost:hover { background: var(--bg); color: var(--primary); }
        .sp-btn-outline { background: var(--surface); color: var(--primary); }
        .sp-btn-outline:hover { background: var(--bg); }
        .sp-btn-primary { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); border-color: transparent; }
        .sp-btn-primary:hover { background: color-mix(in srgb, var(--primary) 22%, transparent); }
        .sp-btn-active { background: var(--blue-light-bg); color: var(--primary); border-color: var(--primary); }

        .sp-slot-badge {
          background: var(--primary);
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
          background: var(--bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sp-sidebar-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          flex-shrink: 0;
          margin: 8px;
        }

        .sp-sidebar-tab {
          flex: 1;
          padding: 7px 8px;
          font-size: 12px;
          font-weight: 400;
          text-align: center;
          cursor: pointer;
          color: var(--text2);
          border-radius: 9px;
          border: none;
          transition: all 0.15s;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
        }
        .sp-sidebar-tab.active { color: #fff; font-weight: 600; background: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.18); }
        .sp-sidebar-tab:hover:not(.active) { background: var(--surface3); color: var(--text); }

        .sp-sidebar-content { flex: 1; overflow-y: auto; padding: 16px; }

        /* ── Panel shared ── */
        .sp-panel-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--primary);
          margin-bottom: 12px;
        }

        .sp-empty-hint {
          font-size: 12px;
          color: var(--text3);
          text-align: center;
          padding: 20px 0;
          line-height: 1.6;
        }

        /* ── Entry Form ── */
        .sp-entry-form {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 14px;
        }

        .sp-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          background: var(--surface);
          margin-bottom: 8px;
          outline: none;
          transition: border-color 0.15s;
        }
        .sp-input:focus { border-color: var(--border2); }
        .sp-input[type=number]::-webkit-inner-spin-button,
        .sp-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .sp-input[type=number] { -moz-appearance: textfield; }

        .sp-form-row { display: flex; gap: 6px; }
        .sp-form-row .sp-input { flex: 1; margin-bottom: 8px; }
        .sp-select { cursor: pointer; text-align-last: center; }

        .sp-color-row {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 5px;
          margin-bottom: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
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
        .sp-color-dot:hover { transform: scale(1.2); box-shadow: 0 2px 8px var(--border); }
        .sp-color-dot.selected { border-color: var(--surface); box-shadow: 0 0 0 2px var(--text); transform: scale(1.1); }

        .sp-add-btn {
          width: 100%;
          padding: 8px;
          background: color-mix(in srgb, var(--primary) 15%, transparent);
          color: var(--primary);
          border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s;
        }
        .sp-add-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--primary) 25%, transparent); }
        .sp-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Task preview card ── */
        .sp-task-preview {
          background: var(--surface);
          border: 1px solid var(--border);
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
          color: var(--primary);
          letter-spacing: 0.3px;
        }
        .sp-task-title {
          font-size: 12px;
          color: var(--text);
          font-weight: 500;
          margin-bottom: 4px;
        }
        .sp-task-deadline {
          font-size: 10px;
          color: var(--text3);
        }

        /* ── Entry List ── */
        .sp-entry-list { display: flex; flex-direction: column; gap: 8px; }

        .sp-entry-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
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
          background: var(--surface);
          border: 1px solid var(--border);
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
          color: var(--text);
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
        .sp-workload-badge.light { background: var(--success-bg); color: var(--success); }
        .sp-workload-badge.medium { background: var(--blue-light-bg); color: var(--primary); }
        .sp-workload-badge.heavy { background: var(--error-bg); color: var(--error); }

        .sp-hours-badge {
          font-size: 10px;
          color: var(--text2);
          padding: 2px 6px;
          background: var(--surface3);
          border-radius: 4px;
        }

        .sp-entry-delete {
          background: none;
          border: none;
          color: var(--text3);
          font-size: 16px;
          cursor: pointer;
          padding: 0 2px;
          line-height: 1;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .sp-entry-delete:hover { color: var(--error); }

        /* ── Slot Panel ── */
        .sp-slot-panel { }

        .sp-clear-btn {
          font-size: 11px;
          color: var(--error);
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
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 6px;
        }

        .sp-slot-day {
          font-size: 10px;
          font-weight: 700;
          color: var(--primary);
          background: var(--blue-light-bg);
          border-radius: 4px;
          padding: 2px 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .sp-slot-time-text {
          font-size: 12px;
          color: var(--accent2);
          flex: 1;
        }

        /* ── Calendar area ── */
        .sp-calendar-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
          position: relative;
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
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          flex-shrink: 0;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
        }

        .sp-gutter-spacer {
          width: 56px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
        }

        .sp-day-header {
          flex: 1;
          min-width: 70px;
          padding: 10px 6px;
          text-align: center;
          border-right: 1px solid var(--border);
        }
        .sp-day-header:last-child { border-right: none; }

        .sp-day-name {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--text2);
          text-transform: uppercase;
        }

        .sp-day-number {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--primary);
          margin-top: 2px;
        }

        .sp-day-header.today .sp-day-number { color: var(--accent); }
        .sp-day-header.today .sp-day-name { color: var(--accent); }

        /* ── Calendar body ── */
        .sp-cal-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow-y: scroll;
          overflow-x: hidden;
        }

        .sp-cal-content {
          display: flex;
          flex: 1;
        }

        .sp-time-gutter {
          width: 56px;
          flex-shrink: 0;
          position: relative;
          height: ${TOTAL_HOURS * HOUR_HEIGHT + 20}px;
          border-right: 1px solid var(--border);
          background: var(--bg);
        }

        .sp-time-label {
          position: absolute;
          right: 8px;
          transform: translateY(-50%);
          font-size: 10px;
          color: var(--text3);
          white-space: nowrap;
          user-select: none;
        }
        .sp-time-label-first {
          transform: translateY(0);
        }

        .sp-days-grid { display: flex; flex: 1; min-width: 0; position: relative; }

        /* ── Day Column ── */
        .sp-day-column {
          flex: 1;
          min-width: 70px;
          position: relative;
          height: ${TOTAL_HOURS * HOUR_HEIGHT + 20}px;
          border-right: 1px solid var(--border);
          cursor: default;
          user-select: none;
          background: var(--bg);
        }
        .sp-day-column:last-child { border-right: none; }
        .sp-day-column.avail-mode { cursor: crosshair; }
        .sp-day-column.today { background: var(--sp-bg1); }

        .sp-hour-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: var(--divider);
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
          color: var(--text2);
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
          background: var(--sp-bg2);
          border: 1px solid var(--border);
          border-radius: 4px;
          width: 18px;
          height: 18px;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          padding: 0;
          line-height: 1;
          transition: background 0.1s;
        }
        .sp-block-action-btn:hover { background: var(--blue-light-bg); }
        .sp-block-action-btn.danger { color: var(--error); }
        .sp-block-action-btn.danger:hover { background: var(--error-bg); }

        .sp-block-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          background: var(--surface);
          border: 1px solid var(--border);
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
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: background 0.1s;
        }
        .sp-block-menu button:hover { background: var(--bg); }
        .sp-block-menu button.danger { color: var(--error); }
        .sp-block-menu button.danger:hover { background: var(--error-bg); }

        /* ── Availability slot ── */
        .sp-avail-slot {
          position: absolute;
          left: 4px; right: 4px;
          background: var(--blue-light-bg);
          border: 1px dashed var(--border2);
          border-radius: 6px;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 4px 6px;
        }

        .sp-slot-time { font-size: 9px; color: var(--accent); }
        .sp-slot-delete {
          background: var(--error-bg);
          border: none;
          color: var(--error);
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
          background: var(--blue-light-bg);
          border: 1px dashed var(--accent);
          border-radius: 6px;
          z-index: 10;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          color: var(--accent);
          pointer-events: none;
        }

        /* ── Toast ── */
        .sp-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 12px;
          z-index: 1000;
          box-shadow: 0 4px 24px rgba(49,72,122,0.12);
          animation: spFadeUp 0.2s ease;
        }
        .sp-toast.success { border-color: var(--success); color: var(--success); }
        .sp-toast.error   { border-color: var(--error); color: var(--error); }
        .sp-toast.warning { border-color: var(--warn1); color: var(--warn); background: var(--warn-bg); }
        .sp-undo-toast { bottom: 62px; display: flex; align-items: center; gap: 14px; min-width: 200px; }
        .sp-undo-btn { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); border: none; font-size: 12px; font-weight: 700; cursor: pointer; padding: 5px 12px; border-radius: 6px; }
        .sp-undo-btn:hover { opacity: 0.85; }
        .sp-undo-dismiss { background: none; border: none; color: var(--text3); font-size: 15px; cursor: pointer; padding: 0; line-height: 1; }

        @keyframes spFadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Loading ── */
        .sp-loading-bar {
          position: fixed;
          top: 0; left: 0;
          height: 2px;
          background: var(--primary);
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
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          width: 360px;
          box-shadow: 0 24px 64px rgba(49,72,122,0.18);
        }

        .sp-modal h2 {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 18px;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .sp-modal p {
          font-size: 13px;
          color: var(--text2);
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
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 11px;
          color: var(--text2);
          max-width: 200px;
          line-height: 1.5;
          box-shadow: 0 4px 16px rgba(49,72,122,0.08);
        }
        .sp-avail-tip strong { color: var(--primary); display: block; margin-bottom: 4px; }

        /* ── Remove number input spinners ── */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; appearance: textfield; }
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
                                    <button className="sp-btn sp-btn-outline" onClick={handleMarkPastDone} title="Mark all blocks that have already started as complete" style={{color:"var(--success)",borderColor:"var(--success)"}}>✓ Mark past done</button>
                                )}
                                {hasGenerated && (
                                    <button className="sp-btn sp-btn-ghost" onClick={handleClearPlan} style={{color:"var(--error)",borderColor:"var(--error-border)"}}>✕ Clear Plan</button>
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

                {postGenWarnings.length > 0 && (
                    <div style={{
                        background: "var(--warn-bg)",
                        borderBottom: "1px solid var(--warn1)",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        flexShrink: 0,
                    }}>
                        <div style={{ flex: 1, fontSize: 12, color: "var(--warn)", lineHeight: 1.6 }}>
                            <span style={{ fontWeight: 600 }}>Some tasks couldn't be fully scheduled this week: </span>
                            {postGenWarnings.map((w, i) => (
                                <span key={i}>
                                    {w.taskTitle}{w.course ? ` (${w.course})` : ""}, only {w.scheduled}h of {w.remaining}h scheduled{i < postGenWarnings.length - 1 ? "; " : ". "}
                                </span>
                            ))}
                            <span style={{ color: "var(--warn1)" }}>Add more availability slots or reduce the hours to fit everything.</span>
                        </div>
                        <button
                            onClick={() => setPostGenWarnings([])}
                            style={{ background: "none", border: "none", color: "var(--warn)", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0, opacity: 0.7 }}
                            title="Dismiss"
                        >×</button>
                    </div>
                )}

                <div className="sp-body">
                    <div className="sp-sidebar">
                        <div className="sp-sidebar-tabs">
                            <button
                                className={`sp-sidebar-tab ${activePanel === "entries" ? "active" : ""}`}
                                onClick={() => setActivePanel("entries")}
                            >
                                Entries
                            </button>
                            <button
                                className={`sp-sidebar-tab ${activePanel === "slots" ? "active" : ""}`}
                                onClick={() => setActivePanel("slots")}
                            >
                                Slots
                            </button>
                            <button
                                className={`sp-sidebar-tab ${activePanel === "courses" ? "active" : ""}`}
                                onClick={() => setActivePanel("courses")}
                            >
                                Courses
                            </button>
                        </div>
                        <div className="sp-sidebar-content">
                            <div style={{ display: activePanel === "entries" ? "contents" : "none" }}>
                                <EntryPanel
                                    entries={entries}
                                    onAdd={handleAddEntry}
                                    onDelete={handleDeleteEntry}
                                    onUpdateHours={handleUpdateEntryHours}
                                    colorMap={colorMap}
                                    onColorChange={handleColorChange}
                                    userId={getUserId()}
                                    weekStart={weekStart}
                                    isPastWeek={weekDates.every(d => { const c = new Date(d); c.setHours(0,0,0,0); const t = new Date(); t.setHours(0,0,0,0); return c < t; })}
                                    entriesLoading={entriesLoading}
                                    onCarryOver={handleCarryOver}
                                />
                            </div>
                            <div style={{ display: activePanel === "slots" ? "contents" : "none" }}>
                                <SlotPanel
                                    availability={availability}
                                    onDeleteSlot={handleDeleteSlot}
                                    onClearAll={handleClearAllSlots}
                                />
                            </div>
                            <div style={{ display: activePanel === "courses" ? "contents" : "none" }}>
                                <CoursesPanel
                                    enrolledSections={enrolledSections}
                                    courseColorOverrides={courseColorOverrides}
                                    onColorChange={setCourseColor}
                                    dismissedSections={dismissedSections}
                                    onRestore={restoreSection}
                                    weekDateStrings={weekDates.map(toLocalDateString)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="sp-calendar-area">
                        {(() => {
                            const _today = new Date(); _today.setHours(0,0,0,0);
                            const allDaysPast = weekDates.every(d => { const c = new Date(d); c.setHours(0,0,0,0); return c < _today; });
                            if (!allDaysPast) return null;
                            return (
                                <div style={{
                                    position:"absolute", inset:0, zIndex:20,
                                    display:"flex", alignItems:"center", justifyContent:"center",
                                    background:"var(--sp-bg2)", backdropFilter:"blur(12px) saturate(1.4)",
                                    WebkitBackdropFilter:"blur(12px) saturate(1.4)",
                                }}>
                                    <div style={{ textAlign:"center", color:"var(--text3)", padding:"0 32px", lineHeight:1.9 }}>
                                        <div style={{ fontSize:14, fontWeight:500, color:"var(--primary)" }}>
                                            This week has already passed
                                        </div>
                                        <div style={{ fontSize:11, marginTop:4, marginBottom:14, color:"var(--primary)" }}>
                                            Navigate forward to plan your current week
                                        </div>
                                        <button
                                            style={{ cursor:"pointer", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", border:"none", borderRadius:8, padding:"8px 18px", fontSize:12, fontWeight:600, fontFamily:"'DM Sans', sans-serif" }}
                                            onClick={() => setCurrentDate(new Date())}
                                        >
                                            Go to current week →
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                        <div className="sp-calendar-scroll-wrapper">
                            <div className="sp-calendar-inner">
                                <div className="sp-cal-body" ref={calBodyRef}>
                                    <div className="sp-day-header-row">
                                        <div className="sp-gutter-spacer" />
                                        {weekDates.map((date, i) => {
                                            const _hd = new Date(date); _hd.setHours(0,0,0,0);
                                            const _ht = new Date(); _ht.setHours(0,0,0,0);
                                            const hdrPast = _hd < _ht;
                                            return (
                                                <div key={i} className={`sp-day-header ${isToday(date) ? "today" : ""}`}
                                                    style={hdrPast ? { opacity: 0.45 } : undefined}>
                                                    <div className="sp-day-name">{DAYS[i]}</div>
                                                    <div className="sp-day-number">{date.getDate()}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="sp-cal-content">
                                    <TimeGutter />
                                    <div className="sp-days-grid">
                                        {(() => {
                                            return weekDates.map((date, i) => {
                                                const dayKey = DAY_KEYS[i];
                                                const dateStr = toLocalDateString(date);
                                                const visibleCourseBlocks = (courseBlocksPerDay[dayKey] || []).filter(cb => !dismissedSections.has(`${dateStr}_${cb.crn}`));
                                                const _d = new Date(date); _d.setHours(0,0,0,0);
                                                const _t = new Date(); _t.setHours(0,0,0,0);
                                                const dayIsPast = _d < _t;
                                                return (
                                                    <DayColumn
                                                        key={dayKey}
                                                        date={date}
                                                        dayKey={dayKey}
                                                        dayIndex={i}
                                                        blocks={weekBlocks[dayKey] || []}
                                                        colorMap={colorMap}
                                                        entries={entries}
                                                        availabilitySlots={!dayIsPast && (isAvailabilityMode || showSlotOverlay) ? (availability[dayKey] || []) : []}
                                                        onCompleteBlock={handleCompleteBlock}
                                                        onDeleteBlock={handleDeleteBlock}
                                                        onUncompleteBlock={handleUncompleteBlock}
                                                        onAddSlot={handleAddSlot}
                                                        onDeleteSlot={handleDeleteSlot}
                                                        onResizeSlot={handleResizeSlot}
                                                        isAvailabilityMode={isAvailabilityMode}
                                                        showSlotOverlay={showSlotOverlay}
                                                        onEditBlock={setEditingBlock}
                                                        onResizeBlock={handleSaveEditedBlock}
                                                        courseBlocks={visibleCourseBlocks}
                                                        onDismissCourse={(crn) => dismissSection(dateStr, crn)}
                                                        nowTime={isToday(date) ? nowTime : null}
                                                    />
                                                );
                                            });
                                        })()}
                                    </div>
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
                            <p>This will delete all study blocks for this week and restore your default availability slots. This cannot be undone.</p>
                            <div className="sp-modal-actions">
                                <button className="sp-btn sp-btn-ghost" onClick={() => setShowClearModal(false)}>Cancel</button>
                                <button className="sp-btn sp-btn-primary" style={{background:"var(--error)",borderColor:"var(--error)"}} onClick={handleClearPlanConfirmed}>Clear Plan</button>
                            </div>
                        </div>
                    </div>
                )}

                {showGenerateModal && (() => {
                    const totalAvailHours = Object.values(availability)
                        .flatMap(slots => slots)
                        .reduce((sum, s) => sum + (s.endHour - s.startHour), 0);
                    const totalRequestedHours = entries.reduce((sum, e) => sum + (parseFloat(e.hoursPerWeek) || 0), 0);
                    // DAY_KEYS is Mon=0 ... Sun=6; weekDates[i] matches DAY_KEYS[i]
                    // Convert a deadline string to a local Date safely (handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm")
                    const parseLocalDate = (str) => {
                        const datePart = str.split("T")[0];
                        const [y, m, d] = datePart.split("-").map(Number);
                        return new Date(y, m - 1, d);
                    };
                    const toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const weekStart = toDateOnly(weekDates[0]);
                    const weekEnd   = toDateOnly(weekDates[weekDates.length - 1]);
                    const fmtDateOnly = (str) => {
                        if (!str) return "";
                        const datePart = str.split("T")[0];
                        const [y, m, d] = datePart.split("-").map(Number);
                        return new Date(y, m - 1, d).toLocaleDateString(undefined, { month:"short", day:"numeric" });
                    };
                    const noEntries = entries.length === 0;
                    const noSlots = totalAvailHours === 0;
                    const issues = [];
                    if (noEntries) {
                        issues.push({ type: "error", msg: "No task entries added yet. Add at least one task from the Entries tab before generating." });
                    } else if (noSlots) {
                        issues.push({ type: "error", msg: "No availability slots found. Drag on the calendar to add your free time first." });
                    }
                    let hasCheck1Error = false;
                    const erroredEntryIds = new Set();
                    if (!noEntries && !noSlots) {
                        // Check 1: individual task exceeds total week availability
                        entries.forEach(e => {
                            const needed = parseFloat(e.hoursPerWeek) || 0;
                            if (needed <= 0) return;
                            if (needed > totalAvailHours) {
                                hasCheck1Error = true;
                                erroredEntryIds.add(e.id);
                                issues.push({
                                    type: "error",
                                    msg: `"${e.name}" needs ${needed}h but only ${totalAvailHours.toFixed(1)}h of slots exist this week, so it won't fully fit.`,
                                });
                            }
                        });

                        // Check 2: deadline feasibility — cumulative per deadline day
                        // Group tasks that have a deadline this week by their deadline day index
                        const tasksByDeadlineDay = new Map();
                        entries.forEach(e => {
                            const needed = parseFloat(e.hoursPerWeek) || 0;
                            if (!e.deadline || needed <= 0) return;
                            const dl = toDateOnly(parseLocalDate(e.deadline));
                            if (dl < weekStart || dl > weekEnd) return;
                            const dlDayIdx = DAY_KEYS.findIndex((_, i) => toDateOnly(weekDates[i]).getTime() === dl.getTime());
                            if (dlDayIdx === -1) return;
                            if (!tasksByDeadlineDay.has(dlDayIdx)) tasksByDeadlineDay.set(dlDayIdx, []);
                            tasksByDeadlineDay.get(dlDayIdx).push({ e, needed });
                        });

                        // For each deadline day (sorted ascending), check cumulative feasibility
                        [...tasksByDeadlineDay.keys()].sort((a, b) => a - b).forEach(dayIdx => {
                            const hoursAvailable = DAY_KEYS
                                .slice(0, dayIdx + 1)
                                .reduce((sum, dk) => sum + (availability[dk] || []).reduce((s, sl) => s + (sl.endHour - sl.startHour), 0), 0);
                            // Sum of hours needed by ALL tasks due on or before this day
                            const allByThen = [...tasksByDeadlineDay.entries()]
                                .filter(([d]) => d <= dayIdx)
                                .flatMap(([, ts]) => ts);
                            const totalNeededByThen = allByThen.reduce((s, t) => s + t.needed, 0);
                            const cumulativeShortfall = totalNeededByThen > hoursAvailable;
                            // Report each task due ON this day that is individually infeasible or part of a cumulative shortfall
                            tasksByDeadlineDay.get(dayIdx).forEach(({ e, needed }) => {
                                if (erroredEntryIds.has(e.id)) return;
                                const individualShortfall = hoursAvailable < needed;
                                if (individualShortfall) {
                                    erroredEntryIds.add(e.id);
                                    issues.push({
                                        type: "error",
                                        msg: `"${e.name}" is due ${fmtDateOnly(e.deadline)} and needs ${needed}h, but only ${hoursAvailable.toFixed(1)}h of slots are available before then.`,
                                    });
                                } else if (cumulativeShortfall) {
                                    erroredEntryIds.add(e.id);
                                    issues.push({
                                        type: "warning",
                                        msg: `"${e.name}" is due ${fmtDateOnly(e.deadline)} and may not be fully scheduled: tasks due by then need ${totalNeededByThen.toFixed(1)}h combined but only ${hoursAvailable.toFixed(1)}h of slots are available.`,
                                    });
                                }
                            });
                        });

                        // Global: total requested > total available — skip if a Check 1 error already covers it
                        if (totalRequestedHours > totalAvailHours && !hasCheck1Error) {
                            issues.push({
                                type: "warning",
                                msg: `${totalRequestedHours}h requested but only ${totalAvailHours.toFixed(1)}h of slots available, some tasks may be partially scheduled.`,
                            });
                        }
                    }
                    const hasErrors = issues.some(i => i.type === "error");
                    return (
                        <div className="sp-modal-backdrop" onClick={() => setShowGenerateModal(false)}>
                            <div className="sp-modal" onClick={e => e.stopPropagation()}>
                                <h2>{hasGenerated ? "Regenerate plan?" : "Generate plan?"}</h2>
                                <p>
                                    {hasGenerated
                                        ? `This will clear your current schedule and build a new one from your ${slotCount} slot${slotCount !== 1 ? "s" : ""} and task entries.`
                                        : `A schedule will be built from your ${slotCount} slot${slotCount !== 1 ? "s" : ""} and task entries.`
                                    }
                                </p>
                                {issues.length > 0 && (
                                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                                        {issues.map((issue, i) => (
                                            <div key={i} style={{
                                                padding:"9px 12px", borderRadius:8,
                                                background: issue.type === "error" ? "var(--error-bg)" : "var(--warn-bg)",
                                                border:`1px solid ${issue.type === "error" ? "var(--error-border)" : "var(--warn1)"}`,
                                                fontSize:12, lineHeight:1.5,
                                                color: issue.type === "error" ? "var(--error)" : "var(--warn)",
                                            }}>
                                                {issue.msg}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="sp-modal-actions">
                                    <button className="sp-btn sp-btn-ghost" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                                    {!noEntries && !noSlots && (
                                        <button className="sp-btn sp-btn-primary" onClick={handleGenerate}>{issues.length > 0 ? "Generate anyway" : "Generate"}</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {isAvailabilityMode && (
                    <div className="sp-avail-tip">
                        <strong>Drag to add slots</strong>
                        Click × or go to the Slots tab to remove them. Overlapping slots are not allowed.
                    </div>
                )}

                {toast && <div className={`sp-toast ${toast.type}`}>{toast.msg}</div>}
                {undoToast && (
                    <div className="sp-toast sp-undo-toast">
                        <span style={{ flex:1 }}>{undoToast.msg}</span>
                        <button onClick={triggerUndo} className="sp-undo-btn">Undo</button>
                        <button onClick={clearUndo} className="sp-undo-dismiss">✕</button>
                    </div>
                )}

                {editingBlock && (
                    <EditBlockModal
                        block={editingBlock}
                        entries={entries}
                        dayBlocks={(() => {
                            const entry = Object.entries(weekBlocks).find(([, blocks]) => blocks.some(b => b.id === editingBlock.id));
                            return entry ? entry[1] : [];
                        })()}
                        courseBlocks={(() => {
                            const entry = Object.entries(weekBlocks).find(([, blocks]) => blocks.some(b => b.id === editingBlock.id));
                            return entry ? (courseBlocksPerDay[entry[0]] || []) : [];
                        })()}
                        onClose={() => setEditingBlock(null)}
                        onSave={handleSaveEditedBlock}
                    />
                )}
            </div>
        </>
    );
}