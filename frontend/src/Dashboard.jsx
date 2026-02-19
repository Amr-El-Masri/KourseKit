import { useState, useRef, useEffect } from "react";

// ── Anon names ───────────────────────────────────────────────────────────────
const ANON_NAMES = [
  "Apple","Blueberry","Cherry","Elderberry","Fig","Grape","Honeydew","Kiwi",
  "Lemon","Mango","Nectarine","Papaya","Pineapple","Raspberry","Strawberry",
  "Starfruit","Tangerine","Watermelon","Bazella","Koussa","Batata 7arra",
  "Kafta","Tawouk","Shawarma","Falafel","Hummus","Tabbouleh","Fattoush",
  "Labneh","Man2oushe","Knefeh","Baklewa","Maamoul","Qatayef","Matte",
  "Sa7lab","Shish Barak","Loubyeh","Mloukhiyye","Wara2 3enab","Mjaddara",
  "Kibbeh","Sambousek","Fatteh","Zaatar","Sfee7a","Jibneh","Bemye","Makloubeh",
];
const randomAnon = () => ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];

// ── Semester data ─────────────────────────────────────────────────────────────
const SEMESTERS = {
  "Fall 24-25":   { gpa: 3.67, progress: 100, week: "15 of 15", courses: [
    { id:1, name:"CMPS 271", prof:"Dr. Mohammad Sakr",        time:"Mon & Wed · 12:30–13:45" },
    { id:2, name:"PHIL 210", prof:"Mr. Mahmoud El Hassanieh", time:"Mon & Wed · 14:00–15:15" },
    { id:3, name:"CMPS 215", prof:"Dr. Mohammad A. Kobeissi", time:"Mon & Wed · 15:30–16:45" },
    { id:4, name:"PSYC 222", prof:"Dr. Arne Dietrich",        time:"Tue & Thu · 9:30–10:45"  },
    { id:5, name:"PSYC 284", prof:"Dr. Sarine Hagopian",      time:"Tue & Thu · 14:00–15:15" },
  ]},
  "Spring 24-25": { gpa: 3.45, progress: 40, week: "6 of 15", courses: [
    { id:1, name:"CMPS 300", prof:"Dr. Ayman Dayeh",    time:"Mon & Wed · 11:00–12:15" },
    { id:2, name:"MATH 201", prof:"Dr. Samer Habre",    time:"Mon & Wed · 14:00–15:15" },
    { id:3, name:"ENGL 203", prof:"Ms. Lara Khouri",    time:"Tue & Thu · 9:30–10:45"  },
    { id:4, name:"CMPS 256", prof:"Dr. Wassim El-Hajj", time:"Tue & Thu · 11:00–12:15" },
  ]},
  "Fall 25-26":   { gpa: null, progress: 0, week: "0 of 15", courses: [] },
};

const PROF_REVIEWS = [
  { id:1, name:randomAnon(), stars:4, text:"Lectures were genuinely interesting, but the workload was intense and exams were hard. 3al 2aleele you learn a lot — if he's giving it I recommend." },
  { id:2, name:randomAnon(), stars:3, text:"He rushes too much and erases before everyone finishes writing, but explains really well — you just have to keep up (w the course aslan ktir sa3eb)." },
];
const COURSE_REVIEWS = [
  { id:1, name:randomAnon(), stars:5, text:"Super interesting course, genuinely highly recommend — and it's only given annually fa traw7ou 3alaykon." },
  { id:2, name:randomAnon(), stars:3, text:"I found it interesting bas ken lezem ykoon elective, and it had heavier workload than it should've had." },
];

const DAYS_OF_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const EVENT_TYPES  = [
  { label:"Class",   color:"#31487A", bg:"#eef2fb" },
  { label:"Gym",     color:"#2d7a4a", bg:"#eef7f0" },
  { label:"Study",   color:"#5A3B7B", bg:"#F0EEF7" },
  { label:"Meeting", color:"#6b2d7a", bg:"#f5eefb" },
  { label:"Other",   color:"#555",    bg:"#f5f5f5" },
];

// ── Widget registry — controls the toggle panel ──────────────────────────────
const ALL_WIDGETS = [
  { id:"courses",   label:"My Courses",        span:2 },
  { id:"gpa",       label:"GPA",               span:1 },
  { id:"progress",  label:"Semester Progress", span:1 },
  { id:"todo",      label:"To-Do List",        span:1 },
  { id:"calendar",  label:"Calendar",          span:1 },
  { id:"schedule",  label:"Weekly Schedule",   span:1 },
  { id:"profrev",   label:"Professor Reviews", span:2 },
  { id:"courserev", label:"Course Reviews",    span:2 },
];

const Stars = ({ count }) => (
  <span style={{ color:"#A59AC9", fontSize:13 }}>
    {"★".repeat(count)}{"☆".repeat(5-count)}
  </span>
);

const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard",        icon:"⊞" },
  { id:"grades",    label:"Grade Calculator", icon:"📊" },
  { id:"tasks",     label:"Task Manager",     icon:"✅" },
  { id:"reviews",   label:"Reviews",          icon:"💬" },
];

