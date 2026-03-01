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
  { id:"high",   label:"High",   color:"#c0392b", bg:"#fef0f0", dot:"#e74c3c" },
  { id:"medium", label:"Medium", color:"#b7680a", bg:"#fef9ee", dot:"#f39c12" },
  { id:"low",    label:"Low",    color:"#2d7a4a", bg:"#eef7f0", dot:"#27ae60" },
];
const TYPES   = ["Assignment","Project","Quiz","Exam","Lab","Reading","Other"];
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

const EMPTY = { course:"", type:"Assignment", title:"", due:"", notes:"" };

function PriorityDot({ id }) {
  const p = priority(id);
  return <span style={{ width:8, height:8, borderRadius:"50%", background:p.dot, display:"inline-block", flexShrink:0 }} />;
}

function DueBadge({ due, done }) {
  if (!due) return null;
  const d = daysLeft(due);
  const over = isOverdue(due, done);
  if (done) return <span style={tm.badge("#2d7a4a","#eef7f0")}>✓ Done</span>;
  if (over)  return <span style={tm.badge("#c0392b","#fef0f0")}>Overdue</span>;
  if (d === 0) return <span style={tm.badge("#b7680a","#fef9ee")}>Due today</span>;
  if (d === 1) return <span style={tm.badge("#b7680a","#fef9ee")}>Due tomorrow</span>;
  if (d <= 3)  return <span style={tm.badge("#b7680a","#fef9ee")}>{d}d left</span>;
  return <span style={tm.badge("#5A3B7B","#F0EEF7")}>{d}d left</span>;
}

function TaskRow({ task, onToggle, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const p = priority(task.priority);
  const over = isOverdue(task.due, task.done);

  return (
      <div style={{
        background: task.done ? "#fafafa" : "#ffffff",
        border: `1px solid ${over && !task.done ? "#f5c6c6" : "#D4D4DC"}`,
        borderLeft: `3px solid ${task.done ? "#D4D4DC" : p.dot}`,
        borderRadius:12, padding:"13px 16px", transition:"box-shadow .15s",
        opacity: task.done ? 0.6 : 1,
      }} className="task-row">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => onToggle(task.id)} style={{
            width:20, height:20, borderRadius:6, border:`2px solid ${task.done?"#2d7a4a":"#D4D4DC"}`,
            background: task.done?"#2d7a4a":"white", cursor:"pointer", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s",
          }}>
            {task.done && <span style={{ color:"white", fontSize:11, lineHeight:1 }}>✓</span>}
          </button>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:600, color: task.done?"#B8A9C9":"#2a2050", textDecoration: task.done?"line-through":"none" }}>
              {task.title || <em style={{ color:"#B8A9C9" }}>Untitled task</em>}
            </span>
              <span style={{ fontSize:11, background:"#F0EEF7", color:"#7B5EA7", padding:"2px 8px", borderRadius:6, fontWeight:600, flexShrink:0 }}>{task.course}</span>
              <span style={{ fontSize:11, background:"#F4F4F8", color:"#A59AC9", padding:"2px 8px", borderRadius:6, flexShrink:0 }}>{task.type}</span>
              <DueBadge due={task.due} done={task.done} />
            </div>
            {task.due && (
                <div style={{ fontSize:11, color:"#B8A9C9", marginTop:3 }}>{fmt(task.due)}</div>
            )}
          </div>

          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button onClick={() => setExpanded(e=>!e)} style={tm.iconBtn} title="Notes">
              {task.notes ? <NotebookPen size={15} /> : <Notebook size={15} />}
            </button>
            <button onClick={() => onEdit(task)} style={tm.iconBtn} title="Edit"><Pencil size={15} /></button>
            <button onClick={() => onDelete(task.id)} style={{ ...tm.iconBtn, color:"#e07070" }} title="Delete">✕</button>
          </div>
        </div>

        {expanded && (
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #F4F4F8", fontSize:13, color:"#5A3B7B", lineHeight:1.6 }}>
              {task.notes || <span style={{ color:"#B8A9C9" }}>No notes added.</span>}
            </div>
        )}
      </div>
  );
}

