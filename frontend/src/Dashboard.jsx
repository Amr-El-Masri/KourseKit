import { useState, useRef, useEffect, useCallback } from "react";
import GradeCalculator from "./GradeCalculator";
import Reviews from "./Reviews";
import TaskManager from "./TaskManager";
import Profile from "./Profile";
import StudyPlanner from "./StudyPlanner";
import CourseDetails from "./CourseDetails";
import SyllabusModal from "./SyllabusModal";
import ThemeToggle from "./ThemeToggle";
import { LayoutDashboard, Calculator, CheckSquare, Star, User, BookOpen, Bell, Pause, Play, Power, LayoutList, Banana, Cat, Eclipse, Dog, Telescope, Panda, Turtle } from 'lucide-react';

const AVATAR_ICONS = [
  { id:"Banana", icon: Banana },
  { id:"Telescope", icon: Telescope  },
  { id:"Eclipse", icon: Eclipse    },
  { id:"Cat", icon: Cat   },
  { id:"Dog", icon: Dog    },
  { id:"Panda", icon: Panda  },
  { id:"Turtle", icon: Turtle   },
];

const DAYS_OF_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const EVENT_TYPES  = [
  { label:"Class",   color:"#31487A", bg:"#eef2fb" },
  { label:"Gym",     color:"#2d7a4a", bg:"#eef7f0" },
  { label:"Study",   color:"var(--accent2)", bg:"#F0EEF7" },
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
  { id:"courseGrades", label: "Course Grades", span: 1},
  { id: "gpasummary", label: "GPA Summary", span:1},
];


function SectionTitle({ children }) {
  return (
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
        <div style={{ width:3, height:18, background:"var(--accent)", borderRadius:2 }} />
        <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"var(--primary)", margin:0 }}>{children}</h3>
      </div>
  );
}

