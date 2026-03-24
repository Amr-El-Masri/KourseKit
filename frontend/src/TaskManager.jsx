import { useState, useEffect, useCallback } from "react";
import { NotebookPen, Notebook, Pencil, Search, ListChecks } from "lucide-react";

const API_BASE = "http://localhost:8080";

function getToken() { return localStorage.getItem("kk_token"); }
function getUserId() {
  const t = getToken();
  return t ? JSON.parse(atob(t.split(".")[1])).sub : null;
}

async function apiFetch(path, options = {}) {
  try {
    const t = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(t && { "Authorization": `Bearer ${t}` }),
      },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
  } catch {
    return null;
  }
}

const PRIORITIES = [
  { id:"high",   label:"High",   color:"var(--error)", bg:"var(--error-bg)", dot:"var(--error)" },
  { id:"medium", label:"Medium", color:"var(--warn)", bg:"var(--warn-bg)", dot:"var(--warn)" },
  { id:"low",    label:"Low",    color:"var(--success)", bg:"var(--success-bg)", dot:"var(--success)" },
];
const TYPES   = ["Midterm Exam","Final Exam","Assignment","Project","Quiz","Lab","Attendance","Other"];
const FILTERS = ["All","Pending","Done","Overdue"];

const priority  = id => PRIORITIES.find(p => p.id === id) || PRIORITIES[1];
const fmt       = iso => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" })
      + " · " + d.toLocaleTimeString("en-US",{ hour:"2-digit", minute:"2-digit", hour12:false });
};
const isOverdue = (iso, done) => !done && iso && new Date(iso) < new Date();
const daysLeft  = iso => {
  if (!iso) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(iso); due.setHours(0,0,0,0);
  return Math.round((due - today) / 86400000);
};

const EMPTY = { course:"", type:"", customType:"", title:"", due:"", notes:"" };

function PriorityDot({ id }) {
  const p = priority(id);
  return <span style={{ width:8, height:8, borderRadius:"50%", background:p.dot, display:"inline-block", flexShrink:0 }} />;
}

function DueBadge({ due, done }) {
  if (!due) return null;
  const d = daysLeft(due);
  const over = isOverdue(due, done);
  if (done) return <span style={tm.badge("var(--success)","var(--success-bg)")}>✓ Done</span>;
  if (over)  return <span style={tm.badge("var(--error)","var(--error-bg)")}>Overdue</span>;
  if (d === 0) return <span style={tm.badge("var(--warn)","var(--warn-bg)")}>Due today</span>;
  if (d === 1) return <span style={tm.badge("var(--warn)","var(--warn-bg)")}>Due tomorrow</span>;
  if (d <= 3)  return <span style={tm.badge("var(--warn)","var(--warn-bg)")}>{d}d left</span>;
  return <span style={tm.badge("var(--accent2)","var(--divider)")}>{d}d left</span>;
}