// ── Custom semester dropdown ──────────────────────────────────────────────────
function SemesterSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)} style={sd.trigger}>
        <span style={{ fontSize:14 }}>📅</span>
        <span style={{ fontWeight:600, color:"#31487A", fontSize:13 }}>{value}</span>
        <span style={{ color:"#A59AC9", fontSize:11, transition:"transform .2s", display:"inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      {open && (
        <div style={sd.dropdown}>
          {Object.keys(SEMESTERS).map(sem => (
            <div key={sem} onClick={() => { onChange(sem); setOpen(false); }}
              style={{ ...sd.option, background: sem === value ? "#F0EEF7" : "transparent", color: sem === value ? "#31487A" : "#4a3a6a", fontWeight: sem === value ? 600 : 400 }}>
              {sem === value && <span style={{ color:"#7B5EA7", marginRight:8, fontSize:12 }}>✓</span>}
              {sem}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Widget toggle panel ───────────────────────────────────────────────────────
function WidgetTogglePanel({ visible, onToggle }) {
  return (
    <div style={sd.togglePanel}>
      <div style={{ fontSize:12, fontWeight:700, color:"#A59AC9", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Widgets</div>
      {ALL_WIDGETS.map(w => (
        <div key={w.id} onClick={() => onToggle(w.id)}
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:8, marginBottom:4, cursor:"pointer", background: visible[w.id] ? "#F0EEF7" : "transparent", transition:"background .15s" }}>
          <span style={{ fontSize:13, color: visible[w.id] ? "#31487A" : "#A59AC9" }}>{w.label}</span>
          <div style={{ width:32, height:18, borderRadius:9, background: visible[w.id] ? "#7B5EA7" : "#D4D4DC", position:"relative", transition:"background .2s" }}>
            <div style={{ position:"absolute", top:2, left: visible[w.id] ? 16 : 2, width:14, height:14, borderRadius:"50%", background:"white", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function Dashboard({ onLogout }) {
  const email = localStorage.getItem("kk_email") || "student@mail.aub.edu";

  const [activePage,    setActivePage]    = useState("dashboard");
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [semester,      setSemester]      = useState("Spring 24-25");
  const [showToggle,    setShowToggle]    = useState(false);
  const toggleRef = useRef(null);

  // widget visibility
  const [visible, setVisible] = useState(
    Object.fromEntries(ALL_WIDGETS.map(w => [w.id, true]))
  );
  const toggleWidget = id => setVisible(v => ({ ...v, [id]: !v[id] }));

  // close toggle panel on outside click
  useEffect(() => {
    const h = e => { if (toggleRef.current && !toggleRef.current.contains(e.target)) setShowToggle(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // todos
  const [todos,     setTodos]     = useState([]);
  const [todoInput, setTodoInput] = useState("");

  // calendar
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // schedule
  const [scheduleEvents, setScheduleEvents] = useState([
    { id:1, day:"Mon", label:"CMPS 271", time:"12:30–13:45", type:"Class" },
    { id:2, day:"Wed", label:"CMPS 271", time:"12:30–13:45", type:"Class" },
    { id:3, day:"Tue", label:"Gym",      time:"7:00–8:30",   type:"Gym"   },
    { id:4, day:"Thu", label:"Study",    time:"16:00–18:00", type:"Study" },
  ]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ day:"Mon", label:"", time:"", type:"Class" });

  const semData = SEMESTERS[semester];

  const addTodo    = () => { if (!todoInput.trim()) return; setTodos(p => [...p, { id:Date.now(), text:todoInput.trim(), done:false }]); setTodoInput(""); };
  const toggleTodo = id => setTodos(p => p.map(t => t.id===id ? {...t,done:!t.done} : t));
  const deleteTodo = id => setTodos(p => p.filter(t => t.id!==id));
  const addEvent   = () => { if (!newEvent.label.trim()) return; setScheduleEvents(p => [...p,{...newEvent,id:Date.now()}]); setNewEvent({day:"Mon",label:"",time:"",type:"Class"}); setShowAddEvent(false); };
  const deleteEvent= id => setScheduleEvents(p => p.filter(e => e.id!==id));

  const monthName   = new Date(calYear, calMonth).toLocaleString("en-US",{month:"long"});
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const startOffset = (new Date(calYear,calMonth,1).getDay()+6)%7;
  const calCells    = [...Array(startOffset).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const isToday     = d => d===today.getDate() && calMonth===today.getMonth() && calYear===today.getFullYear();
  const prevMonth   = () => calMonth===0  ? (setCalMonth(11),setCalYear(y=>y-1)) : setCalMonth(m=>m-1);
  const nextMonth   = () => calMonth===11 ? (setCalMonth(0), setCalYear(y=>y+1)) : setCalMonth(m=>m+1);

  const handleLogout = () => { localStorage.removeItem("kk_token"); localStorage.removeItem("kk_email"); onLogout(); };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:#F4F4F8; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#8FB3E2; border-radius:10px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .card-anim { animation:fadeUp .38s ease both; }
        .card-anim:nth-child(2){animation-delay:.06s} .card-anim:nth-child(3){animation-delay:.12s}
        .card-anim:nth-child(4){animation-delay:.18s} .card-anim:nth-child(5){animation-delay:.24s}
        .card-anim:nth-child(6){animation-delay:.30s} .card-anim:nth-child(7){animation-delay:.36s}
        .card-anim:nth-child(8){animation-delay:.42s}
        .nav-btn { transition:background .15s,color .15s; cursor:pointer; }
        .nav-btn:hover { background:rgba(255,255,255,0.12) !important; }
        .course-card { transition:transform .2s,box-shadow .2s; cursor:pointer; }
        .course-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(49,72,122,0.18) !important; }
        .todo-row { transition:background .15s; }
        .todo-row:hover { background:#D9E1F1 !important; }
        .add-btn:hover { background:#221866 !important; }
        .add-btn { transition:background .15s; }
        .cal-day:hover { background:#D9E1F1 !important; border-radius:6px; }
        .toggle-opt:hover { background:#F0EEF7; }
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <aside style={{ ...s.sidebar, width:sidebarOpen ? 224 : 66 }}>
        <div style={s.sidebarTop}>
          <div style={s.logoMark}>K</div>
          {sidebarOpen && <span style={s.logoLabel}>KourseKit</span>}
        </div>
        {sidebarOpen && (
          <div style={s.userPill}>
            <div style={s.avatar}>{email[0].toUpperCase()}</div>
            <div>
              <div style={{fontWeight:600,fontSize:13,color:"#D9E1F1"}}>Student</div>
              <div style={{fontSize:11,color:"#B8A9C9",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{email}</div>
            </div>
          </div>
        )}
        <nav style={{flex:1,paddingTop:10}}>
          {NAV_ITEMS.map(item => (
            <div key={item.id} className="nav-btn" onClick={() => setActivePage(item.id)} style={{
              display:"flex", alignItems:"center", padding:"10px 16px", margin:"2px 8px", borderRadius:10,
              justifyContent:sidebarOpen?"flex-start":"center",
              background:activePage===item.id?"rgba(255,255,255,0.15)":"transparent",
              color:activePage===item.id?"#ffffff":"#B8A9C9",
              fontWeight:activePage===item.id?600:400, userSelect:"none", position:"relative",
            }}>
              <span style={{fontSize:17,minWidth:22,textAlign:"center"}}>{item.icon}</span>
              {sidebarOpen && <span style={{marginLeft:10,fontSize:14}}>{item.label}</span>}
              {sidebarOpen && activePage===item.id && <span style={{position:"absolute",right:14,width:6,height:6,borderRadius:"50%",background:"#7B5EA7"}} />}
            </div>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(o=>!o)} style={s.collapseBtn}>{sidebarOpen?"◀":"▶"}</button>
        <div className="nav-btn" onClick={handleLogout} style={{display:"flex",alignItems:"center",padding:"10px 16px",margin:"2px 8px 14px",borderRadius:10,color:"#e07070",justifyContent:sidebarOpen?"flex-start":"center",cursor:"pointer",userSelect:"none"}}>
          <span style={{fontSize:17,minWidth:22,textAlign:"center"}}>⏻</span>
          {sidebarOpen && <span style={{marginLeft:10,fontSize:14}}>Log out</span>}
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main style={s.main}>
        <header style={s.topbar}>
          <div>
            <div style={s.greeting}>Hello, <span style={{fontFamily:"'Fraunces',serif",fontStyle:"italic",color:"#31487A"}}>Student!</span> 👋</div>
            <div style={{fontSize:13,color:"#5A3B7B",marginTop:2}}>{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
          </div>

          {/* Semester switcher — ONLY on dashboard */}
          {activePage === "dashboard" && (
            <SemesterSelect value={semester} onChange={setSemester} />
          )}

          <div style={s.searchWrap}>
            <span style={{color:"#B8A9C9",marginRight:8}}>🔍</span>
            <input placeholder="Search…" style={s.searchInput} />
          </div>

          {/* Widget toggle — ONLY on dashboard */}
          {activePage === "dashboard" && (
            <div ref={toggleRef} style={{position:"relative"}}>
              <button onClick={() => setShowToggle(o=>!o)} style={sd.toggleBtn} title="Customize widgets">
                ⚙️ <span style={{fontSize:12,fontWeight:600,color:"#31487A",marginLeft:4}}>Widgets</span>
              </button>
              {showToggle && <WidgetTogglePanel visible={visible} onToggle={toggleWidget} />}
            </div>
          )}

          <div style={s.bell}>🔔</div>
        </header>

        {/* ══ DASHBOARD PAGE ══ */}
        {activePage === "dashboard" && (
          <div style={s.grid}>

            {visible.courses && (
              <section className="card-anim" style={{...s.card, gridColumn:"span 2"}}>
                <SectionTitle>My Courses — {semester}</SectionTitle>
                {semData.courses.length === 0
                  ? <div style={{fontSize:13,color:"#B8A9C9",marginTop:16,textAlign:"center",padding:"20px 0"}}>No courses registered for this semester yet.</div>
                  : <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:14}}>
                      {semData.courses.map(c => (
                        <div key={c.id} className="course-card" style={s.courseCard}>
                          <div style={{fontWeight:700,fontSize:15,color:"#31487A",marginBottom:4}}>{c.name}</div>
                          <div style={{fontSize:12,color:"#5A3B7B",marginBottom:3}}>{c.prof}</div>
                          <div style={{fontSize:11,color:"#8FB3E2"}}>{c.time}</div>
                        </div>
                      ))}
                    </div>
                }
              </section>
            )}

            {visible.gpa && (
              <section className="card-anim" style={s.card}>
                <SectionTitle>GPA — {semester}</SectionTitle>
                <div style={{textAlign:"center",padding:"14px 0 6px"}}>
                  {semData.gpa ? (
                    <>
                      <div style={{fontFamily:"'Fraunces',serif",fontSize:56,fontWeight:700,color:"#31487A",lineHeight:1}}>{semData.gpa.toFixed(2)}</div>
                      <div style={{fontSize:12,color:"#5A3B7B",marginTop:8}}>Semester GPA</div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginTop:12}}>
                        <svg viewBox="0 0 60 60" width="80" height="80">
                          <circle cx="30" cy="30" r="24" fill="none" stroke="#D9E1F1" strokeWidth="6"/>
                          <circle cx="30" cy="30" r="24" fill="none" stroke="#8FB3E2" strokeWidth="6"
                            strokeDasharray={`${(semData.gpa/4)*150.8} 150.8`} strokeLinecap="round" transform="rotate(-90 30 30)"/>
                        </svg>
                        <div style={{fontSize:11,color:"#B8A9C9",marginTop:-2}}>of 4.0</div>
                      </div>
                    </>
                  ) : (
                    <div style={{fontSize:13,color:"#B8A9C9",padding:"30px 0"}}>GPA not yet available for this semester</div>
                  )}
                </div>
              </section>
            )}

            {visible.progress && (
              <section className="card-anim" style={s.card}>
                <SectionTitle>Semester Progress</SectionTitle>
                <div style={{marginTop:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8,color:"#5A3B7B"}}>
                    <span>Completion</span>
                    <span style={{fontWeight:600,color:"#31487A"}}>{semData.progress}%</span>
                  </div>
                  <div style={s.progressTrack}><div style={{...s.progressFill,width:`${semData.progress}%`}} /></div>
                  <div style={{fontSize:12,color:"#B8A9C9",marginTop:10}}>Week {semData.week}</div>
                </div>
                <div style={{marginTop:18,display:"flex",gap:10}}>
                  {[{label:"Courses",val:semData.courses.length||"—"},{label:"Progress",val:`${semData.progress}%`},{label:"To-Do",val:todos.filter(t=>!t.done).length}].map(chip=>(
                    <div key={chip.label} style={s.chip}>
                      <div style={{fontSize:11,color:"#A59AC9"}}>{chip.label}</div>
                      <div style={{fontWeight:600,fontSize:13,color:"#31487A"}}>{chip.val}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {visible.todo && (
              <section className="card-anim" style={s.card}>
                <SectionTitle>To-Do List</SectionTitle>
                <div style={{display:"flex",gap:8,marginTop:14}}>
                  <input value={todoInput} onChange={e=>setTodoInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="Add a task…" style={s.todoInput}/>
                  <button className="add-btn" onClick={addTodo} style={s.addBtn}>+</button>
                </div>
                <div style={{marginTop:10,maxHeight:160,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
                  {todos.length===0 && <div style={{fontSize:13,color:"#B8A9C9",textAlign:"center",padding:"16px 0"}}>No tasks yet!</div>}
                  {todos.map(t=>(
                    <div key={t.id} className="todo-row" style={s.todoRow}>
                      <span onClick={()=>toggleTodo(t.id)} style={{fontSize:13,flex:1,cursor:"pointer",textDecoration:t.done?"line-through":"none",color:t.done?"#B8A9C9":"#2a2050"}}>
                        {t.done?"✅":"⬜"} {t.text}
                      </span>
                      <button onClick={()=>deleteTodo(t.id)} style={{background:"none",border:"none",color:"#B8A9C9",cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {visible.calendar && (
              <section className="card-anim" style={s.card}>
                <SectionTitle>Calendar</SectionTitle>
                <div style={{marginTop:14}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <button onClick={prevMonth} style={s.calNavBtn}>‹</button>
                    <span style={{fontWeight:600,fontSize:14,color:"#31487A"}}>{monthName} {calYear}</span>
                    <button onClick={nextMonth} style={s.calNavBtn}>›</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                    {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=>(
                      <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#B8A9C9",padding:"2px 0"}}>{d}</div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                    {calCells.map((d,i)=>(
                      <div key={i} className={d?"cal-day":""} style={{height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,borderRadius:6,cursor:d?"pointer":"default",background:isToday(d)?"#31487A":"transparent",color:isToday(d)?"#fff":d?"#2a2050":"transparent",fontWeight:isToday(d)?700:400}}>
                        {d||""}
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:10,fontSize:11,color:"#B8A9C9",textAlign:"center"}}>Today is {today.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                </div>
              </section>
            )}

            {visible.schedule && (
              <section className="card-anim" style={s.card}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <SectionTitle>Weekly Schedule</SectionTitle>
                  <button onClick={()=>setShowAddEvent(o=>!o)} style={sd.smallAddBtn}>{showAddEvent?"✕ Cancel":"+ Add Event"}</button>
                </div>
                {showAddEvent && (
                  <div style={sd.addEventForm}>
                    <select value={newEvent.day} onChange={e=>setNewEvent(p=>({...p,day:e.target.value}))} style={sd.miniSelect}>
                      {DAYS_OF_WEEK.map(d=><option key={d}>{d}</option>)}
                    </select>
                    <input placeholder="Label" value={newEvent.label} onChange={e=>setNewEvent(p=>({...p,label:e.target.value}))} style={{...sd.miniInput,flex:2}}/>
                    <input placeholder="Time (e.g. 9:00–10:00)" value={newEvent.time} onChange={e=>setNewEvent(p=>({...p,time:e.target.value}))} style={{...sd.miniInput,flex:2}}/>
                    <select value={newEvent.type} onChange={e=>setNewEvent(p=>({...p,type:e.target.value}))} style={sd.miniSelect}>
                      {EVENT_TYPES.map(t=><option key={t.label}>{t.label}</option>)}
                    </select>
                    <button onClick={addEvent} style={sd.miniSaveBtn}>Save</button>
                  </div>
                )}
                <div style={{maxHeight:240,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
                  {DAYS_OF_WEEK.map(day => {
                    const evts = scheduleEvents.filter(e=>e.day===day);
                    if (!evts.length) return null;
                    return (
                      <div key={day}>
                        <div style={{fontSize:11,fontWeight:700,color:"#8FB3E2",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{day}</div>
                        {evts.map(ev => {
                          const tc = EVENT_TYPES.find(t=>t.label===ev.type)||EVENT_TYPES[4];
                          return (
                            <div key={ev.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",borderRadius:8,marginBottom:4,background:tc.bg,borderLeft:`3px solid ${tc.color}`}}>
                              <div>
                                <span style={{fontSize:13,fontWeight:600,color:tc.color}}>{ev.label}</span>
                                {ev.time && <span style={{fontSize:11,color:"#B8A9C9",marginLeft:8}}>{ev.time}</span>}
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <span style={{fontSize:10,background:tc.color+"22",color:tc.color,padding:"2px 6px",borderRadius:4}}>{ev.type}</span>
                                <button onClick={()=>deleteEvent(ev.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:11}}>✕</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  {scheduleEvents.length===0 && <div style={{fontSize:13,color:"#B8A9C9",textAlign:"center",padding:"16px 0"}}>No events yet!</div>}
                </div>
              </section>
            )}

            {visible.profrev && (
              <section className="card-anim" style={{...s.card,gridColumn:"span 2"}}>
                <SectionTitle>Professor Reviews</SectionTitle>
                <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:14}}>
                  {PROF_REVIEWS.map(r=>(
                    <div key={r.id} style={s.reviewCard}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontWeight:600,fontSize:13,color:"#31487A"}}>Anonymous {r.name}</span>
                        <Stars count={r.stars}/>
                      </div>
                      <p style={{fontSize:13,color:"#4a3a6a",lineHeight:1.6}}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {visible.courserev && (
              <section className="card-anim" style={{...s.card,gridColumn:"span 2"}}>
                <SectionTitle>Course Reviews</SectionTitle>
                <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:14}}>
                  {COURSE_REVIEWS.map(r=>(
                    <div key={r.id} style={s.reviewCard}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontWeight:600,fontSize:13,color:"#31487A"}}>Anonymous {r.name}</span>
                        <Stars count={r.stars}/>
                      </div>
                      <p style={{fontSize:13,color:"#4a3a6a",lineHeight:1.6}}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* ══ GRADE CALCULATOR PAGE ══ */}
        {activePage === "grades" && <GradeCalculator />}

        {activePage !== "dashboard" && activePage !== "grades" && (
          <div style={{padding:40,textAlign:"center",color:"#B8A9C9",marginTop:60}}>
            <div style={{fontSize:48,marginBottom:16}}>🚧</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:22,color:"#31487A"}}>{NAV_ITEMS.find(n=>n.id===activePage)?.label} coming soon!</div>
            <div style={{fontSize:13,marginTop:8}}>This page is next on the build list.</div>
          </div>
        )}
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GRADE CALCULATOR
// ════════════════════════════════════════════════════════════════════════════
function GradeCalculator() {
  const [activeTab, setActiveTab] = useState("semester");

  // ── Semester GPA ──
  const [semCourses, setSemCourses] = useState([{ id:1, name:"", grade:"", credits:"" }]);
  const [semResult,  setSemResult]  = useState(null);
  const gradeToPoint = g => ({ "A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0 }[g] ?? parseFloat(g));
  const calcSemGPA = () => {
    let pts=0, creds=0;
    semCourses.forEach(c => {
      const p=gradeToPoint(c.grade), cr=parseFloat(c.credits);
      if (!isNaN(p) && !isNaN(cr) && cr>0) { pts+=p*cr; creds+=cr; }
    });
    setSemResult(creds>0 ? (pts/creds).toFixed(2) : null);
  };

  // ── Cumulative GPA ──
  const [cumSems,   setCumSems]   = useState([{ id:1, name:"", gpa:"", credits:"" }]);
  const [cumResult, setCumResult] = useState(null);
  const calcCumGPA = () => {
    let pts=0, creds=0;
    cumSems.forEach(s => {
      const g=parseFloat(s.gpa), cr=parseFloat(s.credits);
      if (!isNaN(g) && !isNaN(cr) && cr>0) { pts+=g*cr; creds+=cr; }
    });
    setCumResult(creds>0 ? (pts/creds).toFixed(2) : null);
  };

  // ── Course grade ──
  const [components, setComponents] = useState([{ id:1, type:"Exam", weight:"", grade:"" }]);
  const [courseResult, setCourseResult] = useState(null);
  const calcCourse = () => {
    let total=0, wSum=0;
    components.forEach(c => {
      const w=parseFloat(c.weight), g=parseFloat(c.grade);
      if (!isNaN(w) && !isNaN(g)) { total+=w*g; wSum+=w; }
    });
    setCourseResult(wSum>0 ? (total/wSum).toFixed(2) : null);
  };

  // ── Target grade ──
  const [graded,     setGraded]     = useState([{ id:1, weight:"", grade:"" }]);
  const [targetGoal, setTargetGoal] = useState("");
  const [targetResult, setTargetResult] = useState(null);
  const calcTarget = () => {
    let earned=0, wUsed=0;
    graded.forEach(g => {
      const w=parseFloat(g.weight), gr=parseFloat(g.grade);
      if (!isNaN(w) && !isNaN(gr)) { earned+=w*gr; wUsed+=w; }
    });
    const goal=parseFloat(targetGoal);
    const remain=100-wUsed;
    if (remain<=0||isNaN(goal)) { setTargetResult("Please check weights add up to less than 100."); return; }
    const needed=(goal*100-earned)/remain;
    setTargetResult(needed>100 ? "Not achievable — needed grade > 100%." : needed<0 ? "You've already achieved this goal!" : `You need ${needed.toFixed(1)}% on the remaining ${remain}% of your grade.`);
  };

  const TABS = [
    { id:"semester", label:"Semester GPA"  },
    { id:"cumulative",label:"Cumulative GPA"},
    { id:"course",   label:"Course Grade"  },
    { id:"target",   label:"Target Grade"  },
  ];

  const addRow = (setter) => setter(p => [...p, { id:Date.now(), name:"", grade:"", credits:"", weight:"", type:"Exam", gpa:"" }]);
  const removeRow = (setter, id) => setter(p => p.length>1 ? p.filter(r=>r.id!==id) : p);
  const updateRow = (setter, id, field, val) => setter(p => p.map(r => r.id===id ? {...r,[field]:val} : r));

  return (
    <div style={{padding:"28px 28px 60px"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:24,color:"#31487A",marginBottom:4}}>Grade Calculator</div>
        <div style={{fontSize:13,color:"#A59AC9"}}>Calculate your GPA and plan your grades</div>
      </div>

      {/* Tabs */}
      <div style={gc.tabBar}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            ...gc.tab,
            background: activeTab===t.id ? "#31487A" : "transparent",
            color:       activeTab===t.id ? "#ffffff"  : "#A59AC9",
            fontWeight:  activeTab===t.id ? 600 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Semester GPA ── */}
      {activeTab==="semester" && (
        <div style={gc.card}>
          <SectionTitle>Current Semester GPA</SectionTitle>
          <div style={{marginTop:18}}>
            <div style={gc.headerRow}>
              <span style={gc.colHead}>Course Name</span>
              <span style={gc.colHead}>Grade</span>
              <span style={gc.colHead}>Credits</span>
              <span style={{width:32}}/>
            </div>
            {semCourses.map(c=>(
              <div key={c.id} style={gc.row}>
                <input value={c.name} onChange={e=>updateRow(setSemCourses,c.id,"name",e.target.value)} placeholder="e.g. CMPS 271" style={gc.input}/>
                <input value={c.grade} onChange={e=>updateRow(setSemCourses,c.id,"grade",e.target.value)} placeholder="e.g. 3.7 or A-" style={{...gc.input,maxWidth:110}}/>
                <input value={c.credits} onChange={e=>updateRow(setSemCourses,c.id,"credits",e.target.value)} placeholder="e.g. 3" type="number" style={{...gc.input,maxWidth:90}}/>
                <button onClick={()=>removeRow(setSemCourses,c.id)} style={gc.removeBtn}>✕</button>
              </div>
            ))}
            <button onClick={()=>addRow(setSemCourses)} style={gc.addRowBtn}>+ Add Course</button>
          </div>
          <div style={{display:"flex",gap:12,marginTop:20,alignItems:"center",flexWrap:"wrap"}}>
            <button onClick={calcSemGPA} style={gc.calcBtn}>Calculate GPA</button>
            {semResult && <ResultBadge value={semResult} label="Semester GPA" />}
          </div>
        </div>
      )}

      {/* ── Cumulative GPA ── */}
      {activeTab==="cumulative" && (
        <div style={gc.card}>
          <SectionTitle>Cumulative GPA</SectionTitle>
          <div style={{marginTop:18}}>
            <div style={gc.headerRow}>
              <span style={gc.colHead}>Semester</span>
              <span style={gc.colHead}>GPA</span>
              <span style={gc.colHead}>Credits</span>
              <span style={{width:32}}/>
            </div>
            {cumSems.map(c=>(
              <div key={c.id} style={gc.row}>
                <input value={c.name} onChange={e=>updateRow(setCumSems,c.id,"name",e.target.value)} placeholder="e.g. Fall 24-25" style={gc.input}/>
                <input value={c.gpa}  onChange={e=>updateRow(setCumSems,c.id,"gpa",e.target.value)}  placeholder="e.g. 3.67" type="number" step="0.01" style={{...gc.input,maxWidth:110}}/>
                <input value={c.credits} onChange={e=>updateRow(setCumSems,c.id,"credits",e.target.value)} placeholder="e.g. 15" type="number" style={{...gc.input,maxWidth:90}}/>
                <button onClick={()=>removeRow(setCumSems,c.id)} style={gc.removeBtn}>✕</button>
              </div>
            ))}
            <button onClick={()=>addRow(setCumSems)} style={gc.addRowBtn}>+ Add Semester</button>
          </div>
          <div style={{display:"flex",gap:12,marginTop:20,alignItems:"center",flexWrap:"wrap"}}>
            <button onClick={calcCumGPA} style={gc.calcBtn}>Calculate Cumulative GPA</button>
            {cumResult && <ResultBadge value={cumResult} label="Cumulative GPA" />}
          </div>
        </div>
      )}

      {/* ── Course Grade ── */}
      {activeTab==="course" && (
        <div style={gc.card}>
          <SectionTitle>Course Grade (So Far)</SectionTitle>
          <p style={{fontSize:13,color:"#A59AC9",marginTop:6,marginBottom:18}}>Enter each graded component, its weight, and your grade to calculate your current course grade.</p>
          <div style={gc.headerRow}>
            <span style={gc.colHead}>Type</span>
            <span style={gc.colHead}>Weight %</span>
            <span style={gc.colHead}>Grade %</span>
            <span style={{width:32}}/>
          </div>
          {components.map(c=>(
            <div key={c.id} style={gc.row}>
              <select value={c.type} onChange={e=>updateRow(setComponents,c.id,"type",e.target.value)} style={{...gc.input,maxWidth:130,cursor:"pointer"}}>
                {["Exam","Assignment","Project","Quiz","Lab","Other"].map(t=><option key={t}>{t}</option>)}
              </select>
              <input value={c.weight} onChange={e=>updateRow(setComponents,c.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={{...gc.input,maxWidth:110}}/>
              <input value={c.grade}  onChange={e=>updateRow(setComponents,c.id,"grade",e.target.value)}  placeholder="e.g. 85" type="number" style={{...gc.input,maxWidth:110}}/>
              <button onClick={()=>removeRow(setComponents,c.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button onClick={()=>addRow(setComponents)} style={gc.addRowBtn}>+ Add Component</button>
          <div style={{display:"flex",gap:12,marginTop:20,alignItems:"center",flexWrap:"wrap"}}>
            <button onClick={calcCourse} style={gc.calcBtn}>Calculate Grade</button>
            {courseResult && <ResultBadge value={`${courseResult}%`} label="Current Grade" color={parseFloat(courseResult)>=90?"#2d7a4a":parseFloat(courseResult)>=70?"#31487A":"#c0392b"}/>}
          </div>
        </div>
      )}

      {/* ── Target Grade ── */}
      {activeTab==="target" && (
        <div style={gc.card}>
          <SectionTitle>Target Course Grade</SectionTitle>
          <p style={{fontSize:13,color:"#A59AC9",marginTop:6,marginBottom:18}}>Enter grades you've already received, then set your target to find out what you need on the rest.</p>
          <div style={gc.headerRow}>
            <span style={gc.colHead}>Weight % (already graded)</span>
            <span style={gc.colHead}>Grade %</span>
            <span style={{width:32}}/>
          </div>
          {graded.map(g=>(
            <div key={g.id} style={gc.row}>
              <input value={g.weight} onChange={e=>updateRow(setGraded,g.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={gc.input}/>
              <input value={g.grade}  onChange={e=>updateRow(setGraded,g.id,"grade",e.target.value)}  placeholder="e.g. 78" type="number" style={gc.input}/>
              <button onClick={()=>removeRow(setGraded,g.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button onClick={()=>addRow(setGraded)} style={gc.addRowBtn}>+ Add Component</button>
          <div style={{display:"flex",gap:12,marginTop:20,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,background:"#F4F4F8",border:"1px solid #D4D4DC",borderRadius:10,padding:"8px 14px"}}>
              <span style={{fontSize:13,color:"#5A3B7B",fontWeight:600}}>Target grade:</span>
              <input value={targetGoal} onChange={e=>setTargetGoal(e.target.value)} placeholder="e.g. 85" type="number" style={{border:"none",outline:"none",background:"transparent",fontSize:14,fontWeight:600,color:"#31487A",width:60}}/>
              <span style={{fontSize:13,color:"#A59AC9"}}>%</span>
            </div>
            <button onClick={calcTarget} style={gc.calcBtn}>Calculate</button>
          </div>
          {targetResult && (
            <div style={{marginTop:16,padding:"14px 18px",background:"#F0EEF7",borderRadius:12,borderLeft:"3px solid #7B5EA7",fontSize:14,color:"#31487A",fontWeight:500,lineHeight:1.6}}>
              {targetResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultBadge({ value, label, color="#31487A" }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,background:"#F0EEF7",borderRadius:12,padding:"12px 20px",border:"1px solid #D4D4DC"}}>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:32,fontWeight:700,color,lineHeight:1}}>{value}</div>
      <div style={{fontSize:12,color:"#A59AC9"}}>{label}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:3,height:18,background:"#7B5EA7",borderRadius:2}}/>
      <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:"#31487A"}}>{children}</h3>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root:         { display:"flex", minHeight:"100vh", background:"#F4F4F8", fontFamily:"'DM Sans',sans-serif" },
  sidebar:      { display:"flex", flexDirection:"column", background:"#31487A", height:"100vh", position:"sticky", top:0, transition:"width 0.25s ease", overflow:"hidden", flexShrink:0, zIndex:100 },
  sidebarTop:   { display:"flex", alignItems:"center", gap:10, padding:"22px 16px 16px", borderBottom:"1px solid rgba(255,255,255,0.1)" },
  logoMark:     { width:34, height:34, borderRadius:10, background:"#7B5EA7", color:"white", fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  logoLabel:    { fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:18, color:"#ffffff", whiteSpace:"nowrap" },
  userPill:     { display:"flex", alignItems:"center", gap:10, margin:"12px 12px 6px", padding:"10px 12px", background:"rgba(255,255,255,0.08)", borderRadius:12 },
  avatar:       { width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg, #8FB3E2, #A59AC9)", color:"white", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  collapseBtn:  { margin:"8px auto", display:"block", background:"none", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"4px 10px", cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:12 },
  main:         { flex:1, overflowY:"auto", minHeight:"100vh" },
  topbar:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", background:"rgba(244,244,248,0.95)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:50, borderBottom:"1px solid #D4D4DC", gap:14, flexWrap:"wrap" },
  greeting:     { fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:20, color:"#31487A" },
  searchWrap:   { flex:1, maxWidth:240, display:"flex", alignItems:"center", background:"#ffffff", border:"1px solid #D4D4DC", borderRadius:12, padding:"8px 14px" },
  searchInput:  { border:"none", outline:"none", background:"transparent", fontSize:13, color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" },
  bell:         { width:38, height:38, borderRadius:10, background:"#ffffff", border:"1px solid #D4D4DC", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 },
  grid:         { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:20, padding:"24px 28px 40px" },
  card:         { background:"#ffffff", borderRadius:18, padding:"20px 22px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid #D4D4DC" },
  courseCard:   { background:"#F4F4F8", borderRadius:12, padding:"12px 14px", minWidth:140, flex:"1 1 140px", boxShadow:"0 2px 8px rgba(49,72,122,0.08)" },
  progressTrack:{ height:10, background:"#D9E1F1", borderRadius:10, overflow:"hidden" },
  progressFill: { height:"100%", background:"linear-gradient(90deg, #31487A, #8FB3E2)", borderRadius:10, transition:"width 0.6s ease" },
  chip:         { flex:1, background:"#F4F4F8", borderRadius:10, padding:"8px 12px", textAlign:"center" },
  todoInput:    { flex:1, padding:"9px 12px", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#F4F4F8" },
  addBtn:       { padding:"9px 16px", background:"#31487A", color:"white", border:"none", borderRadius:10, fontSize:18, cursor:"pointer", lineHeight:1 },
  todoRow:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:8, background:"#F7F5FB" },
  reviewCard:   { flex:"1 1 260px", background:"#F4F4F8", borderRadius:12, padding:"14px 16px" },
  calNavBtn:    { background:"none", border:"1px solid #D4D4DC", borderRadius:8, width:28, height:28, cursor:"pointer", fontSize:16, color:"#8FB3E2", display:"flex", alignItems:"center", justifyContent:"center" },
};

// semester dropdown styles
const sd = {
  trigger: { display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"#ffffff", border:"1px solid #D4D4DC", borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 1px 4px rgba(49,72,122,0.06)" },
  dropdown: { position:"absolute", top:"calc(100% + 8px)", left:0, minWidth:200, background:"#ffffff", borderRadius:14, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid #D4D4DC", zIndex:200, padding:"6px", overflow:"hidden" },
  option: { padding:"10px 14px", borderRadius:10, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", transition:"background .12s", display:"flex", alignItems:"center" },
  toggleBtn: { display:"flex", alignItems:"center", padding:"8px 12px", background:"#ffffff", border:"1px solid #D4D4DC", borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:15 },
  togglePanel: { position:"absolute", top:"calc(100% + 8px)", right:0, width:220, background:"#ffffff", borderRadius:14, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid #D4D4DC", zIndex:200, padding:"14px" },
  smallAddBtn: { fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:8, border:"1px solid #D4D4DC", background:"#F4F4F8", color:"#31487A", cursor:"pointer" },
  addEventForm: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:12, padding:"12px", background:"#F7F5FB", borderRadius:10, border:"1px solid #D4D4DC", alignItems:"center" },
  miniSelect: { padding:"6px 8px", border:"1px solid #D4D4DC", borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#fff", cursor:"pointer", outline:"none" },
  miniInput: { padding:"6px 10px", border:"1px solid #D4D4DC", borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#fff", outline:"none" },
  miniSaveBtn: { padding:"6px 14px", background:"#31487A", color:"white", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" },
};

// grade calculator styles
const gc = {
  tabBar: { display:"flex", gap:4, background:"#ffffff", padding:5, borderRadius:14, border:"1px solid #D4D4DC", marginBottom:24, width:"fit-content" },
  tab: { padding:"9px 18px", border:"none", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s, color .15s" },
  card: { background:"#ffffff", borderRadius:18, padding:"24px 26px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid #D4D4DC", maxWidth:760 },
  headerRow: { display:"flex", gap:12, marginBottom:8, paddingBottom:8, borderBottom:"1px solid #F4F4F8" },
  colHead: { fontSize:11, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", flex:1 },
  row: { display:"flex", gap:12, marginBottom:8, alignItems:"center" },
  input: { flex:1, padding:"9px 12px", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#F7F5FB", outline:"none" },
  removeBtn: { width:28, height:28, border:"none", background:"none", color:"#B8A9C9", cursor:"pointer", fontSize:14, borderRadius:6, flexShrink:0 },
  addRowBtn: { padding:"7px 14px", background:"#F0EEF7", color:"#7B5EA7", border:"1px solid #D4D4DC", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:4 },
  calcBtn: { padding:"10px 22px", background:"#31487A", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};
