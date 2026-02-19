import { useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITIES = [
  { id:"high",   label:"High",   color:"#c0392b", bg:"#fef0f0", dot:"#e74c3c" },
  { id:"medium", label:"Medium", color:"#b7680a", bg:"#fef9ee", dot:"#f39c12" },
  { id:"low",    label:"Low",    color:"#2d7a4a", bg:"#eef7f0", dot:"#27ae60" },
];
const TYPES   = ["Assignment","Project","Quiz","Exam","Lab","Reading","Other"];
const COURSES = ["CMPS 271","PHIL 210","CMPS 215","PSYC 222","PSYC 284","Other"];
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
  const diff = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return diff;
};

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY = { course:"CMPS 271", type:"Assignment", title:"", due:"", priority:"medium", notes:"" };

// ── Sub-components ────────────────────────────────────────────────────────────
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
        {/* checkbox */}
        <button onClick={() => onToggle(task.id)} style={{
          width:20, height:20, borderRadius:6, border:`2px solid ${task.done?"#2d7a4a":"#D4D4DC"}`,
          background: task.done?"#2d7a4a":"white", cursor:"pointer", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s",
        }}>
          {task.done && <span style={{ color:"white", fontSize:11, lineHeight:1 }}>✓</span>}
        </button>

        {/* title + meta */}
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

        {/* actions */}
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button onClick={() => setExpanded(e=>!e)} style={tm.iconBtn} title="Notes">
            {task.notes ? "📝" : "💬"}
          </button>
          <button onClick={() => onEdit(task)} style={tm.iconBtn} title="Edit">✏️</button>
          <button onClick={() => onDelete(task.id)} style={{ ...tm.iconBtn, color:"#e07070" }} title="Delete">✕</button>
        </div>
      </div>

      {/* expanded notes */}
      {expanded && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #F4F4F8", fontSize:13, color:"#5A3B7B", lineHeight:1.6 }}>
          {task.notes || <span style={{ color:"#B8A9C9" }}>No notes added.</span>}
        </div>
      )}
    </div>
  );
}

function TaskForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [err,  setErr]  = useState("");
  const set = (k, v) => { setForm(p => ({ ...p, [k]:v })); setErr(""); };

  const save = () => {
    if (!form.title.trim()) { setErr("Please enter a task title."); return; }
    // TODO: replace with API call → POST /api/tasks (new) or PUT /api/tasks/:id (edit)
    // body: { ...form }  →  response: { task: { id, ...form } }
    onSave({ ...form, id: initial?.id || Date.now(), done: initial?.done || false });
  };

  return (
    <div style={tm.formCard}>
      <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"#31487A", marginBottom:18 }}>
        {initial?.id ? "Edit Task" : "New Task"}
      </div>

      {err && <div style={{ background:"#fef0f0", border:"1px solid #f5c6c6", borderRadius:10, padding:"9px 14px", fontSize:13, color:"#c0392b", marginBottom:14 }}>{err}</div>}

      {/* Title */}
      <label style={tm.label}>Task Title</label>
      <input value={form.title} onChange={e=>set("title",e.target.value)}
        placeholder="e.g. CMPS 271 — Lab 3 Report"
        style={tm.input} className="tm-input" />

      {/* Row: course + type */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:140 }}>
          <label style={tm.label}>Course</label>
          <select value={form.course} onChange={e=>set("course",e.target.value)} style={{ ...tm.input, cursor:"pointer" }}>
            {COURSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex:1, minWidth:140 }}>
          <label style={tm.label}>Type</label>
          <select value={form.type} onChange={e=>set("type",e.target.value)} style={{ ...tm.input, cursor:"pointer" }}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Row: due + priority */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <div style={{ flex:2, minWidth:180 }}>
          <label style={tm.label}>Due Date & Time</label>
          <input type="datetime-local" value={form.due} onChange={e=>set("due",e.target.value)} style={{ ...tm.input, colorScheme:"light" }} className="tm-input" />
        </div>
        <div style={{ flex:1, minWidth:130 }}>
          <label style={tm.label}>Priority</label>
          <select value={form.priority} onChange={e=>set("priority",e.target.value)} style={{ ...tm.input, cursor:"pointer" }}>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Notes */}
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