function TaskRow({ task, onToggle, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const p = priority(task.priority);
  const over = isOverdue(task.due, task.done);

  return (
      <div style={{
        background: task.done ? "var(--surface2)" : "var(--surface)",
        border: `1px solid ${over && !task.done ? "var(--error-border)" : "var(--border)"}`,
        borderLeft: `3px solid ${task.done ? "var(--border)" : p.dot}`,
        borderRadius:12, padding:"13px 16px", transition:"box-shadow .15s",
        opacity: task.done ? 0.6 : 1,
      }} className="task-row">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button className="tm-check" onClick={() => onToggle(task.id)} style={{
            width:20, height:20, borderRadius:6, border:`2px solid ${task.done?"var(--success)":"var(--border)"}`,
            background: task.done?"var(--success)":"var(--surface)", cursor:"pointer", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s",
          }}>
            {task.done && <span style={{ color:"white", fontSize:11, lineHeight:1 }}>✓</span>}
          </button>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:2, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:600, color: task.done?"var(--text3)":"var(--text)", textDecoration: task.done?"line-through":"none" }}>
              {task.title || <em style={{ color:"var(--text3)" }}>Untitled task</em>}
            </span>
              <span style={{ fontSize:11, background:"var(--divider)", color:"var(--accent)", padding:"2px 8px", borderRadius:6, fontWeight:600, flexShrink:0 }}>{task.course}</span>
              <span style={{ fontSize:11, background:"var(--bg)", color:"var(--text2)", padding:"2px 8px", borderRadius:6, flexShrink:0 }}>{task.type}</span>
              <DueBadge due={task.due} done={task.done} />
            </div>
            {task.due && (
                <div style={{ fontSize:11, color:"var(--text3)", marginTop:3 }}>{fmt(task.due)}</div>
            )}
          </div>

          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button onClick={() => setExpanded(e=>!e)} style={tm.iconBtn} title="Notes">
              {task.notes ? <NotebookPen size={15} color="var(--text)" /> : <Notebook size={15} color="var(--text)" />}
            </button>
            <button onClick={() => onEdit(task)} style={tm.iconBtn} title="Edit"><Pencil size={15} color="var(--text)" /></button>
            {confirming ? (
                <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:11, color:"var(--error)", fontWeight:600, whiteSpace:"nowrap" }}>Delete?</span>
                <button onClick={() => { setConfirming(false); onDelete(task.id); }} style={{ ...tm.iconBtn, color:"var(--error)", fontSize:11, fontWeight:700, padding:"2px 6px" }}>Yes</button>
                <button onClick={() => setConfirming(false)} style={{ ...tm.iconBtn, fontSize:11, padding:"2px 6px" }}>No</button>
              </span>
            ) : (
                <button onClick={() => setConfirming(true)} style={{ ...tm.iconBtn, color:"var(--error)" }} title="Delete">✕</button>
            )}
          </div>
        </div>

        {expanded && (
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)", fontSize:13, color:"var(--accent2)", lineHeight:1.6 }}>
              {task.notes || <span style={{ color:"var(--text3)" }}>No notes added.</span>}
            </div>
        )}
      </div>
  );
}

