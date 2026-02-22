import { useState, useRef, useEffect } from "react";
import GradeCalculator from "./GradeCalculator";
import Reviews from "./Reviews";
import TaskManager from "./TaskManager";
import Profile from "./Profile";
import StudyPlanner from "./StudyPlanner";
import { LayoutDashboard, Calculator, CheckSquare, Star, User, BookOpen, Bell } from 'lucide-react';

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

const SEMESTERS = {
  "Fall 24-25":   { gpa: 3.67, progress: 100, week: "15 of 15", courses: [
    { id:1, name:"CMPS 271", prof:"Dr. Mohammad Sakr",        time:"Mon & Wed · 12:30–13:45" },
    { id:2, name:"PHIL 210", prof:"Mr. Mahmoud El Hassanieh", time:"Mon & Wed · 14:00–15:15" },
    { id:3, name:"CMPS 215", prof:"Dr. Mohammad A. Kobeissi", time:"Mon & Wed · 15:30–16:45" },
    { id:4, name:"PSYC 222", prof:"Dr. Arne Dietrich",        time:"Tue & Thu · 9:30–10:45"  },
    { id:5, name:"PSYC 284", prof:"Dr. Sarine Hagopian",      time:"Tue & Thu · 14:00–15:15" },
  ]},
  "Spring 24-25": { gpa: 3.45, progress: 100, week: "15 of 15", courses: [
    { id:1, name:"CMPS 300", prof:"Dr. Ayman Dayeh",    time:"Mon & Wed · 11:00–12:15" },
    { id:2, name:"MATH 201", prof:"Dr. Samer Habre",    time:"Mon & Wed · 14:00–15:15" },
    { id:3, name:"ENGL 203", prof:"Ms. Lara Khouri",    time:"Tue & Thu · 9:30–10:45"  },
    { id:4, name:"CMPS 256", prof:"Dr. Wassim El-Hajj", time:"Tue & Thu · 11:00–12:15" },
  ]},
  "Spring 25-26": { gpa: null, progress: 15, week: "3 of 15", courses: [
    { id:1, name:"CMPS 271", prof:"Dr. Mohammad Sakr",        time:"Mon & Wed · 12:30–13:45" },
    { id:2, name:"PHIL 210", prof:"Mr. Mahmoud El Hassanieh", time:"Mon & Wed · 14:00–15:15" },
    { id:3, name:"CMPS 215", prof:"Dr. Mohammad A. Kobeissi", time:"Mon & Wed · 15:30–16:45" },
    { id:4, name:"PSYC 222", prof:"Dr. Arne Dietrich",        time:"Tue & Thu · 9:30–10:45"  },
    { id:5, name:"PSYC 284", prof:"Dr. Sarine Hagopian",      time:"Tue & Thu · 14:00–15:15" },
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

const ALL_WIDGETS = [
  { id:"courses",   label:"My Courses",        span:2 },
  { id:"gpa",       label:"GPA",               span:1 },
  { id:"progress",  label:"Semester Progress", span:1 },
  { id:"todo",      label:"To-Do List",        span:1 },
  { id:"pomodoro",  label:"Pomodoro Timer",    span:1 },
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

function SectionTitle({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <div style={{ width:3, height:18, background:"#7B5EA7", borderRadius:2 }} />
      <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"#31487A", margin:0 }}>{children}</h3>
    </div>
  );
}

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
        <span style={{ fontSize:14 }}></span>
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

function PomodoroTimer() {
  const MODES = [
    { label:"Focus",      duration:25*60, color:"#31487A", bg:"#eef2fb" },
    { label:"Short Break",duration:5*60,  color:"#2d7a4a", bg:"#eef7f0" },
    { label:"Long Break", duration:15*60, color:"#5A3B7B", bg:"#F0EEF7" },
  ];
  const [modeIdx,   setModeIdx]   = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(MODES[0].duration);
  const [running,   setRunning]   = useState(false);
  const [sessions,  setSessions]  = useState(0);
  const intervalRef = useRef(null);

  const mode = MODES[modeIdx];
  const mins = String(Math.floor(timeLeft/60)).padStart(2,"0");
  const secs = String(timeLeft%60).padStart(2,"0");
  const pct  = 1 - timeLeft/mode.duration;
  const r    = 46;
  const circ = 2*Math.PI*r;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (modeIdx === 0) setSessions(s => s+1);
            return 0;
          }
          return t-1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, modeIdx]);

  const switchMode = idx => {
    setRunning(false);
    setModeIdx(idx);
    setTimeLeft(MODES[idx].duration);
  };

  const reset = () => { setRunning(false); setTimeLeft(mode.duration); };

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,paddingTop:6}}>
      <div style={{display:"flex",gap:4,background:"#F4F4F8",padding:4,borderRadius:12,width:"100%"}}>
        {MODES.map((m,i) => (
          <button key={m.label} onClick={() => switchMode(i)} style={{
            flex:1, padding:"6px 0", border:"none", borderRadius:8, fontSize:11, fontWeight:600,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
            background: modeIdx===i ? m.color : "transparent",
            color: modeIdx===i ? "#fff" : "#A59AC9",
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{position:"relative",width:120,height:120}}>
        <svg width="120" height="120" style={{transform:"rotate(-90deg)"}}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="#D9E1F1" strokeWidth="8"/>
          <circle cx="60" cy="60" r={r} fill="none" stroke={mode.color} strokeWidth="8"
            strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round"
            style={{transition:"stroke-dasharray 0.5s ease"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:mode.color,lineHeight:1}}>{mins}:{secs}</div>
          <div style={{fontSize:10,color:"#A59AC9",marginTop:2}}>{mode.label}</div>
        </div>
      </div>

      <div style={{display:"flex",gap:10}}>
        <button onClick={reset} style={{padding:"7px 14px",background:"#F4F4F8",border:"1px solid #D4D4DC",borderRadius:9,fontSize:12,cursor:"pointer",color:"#A59AC9",fontFamily:"'DM Sans',sans-serif"}}>↺ Reset</button>
        <button onClick={() => setRunning(r => !r)} style={{
          padding:"7px 22px", background:running?"#e07070":mode.color, color:"white",
          border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", transition:"background .15s",
        }}>{running ? "⏸ Pause" : "▶ Start"}</button>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#A59AC9"}}>
        <span></span>
        <span style={{color:"#31487A",fontWeight:600}}>{sessions}</span>
        <span>session{sessions!==1?"s":""} completed</span>
      </div>
    </div>
  );
}


export default function Dashboard({ onLogout }) {
  const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard",        icon:"<LayoutDashboard size={17}/>" },
  { id:"grades",    label:"Grade Calculator", icon:"<Calculator size={17}/>" },
  { id:"tasks",     label:"Task Manager",     icon:"<CheckSquare size={17}/>" },
  { id:"reviews",   label:"Reviews",          icon:"<Star size={17}/>" },
  { id:"profile",   label: "Student Profile",       icon:"<User size={17}/>" },
  { id:"planner", label:"Study Planner", icon:"<BookOpen size={17}/>" },
];
  const email = localStorage.getItem("kk_email") || "student@mail.aub.edu";

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("kk_profile");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const displayName = profile.firstName || profile.lastName
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
    : "Student";

  const [activePage,    setActivePage]    = useState("dashboard");
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [semester,      setSemester]      = useState("Spring 25-26");
  const [showToggle,    setShowToggle]    = useState(false);
  const toggleRef = useRef(null);

  const [visible, setVisible] = useState(
    Object.fromEntries(ALL_WIDGETS.map(w => [w.id, true]))
  );
  const toggleWidget = id => setVisible(v => ({ ...v, [id]: !v[id] }));

  useEffect(() => {
    const h = e => { if (toggleRef.current && !toggleRef.current.contains(e.target)) setShowToggle(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const [todos,     setTodos]     = useState([]);
  const [todoInput, setTodoInput] = useState("");

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

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

      <main style={s.main}>
        <header style={s.topbar}>
          <div>
            <div style={s.greeting}>Hello, <span style={{fontFamily:"'Fraunces',serif",fontStyle:"italic",color:"#31487A"}}>{displayName}!</span></div>
            <div style={{fontSize:13,color:"#5A3B7B",marginTop:2}}>{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
          </div>

          {activePage === "dashboard" && (
            <SemesterSelect value={semester} onChange={setSemester} />
          )}

          <div style={s.searchWrap}>
            <span style={{color:"#B8A9C9",marginRight:8}}></span>
            <input placeholder="Search…" style={s.searchInput} />
          </div>

          {/* widget toggle */}
          {activePage === "dashboard" && (
            <div ref={toggleRef} style={{position:"relative"}}>
              <button onClick={() => setShowToggle(o=>!o)} style={sd.toggleBtn} title="Customize widgets">
                 <span style={{fontSize:12,fontWeight:600,color:"#31487A",marginLeft:4}}>Widgets</span>
              </button>
              {showToggle && <WidgetTogglePanel visible={visible} onToggle={toggleWidget} />}
            </div>
          )}

          <div style={s.bell}><Bell size={18} color="#8FB3E2" /></div>
        </header>

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
                        {t.done?"":"⬜"} {t.text}
                      </span>
                      <button onClick={()=>deleteTodo(t.id)} style={{background:"none",border:"none",color:"#B8A9C9",cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {visible.pomodoro && (
              <section className="card-anim" style={s.card}>
                <SectionTitle>Pomodoro Timer</SectionTitle>
                <PomodoroTimer />
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

          </div>
        )}

      
        {activePage === "grades" && <GradeCalculator />}
        {activePage === "tasks" && <TaskManager />}
        {activePage === "reviews" && <Reviews />}
        {activePage === "planner" && <StudyPlanner />}
        {activePage === "profile" && (
          <Profile onProfileSave={p => setProfile(p)} />
        )}

      </main>
    </div>
  );
}

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