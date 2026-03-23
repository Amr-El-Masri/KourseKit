import { useState, useEffect, useRef, useCallback } from "react";
import StudentDirectoryPanel from "./StudentDirectoryPanel";
import { Banana, Cat, Dog, Eclipse, Telescope, Panda, Turtle } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import TranscriptModal from "./TranscriptModal";
import StudentCourses from "./StudentCourses";

function getTokenRole() {
  try {
    const token = localStorage.getItem("kk_token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).role || null;
  } catch { return null; }
}

const AVATAR_ICONS = [
  { id:"Banana", icon: Banana },
  { id:"Telescope", icon: Telescope  },
  { id:"Eclipse", icon: Eclipse    },
  { id:"Cat", icon: Cat   },
  { id:"Dog", icon: Dog    },
  { id:"Panda", icon: Panda  },
  { id:"Turtle", icon: Turtle   },
];
const FACULTIES = [
  "Arts & Sciences",
  "Engineering & Architecture",
  "Business",
  "Health Sciences",
  "Medicine",
  "Nursing",
  "Education",
];

const MAJORS_BY_FACULTY = {
  "Arts & Sciences": [
    "Applied Mathematics", "Arabic Language and Literature", "Archaeology",
    "Art History", "Biology", "Chemistry", "Computer Science", "Earth Sciences",
    "Economics", "English Language", "English Literature", "History",
    "Mathematics", "Media and Communication", "Philosophy", "Physics",
    "Political Studies", "Psychology", "Public Administration",
    "Sociology-Anthropology", "Statistics", "Studio Arts",
  ],
  "Engineering & Architecture": [
    "Architecture", "Chemical Engineering", "Civil and Environmental Engineering",
    "Computer and Communications Engineering", "Construction Engineering",
    "Electrical and Computer Engineering", "Graphic Design", "Industrial Engineering",
    "Landscape Architecture", "Mechanical Engineering",
  ],
  "Business": [
    "Agri-Business", "Business Administration",
  ],
  "Health Sciences": [
    "Environmental Health", "Health Communication", "Medical Imaging Sciences",
    "Medical Laboratory Sciences", "Nutrition and Dietetics",
    "Nutrition and Dietetics Coordinated Program",
  ],
  "Medicine": ["Medicine"],
  "Nursing":  ["Nursing"],
  "Education": ["Elementary Education", "Agri-culture", "Food Sciences and Management"],
};

const MINORS_BY_FACULTY = {
  "Arts & Sciences": [
    "Applied Mathematics", "Arabic Studies", "Archaeology", "Art History",
    "Biology", "Chemistry", "Computer Science", "Economics", "English Literature",
    "Environmental Studies", "History", "Mathematics", "Media and Communication",
    "Philosophy", "Physics", "Political Studies", "Psychology",
    "Public Administration", "Sociology-Anthropology", "Statistics", "Studio Arts",
  ],
  "Engineering & Architecture": [
    "Architecture", "Computer and Communications Engineering",
    "Electrical and Computer Engineering", "Industrial Engineering",
  ],
  "Business": ["Business Administration", "Finance", "Marketing"],
  "Health Sciences": ["Health Communication", "Nutrition and Dietetics"],
  "Medicine":  [],
  "Nursing":   [],
  "Education": ["Elementary Education"],
};

const STUDENT_STATUSES = [
  { id:"freshman",  label:"Freshman",  desc:"1st year" },
  { id:"sophomore", label:"Sophomore", desc:"2nd year" },
  { id:"junior",    label:"Junior",    desc:"3rd year" },
  { id:"senior",    label:"Senior",    desc:"4th year" },
  { id:"E1",        label:"E1",        desc:"Eng. year 1" },
  { id:"E2",        label:"E2",        desc:"Eng. year 2" },
  { id:"E3",        label:"E3",        desc:"Eng. year 3" },
  { id:"E4",        label:"E4",        desc:"Eng. year 4" },
  { id:"E5",        label:"E5",        desc:"Eng. year 5" },
];

const DEFAULT_PROFILE = {
  firstName:    "",
  lastName:     "",
  email:        "",
  faculty:      "Arts & Sciences",
  major:        "Computer Science",
  minorFaculty: "",
  minor:        false,
  minorName:    "",
  status:       "freshman",
  cumGPA:       "",
  totalCredits: "",
  bio:          "",
  avatar:       null,
  doubleMajor:   false,
  secondMajor:   "",
  secondFaculty: "Arts & Sciences",
  doubleMinor:   false,
  secondMinorFaculty: "",
  secondMinor:   "",
  tripleMinor:   false,
  thirdMinorFaculty: "",
  thirdMinor:    "",
  emailRemindersEnabled: true,
  graduationYear: "",
  linkedin: "",
  github: "",
  openToStudyGroups: false,
  interests: "",
};

async function profileFetch(path, options = {}) {
  const t = localStorage.getItem("kk_token");
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${t}` },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const gpaColor = g => {
  const v = parseFloat(g);
  if (isNaN(v)) return "var(--text3)";
  if (v >= 3.7) return "#2d7a4a";
  if (v >= 3.0) return "var(--primary)";
  if (v >= 2.0) return "#b7680a";
  return "var(--error)";
};

const statusObj = id => STUDENT_STATUSES.find(s => s.id === id) || STUDENT_STATUSES[0];

const API = "http://localhost:8080";
const semAuthHeaders = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("kk_token")}` });
const LETTER_GRADES = ["","A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];
const fmtDateShort = iso => { try { return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); } catch { return ""; } };
const AUB_SEMESTERS = [
  "Spring 25-26","Summer 25-26","Fall 25-26",
  "Spring 24-25","Summer 24-25","Fall 24-25",
  "Spring 23-24","Summer 23-24","Fall 23-24",
  "Spring 22-23","Summer 22-23","Fall 22-23",
];



// ── Mini default-schedule planner constants ──────────────────────────────────
const DS_HOUR_H   = 40;
const DS_START    = 0;
const DS_END      = 24;
const DS_TOTAL    = DS_END - DS_START;
const DS_VISIBLE_H = 8 * DS_HOUR_H;
const DS_DAY_KEYS_LIST  = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const DS_DAY_SHORT      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function dsHourToPx(h)  { return (h - DS_START) * DS_HOUR_H; }
function dsPxToHour(px) { return px / DS_HOUR_H + DS_START; }
function dsSnap(h)      { return Math.round(h * 4) / 4; }

const COURSE_COLORS = ["#2563EB","#16A34A","#EA580C","#7C3AED","#DC2626","#0891B2","#DB2777","#65A30D"];
const DS_DAY_ABBR   = { M:"MONDAY", T:"TUESDAY", W:"WEDNESDAY", R:"THURSDAY", F:"FRIDAY", S:"SATURDAY", U:"SUNDAY" };
function parseCourseTime(t) {
  if (!t || t === "0000" || !t.trim() || t.trim() === ".") return null;
  if (t.includes(":")) { const [h,m] = t.split(":"); return parseInt(h) + parseInt(m)/60; }
  const p = t.padStart(4,"0"); return parseInt(p.slice(0,2)) + parseInt(p.slice(2,4))/60;
}
function getSectionSlots(section) {
  const slots = [];
  if (section?.days1 && section.beginTime1) {
    const s = parseCourseTime(section.beginTime1), e = parseCourseTime(section.endTime1);
    if (s !== null && e !== null) section.days1.split(" ").forEach(d => { if (DS_DAY_ABBR[d]) slots.push({ dayKey: DS_DAY_ABBR[d], startHour: s, endHour: e }); });
  }
  if (section?.days2 && section.beginTime2 && section.beginTime2 !== "0000" && section.beginTime2.trim() !== ".") {
    const s = parseCourseTime(section.beginTime2), e = parseCourseTime(section.endTime2);
    if (s !== null && e !== null) section.days2.split(" ").forEach(d => { if (DS_DAY_ABBR[d]) slots.push({ dayKey: DS_DAY_ABBR[d], startHour: s, endHour: e }); });
  }
  return slots;
}
function dsFmt(h) {
  const hh = Math.floor(h), mm = Math.round((h % 1) * 60);
  const ap = hh < 12 ? "AM" : "PM", h12 = hh % 12 || 12;
  return mm ? `${h12}:${String(mm).padStart(2,"0")} ${ap}` : `${h12} ${ap}`;
}
function dsFmtISO(h) {
  return `${String(Math.floor(h)).padStart(2,"0")}:${String(Math.round((h % 1) * 60)).padStart(2,"0")}:00`;
}
function dsParseHour(t) { const [h, m] = t.split(":"); return parseInt(h) + parseInt(m) / 60; }