function SemesterSelect({ value, onChange, semesters }) {
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
          <span style={{ fontWeight:600, color:"var(--primary)", fontSize:13 }}>{value || "Select semester"}</span>
          <span style={{ color:"var(--text2)", fontSize:11, transition:"transform .2s", display:"inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </button>
        {open && (
            <div style={sd.dropdown}>
              {semesters.map(sem => (
                  <div key={sem} onClick={() => { onChange(sem); setOpen(false); }}
                       style={{ ...sd.option, background: sem === value ? "var(--surface3)" : "transparent", color: sem === value ? "var(--primary)" : "var(--text-body)", fontWeight: sem === value ? 600 : 400 }}>
                    {sem === value && <span style={{ color:"var(--accent)", marginRight:8, fontSize:12 }}>✓</span>}
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
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Widgets</div>
        {ALL_WIDGETS.map(w => (
            <div key={w.id} onClick={() => onToggle(w.id)}
                 style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:8, marginBottom:4, cursor:"pointer", background: visible[w.id] ? "var(--surface3)" : "transparent", transition:"background .15s" }}>
              <span style={{ fontSize:13, color: visible[w.id] ? "var(--primary)" : "var(--text2)" }}>{w.label}</span>
              <div style={{ width:32, height:18, borderRadius:9, background: visible[w.id] ? "var(--accent)" : "var(--border)", position:"relative", transition:"background .2s" }}>
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
    { label:"Long Break", duration:15*60, color:"var(--accent2)", bg:"#F0EEF7" },
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
        <div style={{display:"flex",gap:4,background:"var(--surface2)",padding:4,borderRadius:12,width:"100%"}}>
          {MODES.map((m,i) => (
              <button key={m.label} onClick={() => switchMode(i)} style={{
                flex:1, padding:"6px 0", border:"none", borderRadius:8, fontSize:11, fontWeight:600,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                background: modeIdx===i ? m.color : "transparent",
                color: modeIdx===i ? "#fff" : "var(--text2)",
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
            <div style={{fontSize:10,color:"var(--text2)",marginTop:2}}>{mode.label}</div>
          </div>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={reset} style={{padding:"7px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:9,fontSize:12,cursor:"pointer",color:"var(--text2)",fontFamily:"'DM Sans',sans-serif"}}>↺ Reset</button>
          <button onClick={() => setRunning(r => !r)} style={{
            padding:"7px 22px", background:running?"#e07070":mode.color, color:"white",
            border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", transition:"background .15s",
          }}>{running ? <><Pause size={13} style={{verticalAlign:"middle",marginRight:4}}/>Pause</> : <><Play size={13} style={{verticalAlign:"middle",marginRight:4}}/>Start</>}</button>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--text2)"}}>
          <span></span>
          <span style={{color:"var(--primary)",fontWeight:600}}>{sessions}</span>
          <span>session{sessions!==1?"s":""} completed</span>
        </div>
      </div>
  );
}

function CourseGradeSummaryWidget({ apiSemesters, selectedSemester }) {
  const gradePoints = {"A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0};

  const semObj = apiSemesters.find(s => s.semesterName === selectedSemester);
  const courses = (semObj?.courses || []).filter(c => c.courseCode);

  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    setSelectedCourse(courses[0]?.courseCode || "");
  }, [selectedSemester]);

  const courseObj = courses.find(c => c.courseCode === selectedCourse);

  // Pull assessments from kk_course_data (saved by GradeCalculator) since the API doesn't store them
  const getAssessments = (courseCode) => {
    try {
      const saved = JSON.parse(localStorage.getItem("kk_course_data") || "{}")[courseCode];
      if (saved?.components?.length) {
        return saved.components
          .filter(c => c.type || c.customType)
          .map(c => ({
            name: c.type === "Other" ? (c.customType?.trim() || "Other") : c.type,
            weight: parseFloat(c.weight) || 0,
            grade: c.grade || null,
          }));
      }
    } catch {}
    return [];
  };

  const assessments = courseObj?.assessments?.length
    ? courseObj.assessments
    : getAssessments(selectedCourse);

  const gpaColor = g => {
    const v = parseFloat(g);
    if (isNaN(v)) return "var(--text2)";
    return v >= 3.7 ? "#27ae60" : v >= 3.0 ? "#2980b9" : v >= 2.0 ? "#e67e22" : "#c0392b";
  };

  const gradeColor = g => {
    const gp = gradePoints[g?.trim()?.toUpperCase()];
    return gp !== undefined ? gpaColor(gp) : "var(--text2)";
  };

  const letterToNumeric = g => {
    const map = {"A+":97,"A":93,"A-":90,"B+":87,"B":83,"B-":80,"C+":77,"C":73,"C-":70,"D+":67,"D":63,"F":50};
    const s = String(g || "").trim().toUpperCase();
    if (map[s] !== undefined) return map[s];
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  const totalWeight = assessments.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0);
  const coveredWeight = assessments.reduce((sum, a) => {
    const score = letterToNumeric(a.grade);
    return score !== null ? sum + (parseFloat(a.weight) || 0) : sum;
  }, 0);
  const weightedScore = assessments.reduce((sum, a) => {
    const score = letterToNumeric(a.grade);
    const w = parseFloat(a.weight) || 0;
    return score !== null ? sum + (score * w / 100) : sum;
  }, 0);
  const projectedPct = coveredWeight > 0 ? (weightedScore / coveredWeight * 100).toFixed(1) : null;

  return (
    <section className="card-anim" style={{ background:"var(--surface)", borderRadius:18, padding:"20px 22px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:3, height:18, background:"var(--accent)", borderRadius:2 }} />
          <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"var(--primary)", margin:0 }}>Course Grade Breakdown</h3>
        </div>
        {selectedSemester && (
          <span style={{ fontSize:12, fontWeight:600, color:"var(--accent)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"3px 10px" }}>
            {selectedSemester}
          </span>
        )}
      </div>

      {courses.length === 0 ? (
        <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"24px 0" }}>No courses found for this semester.</div>
      ) : (
        <>
          {/* Course picker — only courses from the selected semester */}
          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            {courses.map(c => (
              <button
                key={c.courseCode}
                onClick={() => setSelectedCourse(c.courseCode)}
                style={{
                  padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", border:"1px solid var(--border)",
                  background: selectedCourse === c.courseCode ? "var(--primary)" : "var(--surface2)",
                  color: selectedCourse === c.courseCode ? "white" : "var(--text)",
                  transition:"all .15s",
                }}
              >
                {c.courseCode}
              </button>
            ))}
          </div>

          {!courseObj ? (
            <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"16px 0" }}>Select a course.</div>
          ) : (
            <>
              {/* Course header — code, credits, final grade */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--surface2)", borderRadius:10, padding:"10px 14px", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--primary)" }}>{courseObj.courseCode}</div>
                  <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>{courseObj.credits} credits · {selectedSemester}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:26, fontWeight:700, fontFamily:"'Fraunces',serif", color: gradeColor(courseObj.grade) }}>
                    {courseObj.grade || "—"}
                  </div>
                  {gradePoints[courseObj.grade?.trim()?.toUpperCase()] !== undefined && (
                    <div style={{ fontSize:11, color:"var(--text2)" }}>{gradePoints[courseObj.grade.trim().toUpperCase()].toFixed(1)} GPA pts</div>
                  )}
                </div>
              </div>

              {assessments.length === 0 ? (
                <div style={{ fontSize:12, color:"var(--text3)", textAlign:"center", padding:"12px 0" }}>
                  No assessment breakdown saved for this course in the Grade Calculator.
                </div>
              ) : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 52px 52px 64px", gap:4, padding:"4px 6px", marginBottom:4 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Component</span>
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textAlign:"center", textTransform:"uppercase", letterSpacing:"0.05em" }}>Weight</span>
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textAlign:"center", textTransform:"uppercase", letterSpacing:"0.05em" }}>Grade</span>
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.05em" }}>Contrib.</span>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {assessments.map((a, i) => {
                      const score = letterToNumeric(a.grade);
                      const w = parseFloat(a.weight) || 0;
                      const contrib = score !== null ? ((score * w) / 100).toFixed(1) : "—";
                      return (
                        <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 52px 52px 64px", gap:4, padding:"7px 8px", background: i % 2 === 0 ? "var(--surface2)" : "transparent", borderRadius:8, alignItems:"center" }}>
                          <span style={{ fontSize:12, color:"var(--text)", fontWeight:500 }}>{a.name || `Component ${i+1}`}</span>
                          <span style={{ fontSize:12, color:"var(--text2)", textAlign:"center" }}>{w}%</span>
                          <span style={{ fontSize:13, fontWeight:700, color: a.grade ? gradeColor(a.grade) : "var(--text3)", textAlign:"center", fontFamily:"'Fraunces',serif" }}>{a.grade || "—"}</span>
                          <span style={{ fontSize:12, color:"var(--accent2)", fontWeight:600, textAlign:"right" }}>{contrib}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop:10, padding:"8px 12px", background:"var(--surface3,#eef2fb)", borderRadius:9, border:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"var(--text2)" }}>
                      {coveredWeight < totalWeight
                        ? <>{coveredWeight}% graded · {(totalWeight - coveredWeight).toFixed(0)}% pending</>
                        : <>{totalWeight}% total weight</>
                      }
                    </span>
                    {projectedPct && (
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--primary)" }}>
                        Projected: {projectedPct}%
                      </span>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

function GPASummaryWidget({ apiSemesters, selectedSemester, onNavigate }) {
  const gradePoints = {"A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0};

  const gpaColor = g => {
    const v = parseFloat(g);
    if (isNaN(v)) return "var(--text2)";
    return v >= 3.7 ? "#27ae60" : v >= 3.0 ? "#2980b9" : v >= 2.0 ? "#e67e22" : "#c0392b";
  };

  const semObj = apiSemesters.find(s => s.semesterName === selectedSemester);
  const courses = (semObj?.courses || []).filter(c => c.courseCode);
  const gradedCourses = courses.filter(c => c.grade && gradePoints[c.grade?.trim()?.toUpperCase()] !== undefined && Number(c.credits) > 0);
  const allGraded = courses.length > 0 && gradedCourses.length === courses.length;

  const semGPA = allGraded ? (() => {
    const pts = gradedCourses.reduce((sum, c) => sum + gradePoints[c.grade.trim().toUpperCase()] * Number(c.credits), 0);
    const creds = gradedCourses.reduce((sum, c) => sum + Number(c.credits), 0);
    return { gpa: (pts / creds).toFixed(2), pts, creds };
  })() : null;

  return (
    <section className="card-anim" style={{ background:"var(--surface)", borderRadius:18, padding:"20px 22px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:3, height:18, background:"var(--accent)", borderRadius:2 }} />
          <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"var(--primary)", margin:0 }}>GPA Summary</h3>
        </div>
        {selectedSemester && (
          <span style={{ fontSize:12, fontWeight:600, color:"var(--accent)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"3px 10px" }}>
            {selectedSemester}
          </span>
        )}
      </div>

      {!selectedSemester || courses.length === 0 ? (
        <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"24px 0" }}>
          No courses found for this semester.
        </div>
      ) : !allGraded ? (
        <>
          <div style={{ fontSize:12, color:"var(--warn1,#c97d00)", background:"var(--warn-bg,#fff8ec)", border:"1px solid #f5dfa0", borderRadius:9, padding:"8px 12px", marginBottom:12 }}>
            Final grades not yet available for all courses this semester.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {courses.map((c, ci) => {
              const gp = gradePoints[c.grade?.trim()?.toUpperCase()];
              const hasGrade = gp !== undefined;
              return (
                <div key={ci} style={{ display:"grid", gridTemplateColumns:"1fr 44px 60px", gap:4, padding:"7px 10px", background: ci % 2 === 0 ? "var(--surface2)" : "transparent", borderRadius:8, alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--primary)" }}>{c.courseCode}</span>
                  <span style={{ fontSize:12, color:"var(--text2)", textAlign:"center" }}>{c.credits} cr</span>
                  <span style={{ fontSize:13, fontWeight:700, fontFamily:"'Fraunces',serif", textAlign:"right", color: hasGrade ? gpaColor(gp) : "var(--text3)" }}>
                    {c.grade || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--surface3,#eef2fb)", borderRadius:12, padding:"12px 16px", marginBottom:14, border:"1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Semester GPA</div>
              <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>{semGPA.creds} cr · {gradedCourses.length} courses</div>
            </div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:34, fontWeight:700, color: gpaColor(semGPA.gpa), lineHeight:1 }}>{semGPA.gpa}</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 44px 52px 60px", gap:4, padding:"4px 6px", marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Course</span>
            <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textAlign:"center", textTransform:"uppercase", letterSpacing:"0.05em" }}>Cr</span>
            <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textAlign:"center", textTransform:"uppercase", letterSpacing:"0.05em" }}>Grade</span>
            <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.05em" }}>Pts×Cr</span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {gradedCourses.map((c, ci) => {
              const gp = gradePoints[c.grade.trim().toUpperCase()];
              const contribution = (gp * Number(c.credits)).toFixed(1);
              return (
                <div key={ci} style={{ display:"grid", gridTemplateColumns:"1fr 44px 52px 60px", gap:4, padding:"7px 8px", background: ci % 2 === 0 ? "var(--surface2)" : "transparent", borderRadius:8, alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--primary)" }}>{c.courseCode}</span>
                  <span style={{ fontSize:12, color:"var(--text2)", textAlign:"center" }}>{c.credits}</span>
                  <span style={{ fontSize:13, color: gpaColor(gp), fontWeight:700, textAlign:"center", fontFamily:"'Fraunces',serif" }}>{c.grade}</span>
                  <span style={{ fontSize:12, color:"var(--accent2)", fontWeight:600, textAlign:"right" }}>{contribution}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop:10, padding:"8px 12px", background:"var(--surface3,#eef2fb)", borderRadius:9, border:"1px solid var(--border)", fontSize:12, color:"var(--primary)", fontWeight:600 }}>
            GPA = {semGPA.pts.toFixed(1)} ÷ {semGPA.creds} cr = <span style={{ color: gpaColor(semGPA.gpa), fontSize:14 }}>{semGPA.gpa}</span>
          </div>
        </>
      )}

      <button
        onClick={() => onNavigate("grades")}
        style={{ marginTop:14, width:"100%", padding:"9px 0", background:"none", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontWeight:600, color:"var(--accent)", fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}
      >
        Open GPA Calculator →
      </button>
    </section>
  );
}

export default function Dashboard({ onLogout }) {
  const NAV_ITEMS = [
    { id:"dashboard", label:"Dashboard",        icon:<LayoutDashboard size={17}/> },
    { id:"tasks",     label:"Task Manager",     icon:<CheckSquare size={17}/> },
    { id:"planner",   label:"Study Planner",    icon:<BookOpen size={17}/> },
    { id:"grades",    label:"Grade Calculator", icon:<Calculator size={17}/> },
    { id:"reviews",   label:"Reviews",          icon:<Star size={17}/> },
  ];

  const [editingTask, setEditingTask] = useState(null);
  const [courseDetailsTarget, setCourseDetailsTarget] = useState(null);
  const [syllabusTarget, setSyllabusTarget] = useState(null); // course name for syllabus modal
  const [syllabusCalcData, setSyllabusCalcData] = useState(null); // pre-fill data for calculator
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);
  const email = localStorage.getItem("kk_email") || "student@mail.aub.edu";

  const [profile, setProfile] = useState({});
  const displayName = profile.firstName || profile.lastName
      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
      : "Student";

  const [activePage, setActivePage] = useState(() => localStorage.getItem("kk_activePage") || "dashboard");
  const [sidebarOpen,    setSidebarOpen]   = useState(true);
  useEffect(() => {
    localStorage.setItem("kk_activePage", activePage); }, [activePage]);
  const [semester,       setSemester]      = useState("");
  const [apiSemesters,   setApiSemesters]  = useState([]);
  const [showToggle,    setShowToggle]    = useState(false);
  const toggleRef = useRef(null);

  const [visible, setVisible] = useState(() => {
    try {
      const saved = localStorage.getItem("kk_widgets");
      return saved ? JSON.parse(saved) : Object.fromEntries(ALL_WIDGETS.map(w => [w.id, true]));
    } catch {
      return Object.fromEntries(ALL_WIDGETS.map(w => [w.id, true]));}
  });

  const toggleWidget = id => {
    setVisible(v => {
      const next = { ...v, [id]: !v[id] };
      localStorage.setItem("kk_widgets", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const h = e => { if (toggleRef.current && !toggleRef.current.contains(e.target)) setShowToggle(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem("kk_todos");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [todoInput, setTodoInput] = useState("");
  const [todoError, setTodoError] = useState(false);

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [hoveredTask, setHoveredTask] = useState(null);

  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ day:"Mon", label:"", time:"", type:"Class" });

  const selectedSem = apiSemesters.find(s => s.semesterName === semester) ?? { courses: [] };
  const semCourseList = (selectedSem.courses || []).map(c => ({ id: c.id, name: c.courseCode }));

  const addTodo = () => {
    if (!todoInput.trim()) { setTodoError(true); return; }
    setTodoError(false);
    const next = [...todos, { id:Date.now(), text:todoInput.trim(), done:false }];
    setTodos(next);
    localStorage.setItem("kk_todos", JSON.stringify(next));
    setTodoInput("");
  };

  const toggleTodo = id => {
    const next = todos.map(t => t.id===id ? {...t,done:!t.done} : t);
    setTodos(next);
    localStorage.setItem("kk_todos", JSON.stringify(next));
  };

  const deleteTodo = id => {
    const next = todos.filter(t => t.id!==id);
    setTodos(next);
    localStorage.setItem("kk_todos", JSON.stringify(next));
  };

const [tasks, setTasks] = useState([]);
const [courseColors, setCourseColors] = useState({});

const saveCourseColor = (courseName, color) => {
  const next = { ...courseColors, [courseName]: color };
  setCourseColors(next);
  const t = localStorage.getItem("kk_token");
  if (t) fetch("http://localhost:8080/api/profile/colors", {
    method: "PUT",
    headers: { "Authorization": "Bearer " + t, "Content-Type": "application/json" },
    body: JSON.stringify(next),
  }).catch(() => {});
};

  const [courseOfficeHours, setCourseOfficeHours] = useState(() => {
    try {
      const saved = localStorage.getItem("kk_course_office_hours");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [expandedOH, setExpandedOH] = useState({});

  const [courseSyllabi, setCourseSyllabi] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}"); } catch { return {}; }
  });
  useEffect(() => {
    const sync = () => {
      try { setCourseSyllabi(JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}")); } catch {}
    };
    window.addEventListener("kk_syllabus_changed", sync);
    return () => window.removeEventListener("kk_syllabus_changed", sync);
  }, []);

  const saveCourseOfficeHours = (courseName, hours) => {
    const next = { ...courseOfficeHours, [courseName]: hours };
    setCourseOfficeHours(next);
    localStorage.setItem("kk_course_office_hours", JSON.stringify(next));
  };

  const getAuthInfo = () => {
    const token = localStorage.getItem("kk_token");
    const userId = token ? JSON.parse(atob(token.split(".")[1])).sub : null;
    return { token, userId };
  };

  const loadNotifications = useCallback(() => {
    const { token, userId } = getAuthInfo();
    if (!userId) return;
    fetch("http://localhost:8080/api/" + userId + "/notifications", {
      headers: { "Authorization": "Bearer " + token }
    })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
          }
        })
        .catch(() => {});
  }, []);

  const markAllAsRead = useCallback(() => {
    const { token, userId } = getAuthInfo();
    if (!userId) return;
    fetch("http://localhost:8080/api/" + userId + "/notifications/read-all", {
      method: "PATCH",
      headers: { "Authorization": "Bearer " + token }
    })
        .then(() => {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          setUnreadCount(0);
        })
        .catch(() => {});
  }, []);

  const loadTasksForCalendar = useCallback(() => {
    const token = localStorage.getItem("kk_token");
    const userId = token ? JSON.parse(atob(token.split(".")[1])).sub : null;
    if (!userId) return;
    fetch(`http://localhost:8080/api/tasks/${userId}/list-all`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTasks(data.map(t => ({ ...t, due: t.deadline, done: t.completed })));
          }
        })
        .catch(() => {});
  }, []);

  useEffect(() => {
    if (activePage === "dashboard") loadTasksForCalendar();
  }, [activePage]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [studyBlocks, setStudyBlocks] = useState({});
  const [studySlots, setStudySlots] = useState({});
  const [studyEntries, setStudyEntries] = useState([]);
  const [schedColorMap, setSchedColorMap] = useState(() => {
    try { const s = localStorage.getItem("kk_colorMap"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [schedWeekOffset, setSchedWeekOffset] = useState(0);

  const getWeekStartForOffset = (offset) => {
    const d = new Date();
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    d.setDate(d.getDate() + diff + offset * 7);
    return d.toISOString().split("T")[0];
  };

  const loadStudyBlocks = useCallback((offset = 0) => {
    const token = localStorage.getItem("kk_token");
    const userId = token ? JSON.parse(atob(token.split(".")[1])).sub : null;
    if (!userId) return;
    const weekStart = getWeekStartForOffset(offset);
    try { const s = localStorage.getItem("kk_colorMap"); if (s) setSchedColorMap(JSON.parse(s)); } catch {}
    fetch(`http://localhost:8080/api/study-plan/${userId}/weekly?weekStart=${weekStart}`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json()).then(data => { if (data) setStudyBlocks(data); }).catch(() => {});
    fetch(`http://localhost:8080/api/study-plan/${userId}/slots?weekStart=${weekStart}`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(s => { if (!map[s.dayKey]) map[s.dayKey] = []; map[s.dayKey].push(s); });
        setStudySlots(map);
      }
    }).catch(() => {});
    fetch(`http://localhost:8080/api/study-plan/${userId}/entries?weekStart=${weekStart}`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setStudyEntries(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activePage === "dashboard") {
      loadTasksForCalendar();
      loadStudyBlocks(schedWeekOffset);
    }
  }, [activePage]);

  useEffect(() => {
    if (activePage === "dashboard") loadStudyBlocks(schedWeekOffset);
  }, [schedWeekOffset]);

  const saveTasks = (next) => {
    setTasks(next);
    localStorage.setItem("kk_tasks", JSON.stringify(next));
  };

  const toggleTask = id  => saveTasks(tasks.map(t => t.id===id ? {...t, done:!t.done} : t));
  const deleteTask = id  => saveTasks(tasks.filter(t => t.id!==id));
  const upsertTask = task => saveTasks(tasks.some(t=>t.id===task.id) ? tasks.map(t=>t.id===task.id?task:t) : [task,...tasks]);

  const addEvent   = () => { if (!newEvent.label.trim()) return; setScheduleEvents(p => [...p,{...newEvent,id:Date.now()}]); setNewEvent({day:"Mon",label:"",time:"",type:"Class"}); setShowAddEvent(false); };
  const deleteEvent= id => setScheduleEvents(p => p.filter(e => e.id!==id));

  const monthName   = new Date(calYear, calMonth).toLocaleString("en-US",{month:"long"});
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const startOffset = (new Date(calYear,calMonth,1).getDay()+6)%7;
  const calCells    = [...Array(startOffset).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const isToday     = d => d===today.getDate() && calMonth===today.getMonth() && calYear===today.getFullYear();
  const prevMonth   = () => calMonth===0  ? (setCalMonth(11),setCalYear(y=>y-1)) : setCalMonth(m=>m-1);
  const nextMonth   = () => calMonth===11 ? (setCalMonth(0), setCalYear(y=>y+1)) : setCalMonth(m=>m+1);

  const tasksByDate = tasks.reduce((acc, t) => {
        if (!t.due) return acc;
        const key = t.due.slice(0, 10);
        acc[key] = acc[key] ? [...acc[key], t] : [t];
        return acc;},
      {});

  const calKey = (d) => {
    const mm = String(calMonth + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${calYear}-${mm}-${dd}`;};

  const handleLogout = () => { Object.keys(localStorage).filter(k => k.startsWith("kk_")).forEach(k => localStorage.removeItem(k)); onLogout(); };

  const fetchSemesters = () => {
    const token = localStorage.getItem("kk_token");
    return fetch("http://localhost:8080/api/grades/saved", {
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const sorted = sortSemesters(data);
            setApiSemesters(sorted);
            setSemester(s => s || (sorted[sorted.length - 1]?.semesterName ?? ""));
            return sorted;
          }
          return []; })
        .catch(() => []);
  };

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

  useEffect(() => { fetchSemesters(); }, []);

  useEffect(() => {
    const t = localStorage.getItem("kk_token");
    if (!t) return;
    fetch("http://localhost:8080/api/profile", {
      headers: { "Authorization": "Bearer " + t, "Content-Type": "application/json" },
    }).then(r => r.ok ? r.json() : null).then(data => { if (data) setProfile(data); }).catch(() => {});
    fetch("http://localhost:8080/api/profile/colors", {
      headers: { "Authorization": "Bearer " + t, "Content-Type": "application/json" },
    }).then(r => r.ok ? r.json() : null).then(data => { if (data) setCourseColors(data); }).catch(() => {});
  }, []);

  // Courses from all saved semesters (deduplicated) for Grade Calculator dropdown
  const dashboardCourses = [...new Map(
      apiSemesters.flatMap(s => (s.courses || []).map(c => ({ id: c.id, name: c.courseCode })))
          .filter(c => c.name)
          .map(c => [c.name, c])
  ).values()];

  return (
      <div style={s.root}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:var(--bg); }
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
        .toggle-opt:hover { background:var(--surface3); }
        label:has(input[type="color"]):hover { transform: scale(1.2); box-shadow: 0 3px 10px rgba(0,0,0,0.2) !important; }
      `}</style>

        <aside style={{ ...s.sidebar, width:sidebarOpen ? 224 : 66 }}>
          <div style={{ ...s.sidebarTop, flexDirection: sidebarOpen ? "row" : "column", justifyContent: sidebarOpen ? "space-between" : "center", gap: sidebarOpen ? 10 : 8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src="/KourseKit.jpeg" alt="KourseKit" style={{ width:34, height:34, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
              {sidebarOpen && <span style={s.logoLabel}>KourseKit</span>}
            </div>
            <button onClick={() => setSidebarOpen(o=>!o)} style={s.collapseBtn}>{sidebarOpen?"◀":"▶"}</button>
          </div>
          <nav style={{flex:1,paddingTop:10}}>
            {NAV_ITEMS.map(item => (
                <div key={item.id} className="nav-btn" onClick={() => setActivePage(item.id)} style={{
                  display:"flex", alignItems:"center", padding:"10px 16px", margin:"2px 8px", borderRadius:10,
                  justifyContent:sidebarOpen?"flex-start":"center",
                  background:activePage===item.id?"rgba(255,255,255,0.15)":"transparent",
                  color:activePage===item.id?"#ffffff":"var(--text3)",
                  fontWeight:activePage===item.id?600:400, userSelect:"none", position:"relative",
                }}>
                  <span style={{fontSize:17,minWidth:22,textAlign:"center"}}>{item.icon}</span>
                  {sidebarOpen && <span style={{marginLeft:10,fontSize:14}}>{item.label}</span>}
                  {sidebarOpen && activePage===item.id && <span style={{position:"absolute",right:14,width:6,height:6,borderRadius:"50%",background:"#7B5EA7"}} />}
                </div>
            ))}
          </nav>
          <div className="nav-btn" onClick={() => setActivePage("profile")} style={{display:"flex",alignItems:"center",padding:"10px 16px",margin:"2px 8px 12px",borderRadius:10,justifyContent:sidebarOpen?"flex-start":"center",cursor:"pointer",userSelect:"none",background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.25)"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"#31487A",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:activePage==="profile"?"2px solid #7B5EA7":"2px solid transparent",transition:"border-color .15s"}}>
              {profile.avatar
                  ? (() => { const a = AVATAR_ICONS.find(x => x.id === profile.avatar); return a ? <a.icon size={13} color="white" /> : <span style={{fontWeight:700,fontSize:11,color:"white"}}>{email[0].toUpperCase()}</span>; })()
                  : <span style={{fontWeight:700,fontSize:11,color:"white"}}>{email[0].toUpperCase()}</span>}
            </div>
            {sidebarOpen && (
                <div style={{marginLeft:10,display:"flex",flexDirection:"column",lineHeight:1.3,overflow:"hidden"}}>
                  <span style={{fontSize:13,fontWeight:600,color:activePage==="profile"?"#ffffff":"#D9E1F1"}}>Student Profile</span>
                  <span style={{fontSize:11,color:"var(--text3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{email}</span>
                </div>
            )}
          </div>
        </aside>

        <main style={s.main}>
          <header style={s.topbar}>
            <div>
              <div style={s.greeting}>Hello, <span style={{fontFamily:"'Fraunces',serif",fontStyle:"italic",color:"var(--primary)"}}>{displayName}!</span></div>
              <div style={{fontSize:13,color:"var(--accent2)",marginTop:2}}>{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            </div>

            {activePage === "dashboard" && (
                <SemesterSelect value={semester} onChange={setSemester} semesters={apiSemesters.map(s => s.semesterName)} />
            )}

            {/* widget toggle */}
            {activePage === "dashboard" && (
                <div ref={toggleRef} style={{position:"relative"}}>
                  <button onClick={() => setShowToggle(o=>!o)} style={sd.toggleBtn} title="Customize widgets">
                    <span style={{fontSize:12,fontWeight:600,color:"var(--primary)",marginLeft:4}}>Widgets</span>
                  </button>
                  {showToggle && <WidgetTogglePanel visible={visible} onToggle={toggleWidget} />}
                </div>
            )}

            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <button
                  onClick={() => window.location.reload()}
                  title="Refresh"
                  style={{...s.bell, fontSize:16, cursor:"pointer", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--primary)"}}
              >
                ↺
              </button>
              <div ref={notifRef} style={{position:"relative"}}>
                <button
                    onClick={() => { setShowNotifPanel(p => !p); if (unreadCount > 0) markAllAsRead(); }}
                    style={{...s.bell, position:"relative", border:"1px solid var(--border)", cursor:"pointer"}}
                    title="Notifications"
                >
                  <Bell size={18} color="var(--primary)" />
                  {unreadCount > 0 && (
                      <span style={{
                        position:"absolute", top:4, right:4,
                        background:"var(--primary)", color:"var(--surface)", borderRadius:"50%",
                        width:14, height:14, fontSize:9, fontWeight:700,
                        display:"flex", alignItems:"center", justifyContent:"center"
                      }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>
                {showNotifPanel && (
                    <div style={{
                      position:"absolute", top:46, right:0, width:320,
                      background:"var(--surface)", borderRadius:12,
                      boxShadow:"0 8px 32px rgba(49,72,122,0.13)",
                      border:"1px solid var(--border)", zIndex:9999, overflow:"hidden"
                    }}>
                      <div style={{padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                        <span style={{fontWeight:700, fontSize:13, color:"var(--primary)"}}>Notifications</span>
                        {notifications.length > 0 && <span style={{fontSize:11, color:"var(--text3)"}}>{notifications.length} total</span>}
                      </div>
                      <div style={{maxHeight:380, overflowY:"auto"}}>
                        {notifications.length === 0 ? (
                            <div style={{padding:"24px 16px", textAlign:"center", color:"var(--text3)", fontSize:13}}>No notifications</div>
                        ) : (
                            <>
                              {/* Overdue */}
                              {notifications.filter(n => n.urgency === "overdue").length > 0 && (
                                  <div>
                                    <div style={{padding:"7px 16px 5px", fontSize:10, fontWeight:700, color:"#B0270A", letterSpacing:"0.07em", textTransform:"uppercase"}}>
                                      Overdue
                                    </div>
                                    {notifications.filter(n => n.urgency === "overdue").map((n, i, arr) => (
                                        <div key={i} style={{
                                          padding:"9px 16px 10px",
                                          background:"var(--error-fg)",
                                          borderBottom: i < arr.length - 1 ? "1px solid var(--error-border)" : "1px solid var(--border)"
                                        }}>
                                          <div style={{fontSize:12, color:"var(--primary)", lineHeight:1.5}}>{n.message}</div>
                                          <div style={{fontSize:10, color:"var(--text3)", marginTop:3}}>
                                            {n.createdAt}
                                          </div>
                                        </div>
                                    ))}
                                  </div>
                              )}
                              {/* Due Today */}
                              {notifications.filter(n => n.urgency === "today").length > 0 && (
                                  <div>
                                    <div style={{padding:"7px 16px 5px", fontSize:10, fontWeight:700, color:"#D95F4B", letterSpacing:"0.07em", textTransform:"uppercase"}}>
                                      Due Today
                                    </div>
                                    {notifications.filter(n => n.urgency === "today").map((n, i, arr) => (
                                        <div key={i} style={{
                                          padding:"9px 16px 10px",
                                          background:"var(--surface)",
                                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "1px solid var(--border)"
                                        }}>
                                          <div style={{fontSize:12, color:"var(--primary)", lineHeight:1.5}}>{n.message}</div>
                                          <div style={{fontSize:10, color:"var(--text3)", marginTop:3}}>
                                            {n.createdAt}
                                          </div>
                                        </div>
                                    ))}
                                  </div>
                              )}
                              {/* Due Tomorrow */}
                              {notifications.filter(n => n.urgency === "tomorrow").length > 0 && (
                                  <div>
                                    <div style={{padding:"7px 16px 5px", fontSize:10, fontWeight:700, color:"#C07830", letterSpacing:"0.07em", textTransform:"uppercase"}}>
                                      Due Tomorrow
                                    </div>
                                    {notifications.filter(n => n.urgency === "tomorrow").map((n, i, arr) => (
                                        <div key={i} style={{
                                          padding:"9px 16px 10px",
                                          background:"var(--surface)",
                                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "1px solid var(--border)"
                                        }}>
                                          <div style={{fontSize:12, color:"var(--primary)", lineHeight:1.5}}>{n.message}</div>
                                          <div style={{fontSize:10, color:"var(--text3)", marginTop:3}}>
                                            {n.createdAt}
                                          </div>
                                        </div>
                                    ))}
                                  </div>
                              )}
                              {/* Due in 3 Days */}
                              {notifications.filter(n => n.urgency === "3day").length > 0 && (
                                  <div>
                                    <div style={{padding:"7px 16px 5px", fontSize:10, fontWeight:700, color:"var(--accent)", letterSpacing:"0.07em", textTransform:"uppercase"}}>
                                      Due in 3 Days
                                    </div>
                                    {notifications.filter(n => n.urgency === "3day").map((n, i, arr) => (
                                        <div key={i} style={{
                                          padding:"9px 16px 10px",
                                          background:"var(--surface)",
                                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none"
                                        }}>
                                          <div style={{fontSize:12, color:"var(--primary)", lineHeight:1.5}}>{n.message}</div>
                                          <div style={{fontSize:10, color:"var(--text3)", marginTop:3}}>
                                            {n.createdAt}
                                          </div>
                                        </div>
                                    ))}
                                  </div>
                              )}
                            </>
                        )}
                      </div>
                    </div>
                )}
              </div>
            </div>


          </header>

          {activePage === "dashboard" && (
              <div style={s.grid}>

                {visible.courses && (
                    <section className="card-anim" style={{...s.card, gridColumn:"span 2"}}>
                      <SectionTitle>My Courses — {semester}</SectionTitle>
                      {semCourseList.length === 0
                          ? <div style={{fontSize:13,color:"var(--text3)",marginTop:16,textAlign:"center",padding:"20px 0"}}>No courses registered for this semester yet.</div>
                          : <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:14}}>
                            {semCourseList.map(c => (
                                <div key={c.id} className="course-card"
                                     onClick={() => {
                                      const token = localStorage.getItem("kk_token");
                                      fetch(`http://localhost:8080/api/courses/search?query=${encodeURIComponent(c.name)}`, {
                                        headers: { "Authorization": "Bearer " + token }
                                      })
                                        .then(r => r.json())
                                        .then(results => {
                                          const match = results.find(r => r.courseCode === c.name);
                                          if (match) {
                                            setCourseDetailsTarget({ id: match.id, courseCode: match.courseCode, title: match.title });
                                            setActivePage("courseDetails");
                                          }
                                        })
                                        .catch(() => {});
                                    }}
                                     style={{...s.courseCard, border: `2px solid ${courseColors[c.name] || "var(--text2)"}`}}>
                                  <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                                    <div style={{fontWeight:700, fontSize:15, color:"var(--primary)"}}>{c.name}</div>
                                    <label style={{
                                      width:20, height:20, borderRadius:"50%",
                                      background: courseColors[c.name] || "var(--text2)",
                                      cursor:"pointer", flexShrink:0,
                                      boxShadow:"0 1px 4px rgba(0,0,0,0.15)",
                                      border:"2px solid white",
                                      display:"inline-block",
                                      transition:"transform .15s, box-shadow .15s ease",
                                    }}>
                                      <input
                                          type="color"
                                          value={courseColors[c.name] || "var(--text2)"}
                                          onChange={e => { e.stopPropagation(); saveCourseColor(c.name, e.target.value); }}
                                          style={{ opacity:0, width:0, height:0, position:"absolute" }}
                                      />
                                    </label>
                                  </div>
                                  {courseSyllabi[c.name] ? (
                                      <div style={{ marginTop:8, fontSize:11, color:"var(--success-bg)", background:"var(--success)", border:"1px solid #b7dfc5", borderRadius:6, padding:"3px 8px", display:"flex", alignItems:"center", gap:4 }}>
                                        <span>✓</span> Syllabus uploaded
                                      </div>
                                  ) : (
                                      <button
                                          onClick={e => { e.stopPropagation(); setSyllabusTarget(c.name); }}
                                          style={{ marginTop:8, fontSize:11, color:"var(--accent)", background:"none", border:"1px solid var(--border)", borderRadius:6, padding:"3px 8px", cursor:"pointer", width:"100%", textAlign:"left" }}
                                      >
                                        + Upload Syllabus
                                      </button>
                                  )}
                                  {courseOfficeHours[c.name]?.length > 0 && (
                                      <div style={{ marginTop:6 }}>
                                        <button
                                            onClick={e => { e.stopPropagation(); setExpandedOH(p => ({ ...p, [c.name]: !p[c.name] })); }}
                                            style={{ fontSize:11, color:"var(--accent2)", background:"none", border:"none", padding:0, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}
                                        >
                                          <span style={{ fontSize:9 }}>{expandedOH[c.name] ? "▼" : "▶"}</span> Office Hours
                                        </button>
                                        {expandedOH[c.name] && (
                                            <div style={{ marginTop:4, paddingLeft:4 }}>
                                              {courseOfficeHours[c.name].map((oh, i) => (
                                                  <div key={i} style={{ fontSize:11, color:"var(--text)", lineHeight:1.5 }}>
                                                    {[oh.day, oh.time, oh.location].filter(Boolean).join(" · ")}
                                                  </div>
                                              ))}
                                            </div>
                                        )}
                                      </div>
                                  )}
                                </div>
                            ))}
                          </div>
                      }
                    </section>
                )}

                {visible.gpa && (
                    <section className="card-anim" style={s.card}>
                      <SectionTitle>GPA — {semester}</SectionTitle>
                      {(() => {
                        const gradePoints = {"A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0};
                        const validCourses = courses => (courses||[]).filter(c => c.grade && gradePoints[c.grade?.trim().toUpperCase()] !== undefined && Number(c.credits) > 0);
                        const calcGPA = courses => {
                          const v = validCourses(courses);
                          if (!v.length) return null;
                          const pts = v.reduce((sum, c) => sum + gradePoints[c.grade.trim().toUpperCase()] * Number(c.credits), 0);
                          const creds = v.reduce((sum, c) => sum + Number(c.credits), 0);
                          return { gpa: (pts / creds).toFixed(2), creds, count: v.length };
                        };
                        const gpaColor = g => parseFloat(g) >= 3.7 ? "#27ae60" : parseFloat(g) >= 3.0 ? "#2980b9" : parseFloat(g) >= 2.0 ? "#e67e22" : "var(--error)";

                        const currentSem = apiSemesters.find(s => s.semesterName === semester);
                        const semResult = calcGPA(currentSem?.courses);

                        if (semResult) return (
                            <div style={{textAlign:"center", padding:"20px 0"}}>
                              <div style={{fontFamily:"'Fraunces',serif", fontSize:48, fontWeight:700, color:gpaColor(semResult.gpa), lineHeight:1}}>{semResult.gpa}</div>
                              <div style={{fontSize:12, color:"var(--text2)", marginTop:6}}>{semResult.creds} credits · {semResult.count} courses</div>
                            </div>
                        );

                        const allCourses = apiSemesters.flatMap(s => s.courses || []);
                        const cumResult = calcGPA(allCourses);

                        if (cumResult) return (
                            <div style={{textAlign:"center", padding:"20px 0"}}>
                              <div style={{fontFamily:"'Fraunces',serif", fontSize:48, fontWeight:700, color:gpaColor(cumResult.gpa), lineHeight:1}}>{cumResult.gpa}</div>
                              <div style={{fontSize:12, color:"var(--text2)", marginTop:6}}>Cumulative GPA · {cumResult.creds} credits</div>
                            </div>
                        );

                        if (profile.cumGPA) return (
                            <div style={{textAlign:"center", padding:"20px 0"}}>
                              <div style={{fontFamily:"'Fraunces',serif", fontSize:48, fontWeight:700, color:gpaColor(profile.cumGPA), lineHeight:1}}>{parseFloat(profile.cumGPA).toFixed(2)}</div>
                              <div style={{fontSize:12, color:"var(--text2)", marginTop:6}}>Cumulative GPA (from profile)</div>
                              <div style={{fontSize:11, color:"#D4C9E8", marginTop:4}}>No semester data yet</div>
                            </div>
                        );

                        return (
                            <div style={{fontSize:13, color:"var(--text3)", textAlign:"center", padding:"24px 0"}}>
                              No grades recorded yet.
                            </div>
                        );
                      })()}
                    </section>
                )}

                {visible.progress && (
                    <section className="card-anim" style={s.card}>
                      <SectionTitle>Semester Progress</SectionTitle>
                      <div style={{marginTop:18,display:"flex",gap:10}}>
                        {[{label:"Courses",val:semCourseList.length||"—"},{label:"To-Do",val:todos.filter(t=>!t.done).length},{label:"Due Today", val: tasks.filter(t => !t.done && t.due?.slice(0,10) === new Date().toISOString().slice(0,10)).length}].map(chip=>(
                            <div key={chip.label} style={s.chip}>
                              <div style={{fontSize:11,color:"var(--text2)"}}>{chip.label}</div>
                              <div style={{fontWeight:600,fontSize:13,color:"var(--primary)"}}>{chip.val}</div>
                            </div>
                        ))}
                      </div>
                    </section>
                )}

                {visible.todo && (
                    <section className="card-anim" style={s.card}>
                      <SectionTitle>To-Do List</SectionTitle>
                      <div style={{display:"flex",gap:8,marginTop:14}}>
                        <input value={todoInput} onChange={e=>{setTodoInput(e.target.value);setTodoError(false);}} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="Add a task…" style={{...s.todoInput, borderColor: todoError ? "var(--error)" : "var(--border)"}}/>
                        <button className="add-btn" onClick={addTodo} style={s.addBtn}>+</button>
                      </div>
                      {todoError && <div style={{fontSize:12,color:"var(--error)",marginTop:4}}>Please type a task first, then add.</div>}
                      <div style={{marginTop:10,maxHeight:160,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
                        {todos.length===0 && <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"16px 0"}}>No tasks yet!</div>}
                        {todos.map(t=>(
                            <div key={t.id} className="todo-row" style={s.todoRow}>
                      <span onClick={()=>toggleTodo(t.id)} style={{fontSize:13,flex:1,cursor:"pointer",textDecoration:t.done?"line-through":"none",color:t.done?"var(--text3)":"var(--text)"}}>
                        {t.done?"":<LayoutList size={13} style={{verticalAlign:"middle",marginRight:4}}/>}{t.text}
                      </span>
                              <button onClick={()=>deleteTodo(t.id)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:12}}>✕</button>
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
                    <section className="card-anim" style={{...s.card, position:"relative"}}>
                      <SectionTitle>Calendar</SectionTitle>
                      <div style={{marginTop:14}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                          <button onClick={prevMonth} style={s.calNavBtn}>‹</button>
                          <span style={{fontWeight:600,fontSize:14,color:"var(--primary)"}}>{monthName} {calYear}</span>
                          <button onClick={nextMonth} style={s.calNavBtn}>›</button>
                        </div>

                        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=>(
                              <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"var(--text3)",padding:"2px 0"}}>{d}</div>
                          ))}
                        </div>

                        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                          {calCells.map((d,i) => {
                            const dayTasks = d ? (tasksByDate[calKey(d)] || []) : [];
                            return (
                                <div key={i} className={d?"cal-day":""} style={{
                                  display:"flex", flexDirection:"column", alignItems:"center",
                                  borderRadius:6, cursor:d?"pointer":"default",
                                  background:isToday(d)?"var(--primary)":"transparent",
                                  paddingBottom: dayTasks.length ? 3 : 0,
                                }}>
                                  {/* day number */}
                                  <div style={{
                                    minHeight:28, display:"flex", alignItems:"center", justifyContent:"center",
                                    fontSize:12, width:"100%",
                                    color:isToday(d)?"#fff":d?"var(--text)":"transparent",
                                    fontWeight:isToday(d)?700:400,
                                  }}>
                                    {d||""}
                                  </div>

                                  {/* colored task lines */}
                                  {dayTasks.map((t, ti) => {
                                    const color = t.done ? "#27ae60": new Date(t.due) < new Date() ? "var(--error)": courseColors[t.course] || "var(--text2)";
                                    return (
                                        <div
                                            key={ti}
                                            onMouseEnter={e => {
                                              const rect = e.target.getBoundingClientRect();
                                              const cardRect = e.target.closest("section").getBoundingClientRect();
                                              setHoveredTask({
                                                task: t,
                                                x: rect.left - cardRect.left,
                                                y: rect.bottom - cardRect.top + 4,
                                              });
                                            }}
                                            onMouseLeave={() => setHoveredTask(null)}
                                            onClick={() => { setEditingTask(t); setActivePage("tasks"); }}
                                            style={{
                                              width:"90%", height:3, borderRadius:2,
                                              background: color, marginBottom:1,
                                              cursor:"pointer", transition:"height .1s",
                                            }}
                                            className="cal-task-line"
                                        />
                                    );
                                  })}
                                </div>
                            );
                          })}
                        </div>

                        <div style={{marginTop:10,fontSize:11,color:"var(--text3)",textAlign:"center"}}>
                          Today is {today.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                        </div>
                      </div>

                      {/* Hover tooltip */}
                      {hoveredTask && (
                          <div style={{
                            position:"absolute",
                            left: Math.min(hoveredTask.x, 220),
                            top: hoveredTask.y,
                            background:"var(--surface)",
                            border:"1px solid var(--border)",
                            borderRadius:10,
                            padding:"9px 13px",
                            boxShadow:"0 6px 24px rgba(49,72,122,0.13)",
                            zIndex:300,
                            minWidth:170,
                            maxWidth:220,
                            pointerEvents:"none",
                          }}>
                            <div style={{fontSize:11,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>
                              {hoveredTask.task.type} · {hoveredTask.task.course}
                            </div>
                            <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:4,lineHeight:1.3}}>
                              {hoveredTask.task.title}
                            </div>
                            <div style={{fontSize:11,color:"var(--text3)"}}>
                              {hoveredTask.task.due
                                  ? new Date(hoveredTask.task.due).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false})
                                  : "No due date"}
                            </div>
                            {hoveredTask.task.done && (
                                <div style={{fontSize:11,color:"#27ae60",fontWeight:600,marginTop:4}}>✓ Completed</div>
                            )}
                            {!hoveredTask.task.done && new Date(hoveredTask.task.due) < new Date() && (
                                <div style={{fontSize:11,color:"var(--error)",fontWeight:600,marginTop:4}}>Overdue</div>
                            )}
                          </div>
                      )}
                    </section>
                )}

                {visible.schedule && (
                    <section className="card-anim" style={s.card}>
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
                        <SectionTitle>Weekly Schedule</SectionTitle>
                        <button onClick={() => setActivePage("planner")} style={sd.smallAddBtn}>
                          Open Planner →
                        </button>
                      </div>

                      {(() => {
                        const weekStartDate = (() => {
                          const d = new Date();
                          const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
                          d.setDate(d.getDate() + diff + schedWeekOffset * 7);
                          return d;
                        })();

                        const weekEndDate = new Date(weekStartDate);
                        weekEndDate.setDate(weekStartDate.getDate() + 6);
                        const fmtDate = d => d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
                        return (
                            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, background:"var(--surface2)", borderRadius:10, padding:"6px 10px"}}>
                              <button onClick={() => setSchedWeekOffset(o => o - 1)} style={{background:"none", border:"1px solid var(--border)", borderRadius:7, width:26, height:26, cursor:"pointer", fontSize:14, color:"#8FB3E2", display:"flex", alignItems:"center", justifyContent:"center"}}>‹</button>
                              <span style={{fontSize:12, fontWeight:600, color:"var(--primary)"}}>
                              {schedWeekOffset === 0 ? "This Week" : schedWeekOffset === 1 ? "Next Week" : schedWeekOffset === -1 ? "Last Week" : `${fmtDate(weekStartDate)} – ${fmtDate(weekEndDate)}`}
                                <span style={{fontWeight:400, color:"var(--text2)", marginLeft:6}}>{fmtDate(weekStartDate)} – {fmtDate(weekEndDate)}</span>
                              </span>
                              <button onClick={() => setSchedWeekOffset(o => o + 1)} style={{background:"none", border:"1px solid var(--border)", borderRadius:7, width:26, height:26, cursor:"pointer", fontSize:14, color:"#8FB3E2", display:"flex", alignItems:"center", justifyContent:"center"}}>›</button>
                            </div> );
                      })()}

                      <div style={{display:"flex", flexDirection:"column", gap:6, maxHeight:220, overflowY:"auto"}}>
                        {(() => {
                          const DAY_KEYS   = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
                          const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
                          const hasBlocks  = DAY_KEYS.some(k => (studyBlocks[k]||[]).length > 0);
                          const hasSlots   = DAY_KEYS.some(k => (studySlots[k]||[]).length > 0);

                          if (!hasBlocks && !hasSlots) return (
                              <div style={{fontSize:13, color:"var(--text3)", textAlign:"center", padding:"20px 0"}}>
                                No schedule for this week — open the planner to generate one!
                              </div> );

                          const fmt = timeStr => {
                            if (!timeStr) return "";
                            const parts = Array.isArray(timeStr) ? timeStr : timeStr.split(":");
                            return `${String(parts[0]).padStart(2,"0")}:${String(parts[1]||0).padStart(2,"0")}`;
                          };

                          const fmtH = h => `${String(Math.floor(h)).padStart(2,"0")}:${String(Math.round((h%1)*60)).padStart(2,"0")}`;
                          const PALETTE = ["var(--accent2)","#31487A","#2d7a4a","#7a4a2d","#7a2d5a","#2d5a7a","#6b2d7a"];
                          const entryLookup = {};
                          studyEntries.forEach((e, idx) => {
                            const entryIdStr = String(e.id);
                            const course = e.task?.course || "";
                            const title  = e.task?.title  || "Study";
                            const label  = course ? `${course} — ${title}` : title;
                            const color  = schedColorMap[entryIdStr] || courseColors[course] || PALETTE[idx % PALETTE.length];
                            entryLookup[entryIdStr] = { label, color };
                          });

                          return DAY_KEYS.map((key, i) => {
                            const blocks = (studyBlocks[key] || []).slice().sort((a,b) => fmt(a.startTime).localeCompare(fmt(b.startTime)));
                            const slots  = studySlots[key] || [];
                            if (!blocks.length && !slots.length) return null;

                            return (
                                <div key={key} style={{marginBottom:2}}>
                                  <div style={{fontSize:11, fontWeight:700, color:"#8FB3E2", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em"}}>
                                    {DAY_LABELS[i]}
                                  </div>

                                  {blocks.map((b, bi) => {
                                    const startH = Array.isArray(b.startTime)
                                        ? b.startTime[0] + b.startTime[1]/60
                                        : parseFloat(b.startTime?.split(":")[0]||0) + parseFloat(b.startTime?.split(":")[1]||0)/60;
                                    const endH = startH + (b.duration || 1);
                                    const info  = entryLookup[String(b.studyPlanEntryId)] || {};
                                    const color = info.color || "#7B5EA7";
                                    const label = info.label || "Study Block";
                                    return (
                                        <div key={bi} style={{
                                          display:"flex", alignItems:"center", justifyContent:"space-between",
                                          padding:"6px 10px", borderRadius:8, marginBottom:4,
                                          background: b.completed ? "#f5f5f5" : color + "18",
                                          borderLeft: `3px solid ${b.completed ? "#ccc" : color}`,
                                          opacity: b.completed ? 0.65 : 1,
                                        }}>
                                          <div style={{minWidth:0}}>
                                          <span style={{fontSize:12, fontWeight:700, color: b.completed ? "#aaa" : color, display:"block", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}> {label}
                                          </span>
                                          <span style={{fontSize:11, color:"var(--text3)"}}>
                                          {fmtH(startH)} – {fmtH(endH)} · {b.duration}h
                                        </span>
                                          </div>
                                          {b.completed
                                              ? <span style={{fontSize:10, background:"#eef7f0", color:"#2d7a4a", padding:"2px 6px", borderRadius:4, fontWeight:600, flexShrink:0}}>✓ Done</span>
                                              : <span style={{fontSize:10, background:color+"22", color, padding:"2px 6px", borderRadius:4, fontWeight:600, flexShrink:0}}>{b.duration}h</span>
                                          }
                                        </div>
                                    );
                                  })}

                                  {!blocks.length && slots.map((slot, si) => (
                                      <div key={si} style={{
                                        display:"flex", alignItems:"center", justifyContent:"space-between",
                                        padding:"6px 10px", borderRadius:8, marginBottom:4,
                                        background:"var(--blue2-bg)", borderLeft:"3px solid var(--border2)",
                                      }}>    <div>
                                        <span style={{fontSize:12, fontWeight:600, color:"var(--primary)"}}>{fmt(slot.startTime)} – {fmt(slot.endTime)}</span>
                                        <div style={{fontSize:11, color:"var(--text2)", marginTop:1}}>Available slot</div>
                                      </div>
                                        <span style={{fontSize:10, background:"var(--blue2-bg)", color:"var(--primary)", padding:"2px 6px", borderRadius:4, flexShrink:0}}>Free</span>
                                      </div>
                                  ))}
                                </div>
                            );
                          });
                        })()}
                      </div>
                    </section>
                )}

                {visible.courseGrades && (
                  <CourseGradeSummaryWidget apiSemesters={apiSemesters} selectedSemester={semester}/>
                )}

                {visible.gpasummary && (
                  <GPASummaryWidget apiSemesters={apiSemesters} selectedSemester={semester} onNavigate={setActivePage} />
                )}

              </div>
          )}

          {activePage === "grades" && <GradeCalculator dashboardCourses={dashboardCourses} savedSemesters={apiSemesters} selectedSemester={semester} />}
          {activePage === "tasks" && (
              <TaskManager
                  tasks={tasks}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onSave={upsertTask}
                  initialEditTask={editingTask}
                  key={editingTask?.id || "tasks"}
                  onNavigate={setActivePage}
              />
          )}
          {activePage === "reviews" && <Reviews initialCourse={courseDetailsTarget} />}
          {activePage === "planner" && <StudyPlanner />}
          {activePage === "profile" && (
              <Profile onProfileSave={p => setProfile(p)} onLogout={handleLogout} />
          )}

          {activePage === "courseDetails" && courseDetailsTarget && (
            <CourseDetails
              course={courseDetailsTarget}
              onBack={() => setActivePage("dashboard")}
            />
          )}

        </main>

        {syllabusTarget && (
            <SyllabusModal
                courseName={syllabusTarget}
                onClose={() => setSyllabusTarget(null)}
                onApply={data => {
                  const name = syllabusTarget;
                  setSyllabusTarget(null);
                  if (data) {
                    if (data.officeHours?.length) saveCourseOfficeHours(name, data.officeHours);
                    // Save syllabus extract for GradeCalculator to pick up
                    if (data.assessments?.length || data.finalExamWeight) {
                      try {
                        const all = JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}");
                        const next = { ...all, [name]: { assessments: data.assessments || [], finalExamWeight: data.finalExamWeight ?? null } };
                        localStorage.setItem("kk_course_syllabus", JSON.stringify(next));
                        setCourseSyllabi(next);
                      } catch {}
                    }
                    if (data.assessments) {
                      setSyllabusCalcData(data);
                    }
                  }
                }}
            />
        )}
      </div>
  );
}

const s = {
  root:         { display:"flex", minHeight:"100vh", background:"var(--bg)", fontFamily:"'DM Sans',sans-serif" },
  sidebar:      { display:"flex", flexDirection:"column", background:"#31487A", height:"100vh", position:"sticky", top:0, transition:"width 0.25s ease", overflow:"hidden", flexShrink:0, zIndex:100 },
  sidebarTop:   { display:"flex", alignItems:"center", gap:10, padding:"22px 16px 16px", borderBottom:"1px solid rgba(255,255,255,0.1)" },
  logoMark:     { width:34, height:34, borderRadius:10, background:"#7B5EA7", color:"white", fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  logoLabel:    { fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:18, color:"#ffffff", whiteSpace:"nowrap" },
  userPill:     { display:"flex", alignItems:"center", gap:10, margin:"12px 12px 6px", padding:"10px 12px", background:"rgba(255,255,255,0.08)", borderRadius:12 },
  avatar:       { width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg, #8FB3E2, #A59AC9)", color:"white", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  collapseBtn:  { margin:"8px auto", display:"block", background:"none", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"4px 10px", cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:12 },
  main:         { flex:1, overflowY:"auto", minHeight:"100vh" },
  topbar:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", background:"var(--bg)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:50, borderBottom:"1px solid var(--border)", gap:14, flexWrap:"wrap" },
  greeting:     { fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:20, color:"var(--primary)" },
  bell:         { width:38, height:38, borderRadius:10, background:"var(--surface)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 },
  grid:         { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:20, padding:"24px 28px 40px" },
  card:         { background:"var(--surface)", borderRadius:18, padding:"20px 22px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid var(--border)" },
  courseCard:   { background:"var(--bg)", borderRadius:12, padding:"12px 14px", minWidth:140, flex:"1 1 140px", boxShadow:"0 2px 8px rgba(49,72,122,0.08)" },
  progressTrack:{ height:10, background:"#D9E1F1", borderRadius:10, overflow:"hidden" },
  progressFill: { height:"100%", background:"linear-gradient(90deg, #31487A, #8FB3E2)", borderRadius:10, transition:"width 0.6s ease" },
  chip:         { flex:1, background:"var(--surface2)", borderRadius:10, padding:"8px 12px", textAlign:"center" },
  todoInput:    { flex:1, padding:"9px 12px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"var(--surface2)", color:"var(--text)" },
  addBtn:       { padding:"9px 16px", background:"var(--primary)", color:"white", border:"none", borderRadius:10, fontSize:18, cursor:"pointer", lineHeight:1 },
  todoRow:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:8, background:"var(--surface2)" },
  reviewCard:   { flex:"1 1 260px", background:"var(--bg)", borderRadius:12, padding:"14px 16px" },
  calNavBtn:    { background:"none", border:"1px solid var(--border)", borderRadius:8, width:28, height:28, cursor:"pointer", fontSize:16, color:"#8FB3E2", display:"flex", alignItems:"center", justifyContent:"center" },
};

const sd = {
  trigger: { display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 1px 4px rgba(49,72,122,0.06)" },
  dropdown: { position:"absolute", top:"calc(100% + 8px)", left:0, minWidth:200, background:"var(--surface)", borderRadius:14, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:"6px", overflow:"hidden" },
  option: { padding:"10px 14px", borderRadius:10, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", transition:"background .12s", display:"flex", alignItems:"center" },
  toggleBtn: { display:"flex", alignItems:"center", padding:"8px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:15 },
  togglePanel: { position:"absolute", top:"calc(100% + 8px)", right:0, width:220, background:"var(--surface)", borderRadius:14, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:"14px" },
  smallAddBtn: { fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:8, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--primary)", cursor:"pointer" },
  addEventForm: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:12, padding:"12px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)", alignItems:"center" },
  miniSelect: { padding:"6px 8px", border:"1px solid var(--border)", borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", cursor:"pointer", outline:"none" },
  miniInput: { padding:"6px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", outline:"none" },
  miniSaveBtn: { padding:"6px 14px", background:"var(--primary)", color:"white", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" },
};