function TaskForm({ initial, onSave, onCancel, backendError, courses = [] }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [err,  setErr]  = useState("");
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
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"#31487A", marginBottom:18 }}>
          {initial?.id ? "Edit Task" : "New Task"}
        </div>

        {err && <div style={{ background:"#fef0f0", border:"1px solid #f5c6c6", borderRadius:10, padding:"9px 14px", fontSize:13, color:"#c0392b", marginBottom:14 }}>{err}</div>}

        <label style={tm.label}>Task Title</label>
        <input value={form.title} onChange={e=>set("title",e.target.value)}
               placeholder="e.g. CMPS 271 — Lab 3 Report"
               style={tm.input} className="tm-input" />

        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:140 }}>
            <label style={tm.label}>Course</label>
            {courses.length > 0 ? (
              <select value={form.course} onChange={e=>set("course",e.target.value)} style={{ ...tm.input, cursor:"pointer" }}>
                <option value="">Select course…</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input value={form.course} onChange={e=>set("course",e.target.value)}
                     placeholder="e.g. CMPS 271"
                     style={tm.input} className="tm-input" />
            )}
          </div>
          <div style={{ flex:1, minWidth:140 }}>
            <label style={tm.label}>Type</label>
            <select value={form.type} onChange={e=>set("type",e.target.value)} style={{ ...tm.input, cursor:"pointer" }}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:2, minWidth:180 }}>
            <label style={tm.label}>Due Date & Time</label>
            <input type="datetime-local" value={form.due} onChange={e=>set("due",e.target.value)} style={{ ...tm.input, colorScheme:"light" }} className="tm-input" />
          </div>

        </div>

        <label style={tm.label}>Notes <span style={{ color:"#B8A9C9", fontWeight:400 }}>(optional)</span></label>
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)}
                  placeholder="Any extra details..."
                  rows={3}
                  style={{ ...tm.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
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

export default function TaskManager() {
  const [tasks,        setTasks]        = useState([]);
  const [filter,       setFilter]       = useState("All");
  const [search,       setSearch]       = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [composing,    setComposing]    = useState(false);
  const [editing,      setEditing]      = useState(null);

  const USER_ID = getUserId();

  const [allCourses,   setAllCourses]   = useState([]);
  const [savedCourses, setSavedCourses] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("kk_token");
    fetch(`${API_BASE}/api/grades/saved`, {
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const current = data[data.length - 1];
          const names = (current.courses || []).map(c => c.courseCode).filter(Boolean).sort();
          setSavedCourses(names);
        }
      })
      .catch(() => {});
  }, []);

  const loadTasks = useCallback(async () => {
    const data = await apiFetch(`/api/tasks/${USER_ID}/list-all`);
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
      const data = await apiFetch(`/api/tasks/${USER_ID}/search?keyword=${encodeURIComponent(search)}`);
      if (data) setTasks(data.map(t => ({ ...t, due: t.deadline, done: t.completed })));
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!courseFilter) { loadTasks(); return; }
    const fetchByCourse = async () => {
      const data = await apiFetch(`/api/tasks/${USER_ID}/list?course=${encodeURIComponent(courseFilter)}`);
      if (data) setTasks(data.map(t => ({ ...t, due: t.deadline, done: t.completed })));
    };
    fetchByCourse();
  }, [courseFilter]);

  const toggleDone = async id => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = await apiFetch(`/api/tasks/${USER_ID}/edit/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...task, completed: !task.done }),
    });
    if (updated) setTasks(p => p.map(t => t.id === id ? { ...updated, due: updated.deadline, done: updated.completed } : t));
  };

  const deleteTask = async id => {
    await apiFetch(`/api/tasks/${USER_ID}/delete/${id}`, { method: "DELETE" });
    setTasks(p => p.filter(t => t.id !== id));
  };

  const saveTask = async (task, onError) => {
    const isEdit = tasks.some(t => t.id === task.id);
    const payload = { title: task.title, course: task.course, type: task.type, deadline: task.due, notes: task.notes };
    if (isEdit) {
      const res = await fetch(`${API_BASE}/api/tasks/${USER_ID}/edit/${task.id}`, {
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
      const res = await fetch(`${API_BASE}/api/tasks/${USER_ID}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        const newTask = { ...created, due: created.deadline, done: created.completed };
        setTasks(p => [newTask, ...p]);
        if (created.course) setAllCourses(prev => [...new Set([...prev, created.course])].sort());
        setComposing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        if (onError) onError(data.message || "Failed to add task.");
      }
    }
  };

  let displayed = tasks
      .filter(t => {
        if (filter==="Pending") return !t.done;
        if (filter==="Done")    return t.done;
        if (filter==="Overdue") return isOverdue(t.due, t.done);
        return true;
      });



  const counts = {
    all:     tasks.length,
    pending: tasks.filter(t=>!t.done).length,
    done:    tasks.filter(t=>t.done).length,
    overdue: tasks.filter(t=>isOverdue(t.due,t.done)).length,
  };

  return (
      <div style={{ padding:"28px 28px 60px", maxWidth:860 }}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .tm-input:focus { border-color:#8FB3E2 !important; outline:none; }
        .task-row:hover { box-shadow:0 3px 16px rgba(49,72,122,0.1) !important; }
        .tm-icon-btn:hover { background:#F0EEF7 !important; }
      `}</style>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"#31487A", marginBottom:4 }}>Task Manager</div>
            <div style={{ fontSize:13, color:"#A59AC9" }}>
              {counts.pending} pending · {counts.overdue > 0 && <span style={{ color:"#c0392b", fontWeight:600 }}>{counts.overdue} overdue · </span>}{counts.done} done
            </div>
          </div>
          <button onClick={() => { setEditing(null); setComposing(true); }} style={tm.newBtn}>
            + New Task
          </button>
        </div>

        {(composing || editing) && (
            <TaskForm
                initial={editing}
                onSave={saveTask}
                onCancel={() => { setComposing(false); setEditing(null); }}
                courses={savedCourses}
            />
        )}

        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          {[
            { label:"All",     val:counts.all,     filter:"All"     },
            { label:"Pending", val:counts.pending, filter:"Pending" },
            { label:"Done",    val:counts.done,    filter:"Done"    },
            { label:"Overdue", val:counts.overdue, filter:"Overdue", warn:counts.overdue>0 },
          ].map(c => (
              <button key={c.filter} onClick={() => setFilter(c.filter)} style={{
                padding:"7px 16px", borderRadius:10, border:"1px solid",
                fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s",
                borderColor: filter===c.filter ? "#31487A" : "#D4D4DC",
                background:  filter===c.filter ? "#31487A" : "#ffffff",
                color:       filter===c.filter ? "#ffffff" : c.warn?"#c0392b":"#A59AC9",
              }}>
                {c.label} <span style={{ opacity:.7 }}>{c.val}</span>
              </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", background:"#ffffff", border:"1px solid #D4D4DC", borderRadius:12, padding:"8px 14px", flex:"1 1 200px", maxWidth:300 }}>
            <Search size={15} style={{ color:"#B8A9C9", marginRight:8, flexShrink:0 }} />
            <input value={search} onChange={e => { setCourseFilter(""); setSearch(e.target.value); }} placeholder="Search tasks…"
                   className="tm-input"
                   style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", background:"#ffffff", border:"1px solid #D4D4DC", borderRadius:12, padding:"8px 14px", flex:"1 1 160px", maxWidth:200 }}>
            <select value={courseFilter} onChange={e => { setSearch(""); setCourseFilter(e.target.value); }}
                    style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color: courseFilter ? "#2a2050" : "#B8A9C9", width:"100%", fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
              <option value="">All Courses</option>
              {allCourses.map(c => (
                  <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>


        {displayed.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#B8A9C9" }}>
              <div style={{ marginBottom:12 }}><ListChecks size={40} color="#B8A9C9" /></div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"#31487A" }}>
                {filter==="Done" ? "No completed tasks yet." : filter==="Overdue" ? "Nothing overdue!" : "No tasks found."}
              </div>
              {filter==="All" && <div style={{ fontSize:13, marginTop:6 }}>Hit "+ New Task" to add one.</div>}
            </div>
        ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {displayed.map(t => (
                  <TaskRow key={t.id} task={t}
                           onToggle={toggleDone}
                           onDelete={deleteTask}
                           onEdit={task => { setEditing(task); setComposing(false); }}
                  />
              ))}
            </div>
        )}
      </div>
  );
}

const tm = {
  formCard:  { background:"#ffffff", borderRadius:18, padding:"24px 26px", border:"1px solid #D4D4DC", boxShadow:"0 4px 20px rgba(49,72,122,0.09)", marginBottom:20 },
  label:     { display:"block", fontSize:12, fontWeight:600, color:"#2a2050", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#F7F5FB", marginBottom:14, display:"block", transition:"border-color .15s", outline:"none" },
  saveBtn:   { padding:"10px 24px", background:"#31487A", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"10px 18px", background:"#F4F4F8", color:"#A59AC9", border:"1px solid #D4D4DC", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  newBtn:    { padding:"10px 20px", background:"#7B5EA7", color:"white", border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  iconBtn:   { background:"none", border:"none", cursor:"pointer", fontSize:15, borderRadius:6, padding:"3px 5px", transition:"background .15s" },
  badge:     (color, bg) => ({ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6, color, background:bg, flexShrink:0 }),
};