function TaskForm({ initial, onSave, onCancel, backendError, courses = [] }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [err,  setErr]  = useState("");
  const [formCourseDropOpen, setFormCourseDropOpen] = useState(false);
  const [formTypeDropOpen,   setFormTypeDropOpen]   = useState(false);
  const set = (k, v) => { setForm(p => ({ ...p, [k]:v })); setErr(""); };

  const save = () => {
    if (!form.title.trim()) { setErr("Please enter a task title."); return; }
    if (!form.course.trim()) { setErr("Please select a course."); return; }
    if (!form.due) { setErr("Please select a due date."); return; }
    if (new Date(form.due) < new Date()) { setErr("Deadline cannot be in the past."); return; }
    onSave({ ...form, id: initial?.id || Date.now(), done: initial?.done || false }, setErr);
  };

  return (
      <div style={tm.formCard}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)", marginBottom:18 }}>
          {initial?.id ? "Edit Task" : "New Task"}
        </div>

        {err && <div style={{ background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:10, padding:"9px 14px", fontSize:13, color:"var(--error)", marginBottom:14 }}>{err}</div>}

        <label style={tm.label}>Task Title</label>
        <input value={form.title} onChange={e=>set("title",e.target.value)}
               placeholder="e.g. CMPS 271 — Lab 3 Report"
               style={tm.input} className="tm-input" />

        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:140 }}>
            <label style={tm.label}>Course</label>
            {courses.length > 0 ? (
                <div style={{ position:"relative", marginBottom:14 }}>
                  <button onClick={() => setFormCourseDropOpen(o => !o)} style={{
                    padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                    background:"var(--surface2)", border:"1px solid var(--border)", color: form.course ? "var(--text)" : "var(--text3)",
                    fontFamily:"'DM Sans',sans-serif",
                  }}>
                    {form.course || "Select course…"}
                    <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: formCourseDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                  </button>
                  {formCourseDropOpen && (
                    <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                      {courses.map(c => (
                        <div key={c} onClick={() => { set("course", c); setFormCourseDropOpen(false); }}
                          className="kk-option"
                          style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                            transition:"background .15s",
                            background: form.course === c ? "var(--divider)" : "transparent",
                            color:      form.course === c ? "var(--accent)"  : "var(--primary)" }}>
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            ) : (
                <input value={form.course} onChange={e=>set("course",e.target.value)}
                       placeholder="e.g. CMPS 271"
                       style={tm.input} className="tm-input" />
            )}
          </div>
          <div style={{ flex:1, minWidth:140 }}>
            <label style={tm.label}>Type</label>
            <div style={{ position:"relative", marginBottom:14 }}>
              <button onClick={() => setFormTypeDropOpen(o => !o)} style={{
                padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                background:"var(--surface2)", border:"1px solid var(--border)", color: form.type ? "var(--text)" : "var(--text3)",
                fontFamily:"'DM Sans',sans-serif",
              }}>
                {form.type || "Select type…"}
                <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: formTypeDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
              </button>
              {formTypeDropOpen && (
                <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                  {TYPES.map(t => (
                    <div key={t} onClick={() => { set("type", t); setFormTypeDropOpen(false); }}
                      className="kk-option"
                      style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                        transition:"background .15s",
                        background: form.type === t ? "var(--divider)" : "transparent",
                        color:      form.type === t ? "var(--accent)"  : "var(--primary)" }}>
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {form.type === "Other" && (
                <input value={form.customType||""} onChange={e=>set("customType",e.target.value)}
                       placeholder="Specify (optional)" style={{ ...tm.input, marginTop:6, fontSize:12 }} className="tm-input" />
            )}
          </div>
        </div>

        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:2, minWidth:180 }}>
            <label style={tm.label}>Due Date & Time</label>
            <input type="datetime-local" value={form.due} onChange={e=>set("due",e.target.value)} style={{ ...tm.input, colorScheme:"light" }} className="tm-input" />
          </div>

        </div>

        <label style={tm.label}>Notes <span style={{ color:"var(--text3)", fontWeight:400 }}>(optional)</span></label>
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)}
                  placeholder="Any extra details..."
                  rows={3}
                  style={{ ...tm.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, marginBottom:0 }}
        />

        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <button onClick={save} style={tm.saveBtn}>
            {initial?.id ? "Save Changes" : "Add Task"}
          </button>
          <button onClick={onCancel} style={tm.cancelBtn}>Cancel</button>
        </div>
      </div>
  );
}