// ── Main TaskManager page ─────────────────────────────────────────────────────
export default function TaskManager() {
  const [tasks,     setTasks]     = useState([
    { id:1, course:"CMPS 271", type:"Lab",        title:"Lab 3 Report",          due:"2026-02-25T23:59", priority:"high",   notes:"Submit to Moodle. Include screenshots of output.", done:false },
    { id:2, course:"PHIL 210", type:"Reading",    title:"Read Chapters 4–5",     due:"2026-02-22T12:00", priority:"medium", notes:"Focus on the argument structure in Ch. 5.",         done:false },
    { id:3, course:"PSYC 222", type:"Assignment", title:"Reflection Paper",      due:"2026-02-20T23:59", priority:"high",   notes:"800–1000 words. APA format.",                       done:false },
    { id:4, course:"CMPS 215", type:"Quiz",       title:"Quiz 2 — Pointers",     due:"2026-02-21T11:00", priority:"high",   notes:"",                                                  done:false },
    { id:5, course:"PSYC 284", type:"Project",    title:"Group Presentation",    due:"2026-03-10T14:00", priority:"medium", notes:"Slides due one week before.",                       done:false },
    { id:6, course:"PHIL 210", type:"Assignment", title:"Short Essay Draft",     due:"2026-02-15T23:59", priority:"low",    notes:"",                                                  done:true  },
  ]);
  const [filter,    setFilter]    = useState("All");
  const [search,    setSearch]    = useState("");
  const [sortBy,    setSortBy]    = useState("due");   // "due" | "priority" | "course"
  const [composing, setComposing] = useState(false);
  const [editing,   setEditing]   = useState(null);

  // ── CRUD stubs ──
  const toggleDone = id => {
    // TODO: PUT /api/tasks/:id/toggle
    setTasks(p => p.map(t => t.id===id ? {...t, done:!t.done} : t));
  };
  const deleteTask = id => {
    // TODO: DELETE /api/tasks/:id
    setTasks(p => p.filter(t => t.id!==id));
  };
  const saveTask = task => {
    // TODO: POST /api/tasks  or  PUT /api/tasks/:id
    setTasks(p => p.some(t=>t.id===task.id) ? p.map(t=>t.id===task.id?task:t) : [task,...p]);
    setComposing(false);
    setEditing(null);
  };

  // ── filter + sort ──
  const PRIO_ORDER = { high:0, medium:1, low:2 };
  let displayed = tasks
    .filter(t => {
      if (filter==="Pending") return !t.done;
      if (filter==="Done")    return t.done;
      if (filter==="Overdue") return isOverdue(t.due, t.done);
      return true;
    })
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.course.toLowerCase().includes(search.toLowerCase()));

  displayed = [...displayed].sort((a,b) => {
    if (sortBy==="priority") return PRIO_ORDER[a.priority]-PRIO_ORDER[b.priority];
    if (sortBy==="course")   return a.course.localeCompare(b.course);
    // due: undated last, overdue first
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return new Date(a.due) - new Date(b.due);
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

      {/* Header */}
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

      {/* Compose / Edit form */}
      {(composing || editing) && (
        <TaskForm
          initial={editing}
          onSave={saveTask}
          onCancel={() => { setComposing(false); setEditing(null); }}
        />
      )}

      {/* Stat chips */}
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

      {/* Controls */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", background:"#ffffff", border:"1px solid #D4D4DC", borderRadius:12, padding:"8px 14px", flex:"1 1 200px", maxWidth:300 }}>
          <span style={{ color:"#B8A9C9", marginRight:8 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…"
            className="tm-input"
            style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#A59AC9" }}>
          <span>Sort:</span>
          {[{id:"due",label:"Due Date"},{id:"priority",label:"Priority"},{id:"course",label:"Course"}].map(s => (
            <button key={s.id} onClick={()=>setSortBy(s.id)} style={{
              padding:"6px 12px", borderRadius:8, border:"1px solid", cursor:"pointer", fontSize:12,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, transition:"all .15s",
              borderColor: sortBy===s.id?"#31487A":"#D4D4DC",
              background:  sortBy===s.id?"#31487A":"#ffffff",
              color:       sortBy===s.id?"#ffffff":"#A59AC9",
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {displayed.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#B8A9C9" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
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

// ── Styles ────────────────────────────────────────────────────────────────────
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