function DsMiniSlot({ slot, dayKey, onDelete, onResize, readonly }) {
  const [liveEnd, setLiveEnd] = useState(null);
  const liveRef = useRef(null);
  const dragRef = useRef(null);
  const endH = liveEnd ?? slot.endHour;

  const handleResizeStart = useCallback((e) => {
    if (readonly) return;
    e.stopPropagation(); e.preventDefault();
    dragRef.current = { startY: e.clientY, startEnd: slot.endHour };
    liveRef.current = slot.endHour;
    const onMove = (ev) => {
      const diff = (ev.clientY - dragRef.current.startY) / DS_HOUR_H;
      const ne = Math.min(Math.max(dsSnap(dragRef.current.startEnd + diff), slot.startHour + 0.25), DS_END);
      liveRef.current = ne;
      setLiveEnd(ne);
    };
    const onUp = () => {
      if (dragRef.current) { onResize(dayKey, slot.id, liveRef.current); setLiveEnd(null); liveRef.current = null; }
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [slot, dayKey, onResize, readonly]);

  return (
    <div
      className="ds-slot"
      style={{ top: dsHourToPx(slot.startHour) + 1, height: Math.max((endH - slot.startHour) * DS_HOUR_H - 2, 10) }}
      onMouseDown={e => e.stopPropagation()}
    >
      <span className="ds-slot-time">{dsFmt(slot.startHour)}–{dsFmt(endH)}</span>
      {!readonly && (
        <button className="ds-slot-del" onClick={e => { e.stopPropagation(); onDelete(dayKey, slot.id); }}>×</button>
      )}
      {!readonly && (
        <div onMouseDown={handleResizeStart} className="ds-slot-resize">
          <div style={{ width: 16, height: 2, borderRadius: 1, background: "rgba(123,94,167,0.4)" }} />
        </div>
      )}
    </div>
  );
}

function DsMiniDayCol({ dayKey, slots, onAdd, onDelete, onResize, readonly, scrollRef, courseBlocks }) {
  const colRef  = useRef(null);
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const getHour = useCallback((e, allowEnd = false) => {
    const rect = colRef.current.getBoundingClientRect();
    return Math.min(Math.max(dsSnap(dsPxToHour(e.clientY - rect.top)), DS_START), allowEnd ? DS_END : DS_END - 0.25);
  }, []);

  const onDown = useCallback((e) => {
    if (readonly) return;
    if (e.target.closest(".ds-slot")) return;
    e.preventDefault();
    const sh = getHour(e);
    dragRef.current = { startHour: sh, endHour: sh + 0.25 };
    setDragging({ startHour: sh, endHour: sh + 0.25 });
  }, [getHour, readonly]);

  const onMove = useCallback((e) => {
    if (!dragRef.current) return;
    const eh = Math.min(Math.max(dsSnap(getHour(e, true)), dragRef.current.startHour + 0.25), DS_END);
    dragRef.current.endHour = eh;
    setDragging({ startHour: dragRef.current.startHour, endHour: eh });
    const scrollEl = scrollRef?.current;
    if (scrollEl) {
      const { top, bottom } = scrollEl.getBoundingClientRect();
      const ZONE = 60;
      if (e.clientY > bottom - ZONE) scrollEl.scrollTop += Math.round((ZONE - (bottom - e.clientY)) / 4);
      else if (e.clientY < top + ZONE) scrollEl.scrollTop -= Math.round((ZONE - (e.clientY - top)) / 4);
    }
  }, [getHour, scrollRef]);

  const onUp = useCallback(() => {
    if (!dragRef.current) return;
    const { startHour, endHour } = dragRef.current;
    if (endHour - startHour >= 0.25) {
      const overlapsSlot = (slots || []).some(s => startHour < s.endHour && endHour > s.startHour);
      const overlapsCourse = (courseBlocks || []).some(cb => startHour < cb.endHour && endHour > cb.startHour);
      if (!overlapsSlot && !overlapsCourse) onAdd(dayKey, { startHour, endHour, id: Date.now() + Math.random() });
    }
    dragRef.current = null;
    setDragging(null);
  }, [dayKey, slots, onAdd]);

  useEffect(() => {
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mouseup", onUp); window.removeEventListener("mousemove", onMove); };
  }, [onMove, onUp]);

  return (
    <div className={`ds-day-col${readonly ? " ds-day-readonly" : ""}`} ref={colRef} onMouseDown={onDown}>
      {Array.from({ length: DS_TOTAL }, (_, i) => (
        <div key={i} className="ds-hour-line" style={{ top: i * DS_HOUR_H }} />
      ))}
      {(slots || []).map(slot => (
        <DsMiniSlot key={slot.id} slot={slot} dayKey={dayKey} onDelete={onDelete} onResize={onResize} readonly={readonly} />
      ))}
      {(courseBlocks || []).map((cb, i) => (
        <div key={`cb-${i}`} style={{ position:"absolute", left:2, right:2, top:dsHourToPx(cb.startHour)+1, height:Math.max((cb.endHour-cb.startHour)*DS_HOUR_H-2,10), background:cb.color, borderRadius:5, zIndex:3, padding:"2px 4px", overflow:"hidden", pointerEvents:"none", boxShadow:`0 1px 4px ${cb.color}55` }}>
          <div style={{ fontSize:8, fontWeight:800, color:"#fff", lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", textShadow:"0 1px 2px rgba(0,0,0,0.2)" }}>{cb.courseCode}</div>
          <div style={{ fontSize:7, color:"rgba(255,255,255,0.85)" }}>{dsFmt(cb.startHour)}–{dsFmt(cb.endHour)}</div>
        </div>
      ))}
      {dragging && (
        <div className="ds-drag-preview" style={{ top: dsHourToPx(dragging.startHour) + 1, height: (dragging.endHour - dragging.startHour) * DS_HOUR_H - 2 }}>
          {dsFmt(dragging.startHour)}–{dsFmt(dragging.endHour)}
        </div>
      )}
    </div>
  );
}

export function DefaultScheduleEditor({ token, onDone, extraAction }) {
  const [availability, setAvailability] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [snapshot,  setSnapshot]  = useState({});
  const [saving,         setSaving]         = useState(false);
  const [hasSaved,       setHasSaved]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [enrolledSections, setEnrolledSections] = useState([]);
  const scrollRef = useRef(null);

  const authH = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${token}` });

  useEffect(() => {
    fetch(`${API}/api/profile/default-schedule`, { headers: authH() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return;
        const av = {};
        data.forEach(s => {
          if (!av[s.dayKey]) av[s.dayKey] = [];
          av[s.dayKey].push({ id: s.id || Date.now() + Math.random(), startHour: dsParseHour(s.startTime), endHour: dsParseHour(s.endTime) });
        });
        setAvailability(av);
        const hasAny = Object.values(av).some(arr => arr.length > 0);
        setHasSaved(hasAny);
        setIsEditing(!hasAny);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll to 8AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * DS_HOUR_H;
    }
  }, []);

  // Fetch enrolled sections to display as course blocks on the schedule
  useEffect(() => {
    fetch(`${API}/api/grades/saved`, { headers: authH() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        const latest = data[0]; // API returns DESC order, so first = most recent
        const courses = (latest?.courses || []).filter(c => c.section);
        const savedColors = (() => { try { return JSON.parse(localStorage.getItem("kk_course_section_colors") || "{}"); } catch { return {}; } })();
        setEnrolledSections(courses.map((c, i) => ({
          courseCode: c.courseCode,
          sectionNumber: c.section.sectionNumber || c.sectioncrn,
          section: c.section,
          color: savedColors[c.sectioncrn] || COURSE_COLORS[i % COURSE_COLORS.length],
        })));
      })
      .catch(() => {});
  }, []);

  const handleAdd = useCallback((dayKey, slot) => {
    setAvailability(prev => ({ ...prev, [dayKey]: [...(prev[dayKey] || []), slot] }));
  }, []);

  const handleDelete = useCallback((dayKey, id) => {
    setAvailability(prev => ({ ...prev, [dayKey]: (prev[dayKey] || []).filter(s => s.id !== id) }));
  }, []);

  const handleResize = useCallback((dayKey, id, newEnd) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map(s => s.id === id ? { ...s, endHour: newEnd } : s),
    }));
  }, []);

  const startEditing = () => {
    setSnapshot(JSON.parse(JSON.stringify(availability)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setAvailability(snapshot);
    setIsEditing(false);
  };

  const handleDeleteSchedule = async () => {
    try {
      await fetch(`${API}/api/profile/default-schedule`, {
        method: "PUT", headers: authH(), body: JSON.stringify([]),
      });
      await fetch(`${API}/api/study-plan/slots/all`, {
        method: "DELETE", headers: authH(),
      });
      setAvailability({});
      setHasSaved(false);
      setIsEditing(true);
      setConfirmDelete(false);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = [];
    for (const [dayKey, slots] of Object.entries(availability)) {
      for (const s of slots) {
        payload.push({ dayKey, startTime: dsFmtISO(s.startHour), endTime: dsFmtISO(s.endHour) });
      }
    }
    try {
      const res = await fetch(`${API}/api/profile/default-schedule`, {
        method: "PUT", headers: authH(), body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const av = {};
      data.forEach(s => {
        if (!av[s.dayKey]) av[s.dayKey] = [];
        av[s.dayKey].push({ id: s.id, startHour: dsParseHour(s.startTime), endHour: dsParseHour(s.endTime) });
      });
      setAvailability(av);
      setHasSaved(true);
      setIsEditing(false);
      if (onDone) onDone();
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 2px 14px rgba(49,72,122,0.07)", overflow: "hidden", marginBottom: 20 }}>
      <style>{`
        .ds-grid-wrap { display:flex; user-select:none; }
        .ds-gutter { width:56px; flex-shrink:0; position:relative; height:${DS_TOTAL * DS_HOUR_H + 20}px; border-right:1px solid var(--border); background:var(--surface); }
        .ds-gutter-lbl { position:absolute; right:8px; transform:translateY(-50%); font-size:10px; color:var(--text3); white-space:nowrap; pointer-events:none; }
        .ds-days-grid { display:flex; flex:1; }
        .ds-day-col { flex:1; position:relative; height:${DS_TOTAL * DS_HOUR_H + 20}px; border-right:1px solid var(--border); cursor:crosshair; background:var(--surface); }
        .ds-day-col.ds-day-readonly { cursor:default; }
        .ds-day-col:last-child { border-right:none; }
        .ds-hour-line { position:absolute; left:0; right:0; height:1px; background:var(--divider); pointer-events:none; }
        .ds-slot { position:absolute; left:2px; right:2px; background:rgba(123,94,167,0.1); border:1px dashed rgba(123,94,167,0.4); border-radius:5px; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; padding:2px 4px; overflow:hidden; }
        .ds-slot-time { font-size:8px; color:var(--accent); line-height:1.4; }
        .ds-slot-del { background:none; border:none; color:var(--error); font-size:12px; cursor:pointer; padding:0; line-height:1; opacity:0; transition:opacity .15s; flex-shrink:0; }
        .ds-slot:hover .ds-slot-del { opacity:1; }
        .ds-slot-resize { position:absolute; bottom:0; left:0; right:0; height:7px; cursor:ns-resize; display:flex; align-items:center; justify-content:center; }
        .ds-drag-preview { position:absolute; left:2px; right:2px; background:rgba(123,94,167,0.15); border:1px dashed var(--accent); border-radius:5px; z-index:10; display:flex; align-items:center; justify-content:center; font-size:9px; color:var(--accent); pointer-events:none; }
      `}</style>
      <div style={{ padding: "20px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>Drag to mark your free time each week.</div>
          {hasSaved && !isEditing && (
            <div style={{ display: "flex", gap: 8 }}>
              {!confirmDelete && (
                <button onClick={startEditing} style={{ padding: "6px 16px", background: "var(--bg)", color: "var(--primary)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  Edit
                </button>
              )}
              {confirmDelete ? (
                <>
                  <button onClick={handleDeleteSchedule} style={{ padding: "6px 14px", background: "var(--error)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    Confirm Delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={{ padding: "6px 14px", background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(true)} style={{ padding: "6px 14px", background: "var(--error-bg)", color: "var(--error)", border: "1px solid var(--error-border)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Day headers */}
        <div style={{ display: "flex", paddingLeft: 56, marginBottom: 4 }}>
          {DS_DAY_KEYS_LIST.map((k, i) => (
            <div key={k} style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {DS_DAY_SHORT[i]}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <div
            className="ds-scroll"
            ref={scrollRef}
            style={{ overflowY: "auto", maxHeight: DS_VISIBLE_H }}
          >
            <div className="ds-grid-wrap">
              {/* Time gutter */}
              <div className="ds-gutter">
                {Array.from({ length: DS_TOTAL + 1 }, (_, i) => {
                  if (i === 0) return null;
                  const h = i;
                  return (
                    <div key={h} className="ds-gutter-lbl" style={{ top: i * DS_HOUR_H }}>
                      {h === 24 ? "12am" : h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
                    </div>
                  );
                })}
              </div>
              {/* Day columns */}
              <div className="ds-days-grid">
                {(() => {
                  const courseBlocksPerDay = {};
                  enrolledSections.forEach(es => {
                    getSectionSlots(es.section).forEach(({ dayKey, startHour, endHour }) => {
                      if (!courseBlocksPerDay[dayKey]) courseBlocksPerDay[dayKey] = [];
                      courseBlocksPerDay[dayKey].push({ startHour, endHour, courseCode: es.courseCode, sectionNumber: es.sectionNumber, color: es.color });
                    });
                  });
                  return DS_DAY_KEYS_LIST.map(dayKey => (
                    <DsMiniDayCol
                      key={dayKey}
                      dayKey={dayKey}
                      slots={availability[dayKey] || []}
                      onAdd={handleAdd}
                      onDelete={handleDelete}
                      onResize={handleResize}
                      readonly={!isEditing}
                      scrollRef={scrollRef}
                      courseBlocks={courseBlocksPerDay[dayKey] || []}
                    />
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: "8px 22px", background: "var(--primary)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save"}
            </button>
            {hasSaved && (
              <button onClick={handleCancel} style={{ padding: "8px 16px", background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Cancel
              </button>
            )}
            {extraAction && <div style={{ marginLeft: "auto" }}>{extraAction}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile({ onProfileSave, onSemestersUpdated }) {
  const email = localStorage.getItem("kk_email") || "student@mail.aub.edu";
  const isAdmin = getTokenRole() === "ADMIN";
  const [section, setSection] = useState("profile");
  const [syllabi, setSyllabi] = useState(() => { try { return JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}"); } catch { return {}; } });

  useEffect(() => {
    const token = localStorage.getItem("kk_token");
    if (!token) return;
    fetch("http://localhost:8080/api/user-syllabi", { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data === "object") {
          localStorage.setItem("kk_course_syllabus", JSON.stringify(data));
          setSyllabi(data);
        }
      })
      .catch(() => {});
  }, []);
  const [sectOpen, setSectOpen] = useState({ profile: false, transcript: false, semesters: false, schedule: false });
  const toggleSect = k => setSectOpen(p => ({ ...p, [k]: !p[k] }));

  const [profile,    setProfile]    = useState(() => ({ ...DEFAULT_PROFILE, email, emailRemindersEnabled: localStorage.getItem("kk_email_reminders") !== "false" }));
  const [editing,    setEditing]    = useState(false);
  const [draft,      setDraft]      = useState({ ...DEFAULT_PROFILE, email });
  const [saved,      setSaved]      = useState(false);
  const [profilepic, setProfilepic] = useState(false);

  // my semesters
  const [semesters,    setSemesters]    = useState([]);
  const [creating,     setCreating]     = useState(false);
  const [newSemName,   setNewSemName]   = useState("");
  const [newSemCourses, setNewSemCourses] = useState([{ id:1, code:"", credits:"", grade:"" }]);
  const [editingId,    setEditingId]    = useState(null);
  const [editName,     setEditName]     = useState("");
  const [editCourses,  setEditCourses]  = useState([]);
  const [semSaveLoad,  setSemSaveLoad]  = useState(false);
  const [semErr,       setSemErr]       = useState("");
  const [semUndoToast, setSemUndoToast] = useState(null);
  const semUndoTimerRef = useRef(null);
  const [syllabusUndoToast, setSyllabusUndoToast] = useState(null);
  const syllabusUndoTimerRef = useRef(null);
  const [showFollowList, setShowFollowList] = useState(null);
  const [syllabusEditCourse, setSyllabusEditCourse] = useState(null); // courseCode being edited
  const [syllabusEditProf, setSyllabusEditProf] = useState("");
  const [syllabusEditOH, setSyllabusEditOH] = useState([]);
  const [showDirectory, setShowDirectory] = useState(false);
  const [friends, setFriends] = useState(() => { try { return JSON.parse(localStorage.getItem("kk_friends") || "[]"); } catch { return []; } });

  // Transcript uploader
  const [transcriptModal, setTranscriptModal] = useState(false);
  const [transcriptInfo,  setTranscriptInfo]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("kk_transcript_info") || "null"); } catch { return null; }
  });

  useEffect(() => {
    const token = localStorage.getItem("kk_token");
    if (!token) return;
    fetch("http://localhost:8080/api/transcript-info", { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => r.status === 204 ? null : r.json())
      .then(data => {
        if (data) {
          const info = { uploadedAt: data.uploadedAt, semesterCount: data.semesterCount, courseCount: data.courseCount };
          localStorage.setItem("kk_transcript_info", JSON.stringify(info));
          localStorage.setItem("kk_transcript_sem_ids", data.semIds);
          setTranscriptInfo(info);
        } else {
          localStorage.removeItem("kk_transcript_info");
          localStorage.removeItem("kk_transcript_sem_ids");
          setTranscriptInfo(null);
        }
      })
      .catch(() => {});
  }, []);
  const [undoToast,   setUndoToast]   = useState(null); // { semIds, semesters }
  const undoTimerRef = useRef(null);

  function restoreFacultyFields(data) {
    if (data.minor && data.minorName) {
      const fac = Object.keys(MINORS_BY_FACULTY).find(f => MINORS_BY_FACULTY[f].includes(data.minorName));
      if (fac) data.minorFaculty = fac;
    }
    if (data.doubleMinor && data.secondMinor) {
      const fac = Object.keys(MINORS_BY_FACULTY).find(f => MINORS_BY_FACULTY[f].includes(data.secondMinor));
      if (fac) data.secondMinorFaculty = fac;
    }
    if (data.tripleMinor && data.thirdMinor) {
      const fac = Object.keys(MINORS_BY_FACULTY).find(f => MINORS_BY_FACULTY[f].includes(data.thirdMinor));
      if (fac) data.thirdMinorFaculty = fac;
    }
    return data;
  }

  useEffect(() => {
    profileFetch("/api/profile")
      .then(data => {
        restoreFacultyFields(data);
        localStorage.setItem("kk_email_reminders", String(data.emailRemindersEnabled));
        setProfile(data);
        setDraft(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API}/api/grades/saved`, { headers: semAuthHeaders() })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setSemesters(sortSemesters(data)))
      .catch(() => {});
  }, []);

  const SEMESTER_ORDER = { "fall": 0, "spring": 1, "summer": 2 };

const sortSemesters = (list) => {
  return [...list].sort((a, b) => {
    const parse = name => {
      if (!name) return { year: 0, term: 0 };
      const lower = name.toLowerCase();
      const yearMatch = name.match(/(\d{2,4})/g);
      const year = yearMatch ? parseInt(yearMatch[0]) : 0;
      const term = Object.entries(SEMESTER_ORDER).find(([k]) => lower.includes(k))?.[1] ?? 99;
      return { year, term };
    };
    const pa = parse(a.semesterName);
    const pb = parse(b.semesterName);
    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.term - pb.term;
  });
};

const refetchSemesters = () =>
  fetch(`${API}/api/grades/saved`, { headers: semAuthHeaders() })
    .then(r => r.json())
    .then(data => { if (Array.isArray(data)) { setSemesters(sortSemesters(data)); onSemestersUpdated?.(); } })
    .catch(() => {});

  const createSemester = async () => {
    if (!newSemName.trim()) return;
    const courses = newSemCourses.filter(c => c.code.trim());
    const missing = courses.filter(c => !c.sectioncrn);
    if (missing.length > 0) { setSemErr(`Please pick a section for: ${missing.map(c => c.code || "empty course").join(", ")}`); return; }
    setSemErr("");
    setSemSaveLoad(true);
    try {
      await fetch(`${API}/api/grades/saved`, {
        method: "POST",
        headers: semAuthHeaders(),
        body: JSON.stringify({ semesterName: newSemName.trim(), courses: courses.map(c => ({ courseCode: c.code, grade: c.grade, credits: parseInt(c.credits) || 0, sectioncrn: c.sectioncrn || null })) }),
      });
      await refetchSemesters();
      setCreating(false); setNewSemName(""); setNewSemCourses([{ id:1, code:"", credits:"", grade:"" }]);
    } catch {}
    finally { setSemSaveLoad(false); }
  };

  const saveEdit = async () => {
    const courses = editCourses.filter(c => c.code.trim());
    const missing = courses.filter(c => !c.sectioncrn);
    if (missing.length > 0) { setSemErr(`Please pick a section for: ${missing.map(c => c.code || "empty course").join(", ")}`); return; }
    setSemErr("");
    setSemSaveLoad(true);
    try {
      await fetch(`${API}/api/grades/saved/${editingId}`, {
        method: "PUT",
        headers: semAuthHeaders(),
        body: JSON.stringify({ semesterName: editName.trim(), courses: courses.map(c => ({ courseCode: c.code, grade: c.grade, credits: parseInt(c.credits) || 0, sectioncrn: c.sectioncrn || null })) }),
      });
      await refetchSemesters();
      setEditingId(null);
    } catch {}
    finally { setSemSaveLoad(false); }
  };

  const deleteSemester = async (id) => {
    const sem = semesters.find(s => s.id === id);
    await fetch(`${API}/api/grades/saved/${id}`, { method: "DELETE", headers: semAuthHeaders() });
    await refetchSemesters();
    setSemUndoToast(sem);
    if (semUndoTimerRef.current) clearTimeout(semUndoTimerRef.current);
    semUndoTimerRef.current = setTimeout(() => setSemUndoToast(null), 5000);
  };

  const undoDeleteSemester = async () => {
    if (!semUndoToast) return;
    if (semUndoTimerRef.current) clearTimeout(semUndoTimerRef.current);
    await fetch(`${API}/api/grades/saved`, {
      method: "POST",
      headers: semAuthHeaders(),
      body: JSON.stringify({ semesterName: semUndoToast.semesterName, courses: (semUndoToast.courses || []).map(c => ({ courseCode: c.courseCode, grade: c.grade, credits: c.credits })) }),
    });
    setSemUndoToast(null);
    await refetchSemesters();
    if (onSemestersUpdated) onSemestersUpdated();
  };

  const removeSyllabus = (courseCode) => {
    const snapshot = syllabi[courseCode];
    const ohMap = JSON.parse(localStorage.getItem("kk_course_office_hours") || "{}");
    const dataMap = JSON.parse(localStorage.getItem("kk_course_data") || "{}");
    const ohSnapshot = ohMap[courseCode];
    const dataSnapshot = dataMap[courseCode];

    const next = { ...syllabi };
    delete next[courseCode];
    setSyllabi(next);
    localStorage.setItem("kk_course_syllabus", JSON.stringify(next));
    window.dispatchEvent(new Event("kk_syllabus_changed"));
    delete dataMap[courseCode]; localStorage.setItem("kk_course_data", JSON.stringify(dataMap));
    delete ohMap[courseCode]; localStorage.setItem("kk_course_office_hours", JSON.stringify(ohMap));
    setSyllabusUndoToast({ courseCode, snapshot, ohSnapshot, dataSnapshot });
    if (syllabusUndoTimerRef.current) clearTimeout(syllabusUndoTimerRef.current);
    syllabusUndoTimerRef.current = setTimeout(async () => {
      const token = localStorage.getItem("kk_token");
      const raw = JSON.parse(localStorage.getItem("kk_syllabus_task_ids") || "{}");
      const map = Array.isArray(raw) ? {} : raw;
      const courseTaskIds = [...(map[courseCode] || [])];
      if (token && courseTaskIds.length > 0) {
        await Promise.all(courseTaskIds.map(id =>
          fetch(`${API}/api/tasks/delete/${id}`, { method:"DELETE", headers:{ "Authorization":`Bearer ${token}` } }).catch(()=>{})
        ));
      }
      delete map[courseCode];
      localStorage.setItem("kk_syllabus_task_ids", JSON.stringify(map));
      if (token) fetch(`${API}/api/user-syllabi/${encodeURIComponent(courseCode)}`, { method:"DELETE", headers:{ "Authorization":`Bearer ${token}` } }).catch(()=>{});
      setSyllabusUndoToast(null);
    }, 5000);
  };

  const undoRemoveSyllabus = () => {
    if (!syllabusUndoToast) return;
    if (syllabusUndoTimerRef.current) clearTimeout(syllabusUndoTimerRef.current);
    const { courseCode, snapshot, ohSnapshot, dataSnapshot } = syllabusUndoToast;
    const next = { ...syllabi, [courseCode]: snapshot };
    setSyllabi(next);
    localStorage.setItem("kk_course_syllabus", JSON.stringify(next));
    if (ohSnapshot) {
      const ohMap = JSON.parse(localStorage.getItem("kk_course_office_hours") || "{}");
      ohMap[courseCode] = ohSnapshot;
      localStorage.setItem("kk_course_office_hours", JSON.stringify(ohMap));
    }
    if (dataSnapshot) {
      const dataMap = JSON.parse(localStorage.getItem("kk_course_data") || "{}");
      dataMap[courseCode] = dataSnapshot;
      localStorage.setItem("kk_course_data", JSON.stringify(dataMap));
    }
    window.dispatchEvent(new Event("kk_syllabus_changed"));
    setSyllabusUndoToast(null);
  };

  const startEdit = (sem) => {
    setEditingId(sem.id);
    setEditName(sem.semesterName);
    setEditCourses((sem.courses || []).map((c,i) => ({ id: i+1, code: c.courseCode || "", credits: String(c.credits || ""), grade: c.grade || "", sectioncrn: c.sectioncrn || null, sectionNumber: c.section?.sectionNumber || null, professorName: c.section?.professorName || null })));
  };

  const removeTranscript = async () => {
    const ids = (() => { try { return JSON.parse(localStorage.getItem("kk_transcript_sem_ids") || "[]"); } catch { return []; } })();
    const snapshots = semesters.filter(s => ids.includes(String(s.id)));
    // Delete semesters from backend
    await Promise.all(ids.map(id =>
      fetch(`${API}/api/grades/saved/${id}`, { method: "DELETE", headers: semAuthHeaders() }).catch(() => {})
    ));
    // Delete transcript info from backend
    fetch(`${API}/api/transcript-info`, { method: "DELETE", headers: semAuthHeaders() }).catch(() => {});
    localStorage.removeItem("kk_transcript_sem_ids");
    localStorage.removeItem("kk_transcript_info");
    setTranscriptInfo(null);
    await refetchSemesters();
    // Show undo toast for 6 seconds
    setUndoToast({ ids, snapshots });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoToast(null), 6000);
  };

  const undoRemoveTranscript = async () => {
    if (!undoToast) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const restoredIds = [];
    for (const sem of undoToast.snapshots) {
      const res = await fetch(`${API}/api/grades/saved`, {
        method: "POST",
        headers: semAuthHeaders(),
        body: JSON.stringify({ semesterName: sem.semesterName, courses: (sem.courses || []).map(c => ({ courseCode: c.courseCode, grade: c.grade, credits: c.credits })) }),
      }).catch(() => null);
      if (res?.ok) {
        const created = await res.json();
        if (created?.id) restoredIds.push(String(created.id));
      }
    }
    const info = { uploadedAt: new Date().toISOString(), semesterCount: restoredIds.length, courseCount: undoToast.snapshots.reduce((s, sem) => s + (sem.courses?.length || 0), 0) };
    localStorage.setItem("kk_transcript_sem_ids", JSON.stringify(restoredIds));
    localStorage.setItem("kk_transcript_info", JSON.stringify(info));
    setTranscriptInfo(info);
    setUndoToast(null);
    await refetchSemesters();
  };

  const set = (k, v) => setDraft(p => {
    const updated = { ...p, [k]: v };
    return updated;
  });

  const handleSave = async () => {
    let savedData = draft;
    try {
      const res = await profileFetch("/api/profile", { method: "PUT", body: JSON.stringify(draft) });
      restoreFacultyFields(res);
      savedData = res;
      setProfile(res);
      setDraft(res);
    } catch { setProfile(draft); }
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (onProfileSave) onProfileSave(savedData);
  };

  const handleCancel = () => { setDraft(profile); setEditing(false); };


  const selectAvatar = async (iconId) => {
    const updated = { ...profile, avatar: iconId };
    try {
      await profileFetch("/api/profile", { method: "PUT", body: JSON.stringify({ avatar: iconId }) });
    } catch {}
    setProfile(updated);
    setProfilepic(false);
    if (onProfileSave) onProfileSave(updated);
  };

  const displayName = profile.firstName || profile.lastName
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Student";

  const initials = profile.firstName && profile.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : (profile.firstName?.[0] || profile.email?.[0] || "S").toUpperCase();

  const st = statusObj(profile.status);

  return (
    <div style={{ padding:"28px 28px 60px" }}>
      {showDirectory &&
        <StudentDirectoryPanel
          onClose={() => setShowDirectory(false)}
          friends={friends}
          onFriendToggle={student => {
            const exists = friends.find(f => f.id === student.id);
            const updated = exists ? friends.filter(f => f.id !== student.id) : [...friends, student];
            setFriends(updated);
            localStorage.setItem("kk_friends", JSON.stringify(updated));
          }}
        />
      }
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .pf-input:focus { border-color:#8FB3E2 !important; outline:none; }
        .pf-status:hover { border-color:var(--accent) !important; }
      `}</style>

      {isAdmin && (
        <div style={{ 
          display:"flex", 
          gap:4, 
          background:"var(--surface)",  
          padding:5,                     
          borderRadius:14,              
          marginBottom:24, 
          width:"fit-content",
          border:"1px solid var(--border)" 
        }}>
          {[{ id:"profile", label:"My Profile" }, { id:"admin", label:"Admin" }].map(t => (
            <button key={t.id} onClick={() => setSection(t.id)} style={{
              padding:"6px 20px", 
              border:"none", 
              borderRadius:8, 
              fontSize:13, 
              fontWeight:600,  
              cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",
              background: section === t.id ? "var(--primary)" : "transparent",
              color:      section === t.id ? "#fff"    : "var(--text2)",
            }}>{t.label}</button>
            ))}
          </div>
        )}

      {isAdmin && section === "admin" && (
        <AdminDashboard token={localStorage.getItem("kk_token")} />
      )}

      {section === "profile" && <>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"var(--primary)", marginBottom:4 }}>My Profile</div>
        <div style={{ fontSize:13, color:"var(--text2)" }}>Your info shows up on the dashboard greeting and affects how KourseKit personalizes your experience.</div>
      </div>

      <div style={{ background:"var(--surface)", borderRadius:20, border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", overflow:"hidden", marginBottom:20 }}>
        <div style={{ padding:"24px 28px 24px" }}>

          <div style={{ display:"flex", alignItems:"flex-end", gap:16, marginBottom:20 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div onClick={() => setProfilepic(o => !o)} style={{
                width:72, height:72, borderRadius:20, border:"3px solid var(--border)",
                background:"linear-gradient(135deg,#8FB3E2,#7B5EA7)",
                color:"white", fontWeight:700, fontSize:26,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Fraunces',serif", boxShadow:"0 4px 12px rgba(49,72,122,0.18)",
                cursor:"pointer",
              }}>
                {profile.avatar
                  ? (() => { const a = AVATAR_ICONS.find(x => x.id === profile.avatar); return a ? <a.icon size={32} color="white" /> : initials; })()
                  : initials}
              </div>
              {profilepic && (
                <div style={{
                  position:"absolute", top:80, left:0, zIndex:100,
                  background:"var(--surface)", borderRadius:14, border:"1px solid var(--border)",
                  boxShadow:"0 8px 32px rgba(49,72,122,0.15)", padding:10,
                  display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, width:196,
                }}>
                  <div onClick={() => selectAvatar(null)} title="Default (initials)" style={{
                    width:36, height:36, borderRadius:10, cursor:"pointer",
                    background: !profile.avatar ? "var(--accent)" : "linear-gradient(135deg,#8FB3E2,#A59AC9)",
                    border: !profile.avatar ? "2px solid #31487A" : "2px solid transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"white", fontWeight:700, fontSize:13, fontFamily:"'Fraunces',serif",
                  }}>{initials}</div>
                  {AVATAR_ICONS.map(({ id, icon: Icon }) => (
                    <div key={id} onClick={() => selectAvatar(id)} title={id} style={{
                      width:36, height:36, borderRadius:10, cursor:"pointer",
                      background: profile.avatar === id ? "var(--accent)" : "linear-gradient(135deg,#8FB3E2,#A59AC9)",
                      border: profile.avatar === id ? "2px solid #31487A" : "2px solid transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .15s",
                    }}>
                      <Icon size={18} color="white" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ paddingBottom:4 }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:22, color:"var(--primary)" }}>{displayName}</div>
              <div style={{ fontSize:12, color:"var(--text2)" }}>{profile.email}</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:10, paddingBottom:4 }}>
               <button onClick={() => setShowDirectory(true)} style={{ padding:"8px 16px", background:"var(--surface2)", color:"var(--primary)", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}> 
                  Find Students </button>
              {saved && (
                <div style={{ fontSize:12, fontWeight:600, color:"#2d7a4a", background:"#eef7f0", border:"1px solid #b7d9c0", borderRadius:8, padding:"6px 14px", display:"flex", alignItems:"center", gap:6 }}>
                  ✓ Saved
                </div>
              )}
              {!editing
                ? <button onClick={() => { setDraft(profile); setEditing(true); }} style={pf.editBtn}>Edit Profile</button>
                : <>
                    <button onClick={handleSave}   style={pf.saveBtn}>Save</button>
                    <button onClick={handleCancel} style={pf.cancelBtn}>Cancel</button>
                  </>
              }
            </div>
          </div>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom: editing ? 24 : 0 }}>
            <StatChip label="Status"         value={`${st.label} · ${st.desc}`} color="var(--accent)" bg="var(--surface3)" />
            <StatChip label="Major" value={(() => { const m = [profile.major, profile.doubleMajor && profile.secondMajor].filter(Boolean).sort(); return m.length > 1 ? m[0] + " & " + m[1] : (m[0] || "—"); })()} color="var(--primary)" bg="var(--blue-light-bg)" />
            {profile.minor && profile.minorName && <StatChip label="Minor" value={(() => { const m = [profile.minorName, profile.doubleMinor && profile.secondMinor, profile.tripleMinor && profile.thirdMinor].filter(Boolean).sort(); return m.length > 1 ? m.slice(0,-1).join(", ") + " & " + m[m.length-1] : m[0]; })()} color="var(--success)" bg="var(--success-bg)" />}
            <StatChip label="Cumulative GPA" value={profile.cumGPA || "—"} color={gpaColor(profile.cumGPA)} bg="var(--bg)" />
            {profile.totalCredits && <StatChip label="Credits" value={`${profile.totalCredits} cr`} color="var(--accent2)" bg="var(--surface3)" />}
          </div>

          <div style={{ display:"flex", gap:16, marginTop:16 }}>
            <button onClick={() => setShowFollowList("following")} style={{ background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit", textAlign:"left" }}>
              <span style={{ fontSize:18, fontWeight:700, color:"var(--primary)" }}>{friends.length}</span>
              <span style={{ fontSize:12, color:"var(--text2)", marginLeft:5 }}>Following</span>
            </button>
          </div>

          {showFollowList && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1001, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ background:"var(--bg)", borderRadius:18, width:360, maxHeight:"70vh", display:"flex", flexDirection:"column", boxShadow:"0 8px 40px rgba(0,0,0,0.18)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:700, color:"var(--primary)" }}>Following</div>
                  <button onClick={() => setShowFollowList(null)} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:16, color:"var(--text2)" }}>✕</button>
                </div>
                <div style={{ overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                  {friends.length === 0 && <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"24px 0" }}>Not following anyone yet.</div>}
                  {friends.map(f => (
                    <div key={f.id} onClick={() => { setShowFollowList(null); setShowDirectory(true); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)", cursor:"pointer" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#8FB3E2,#A59AC9)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontWeight:700, fontSize:13, color:"white" }}>{(f.firstName?.[0] || "?").toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:"var(--primary)" }}>{[f.firstName, f.lastName].filter(Boolean).join(" ") || "Student"}</div>
                        {f.email && <div style={{ fontSize:11, color:"var(--text3)", marginTop:1 }}>{f.email}</div>}
                      </div>
                      <button onClick={() => { const next = friends.filter(x => x.id !== f.id); setFriends(next); localStorage.setItem("kk_friends", JSON.stringify(next)); }} style={{ fontSize:11, color:"var(--error)", background:"none", border:"1px solid var(--border)", borderRadius:7, padding:"3px 8px", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
                        Unfollow </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {editing && (
            <div style={{ borderTop:"1px solid #F4F4F8", paddingTop:24 }}>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:160 }}>
                  <label style={pf.label}>First Name</label>
                  <input className="pf-input" value={draft.firstName} onChange={e => set("firstName", e.target.value)} placeholder="e.g. Sarah" style={pf.input} />
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <label style={pf.label}>Last Name</label>
                  <input className="pf-input" value={draft.lastName} onChange={e => set("lastName", e.target.value)} placeholder="e.g. Khalil" style={pf.input} />
                </div>
              </div>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={pf.label}>Faculty</label>
                  <select className="pf-input" value={draft.faculty}
                    onChange={e => { set("faculty", e.target.value); set("major", ""); }}
                    style={{ ...pf.input, cursor:"pointer" }}>
                    {FACULTIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={pf.label}>Major</label>
                  <select className="pf-input" value={draft.major}
                    onChange={e => set("major", e.target.value)}
                    style={{ ...pf.input, cursor:"pointer" }}>
                    <option value="">Select major…</option>
                    {(MAJORS_BY_FACULTY[draft.faculty] || []).map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ ...pf.label, marginBottom:10 }}>Minor?</label>
                <div style={{ display:"flex", gap:8, marginBottom: draft.minorFaculty ? 12 : 0 }}>
                  {[{val:true,label:"Yes"},{val:false,label:"No"}].map(opt => (
                    <button key={String(opt.val)} onClick={() => { set("minor", opt.val); set("minorFaculty", opt.val ? (draft.minorFaculty || "Arts & Sciences") : ""); set("minorName", ""); if (!opt.val) { set("doubleMinor", false); set("secondMinorFaculty", ""); set("secondMinor", ""); set("tripleMinor", false); set("thirdMinorFaculty", ""); set("thirdMinor", ""); } }} style={{
                      padding:"7px 18px", borderRadius:10, border:"1px solid", cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:"all .15s",
                      borderColor: !!draft.minorFaculty === opt.val ? "var(--accent)" : "var(--border)",
                      background:  !!draft.minorFaculty === opt.val ? "var(--accent)" : "var(--surface2)",
                      color:       !!draft.minorFaculty === opt.val ? "#fff"    : "var(--accent2)",
                      fontWeight:  !!draft.minorFaculty === opt.val ? 600 : 400,
                    }}>{opt.label}</button>
                  ))}
                </div>
                {draft.minorFaculty && (
                  <>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14 }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <label style={pf.label}>Minor Faculty</label>
                        <select className="pf-input" value={draft.minorFaculty}
                          onChange={e => { set("minorFaculty", e.target.value); set("minorName", ""); }}
                          style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                          {FACULTIES.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div style={{ flex:1, minWidth:200 }}>
                        <label style={pf.label}>Minor</label>
                        <select className="pf-input" value={draft.minorName || ""}
                          onChange={e => set("minorName", e.target.value)}
                          style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                          <option value="">Select minor…</option>
                          {(MINORS_BY_FACULTY[draft.minorFaculty] || []).map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom:14 }}>
                      <label style={{ ...pf.label, marginBottom:10 }}>Second Minor?</label>
                      <div style={{ display:"flex", gap:8, marginBottom: draft.secondMinorFaculty ? 12 : 0 }}>
                        {[{val:true,label:"Yes"},{val:false,label:"No"}].map(opt => (
                          <button key={String(opt.val)} onClick={() => { set("doubleMinor", opt.val); set("secondMinorFaculty", opt.val ? (draft.secondMinorFaculty || "Arts & Sciences") : ""); set("secondMinor", ""); if (!opt.val) { set("tripleMinor", false); set("thirdMinorFaculty", ""); set("thirdMinor", ""); } }} style={{
                            padding:"7px 18px", borderRadius:10, border:"1px solid", cursor:"pointer",
                            fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:"all .15s",
                            borderColor: !!draft.secondMinorFaculty === opt.val ? "var(--accent)" : "var(--border)",
                            background:  !!draft.secondMinorFaculty === opt.val ? "var(--accent)" : "var(--surface2)",
                            color:       !!draft.secondMinorFaculty === opt.val ? "#fff"    : "var(--accent2)",
                            fontWeight:  !!draft.secondMinorFaculty === opt.val ? 600 : 400,
                          }}>{opt.label}</button>
                        ))}
                      </div>
                      {draft.secondMinorFaculty && (
                        <>
                          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14 }}>
                            <div style={{ flex:1, minWidth:200 }}>
                              <label style={pf.label}>Second Minor Faculty</label>
                              <select className="pf-input" value={draft.secondMinorFaculty}
                                onChange={e => { set("secondMinorFaculty", e.target.value); set("secondMinor", ""); }}
                                style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                                {FACULTIES.map(f => <option key={f}>{f}</option>)}
                              </select>
                            </div>
                            <div style={{ flex:1, minWidth:200 }}>
                              <label style={pf.label}>Second Minor</label>
                              <select className="pf-input" value={draft.secondMinor || ""}
                                onChange={e => set("secondMinor", e.target.value)}
                                style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                                <option value="">Select minor…</option>
                                {(MINORS_BY_FACULTY[draft.secondMinorFaculty] || []).map(m => <option key={m}>{m}</option>)}
                              </select>
                            </div>
                          </div>

                          <div style={{ marginBottom:14 }}>
                            <label style={{ ...pf.label, marginBottom:10 }}>Third Minor?</label>
                            <div style={{ display:"flex", gap:8, marginBottom: draft.thirdMinorFaculty ? 12 : 0 }}>
                              {[{val:true,label:"Yes"},{val:false,label:"No"}].map(opt => (
                                <button key={String(opt.val)} onClick={() => { set("tripleMinor", opt.val); set("thirdMinorFaculty", opt.val ? (draft.thirdMinorFaculty || "Arts & Sciences") : ""); set("thirdMinor", ""); }} style={{
                                  padding:"7px 18px", borderRadius:10, border:"1px solid", cursor:"pointer",
                                  fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:"all .15s",
                                  borderColor: !!draft.thirdMinorFaculty === opt.val ? "var(--accent)" : "var(--border)",
                                  background:  !!draft.thirdMinorFaculty === opt.val ? "var(--accent)" : "var(--surface2)",
                                  color:       !!draft.thirdMinorFaculty === opt.val ? "#fff"    : "var(--accent2)",
                                  fontWeight:  !!draft.thirdMinorFaculty === opt.val ? 600 : 400,
                                }}>{opt.label}</button>
                              ))}
                            </div>
                            {draft.thirdMinorFaculty && (
                              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                                <div style={{ flex:1, minWidth:200 }}>
                                  <label style={pf.label}>Third Minor Faculty</label>
                                  <select className="pf-input" value={draft.thirdMinorFaculty}
                                    onChange={e => { set("thirdMinorFaculty", e.target.value); set("thirdMinor", ""); }}
                                    style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                                    {FACULTIES.map(f => <option key={f}>{f}</option>)}
                                  </select>
                                </div>
                                <div style={{ flex:1, minWidth:200 }}>
                                  <label style={pf.label}>Third Minor</label>
                                  <select className="pf-input" value={draft.thirdMinor || ""}
                                    onChange={e => set("thirdMinor", e.target.value)}
                                    style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                                    <option value="">Select minor…</option>
                                    {(MINORS_BY_FACULTY[draft.thirdMinorFaculty] || []).map(m => <option key={m}>{m}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ ...pf.label, marginBottom:10 }}>Double Major?</label>
                <div style={{ display:"flex", gap:8, marginBottom: draft.doubleMajor ? 12 : 0 }}>
                  {[{val:true,label:"Yes"},{val:false,label:"No"}].map(opt => (
                    <button key={String(opt.val)} onClick={() => { set("doubleMajor", opt.val); if (!opt.val) { set("secondMajor", ""); set("secondFaculty", "Arts & Sciences"); } else { set("secondFaculty", draft.secondFaculty || "Arts & Sciences"); } }} style={{
                      padding:"7px 18px", borderRadius:10, border:"1px solid", cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:"all .15s",
                      borderColor: draft.doubleMajor === opt.val ? "var(--accent)" : "var(--border)",
                      background:  draft.doubleMajor === opt.val ? "var(--accent)" : "var(--surface2)",
                      color:       draft.doubleMajor === opt.val ? "#fff"    : "var(--accent2)",
                      fontWeight:  draft.doubleMajor === opt.val ? 600 : 400,
                    }}>{opt.label}</button>
                  ))}
                </div>
                {draft.doubleMajor && (
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <label style={pf.label}>Second Faculty</label>
                      <select className="pf-input" value={draft.secondFaculty || "Arts & Sciences"}
                        onChange={e => { set("secondFaculty", e.target.value); set("secondMajor", ""); set("secondMinor", ""); }}
                        style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                        {FACULTIES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                      <label style={pf.label}>Second Major</label>
                      <select className="pf-input" value={draft.secondMajor}
                        onChange={e => set("secondMajor", e.target.value)}
                        style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                        <option value="">Select major…</option>
                        {(MAJORS_BY_FACULTY[draft.secondFaculty] || []).map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <label style={pf.label}>Academic Status</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                {STUDENT_STATUSES.map(s => (
                  <button key={s.id} className="pf-status" onClick={() => set("status", s.id)} style={{
                    padding:"8px 14px", borderRadius:10, border:"1px solid",
                    cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                    borderColor: draft.status === s.id ? "var(--accent)" : "var(--border)",
                    background:  draft.status === s.id ? "var(--accent)" : "var(--surface2)",
                    color:       draft.status === s.id ? "#ffffff" : "var(--accent2)",
                    fontWeight:  draft.status === s.id ? 600 : 400,
                  }}>
                    <div style={{ fontSize:13 }}>{s.label}</div>
                    <div style={{ fontSize:10, opacity:.75 }}>{s.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={pf.label}>Cumulative GPA <span style={{ color:"var(--text3)", fontWeight:400 }}>(optional)</span></label>
                  <input className="pf-input" value={draft.cumGPA} onChange={e => set("cumGPA", e.target.value)}
                    placeholder="e.g. 3.45" type="number" step="0.01" min="0" max="4"
                    style={pf.input} />
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={pf.label}>Total Credits <span style={{ color:"var(--text3)", fontWeight:400 }}>(optional)</span></label>
                  <input className="pf-input" value={draft.totalCredits} onChange={e => set("totalCredits", e.target.value)}
                    placeholder="e.g. 60" type="number"
                    style={pf.input} />
                </div>
              </div>

              <label style={pf.label}>Bio <span style={{ color:"var(--text3)", fontWeight:400 }}>(optional)</span></label>
              <textarea className="pf-input" value={draft.bio} onChange={e => set("bio", e.target.value)}
                placeholder="A short description about yourself..."
                rows={3}
                style={{ ...pf.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
              />

              <div style={{ fontSize:11, color:"var(--text3)", marginTop:-8, marginBottom:16 }}>
                GPA and credits here are self-reported — once backend is connected, this will sync with your actual academic record.
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:4 }}>
                <div>
                  <label style={pf.label}>Expected Graduation Year</label>
                  <select className="pf-input" value={draft.graduationYear} onChange={e => set("graduationYear", e.target.value)} style={{ ...pf.input, cursor:"pointer" }}>
                    <option value="">Select year…</option>
                    {["2025","2026","2027","2028","2029","2030"].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:22 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"var(--accent2)" }}>Open to study groups</span>
                  <button type="button" onClick={() => set("openToStudyGroups", !draft.openToStudyGroups)}
                    style={{ width:46, height:26, borderRadius:13, border:"none", padding:0, cursor:"pointer", flexShrink:0, background: draft.openToStudyGroups ? "var(--accent)" : "#b0b8c8", position:"relative", transition:"background 0.2s" }}>
                    <span style={{ position:"absolute", top:3, left: draft.openToStudyGroups ? 24 : 3, width:20, height:20, borderRadius:"50%", background:"white", boxShadow:"0 1px 3px rgba(0,0,0,0.2)", transition:"left 0.2s", display:"block" }} />
                  </button>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={pf.label}>LinkedIn</label>
                  <input className="pf-input" value={draft.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/in/..." style={pf.input} />
                </div>
                <div>
                  <label style={pf.label}>GitHub</label>
                  <input className="pf-input" value={draft.github} onChange={e => set("github", e.target.value)} placeholder="github.com/..." style={pf.input} />
                </div>
              </div>

              <label style={pf.label}>Interests / Skills <span style={{ color:"var(--text3)", fontWeight:400 }}>(comma-separated)</span></label>
              <input className="pf-input" value={draft.interests} onChange={e => set("interests", e.target.value)} placeholder="e.g. Machine Learning, Web Dev, Photography" style={pf.input} />
            </div>
          )}

          {!editing && (
            <div style={{ marginTop:16, borderTop:"1px solid #F4F4F8", paddingTop:16, display:"flex", flexDirection:"column", gap:10 }}>
              {profile.bio && <div style={{ fontSize:13, color:"var(--accent2)", lineHeight:1.7 }}>{profile.bio}</div>}
              {(profile.graduationYear || profile.linkedin || profile.github || profile.openToStudyGroups || profile.interests) && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
                  {profile.graduationYear && <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"var(--surface2)", color:"var(--primary)", border:"1px solid var(--border)" }}>Class of {profile.graduationYear}</span>}
                  {profile.openToStudyGroups && <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"#eef7f0", color:"#2d7a4a", border:"1px solid #b6e5c8" }}>Open to study groups</span>}
                  {profile.linkedin && <a href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer" style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"var(--surface2)", color:"var(--accent)", border:"1px solid var(--border)", textDecoration:"none" }}>LinkedIn</a>}
                  {profile.github && <a href={profile.github.startsWith("http") ? profile.github : `https://${profile.github}`} target="_blank" rel="noreferrer" style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"var(--surface2)", color:"var(--accent)", border:"1px solid var(--border)", textDecoration:"none" }}>GitHub</a>}
                  {profile.interests && profile.interests.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} style={{ fontSize:11, fontWeight:500, padding:"3px 10px", borderRadius:20, background:"var(--surface3,var(--surface2))", color:"var(--text2)", border:"1px solid var(--border)" }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {transcriptModal && (
        <TranscriptModal
          onClose={() => setTranscriptModal(false)}
          onApply={({ semesterCount, courseCount }) => {
            const info = { uploadedAt: new Date().toISOString(), semesterCount, courseCount };
            setTranscriptInfo(info);
            localStorage.setItem("kk_transcript_info", JSON.stringify(info));
            refetchSemesters();
            setTranscriptModal(false);
          }}
        />
      )}

      {/* Undo toast */}
      {undoToast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 20px", boxShadow:"0 8px 32px rgba(49,72,122,0.18)", display:"flex", alignItems:"center", gap:16, zIndex:9998, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          <span style={{ color:"var(--text)" }}>Transcript semesters removed.</span>
          <button onClick={undoRemoveTranscript} style={{ background:"var(--primary)", color:"white", border:"none", borderRadius:8, padding:"6px 14px", fontWeight:600, fontSize:13, cursor:"pointer" }}>Undo</button>
        </div>
      )}
      {semUndoToast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 20px", boxShadow:"0 8px 32px rgba(49,72,122,0.18)", display:"flex", alignItems:"center", gap:16, zIndex:9997, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          <span style={{ color:"var(--text)" }}><strong>{semUndoToast.semesterName}</strong> deleted.</span>
          <button onClick={undoDeleteSemester} style={{ background:"var(--primary)", color:"white", border:"none", borderRadius:8, padding:"6px 14px", fontWeight:600, fontSize:13, cursor:"pointer" }}>Undo</button>
        </div>
      )}
      {syllabusUndoToast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 20px", boxShadow:"0 8px 32px rgba(49,72,122,0.18)", display:"flex", alignItems:"center", gap:16, zIndex:9996, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          <span style={{ color:"var(--text)" }}>Syllabus for <strong>{syllabusUndoToast.courseCode}</strong> removed.</span>
          <button onClick={undoRemoveSyllabus} style={{ background:"var(--primary)", color:"white", border:"none", borderRadius:8, padding:"6px 14px", fontWeight:600, fontSize:13, cursor:"pointer" }}>Undo</button>
        </div>
      )}

      {/* Syllabus edit modal */}
      {syllabusEditCourse && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e => { if (e.target === e.currentTarget) setSyllabusEditCourse(null); }}>
          <div style={{ background:"var(--surface)", borderRadius:18, padding:"28px 28px 24px", width:"min(480px,94vw)", boxShadow:"0 8px 40px rgba(49,72,122,0.22)", fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:18, color:"var(--primary)", marginBottom:18 }}>
              Edit Syllabus Info — {syllabusEditCourse}
            </div>

            <label style={pf.label}>Professor</label>
            <input value={syllabusEditProf} onChange={e => setSyllabusEditProf(e.target.value)}
              placeholder="Professor name" style={{ ...pf.input }} />

            <div style={{ fontWeight:700, fontSize:14, color:"var(--primary)", marginBottom:10 }}>Office Hours</div>
            {syllabusEditOH.length === 0 && (
              <div style={{ fontSize:12, color:"var(--text2)", marginBottom:8 }}>No office hours — add them below.</div>
            )}
            {syllabusEditOH.map((o, i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:6, alignItems:"center" }}>
                <input value={o.day || ""} onChange={e => setSyllabusEditOH(p => p.map((x,j) => j===i ? {...x, day:e.target.value} : x))}
                  placeholder="Day" style={{ ...pf.input, flex:1, marginBottom:0 }} />
                <input value={o.time || ""} onChange={e => setSyllabusEditOH(p => p.map((x,j) => j===i ? {...x, time:e.target.value} : x))}
                  placeholder="Time" style={{ ...pf.input, flex:1, marginBottom:0 }} />
                <input value={o.location || ""} onChange={e => setSyllabusEditOH(p => p.map((x,j) => j===i ? {...x, location:e.target.value} : x))}
                  placeholder="Location" style={{ ...pf.input, flex:2, marginBottom:0 }} />
                <button onClick={() => setSyllabusEditOH(p => p.filter((_,j) => j!==i))}
                  style={{ background:"none", border:"none", color:"var(--error)", cursor:"pointer", fontSize:15, flexShrink:0 }}>✕</button>
              </div>
            ))}
            <button onClick={() => setSyllabusEditOH(p => [...p, { day:"", time:"", location:"" }])}
              style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600, marginBottom:20 }}>+ Add office hours</button>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setSyllabusEditCourse(null)} style={pf.cancelBtn}>Cancel</button>
              <button onClick={() => {
                const code = syllabusEditCourse;
                const t = localStorage.getItem("kk_token");
                // Update kk_course_syllabus (what dashboard reads)
                const allSyllabi = JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}");
                const existing = allSyllabi[code] || {};
                const updated = { ...existing, professor: syllabusEditProf };
                allSyllabi[code] = updated;
                localStorage.setItem("kk_course_syllabus", JSON.stringify(allSyllabi));
                // Persist to backend
                fetch(`http://localhost:8080/api/user-syllabi/${encodeURIComponent(code)}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${t}` },
                  body: JSON.stringify(updated),
                }).catch(() => {});
                // Update kk_course_data (grade calculator)
                const allData = JSON.parse(localStorage.getItem("kk_course_data") || "{}");
                allData[code] = { ...(allData[code] || {}), professor: syllabusEditProf };
                localStorage.setItem("kk_course_data", JSON.stringify(allData));
                // Update office hours
                const allOH = JSON.parse(localStorage.getItem("kk_course_office_hours") || "{}");
                allOH[code] = syllabusEditOH;
                localStorage.setItem("kk_course_office_hours", JSON.stringify(allOH));
                window.dispatchEvent(new Event("kk_syllabus_changed"));
                setSyllabusEditCourse(null);
              }} style={pf.saveBtn}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Transcript */}
      {transcriptInfo && (
        <div style={{ background:"var(--surface)", borderRadius:16, border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", marginTop:24, overflow:"hidden" }}>
          <div onClick={() => toggleSect("transcript")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", cursor:"pointer", userSelect:"none" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)" }}>Uploaded Transcript</div>
            <span style={{ fontSize:16, color:"var(--text3)" }}>{sectOpen.transcript ? "▾" : "▸"}</span>
          </div>
          {sectOpen.transcript && (
            <div style={{ padding:"0 28px 24px" }}>
              <div style={{ fontSize:13, color:"var(--text2)", marginBottom:16 }}>Remove to clear transcript-imported semesters from data.</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--surface2)", borderRadius:10, padding:"12px 16px", border:"1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--primary)" }}>
                    {transcriptInfo.semesterCount} semester{transcriptInfo.semesterCount !== 1 ? "s" : ""} · {transcriptInfo.courseCount} course{transcriptInfo.courseCount !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
                    Imported {new Date(transcriptInfo.uploadedAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                  </div>
                </div>
                <button onClick={removeTranscript} style={{ background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:8, padding:"6px 14px", color:"var(--error)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Semesters */}
      <div style={{ background:"var(--surface)", borderRadius:16, border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", marginTop:20, overflow:"hidden" }}>
        <div onClick={() => toggleSect("semesters")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", cursor:"pointer", userSelect:"none" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)" }}>My Semesters</div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }} onClick={e => e.stopPropagation()}>
            {sectOpen.semesters && !creating && (
              <div style={{ display:"flex", gap:8 }}>
                {!transcriptInfo && (
                  <button onClick={() => setTranscriptModal(true)} style={{ background:"var(--surface2)", color:"var(--primary)", border:"1px solid var(--border)", borderRadius:10, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Upload Transcript
                  </button>
                )}
                <button onClick={() => { setCreating(true); setEditingId(null); }} style={{ background:"var(--primary)", color:"white", border:"none", borderRadius:10, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  + New Semester
                </button>
              </div>
            )}
            <span onClick={() => toggleSect("semesters")} style={{ fontSize:16, color:"var(--text3)", cursor:"pointer" }}>{sectOpen.semesters ? "▾" : "▸"}</span>
          </div>
        </div>

        {sectOpen.semesters && (
          <div style={{ padding:"0 28px 24px" }}>
            {/* Create form */}
            {creating && (
              <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
                <select value={newSemName} onChange={e => setNewSemName(e.target.value)} style={{ ...pf.input, marginBottom:12, cursor:"pointer" }}>
                  <option value="">Select semester…</option>
                  {AUB_SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Course Name</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Credits</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Grade</span>
                  <span />
                </div>
                {newSemCourses.map(c => (
                  <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                    <StudentCourses value={c} onSelect={data => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r, code:data.code, credits:data.credits||r.credits, sectioncrn:data.sectioncrn, sectionNumber:data.sectionNumber, professorName:data.professorName} : r))} />
                    <input value={c.credits} onChange={e => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r,credits:e.target.value} : r))} placeholder="3" type="number" style={{ ...pf.input, marginBottom:0, fontSize:13 }} />
                    <select value={c.grade} onChange={e => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r,grade:e.target.value} : r))} style={{ ...pf.input, marginBottom:0, fontSize:13, cursor:"pointer" }}>
                      {LETTER_GRADES.map(g => <option key={g} value={g}>{g === "" ? "—" : g}</option>)}
                    </select>
                    <button onClick={() => setNewSemCourses(p => p.filter(r => r.id !== c.id))} style={{ background:"none", border:"none", color:"var(--text3)", fontSize:16, cursor:"pointer", padding:0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setNewSemCourses(p => [...p, { id:Date.now(), code:"", credits:"", grade:"" }])} style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600 }}>+ Add Course</button>
                {semErr && <div style={{ fontSize:12, color:"var(--error)", background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:8, padding:"8px 12px", marginTop:8 }}>{semErr}</div>}
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button onClick={createSemester} disabled={semSaveLoad || !newSemName.trim()} style={{ ...pf.saveBtn, fontSize:13, opacity: semSaveLoad || !newSemName.trim() ? 0.6 : 1 }}>{semSaveLoad ? "Saving…" : "Save Semester"}</button>
                  <button onClick={() => { setCreating(false); setNewSemName(""); setNewSemCourses([{ id:1, code:"", credits:"", grade:"" }]); setSemErr(""); }} style={{ ...pf.cancelBtn }}>Cancel</button>
                </div>
              </div>
            )}

            {semesters.length === 0 && !creating && (
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text3)", fontSize:13 }}>No semesters yet. Create one above.</div>
            )}
            {semesters.map(sem => (
              <div key={sem.id} style={{ border:"1px solid var(--border)", borderRadius:12, marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"var(--surface2)", borderRadius:"12px 12px 0 0" }}>
                  <div>
                    <span style={{ fontWeight:700, fontSize:14, color:"var(--primary)" }}>{sem.semesterName}</span>
                    <span style={{ fontSize:11, color:"var(--text3)", marginLeft:10 }}>{(sem.courses||[]).length} course{(sem.courses||[]).length !== 1 ? "s" : ""} · {fmtDateShort(sem.createdAt)}</span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => editingId === sem.id ? setEditingId(null) : startEdit(sem)} style={{ fontSize:12, fontWeight:600, padding:"5px 12px", border:"1px solid var(--border)", borderRadius:8, background:"var(--surface)", color:"var(--primary)", cursor:"pointer" }}>
                      {editingId === sem.id ? "Close" : "Edit"}
                    </button>
                    <button onClick={() => deleteSemester(sem.id)} style={{ fontSize:12, padding:"5px 10px", border:"1px solid var(--error-border)", borderRadius:8, background:"var(--surface)", color:"var(--error)", cursor:"pointer" }}>Delete</button>
                  </div>
                </div>

                {editingId !== sem.id && (sem.courses||[]).length > 0 && (
                  <div style={{ padding:"10px 16px", display:"flex", flexDirection:"column", gap:4 }}>
                    {(sem.courses||[]).map((c,i) => (
                      <div key={i} style={{ display:"flex", gap:12, fontSize:13, color:"var(--text-body)", alignItems:"center" }}>
                        <span style={{ fontWeight:600, minWidth:100 }}>{c.courseCode}</span>
                        <span style={{ color:"var(--text2)" }}>{c.credits} cr</span>
                        <span style={{ color:"var(--accent)", fontWeight:600 }}>{c.grade}</span>
                        {syllabi[c.courseCode] && (
                          <span style={{ display:"flex", alignItems:"center", gap:4, marginLeft:"auto" }}>
                            <span style={{ fontSize:11, color:"var(--success-text, var(--accent))", fontWeight:500 }}>Syllabus uploaded</span>
                            <button onClick={() => removeSyllabus(c.courseCode)} style={{ fontSize:11, color:"var(--error)", background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:600 }}>✕</button>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {editingId === sem.id && (
                  <div style={{ padding:"14px 16px" }}>
                    <select value={editName} onChange={e => setEditName(e.target.value)} style={{ ...pf.input, marginBottom:10, cursor:"pointer" }}>
                      <option value="">Select semester…</option>
                      {AUB_SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Course Name</span>
                      <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Credits</span>
                      <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Grade</span>
                      <span />
                    </div>
                    {editCourses.map(c => (
                      <div key={c.id}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom: syllabi[c.code] ? 4 : 6 }}>
                          <StudentCourses value={c} onSelect={data => setEditCourses(p => p.map(r => r.id===c.id ? {...r, code:data.code, credits:data.credits||r.credits, sectioncrn:data.sectioncrn, sectionNumber:data.sectionNumber, professorName:data.professorName} : r))} />
                          <input value={c.credits} onChange={e => setEditCourses(p => p.map(r => r.id===c.id ? {...r,credits:e.target.value} : r))} placeholder="3" type="number" style={{ ...pf.input, marginBottom:0, fontSize:13 }} />
                          <select value={c.grade} onChange={e => setEditCourses(p => p.map(r => r.id===c.id ? {...r,grade:e.target.value} : r))} style={{ ...pf.input, marginBottom:0, fontSize:13, cursor:"pointer" }}>
                            {LETTER_GRADES.map(g => <option key={g} value={g}>{g === "" ? "—" : g}</option>)}
                          </select>
                          <button onClick={() => setEditCourses(p => p.filter(r => r.id !== c.id))} style={{ background:"none", border:"none", color:"var(--text3)", fontSize:16, cursor:"pointer", padding:0 }}>✕</button>
                        </div>
                        {syllabi[c.code] && (
                          <div style={{ marginBottom:6, paddingLeft:2 }}>
                            <button onClick={() => {
                              const courseData = JSON.parse(localStorage.getItem("kk_course_data") || "{}")[c.code] || {};
                              const oh = JSON.parse(localStorage.getItem("kk_course_office_hours") || "{}")[c.code] || [];
                              setSyllabusEditProf(courseData.professor || "");
                              setSyllabusEditOH(oh.length ? oh : []);
                              setSyllabusEditCourse(c.code);
                            }} style={{ fontSize:11, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:600 }}>Edit syllabus info</button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setEditCourses(p => [...p, { id:Date.now(), code:"", credits:"", grade:"" }])} style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600 }}>+ Add Course</button>
                    {semErr && <div style={{ fontSize:12, color:"var(--error)", background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:8, padding:"8px 12px", marginTop:8 }}>{semErr}</div>}
                    <div style={{ display:"flex", gap:8, marginTop:12 }}>
                      <button onClick={saveEdit} disabled={semSaveLoad} style={{ ...pf.saveBtn, fontSize:13, opacity: semSaveLoad ? 0.6 : 1 }}>{semSaveLoad ? "Saving…" : "Save Changes"}</button>
                      <button onClick={() => { setEditingId(null); setSemErr(""); }} style={{ ...pf.cancelBtn }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default Weekly Schedule */}
      <div style={{ background:"var(--surface)", borderRadius:16, border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", marginTop:20, overflow:"hidden" }}>
        <div onClick={() => toggleSect("schedule")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", cursor:"pointer", userSelect:"none" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)" }}>Default Weekly Schedule</div>
          <span style={{ fontSize:16, color:"var(--text3)" }}>{sectOpen.schedule ? "▾" : "▸"}</span>
        </div>
        {sectOpen.schedule && (
          <div style={{ padding:"0 28px 24px" }}>
            <DefaultScheduleEditor token={localStorage.getItem("kk_token")} />
          </div>
        )}
      </div>

      </>}
    </div>
  );
}

function StatChip({ label, value, color, bg }) {
  return (
    <div style={{ background:bg, borderRadius:12, padding:"10px 16px", border:"1px solid var(--border)", minWidth:100 }}>
      <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:700, color, fontFamily:"'DM Sans',sans-serif" }}>{value}</div>
    </div>
  );
}

const pf = {
  label:     { display:"block", fontSize:12, fontWeight:600, color:"var(--text)", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", marginBottom:14, display:"block", transition:"border-color .15s", outline:"none" },
  editBtn:   { padding:"8px 18px", background:"var(--bg)", color:"var(--primary)", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  saveBtn:   { padding:"8px 20px", background:"var(--primary)", color:"white", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"8px 16px", background:"var(--bg)", color:"var(--text2)", border:"1px solid var(--border)", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};