export default function TaskManager({ initialEditTask, onNavigate }) {
  const [tasks,        setTasks]        = useState([]);
  const [filter,       setFilter]       = useState("All");
  const [search,       setSearch]       = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [composing,    setComposing]    = useState(false);
  const [editing,      setEditing]      = useState(initialEditTask || null);
  const [courseFilterDropOpen, setCourseFilterDropOpen] = useState(false);

  const USER_ID = getUserId();

  const [allCourses,   setAllCourses]   = useState([]);
  const [savedCourses, setSavedCourses] = useState([]);
  const [undoSyllabus, setUndoSyllabus] = useState(null); // { task, timer }

  useEffect(() => {
    const token = localStorage.getItem("kk_token");
    fetch(`${API_BASE}/api/grades/saved`, {
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const TERM_ORDER = { spring: 2, summer: 1, fall: 0 };
            const parse = name => {
              if (!name) return { year: 0, term: 0 };
              const lower = name.toLowerCase();
              const yearMatch = name.match(/(\d{2,4})/g);
              const year = yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : 0;
              const term = Object.entries(TERM_ORDER).find(([k]) => lower.includes(k))?.[1] ?? -1;
              return { year, term };
            };
            const sorted = [...data].sort((a, b) => {
              const pa = parse(a.semesterName), pb = parse(b.semesterName);
              return pa.year !== pb.year ? pa.year - pb.year : pa.term - pb.term;
            });
            const current = sorted[sorted.length - 1];
            const names = (current.courses || []).map(c => c.courseCode).filter(Boolean).sort();
            setSavedCourses(names);
          }
        })
        .catch(() => {});
  }, []);

  const loadTasks = useCallback(async () => {
    const data = await apiFetch(`/api/tasks/list-all`);
    if (data) {
      const mapped = data.map(t => ({ ...t, due: t.deadline, done: t.completed }));
      setTasks(mapped);
      setAllCourses([...new Set(mapped.map(t => t.course).filter(Boolean))].sort());
    }
  }, [USER_ID]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    if (!search.trim()) { loadTasks(); return; }
    const timeout = setTimeout(async () => {
      const data = await apiFetch(`/api/tasks/search?keyword=${encodeURIComponent(search)}`);
      if (data) setTasks(data.map(t => ({ ...t, due: t.deadline, done: t.completed })));
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!courseFilter) { loadTasks(); return; }
    const fetchByCourse = async () => {
      const data = await apiFetch(`/api/tasks/list?course=${encodeURIComponent(courseFilter)}`);
      if (data) setTasks(data.map(t => ({ ...t, due: t.deadline, done: t.completed })));
    };
    fetchByCourse();
  }, [courseFilter]);

  const toggleDone = async id => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = await apiFetch(`/api/tasks/edit/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...task, completed: !task.done }),
    });
    if (updated) setTasks(p => p.map(t => t.id === id ? { ...updated, due: updated.deadline, done: updated.completed } : t));
  };

  const deleteTask = async id => {
    await apiFetch(`/api/tasks/delete/${id}`, { method: "DELETE" });
    setTasks(p => p.filter(t => t.id !== id));
  };

  const deleteSyllabusTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    await deleteTask(id);
    if (undoSyllabus?.timer) clearTimeout(undoSyllabus.timer);
    const timer = setTimeout(() => setUndoSyllabus(null), 6000);
    setUndoSyllabus({ task, timer });
  };

  const undoDelete = async () => {
    if (!undoSyllabus) return;
    clearTimeout(undoSyllabus.timer);
    const { task } = undoSyllabus;
    setUndoSyllabus(null);
    const res = await fetch(`${API_BASE}/api/tasks/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
      body: JSON.stringify({ title: task.title, course: task.course, type: task.type, deadline: task.due, notes: task.notes || "", allowPastDeadline: true, fromSyllabus: true }),
    });
    if (res.ok) {
      await loadTasks();
    }
  };

  const saveTask = async (task, onError) => {
    const isEdit = tasks.some(t => t.id === task.id);
    const resolvedType = task.type === "Other" ? (task.customType?.trim() || "Other") : task.type;
    const payload = { title: task.title, course: task.course, type: resolvedType, deadline: task.due, notes: task.notes };
    if (isEdit) {
      const res = await fetch(`${API_BASE}/api/tasks/edit/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(p => p.map(t => t.id === task.id ? { ...updated, due: updated.deadline, done: updated.completed } : t));
        setEditing(null);
      } else {
        const data = await res.json().catch(() => ({}));
        if (onError) onError(data.message || "Failed to update task.");
      }
    } else {
      const res = await fetch(`${API_BASE}/api/tasks/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        const newTask = { ...created, due: created.deadline, done: created.completed };
        await loadTasks();
        if (created.course) setAllCourses(prev => [...new Set([...prev, created.course])].sort());
        setComposing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = res.status === 409 ? "A task with this course and title already exists." : (data.error || data.message || "Failed to add task.");
        if (onError) onError(msg);
      }
    }
  };

  const filterFn = t => {
    if (filter==="Pending") return !t.done;
    if (filter==="Done")    return t.done;
    if (filter==="Overdue") return isOverdue(t.due, t.done);
    return true;
  };

  const displayed = tasks.filter(filterFn);
  const syllabusDisplayed = displayed.filter(t => t.fromSyllabus);
  const manualDisplayed   = displayed.filter(t => !t.fromSyllabus);



  const counts = {
    all:     tasks.length,
    pending: tasks.filter(t=>!t.done).length,
    done:    tasks.filter(t=>t.done).length,
    overdue: tasks.filter(t=>isOverdue(t.due,t.done)).length,
  };

  return (
      <div style={{ padding:"28px 28px 60px" }}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .tm-input:focus { border-color:var(--border2) !important; outline:none; }
        .task-row:hover { box-shadow:0 3px 16px rgba(49,72,122,0.1) !important; }
        .tm-icon-btn:hover { background:var(--divider) !important; }
        .tm-check:hover { border-color:var(--success) !important; background:color-mix(in srgb,var(--success) 12%,transparent) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .tm-anim { animation: fadeUp 0.3s ease both; }
      `}</style>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"var(--primary)", marginBottom:4 }}>Task Manager</div>
            <div style={{ fontSize:13, color:"var(--text2)" }}>
              {counts.pending} pending · {counts.overdue > 0 && <span style={{ color:"var(--error)", fontWeight:600 }}>{counts.overdue} overdue · </span>}{counts.done} done
            </div>
          </div>
          <button onClick={() => { setEditing(null); setComposing(true); }} style={tm.newBtn}>
            + New Task
          </button>
        </div>

        {/* Study planner tip */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ fontSize:13, color:"var(--accent2)", lineHeight:1.5 }}>
            <span style={{ fontWeight:600 }}>Want a personalized study plan?</span>
            {" "}Set your weekly availability in the Study Planner and KourseKit will auto-generate study blocks around your deadlines.
          </div>
          {onNavigate && (
              <button
                  onClick={() => onNavigate("planner")}
                  style={{ flexShrink:0, background:"var(--divider)", color:"var(--accent)", border:"none", borderRadius:9, padding:"7px 16px", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}
              >
                Go to Study Planner →
              </button>
          )}
        </div>

        {composing && (
            <TaskForm
                initial={null}
                onSave={saveTask}
                onCancel={() => setComposing(false)}
                courses={savedCourses}
            />
        )}

        <div style={{
          display:"flex",
          gap:4,
          background:"var(--surface)",
          border:"1px solid var(--border)",
          padding:4,
          borderRadius:12,
          marginBottom:20,
          width:"fit-content",
        }}>
          {[
            { label:"All",     val:counts.all,     filter:"All"     },
            { label:"Pending", val:counts.pending, filter:"Pending" },
            { label:"Done",    val:counts.done,    filter:"Done"    },
            { label:"Overdue", val:counts.overdue, filter:"Overdue", warn:counts.overdue>0 },
          ].map(c => (
              <button key={c.filter} className="kk-tab" data-active={filter === c.filter} onClick={() => setFilter(c.filter)} style={{
                padding:"8px 20px",
                border:"none",
                borderRadius:9,
                fontSize:13,
                fontWeight: filter === c.filter ? 600 : 400,
                cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",
                transition:"all .15s",
                background: filter === c.filter ? "var(--primary)" : "transparent",
                color: filter === c.filter ? "#fff" : c.warn ? "var(--error)" : "var(--text2)",
                boxShadow: filter === c.filter ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
              }}>
                {c.label} <span style={{ opacity:.7 }}>{c.val}</span>
              </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px", flex:"1 1 200px", maxWidth:300 }}>
            <Search size={15} style={{ color:"var(--text3)", marginRight:8, flexShrink:0 }} />
            <input value={search} onChange={e => { setCourseFilter(""); setSearch(e.target.value); }} placeholder="Search tasks…"
                   className="tm-input"
                   style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
          </div>
          <div style={{ position:"relative", flex:"1 1 160px", maxWidth:200 }}>
            <button onClick={() => setCourseFilterDropOpen(o => !o)} style={{
              padding:"8px 14px", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
              display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
              background:"var(--surface)", border:"1px solid var(--border)", color: courseFilter ? "var(--text)" : "var(--text3)",
              fontFamily:"'DM Sans',sans-serif",
            }}>
              {courseFilter || "All Courses"}
              <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: courseFilterDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
            </button>
            {courseFilterDropOpen && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                <div onClick={() => { setSearch(""); setCourseFilter(""); setCourseFilterDropOpen(false); }}
                  className="kk-option"
                  style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                    transition:"background .15s",
                    background: !courseFilter ? "var(--divider)" : "transparent",
                    color:      !courseFilter ? "var(--accent)"  : "var(--primary)" }}>
                  All Courses
                </div>
                {allCourses.map(c => (
                  <div key={c} onClick={() => { setSearch(""); setCourseFilter(c); setCourseFilterDropOpen(false); }}
                    className="kk-option"
                    style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                      transition:"background .15s",
                      background: courseFilter === c ? "var(--divider)" : "transparent",
                      color:      courseFilter === c ? "var(--accent)"  : "var(--primary)" }}>
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>


        {displayed.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
              <div style={{ marginBottom:12 }}><ListChecks size={40} color="var(--text3)" /></div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>
                {filter==="Done" ? "No completed tasks yet." : filter==="Overdue" ? "Nothing overdue!" : "No tasks found."}
              </div>
              {filter==="All" && <div style={{ fontSize:13, marginTop:6 }}>Hit "+ New Task" to add one.</div>}
            </div>
        ) : (<>
          {syllabusDisplayed.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:3, height:16, background:"var(--accent)", borderRadius:2 }} />
                <span style={{ fontSize:13, fontWeight:700, color:"var(--primary)", fontFamily:"'DM Sans',sans-serif" }}>From Syllabus</span>
                <span style={{ fontSize:12, color:"var(--text3)" }}>— imported automatically</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {syllabusDisplayed.map((t, i) => (
                  <div key={t.id} className="tm-anim" style={{ animationDelay: `${i * 0.05}s` }}>
                    <TaskRow task={t} onToggle={toggleDone} onDelete={deleteSyllabusTask} onEdit={task => { setEditing(prev => prev?.id === task.id ? null : task); setComposing(false); }} />
                    {editing?.id === t.id && <div style={{marginTop:5}}><TaskForm initial={editing} onSave={saveTask} onCancel={() => setEditing(null)} courses={savedCourses} /></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {manualDisplayed.length > 0 && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:3, height:16, background:"var(--accent)", borderRadius:2 }} />
                <span style={{ fontSize:13, fontWeight:700, color:"var(--primary)", fontFamily:"'DM Sans',sans-serif" }}>My Tasks</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {manualDisplayed.map((t, i) => (
                  <div key={t.id} className="tm-anim" style={{ animationDelay: `${(syllabusDisplayed.length + i) * 0.05}s` }}>
                    <TaskRow task={t} onToggle={toggleDone} onDelete={deleteTask} onEdit={task => { setEditing(prev => prev?.id === task.id ? null : task); setComposing(false); }} />
                    {editing?.id === t.id && <div style={{marginTop:5}}><TaskForm initial={editing} onSave={saveTask} onCancel={() => setEditing(null)} courses={savedCourses} /></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}

        {undoSyllabus && (
            <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"var(--primary)", color:"white", borderRadius:14, padding:"12px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 24px rgba(49,72,122,0.28)", zIndex:9999, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
              <span style={{ fontSize:13 }}>Syllabus task deleted</span>
              <button onClick={undoDelete} style={{ background:"white", color:"var(--primary)", border:"none", borderRadius:8, padding:"5px 14px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Undo</button>
              <button onClick={() => { clearTimeout(undoSyllabus.timer); setUndoSyllabus(null); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.6)", fontSize:16, cursor:"pointer", padding:"0 2px", lineHeight:1 }}>✕</button>
            </div>
        )}
      </div>
  );
}

const tm = {
  formCard:  { background:"var(--surface)", borderRadius:18, padding:"24px 26px", border:"1px solid var(--border)", boxShadow:"0 4px 20px rgba(49,72,122,0.09)", marginBottom:0 },
  label:     { display:"block", fontSize:12, fontWeight:600, color:"var(--text)", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", marginBottom:14, display:"block", transition:"border-color .15s", outline:"none" },
  saveBtn:   { padding:"10px 24px", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"10px 18px", background:"var(--bg)", color:"var(--text2)", border:"1px solid var(--border)", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  newBtn:    { padding:"10px 20px", background:"var(--divider)", color:"var(--accent)", border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  iconBtn:   { background:"none", border:"none", cursor:"pointer", fontSize:15, borderRadius:6, padding:"3px 5px", transition:"background .15s" },
  badge:     (color, bg) => ({ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6, color, background:bg, flexShrink:0 }),
};