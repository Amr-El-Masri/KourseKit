import { useState, useRef, useEffect, useCallback } from "react";
import { initE2EE } from "./e2ee";
import GradeCalculator from "./GradeCalculator";
import Reviews from "./Reviews";
import TaskManager from "./TaskManager";
import Profile, { DefaultScheduleEditor } from "./Profile";
import Settings from "./Settings";
import StudyPlanner from "./StudyPlanner";
import CourseDetails from "./CourseDetails";
import SyllabusModal from "./SyllabusModal";
import TranscriptModal from "./TranscriptModal";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./ThemeContext";
import StudentDirectory from "./StudentDirectoryPanel";
import Forum from "./Forum";
import StudyGroupFinder from "./StudyGroupFinder";
import { LayoutDashboard, Calculator, CheckSquare, Star, User, BookOpen, Bell, Pause, Play, Power, LayoutList, Banana, Cat, Eclipse, Dog, Telescope, Panda, Settings as SettingsIcon, MessageSquare, Users, Plus } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

const AVATAR_ICONS = [
  { id:"Banana", icon: Banana },
  { id:"Telescope", icon: Telescope },
  { id:"Eclipse", icon: Eclipse },
  { id:"Cat", icon: Cat },
  { id:"Dog", icon: Dog },
  { id:"Panda", icon: Panda },
];

const DAYS_OF_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const utcToLocalInput = iso => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const GC_COMP_TYPES = ["Midterm Exam","Final Exam","Assignment","Project","Quiz","Lab","Presentation","Attendance","Participation","Other"];

function inferGCType(name) {
  const n = (name || "").toLowerCase();
  if (/midterm/.test(n)) return "Midterm Exam";
  if (/final/.test(n)) return "Final Exam";
  if (/quiz/.test(n)) return "Quiz";
  if (/project/.test(n)) return "Project";
  if (/lab/.test(n)) return "Lab";
  if (/presentation/.test(n)) return "Presentation";
  if (/^attendance$/.test(n)) return "Attendance";
  if (/^participation$/.test(n)) return "Participation";
  const exact = GC_COMP_TYPES.find(t => t.toLowerCase() === n);
  if (exact) return exact;
  return "Other";
}
const EVENT_TYPES  = [
  { label:"Class",   color:"var(--primary)",  bg:"var(--blue-light-bg)" },
  { label:"Gym",     color:"var(--success)",  bg:"var(--success-bg)" },
  { label:"Study",   color:"var(--accent2)",  bg:"var(--surface3)" },
  { label:"Meeting", color:"var(--accent)",   bg:"var(--surface2)" },
  { label:"Other",   color:"var(--text2)",    bg:"var(--bg)" },
];

const ALL_WIDGETS = [
  { id:"courses",       label:"My Courses",              span:3, pinned:true },
  { id:"progress",      label:"Semester Overview",       span:1 },
  { id:"todo",          label:"To-Do List",              span:1 },
  { id:"pomodoro",      label:"Pomodoro Timer",          span:1 },
  { id:"calendar",      label:"Calendar & Deadlines",    span:1 },
  { id:"schedule",      label:"Course Schedule",         span:1 },
  { id:"grades",        label:"Academic Performance",    span:1 },
  { id:"streak",        label:"Streak",                  span:1 },
  { id:"notepad",       label:"Notepad",                 span:1 },
  { id:"examcountdown", label:"Exam Countdown",          span:1 },
  { id:"todayclasses",  label:"Today's Classes",         span:1 },
  { id:"officehours",   label:"Office Hours",            span:1 },
  { id:"taskbreakdown", label:"Task Breakdown",          span:1 },
  { id:"studysessions",   label:"Study Sessions",          span:1 },
  { id:"gpasimulator",   label:"GPA Simulator",           span:1 },
  { id:"prioritytasks",  label:"Priority Tasks",          span:1 },
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


function PomodoroTimer() {
  const [durations, setDurations] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("kk_pomodoro") || "{}");
      return { focus: s.focus ?? 25, short: s.short ?? 5, long: s.long ?? 15 };
    } catch { return { focus: 25, short: 5, long: 15 }; }
  });
  const [draft, setDraft] = useState(durations);
  const [showOpts, setShowOpts] = useState(false);

  const MODES = [
    { label:"Focus",       key:"focus", color:"var(--primary)" },
    { label:"Short Break", key:"short", color:"var(--accent2)" },
    { label:"Long Break",  key:"long",  color:"var(--text2)"   },
  ];

  const [modeIdx,  setModeIdx]  = useState(0);
  const [timeLeft, setTimeLeft] = useState(durations.focus * 60);
  const [running,  setRunning]  = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef  = useRef(null);
  const modeIdxRef   = useRef(modeIdx);
  const durationsRef = useRef(durations);

  useEffect(() => { modeIdxRef.current = modeIdx; }, [modeIdx]);
  useEffect(() => { durationsRef.current = durations; }, [durations]);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if (modeIdxRef.current === 0) setSessions(s => s + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mode = MODES[modeIdx];
  const dur  = durations[mode.key] * 60;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const pct  = dur > 0 ? 1 - timeLeft / dur : 0;
  const r = 46, circ = 2 * Math.PI * r;

  const switchMode = idx => {
    setRunning(false);
    setModeIdx(idx);
    const key = MODES[idx].key;
    setTimeLeft(durations[key] * 60);
  };

  const reset = () => { setRunning(false); setTimeLeft(dur); };

  const saveOptions = () => {
    const validated = {
      focus: Math.max(1, Math.min(120, Number(draft.focus) || 25)),
      short: Math.max(1, Math.min(60,  Number(draft.short) || 5)),
      long:  Math.max(1, Math.min(120, Number(draft.long)  || 15)),
    };
    setDurations(validated);
    setDraft(validated);
    localStorage.setItem("kk_pomodoro", JSON.stringify(validated));
    setRunning(false);
    setTimeLeft(validated[mode.key] * 60);
    setShowOpts(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,paddingTop:6}}>
      <div style={{display:"flex",gap:4,background:"var(--surface2)",padding:4,borderRadius:12,width:"100%"}}>
        {MODES.map((m,i) => (
          <button key={m.label} className="kk-tab" data-active={modeIdx===i} onClick={() => switchMode(i)} style={{
            flex:1,padding:"6px 0",border:"none",borderRadius:8,fontSize:11,fontWeight:600,
            cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s",
            background: modeIdx===i ? `color-mix(in srgb, ${m.color} 15%, transparent)` : "transparent",
            color: modeIdx===i ? m.color : "var(--text2)",
          }}>{m.label}</button>
        ))}
      </div>

      <div key={`${modeIdx}-${durations[mode.key]}`} className="card-anim" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,width:"100%"}}>
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
          <button className="kk-pill" onClick={reset} style={{padding:"7px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:9,fontSize:12,cursor:"pointer",color:"var(--text2)",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>↺ Reset</button>
          <button className="kk-pill" onClick={() => setRunning(r => !r)} style={{
            padding:"7px 22px",
            background: running ? "color-mix(in srgb, #e07070 15%, transparent)" : `color-mix(in srgb, ${mode.color} 15%, transparent)`,
            color: running ? "#e07070" : mode.color,
            border: `1px solid color-mix(in srgb, ${running?"#e07070":mode.color} 30%, transparent)`,
            borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s",
          }}>{running ? <><Pause size={13} style={{verticalAlign:"middle",marginRight:4}}/>Pause</> : <><Play size={13} style={{verticalAlign:"middle",marginRight:4}}/>Start</>}</button>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--text2)"}}>
          <span style={{color:"var(--primary)",fontWeight:600}}>{sessions}</span>
          <span>session{sessions!==1?"s":""} completed</span>
          <button onClick={() => { setShowOpts(o => !o); setDraft(durations); }} style={{marginLeft:4,background:"none",border:"none",cursor:"pointer",fontSize:11,color:"var(--text3)",padding:0,fontFamily:"inherit"}}>
            {showOpts ? "✕ cancel" : "⚙ options"}
          </button>
        </div>

        {showOpts && (
          <div style={{width:"100%",background:"var(--surface2)",borderRadius:10,padding:"12px 14px",border:"1px solid var(--border)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Timer Durations (minutes)</div>
            {[{key:"focus",label:"Focus"},{key:"short",label:"Short Break"},{key:"long",label:"Long Break"}].map(({key,label}) => (
              <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:"var(--text)"}}>{label}</span>
                <input type="number" min="1" max="120" value={draft[key]}
                  onChange={e => setDraft(d => ({...d, [key]: e.target.value}))}
                  style={{width:56,padding:"4px 8px",border:"1px solid var(--border)",borderRadius:6,fontSize:12,fontFamily:"inherit",background:"var(--surface)",color:"var(--text)",textAlign:"center",outline:"none"}}
                />
              </div>
            ))}
            <button onClick={saveOptions} style={{width:"100%",marginTop:4,padding:"7px 0",background:`color-mix(in srgb, var(--primary) 15%, transparent)`,color:"var(--primary)",border:"1px solid color-mix(in srgb, var(--primary) 30%, transparent)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseGradeSummaryWidget({ apiSemesters, selectedSemester, footer, onUploadTranscript }) {
  const gradePoints = {"A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0};

  const semObj = apiSemesters.find(s => s.semesterName === selectedSemester);
  const courses = (semObj?.courses || []).filter(c => c.courseCode && !c.componenttype);

  const [selectedCourse, setSelectedCourse] = useState(() => sessionStorage.getItem("kk_dash_gb_course") || "");

  useEffect(() => {
    const saved = sessionStorage.getItem("kk_dash_gb_course");
    const valid = courses.find(c => c.courseCode === saved);
    setSelectedCourse(valid ? saved : (courses[0]?.courseCode || ""));
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
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <div style={{ fontSize:13, color:"var(--text3)", marginBottom:10 }}>No grade data for this semester.</div>
              <span style={{ fontSize:12, fontWeight:600, color:"var(--accent)", background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontFamily:"inherit" }} onClick={onUploadTranscript}>Upload transcript to fill in →</span>
            </div>
        ) : (
            <>
              {/* Course picker — only courses from the selected semester */}
              <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
                {courses.map(c => (
                    <button
                        key={c.courseCode}
                        className="kk-pill"
                        data-active={selectedCourse === c.courseCode}
                        onClick={() => { setSelectedCourse(c.courseCode); sessionStorage.setItem("kk_dash_gb_course", c.courseCode); }}
                        style={{
                          padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                          fontFamily:"'DM Sans',sans-serif", border:"1px solid var(--border)",
                          background: selectedCourse === c.courseCode ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "var(--surface2)",
                          color: selectedCourse === c.courseCode ? "var(--primary)" : "var(--text)",
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
        {footer && <div style={{ marginTop:10, paddingTop:8, borderTop:"1px solid var(--border)" }}>{footer}</div>}
      </section>
  );
}

function GPASummaryWidget({ apiSemesters, selectedSemester, onNavigate, footer, onUploadTranscript }) {
  const gradePoints = {"A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0};

  const gpaColor = g => {
    const v = parseFloat(g);
    if (isNaN(v)) return "var(--text2)";
    return v >= 3.7 ? "#27ae60" : v >= 3.0 ? "#2980b9" : v >= 2.0 ? "#e67e22" : "#c0392b";
  };

  const calcGPA = (courseList) => {
    const valid = (courseList || []).filter(c => c.grade && gradePoints[c.grade?.trim()?.toUpperCase()] !== undefined && Number(c.credits) > 0);
    if (!valid.length) return null;
    const pts = valid.reduce((sum, c) => sum + gradePoints[c.grade.trim().toUpperCase()] * Number(c.credits), 0);
    const creds = valid.reduce((sum, c) => sum + Number(c.credits), 0);
    return { gpa: (pts / creds).toFixed(2), pts, creds, count: valid.length };
  };

  const semObj = apiSemesters.find(s => s.semesterName === selectedSemester);
  const courses = (semObj?.courses || []).filter(c => c.courseCode && !c.componenttype);
  const gradedCourses = courses.filter(c => c.grade && gradePoints[c.grade?.trim()?.toUpperCase()] !== undefined && Number(c.credits) > 0);
  const allGraded = courses.length > 0 && gradedCourses.length === courses.length;

  const semGPA = allGraded ? (() => {
    const pts = gradedCourses.reduce((sum, c) => sum + gradePoints[c.grade.trim().toUpperCase()] * Number(c.credits), 0);
    const creds = gradedCourses.reduce((sum, c) => sum + Number(c.credits), 0);
    return { gpa: (pts / creds).toFixed(2), pts, creds };
  })() : null;

  const allCourses = apiSemesters.flatMap(s => s.courses || []);
  const cumGPA = calcGPA(allCourses);

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

        {/* Cumulative GPA banner — always shown when data exists */}
        {cumGPA && (
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <div style={{ flex:1, background:"var(--surface3,#eef2fb)", borderRadius:10, padding:"10px 14px", border:"1px solid var(--border)", textAlign:"center" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Cumulative GPA</div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:700, color:gpaColor(cumGPA.gpa), lineHeight:1 }}>{cumGPA.gpa}</div>
              <div style={{ fontSize:10, color:"var(--text2)", marginTop:3 }}>{cumGPA.creds} cr · {cumGPA.count} courses</div>
            </div>
            {semGPA && (
              <div style={{ flex:1, background:"var(--surface3,#eef2fb)", borderRadius:10, padding:"10px 14px", border:"1px solid var(--border)", textAlign:"center" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Semester GPA</div>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:700, color:gpaColor(semGPA.gpa), lineHeight:1 }}>{semGPA.gpa}</div>
                <div style={{ fontSize:10, color:"var(--text2)", marginTop:3 }}>{semGPA.creds} cr · {selectedSemester}</div>
              </div>
            )}
          </div>
        )}

        {!selectedSemester || courses.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <div style={{ fontSize:13, color:"var(--text3)", marginBottom: cumGPA ? 0 : 10 }}>
                {cumGPA ? "Select a semester to see breakdown." : "No grade history yet."}
              </div>
              {!cumGPA && <span style={{ fontSize:12, fontWeight:600, color:"var(--accent)", border:"1px solid var(--border)", borderRadius:8, padding:"5px 12px", cursor:"pointer" }} onClick={onUploadTranscript}>Upload transcript to get started →</span>}
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
        {footer && <div style={{ marginTop:10, paddingTop:8, borderTop:"1px solid var(--border)" }}>{footer}</div>}
      </section>
  );
}

export default function Dashboard({ onLogout }) {
  const { isDark } = useTheme();
  const [, forceUpdate] = useState(0);
  useEffect(() => { forceUpdate(n => n + 1); }, [isDark]);
  const NAV_ITEMS = [
    { id:"dashboard", label:"Dashboard",        icon:<LayoutDashboard size={17}/> },
    { id:"tasks",     label:"Task Manager",     icon:<CheckSquare size={17}/> },
    { id:"planner",   label:"Study Planner",    icon:<BookOpen size={17}/> },
    { id:"grades",    label:"Grade Calculator", icon:<Calculator size={17}/> },
    { id:"reviews",   label:"Reviews",          icon:<Star size={17}/> },
    { id:"forum",     label:"Forum",            icon:<MessageSquare size={17}/> },
    { id:"groups",    label:"Study Groups",     icon:<Users size={17}/> },
  ];

  const widgetSaveTimer = useRef(null);
  const saveWidgetPrefsToBackend = (prefs) => {
    clearTimeout(widgetSaveTimer.current);
    widgetSaveTimer.current = setTimeout(() => {
      const token = localStorage.getItem("kk_token");
      if (!token) return;
      fetch(`${API}/api/widget-prefs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(prefs),
      }).catch(() => {});
    }, 600);
  };

  const [showTranscript, setShowTranscript] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [courseDetailsTarget, setCourseDetailsTarget] = useState(null);
  const [forumCourseTag, setForumCourseTag] = useState("");
  const [forumProfTag,   setForumProfTag]   = useState("");
  const [syllabusTarget, setSyllabusTarget] = useState(null); // course name for syllabus modal
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

  const [showOnboarding, setShowOnboarding] = useState(false);
  const dismissOnboarding = useCallback(() => {
    const email = localStorage.getItem("kk_email") || "";
    if (email) localStorage.setItem(`kk_schedule_onboarded_${email}`, "true");
    setShowOnboarding(false);
  }, []);
  useEffect(() => {
    const email = localStorage.getItem("kk_email") || "";
    const token = localStorage.getItem("kk_token") || "";
    if (!email) return;
    if (localStorage.getItem(`kk_schedule_onboarded_${email}`)) return;
    // Check if they already have a default schedule — if so, silently mark as onboarded
    fetch(`${API}/api/profile/default-schedule`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(slots => {
        localStorage.setItem(`kk_schedule_onboarded_${email}`, "true");
        if (!Array.isArray(slots) || slots.length > 0) return; // already has slots, don't show
        setShowOnboarding(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("kk_token");
    if (!token) return;
    try {
      const userId = JSON.parse(atob(token.split(".")[1])).sub;
      const apiFetch = (path, opts = {}) => fetch(`${API}${path}`, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        ...opts,
      }).then(r => r.json());
      initE2EE(String(userId), apiFetch).catch(() => {});
    } catch { /* non-critical */ }
  }, []);
  useEffect(() => {
    localStorage.setItem("kk_activePage", activePage);
    if (activePage === "grades" || activePage === "dashboard" || activePage === "profile") fetchSemesters();
  }, [activePage]);
  const [semester,       setSemesterState] = useState(() => localStorage.getItem("kk_activeSemester") || "");
  const setSemester = (val) => { setSemesterState(val); localStorage.setItem("kk_activeSemester", val); };
  const [apiSemesters,   setApiSemesters]  = useState([]);
  const [courseColorsVer, setCourseColorsVer] = useState(0);

  const knownIds = new Set(ALL_WIDGETS.map(w => w.id));
  const defaultVisible = () => Object.fromEntries(ALL_WIDGETS.map(w => [w.id, true]));
  const defaultOrder   = () => ALL_WIDGETS.map(w => w.id);
  const defaultSizes   = () => Object.fromEntries(ALL_WIDGETS.map(w => [w.id, w.span]));

  const [visible, setVisible] = useState(() => {
    try { const s = localStorage.getItem("kk_widgets"); return s ? { ...defaultVisible(), ...JSON.parse(s) } : defaultVisible(); } catch { return defaultVisible(); }
  });
  const [widgetOrder, setWidgetOrder] = useState(() => {
    try {
      const s = localStorage.getItem("kk_widget_order");
      const saved = s ? JSON.parse(s) : [];
      const filtered = saved.filter(id => knownIds.has(id));
      return [...filtered, ...ALL_WIDGETS.map(w => w.id).filter(id => !filtered.includes(id))];
    } catch { return defaultOrder(); }
  });
  const [widgetSizes, setWidgetSizes] = useState(() => {
    try { const s = localStorage.getItem("kk_widget_sizes"); return s ? JSON.parse(s) : defaultSizes(); } catch { return defaultSizes(); }
  });
  const [widgetCollapsed, setWidgetCollapsed] = useState(() => {
    try { const s = localStorage.getItem("kk_widget_collapsed"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const [editMode,   setEditMode]   = useState(false);
  const [dragId,     setDragId]     = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Fetch widget prefs from backend on mount
  useEffect(() => {
    const token = localStorage.getItem("kk_token");
    if (!token) return;
    fetch(`${API}/api/widget-prefs`, { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => r.status === 204 ? null : r.json())
      .then(data => {
        if (!data) return;
        if (data.visible)   { localStorage.setItem("kk_widgets", JSON.stringify(data.visible)); setVisible(data.visible); }
        if (data.order)     { const filtered = data.order.filter(id => knownIds.has(id)); const full = [...filtered, ...defaultOrder().filter(id => !filtered.includes(id))]; localStorage.setItem("kk_widget_order", JSON.stringify(full)); setWidgetOrder(full); }
        if (data.sizes)     { localStorage.setItem("kk_widget_sizes", JSON.stringify(data.sizes)); setWidgetSizes(data.sizes); }
        if (data.collapsed) { localStorage.setItem("kk_widget_collapsed", JSON.stringify(data.collapsed)); setWidgetCollapsed(data.collapsed); }
      })
      .catch(() => {});
  }, []);

  const persistWidgetPrefs = (patch) => {
    const prefs = {
      visible:   patch.visible   ?? visible,
      order:     patch.order     ?? widgetOrder,
      sizes:     patch.sizes     ?? widgetSizes,
      collapsed: patch.collapsed ?? widgetCollapsed,
    };
    saveWidgetPrefsToBackend(prefs);
  };

  const toggleWidget = id => {
    setVisible(v => {
      const next = { ...v, [id]: !v[id] };
      localStorage.setItem("kk_widgets", JSON.stringify(next));
      persistWidgetPrefs({ visible: next });
      return next;
    });
  };


  const saveWidgetOrder = (order) => {
    setWidgetOrder(order);
    localStorage.setItem("kk_widget_order", JSON.stringify(order));
    persistWidgetPrefs({ order });
  };
  const saveWidgetSizes = (sizes) => {
    setWidgetSizes(sizes);
    localStorage.setItem("kk_widget_sizes", JSON.stringify(sizes));
    persistWidgetPrefs({ sizes });
  };
  const toggleSize = (id) => {
    const cur = widgetSizes[id] ?? ALL_WIDGETS.find(w => w.id === id)?.span ?? 1;
    saveWidgetSizes({ ...widgetSizes, [id]: cur >= 3 ? 1 : cur + 1 });
  };

  const onDragStart = (id) => setDragId(id);
  const onDragOver  = (e, id) => { e.preventDefault(); if (dragOverId !== id) setDragOverId(id); };
  const onDrop      = (id) => {
    if (!dragId || dragId === id) { setDragId(null); setDragOverId(null); return; }
    const order = [...widgetOrder];
    const from = order.indexOf(dragId); const to = order.indexOf(id);
    order.splice(from, 1); order.splice(to, 0, dragId);
    saveWidgetOrder(order); setDragId(null); setDragOverId(null);
  };
  const onDragEnd = () => { setDragId(null); setDragOverId(null); };


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

  const [dismissedSections, setDismissedSections] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("kk_dismissed_sections") || "[]")); } catch { return new Set(); }
  });
  const dismissSection = (dateStr, crn) => {
    const key = `${dateStr}_${crn}`;
    const next = new Set(dismissedSections);
    next.add(key);
    setDismissedSections(next);
    localStorage.setItem("kk_dismissed_sections", JSON.stringify([...next]));
  };

  const selectedSem = apiSemesters.find(s => s.semesterName === semester) ?? { courses: [] };
  const semCourseList = (selectedSem.courses || []).filter(c => !c.componenttype).map(c => ({ id: c.courseCode, name: c.courseCode }));
  const enrolledSections = (selectedSem.courses || [])
    .filter(c => c.section)
    .map(c => ({ courseCode: c.courseCode, crn: c.sectioncrn, section: c.section, linkedSection: c.linkedSection || null, componenttype: c.componenttype || null, sectionNumber: c.section?.sectionNumber || null }));

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

  const [courseOfficeHours, setCourseOfficeHours] = useState(() => {
    try {
      const saved = localStorage.getItem("kk_course_office_hours");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [courseSyllabi, setCourseSyllabi] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}"); } catch { return {}; }
  });
  const [courseData, setCourseData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kk_course_data") || "{}"); } catch { return {}; }
  });

  const authHeaders = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("kk_token")}` });

  useEffect(() => {
    fetch(`${API}/api/user-syllabi`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data === "object") {
          localStorage.setItem("kk_course_syllabus", JSON.stringify(data));
          setCourseSyllabi(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const refresh = () => {
      try {
        setCourseSyllabi(JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}"));
        setCourseData(JSON.parse(localStorage.getItem("kk_course_data") || "{}"));
        setCourseOfficeHours(JSON.parse(localStorage.getItem("kk_course_office_hours") || "{}"));
      } catch {}
    };
    window.addEventListener("kk_syllabus_changed", refresh);
    return () => window.removeEventListener("kk_syllabus_changed", refresh);
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

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("-");
    const parsed = new Date(`${year}-${month}-${day}T${timePart}`);
    const mins = Math.floor((Date.now() - parsed.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const loadNotifications = useCallback(() => {
    const { token, userId } = getAuthInfo();
    if (!userId) return;
    fetch(`${API}/api/notifications`, {
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
    fetch(`${API}/api/notifications/read-all`, {
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
    fetch(`${API}/api/tasks/list-all`, {
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
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        if (unreadCount > 0) markAllAsRead();
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [unreadCount, markAllAsRead]);

  const [studyBlocks, setStudyBlocks] = useState({});
  const [studySlots, setStudySlots] = useState({});
  const [studyEntries, setStudyEntries] = useState([]);
  const [schedColorMap, setSchedColorMap] = useState(() => {
    try { const s = localStorage.getItem("kk_colorMap"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [schedWeekOffset, setSchedWeekOffset] = useState(0);
  const [calTab, setCalTab] = useState("calendar");
  const [gradesTab, setGradesTab] = useState("grades");
  const [progressTab, setProgressTab] = useState("semester");

  const [quickNote, setQuickNote] = useState(() => {
    try { return localStorage.getItem("kk_quick_note") || ""; } catch { return ""; }
  });
  const [gradeGoals, setGradeGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kk_grade_goals") || "{}"); } catch { return {}; }
  });
  const [creditsGoal, setCreditsGoal] = useState(() => {
    try { return parseInt(localStorage.getItem("kk_credits_goal") || "120"); } catch { return 120; }
  });
  const [editingCreditsGoal, setEditingCreditsGoal] = useState(false);
  const [creditsGoalInput, setCreditsGoalInput] = useState("");
  const [simGrades, setSimGrades] = useState({});
  const [dashDropId, setDashDropId] = useState("");

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const dates = JSON.parse(localStorage.getItem("kk_activity_dates") || "[]");
      if (!dates.includes(today)) {
        localStorage.setItem("kk_activity_dates", JSON.stringify([...dates.slice(-364), today]));
      }
    } catch {}
  }, []);

  const streakCount = (() => {
    try {
      const dates = new Set(JSON.parse(localStorage.getItem("kk_activity_dates") || "[]"));
      let streak = 0;
      const d = new Date(); d.setHours(0,0,0,0);
      while (dates.has(d.toISOString().slice(0,10))) { streak++; d.setDate(d.getDate()-1); }
      return streak;
    } catch { return 0; }
  })();

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
    fetch(`${API}/api/study-plan/weekly?weekStart=${weekStart}`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json()).then(data => { if (data) setStudyBlocks(data); }).catch(() => {});
    fetch(`${API}/api/study-plan/slots?weekStart=${weekStart}`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(s => { if (!map[s.dayKey]) map[s.dayKey] = []; map[s.dayKey].push(s); });
        setStudySlots(map);
      }
    }).catch(() => {});
    fetch(`${API}/api/study-plan/entries?weekStart=${weekStart}`, {
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

  const handleLogout = () => { const keepKeys = [...["kk_course_colors","kk_colorMap","kk_course_data","kk_course_syllabus","kk_course_office_hours","kk_todos","kk_quick_note"], ...Object.keys(localStorage).filter(k => k.startsWith("kk_schedule_onboarded_"))]; const saved = Object.fromEntries(keepKeys.map(k => [k, localStorage.getItem(k)]).filter(([,v]) => v)); Object.keys(localStorage).filter(k => k.startsWith("kk_")).forEach(k => localStorage.removeItem(k)); Object.entries(saved).forEach(([k,v]) => localStorage.setItem(k,v)); onLogout(); };

  const navigateToForum = (courseTag, profTag) => {
    setForumCourseTag(courseTag || "");
    setForumProfTag(profTag || "");
    setActivePage("forum");
  };

  const fetchSemesters = () => {
    const token = localStorage.getItem("kk_token");
    return fetch(`${API}/api/grades/saved`, {
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const sorted = sortSemesters(data);
            setApiSemesters(sorted);
            setSemesterState(s => { const next = s || (sorted[sorted.length - 1]?.semesterName ?? ""); if (!s) localStorage.setItem("kk_activeSemester", next); return next; });
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
  useEffect(() => { const h = () => setCourseColorsVer(v => v + 1); window.addEventListener("kk_course_colors_changed", h); return () => window.removeEventListener("kk_course_colors_changed", h); }, []);

  useEffect(() => {
    const t = localStorage.getItem("kk_token");
    if (!t) return;
    fetch(`${API}/api/profile`, {
      headers: { "Authorization": "Bearer " + t, "Content-Type": "application/json" },
    }).then(r => r.ok ? r.json() : null).then(data => { if (data) setProfile(data); }).catch(() => {});

  }, []);

  // Courses from all saved semesters (deduplicated) for Grade Calculator dropdown
  const dashboardCourses = [...new Map(
      apiSemesters.flatMap(s => (s.courses || []).filter(c => !c.componenttype).map(c => ({ id: c.id, name: c.courseCode })))
          .filter(c => c.name && (!c.section?.sectionNumber || !(/^B(?!L)/i.test(c.section.sectionNumber) || /^E/i.test(c.section.sectionNumber))))
          .map(c => [c.name, c])
  ).values()];

  const renderWidgetContent = (id) => {
    switch (id) {
      case "courses": return (
        <>
          <SectionTitle>My Courses — {semester}</SectionTitle>
          {semCourseList.length === 0
            ? <div style={{marginTop:16,textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:13,color:"var(--text3)",marginBottom:10}}>No courses registered for this semester yet.</div>
                <button onClick={() => setActivePage("profile")} style={{fontSize:12,fontWeight:600,color:"var(--accent)",background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>Go to Profile →</button>
              </div>
            : <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:14}}>
              {semCourseList.map((c, i) => (
                <div key={c.sectioncrn ?? `${c.name}-${i}`} className="course-card" style={{...s.courseCard, border:"1px solid var(--border)", borderLeft:"3px solid var(--primary)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:"var(--primary)"}}>{c.name}</div>
                      {(courseData[c.name]?.professor || courseSyllabi[c.name]?.professor) && (
                        <div style={{fontSize:11,color:"var(--text2)",marginTop:2,fontWeight:500}}>{courseData[c.name]?.professor || courseSyllabi[c.name]?.professor}</div>
                      )}
                    </div>
                  </div>
                  {!courseSyllabi[c.name] && (
                    <div style={{marginTop:8}}>
                      <button className="kk-pill" onClick={e=>{e.stopPropagation();setSyllabusTarget(c.name);}} style={{fontSize:11,color:"var(--primary)",background:"color-mix(in srgb,var(--primary) 12%,transparent)",border:"1px solid color-mix(in srgb,var(--primary) 25%,transparent)",borderRadius:6,padding:"3px 8px",cursor:"pointer",transition:"all .15s"}}>
                        <><Plus size={13} /> Upload Syllabus</>
                      </button>
                    </div>
                  )}
                  {courseOfficeHours[c.name]?.length > 0 && (
                    <div style={{marginTop:6,paddingTop:6,borderTop:"1px solid var(--border)"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Office Hours</div>
                      {courseOfficeHours[c.name].map((oh,i)=>(
                        <div key={i} style={{fontSize:11,color:"var(--text2)",lineHeight:1.6}}>{[oh.day,oh.time,oh.location].filter(Boolean).join(" · ")}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          }
        </>
      );
      case "progress": {
        const gradePoints2 = {"A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0};
        const earnedCr = apiSemesters.flatMap(s=>s.courses||[]).filter(c=>c.grade&&c.grade.trim().toUpperCase()!=="F"&&gradePoints2[c.grade.trim().toUpperCase()]!==undefined&&Number(c.credits)>0).reduce((sum,c)=>sum+Number(c.credits),0);
        const pct2 = Math.min(100,Math.round((earnedCr/creditsGoal)*100));
        const remaining2 = Math.max(0,creditsGoal-earnedCr);
        const tabs2 = [{id:"semester",label:"Semester"},{id:"credits",label:"Credits"}];
        return (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <SectionTitle>{progressTab==="semester"?"Semester Overview":"Credits Progress"}</SectionTitle>
              <div style={{display:"flex",gap:2,background:"var(--surface2)",borderRadius:9,padding:3}}>
                {tabs2.map(t=><button key={t.id} className="kk-tab" data-active={progressTab===t.id} onClick={()=>setProgressTab(t.id)} style={{padding:"3px 10px",borderRadius:7,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:progressTab===t.id?"var(--surface)":"transparent",color:progressTab===t.id?"var(--primary)":"var(--text2)",boxShadow:progressTab===t.id?"0 1px 4px rgba(49,72,122,0.08)":"none",transition:"all .15s"}}>{t.label}</button>)}
              </div>
            </div>
            {progressTab==="semester" ? (
              <div key="sem" className="card-anim" style={{marginTop:6,display:"flex",gap:10,width:"100%"}}>
                {[{label:"Courses",val:semCourseList.length||"—"},{label:"To-Do",val:todos.filter(t=>!t.done).length},{label:"Due Today",val:tasks.filter(t=>!t.done&&t.due?.slice(0,10)===new Date().toISOString().slice(0,10)).length}].map(chip=>(
                  <div key={chip.label} style={s.chip}><div style={{fontSize:11,color:"var(--text2)"}}>{chip.label}</div><div style={{fontWeight:600,fontSize:13,color:"var(--primary)"}}>{chip.val}</div></div>
                ))}
              </div>
            ) : (
              <div key="cred" className="card-anim" style={{width:"100%"}}>
                <div style={{textAlign:"center",padding:"8px 0 6px"}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:38,fontWeight:700,color:"var(--primary)",lineHeight:1}}>{earnedCr}</div>
                  <div style={{fontSize:12,color:"var(--text2)",marginTop:3}}>of {creditsGoal} credits completed</div>
                </div>
                <div style={{background:"var(--surface2)",borderRadius:99,height:8,overflow:"hidden",marginBottom:8}}>
                  <div style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg,var(--accent),var(--primary))",width:`${pct2}%`,transition:"width .5s"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:"var(--text2)"}}>{pct2}% · {remaining2} cr remaining</span>
                  {editingCreditsGoal ? (
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      <input type="number" value={creditsGoalInput} autoFocus onChange={e=>setCreditsGoalInput(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"){const v=parseInt(creditsGoalInput);if(v>0){setCreditsGoal(v);localStorage.setItem("kk_credits_goal",v);}setEditingCreditsGoal(false);}if(e.key==="Escape")setEditingCreditsGoal(false);}}
                        style={{width:54,fontSize:12,padding:"2px 6px",border:"1px solid var(--border)",borderRadius:6,background:"var(--surface)",color:"var(--text)",fontFamily:"inherit"}}/>
                      <button onClick={()=>{const v=parseInt(creditsGoalInput);if(v>0){setCreditsGoal(v);localStorage.setItem("kk_credits_goal",v);}setEditingCreditsGoal(false);}} style={{fontSize:11,padding:"2px 8px",borderRadius:6,border:"none",background:"var(--primary)",color:"white",cursor:"pointer"}}>✓</button>
                    </div>
                  ) : (
                    <button onClick={()=>{setCreditsGoalInput(String(creditsGoal));setEditingCreditsGoal(true);}} style={{fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Edit goal</button>
                  )}
                </div>
              </div>
            )}
          </>
        );
      }
      case "todo": return (
        <>
          <SectionTitle>To-Do List</SectionTitle>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <input value={todoInput} onChange={e=>{setTodoInput(e.target.value);setTodoError(false);}} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="Add a task…" style={{...s.todoInput,borderColor:todoError?"var(--error)":"var(--border)"}}/>
            <button className="add-btn" onClick={addTodo} style={s.addBtn}><Plus size={18} /></button>
          </div>
          {todoError && <div style={{fontSize:12,color:"var(--error)",marginTop:4}}>Please type a task first, then add.</div>}
          <div style={{marginTop:10,maxHeight:160,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
            {todos.length===0 && <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"16px 0"}}>No tasks yet!</div>}
            {todos.map(t=>(
              <div key={t.id} className="todo-row" style={s.todoRow}>
                <span onClick={()=>toggleTodo(t.id)} style={{fontSize:13,flex:1,cursor:"pointer",textDecoration:t.done?"line-through":"none",color:t.done?"var(--text3)":"var(--text)"}}>{t.done?"":<LayoutList size={13} style={{verticalAlign:"middle",marginRight:4}}/>}{t.text}</span>
                <button onClick={()=>deleteTodo(t.id)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:12}}>✕</button>
              </div>
            ))}
          </div>
        </>
      );
      case "pomodoro": return (
        <div className="card-anim">
          <SectionTitle>Pomodoro Timer</SectionTitle>
          <PomodoroTimer />
        </div>
      );
      case "schedule": return (
        <>
          <div style={{marginBottom:12}}><SectionTitle>Course Schedule</SectionTitle></div>
          {(() => {
                const SCH_START = 6.5, SCH_END = 20.5, SCH_H = 52;
                const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
                const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat"];
                const totalH = (SCH_END - SCH_START) * SCH_H;

                const parseT = t => {
                  if (!t) return null;
                  const parts = Array.isArray(t) ? t : String(t).replace(/[^0-9:]/g,"").split(":");
                  if (parts.length === 1 && parts[0].length === 4) return parseInt(parts[0].slice(0,2)) + parseInt(parts[0].slice(2))/60;
                  return parseFloat(parts[0]) + parseFloat(parts[1]||0)/60;
                };

                const parseDays = str => {
                  if (!str) return [];
                  const map = { M:"MONDAY", T:"TUESDAY", W:"WEDNESDAY", R:"THURSDAY", F:"FRIDAY", S:"SATURDAY", U:"SUNDAY" };
                  return str.split("").map(c => map[c]).filter(Boolean);
                };

                const fmtHour = h => h === 12 ? "12pm" : h > 12 ? `${h-12}pm` : `${h}am`;
                const fmtT = h => { const hr=Math.floor(h); const mn=Math.round((h-hr)*60); return `${hr%12||12}:${String(mn).padStart(2,"0")}${h>=12?"pm":"am"}`; };

                const semCourses = (apiSemesters.find(s=>s.semesterName===semester)?.courses||[]).filter(c=>c.section);
                const mainCourses = semCourses.filter(c => !c.componenttype);
                const savedCourseColors = (() => { void courseColorsVer; try { return JSON.parse(localStorage.getItem("kk_course_colors") || "{}"); } catch { return {}; } })();
                const SCHED_FALLBACK = ["var(--sched1)","var(--sched2)","var(--sched3)","var(--sched4)","var(--sched5)","var(--sched6)","var(--sched7)"];
                const courseColorMap = {};
                mainCourses.forEach((c, ci) => { courseColorMap[c.courseCode] = savedCourseColors[c.courseCode] || SCHED_FALLBACK[ci % 7]; });
                const classByDay = {};
                DAYS.forEach(d => { classByDay[d] = []; });
                semCourses.forEach((c) => {
                  const color = courseColorMap[c.courseCode] || SCHED_FALLBACK[0];
                  const sec = c.section;
                  [[sec.days1, sec.beginTime1, sec.endTime1],[sec.days2, sec.beginTime2, sec.endTime2]].forEach(([days, start, end]) => {
                    if (!days || !start) return;
                    parseDays(days).forEach(day => {
                      classByDay[day].push({ label: c.courseCode, startH: parseT(start), endH: parseT(end), color });
                    });
                  });
                });

                const entryLookup = {};
                studyEntries.forEach((e, idx) => {
                  const id = String(e.id);
                  const course = e.task?.course||""; const title = e.task?.title||"Study";
                  entryLookup[id] = { label: course ? `${course} — ${title}` : title, colorIdx: idx % 7 };
                });

                return (
                  <div style={{ marginTop:4, border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", background:"var(--surface)" }}>
                    <div style={{ display:"flex", background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
                      <div style={{ width:38, flexShrink:0 }} />
                      <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(6,1fr)" }}>
                        {DAY_LABELS.map((label, di) => (
                          <div key={label} style={{ fontSize:11, fontWeight:700, color:"var(--primary)", textAlign:"center", padding:"5px 0", borderLeft: di>0?"1px solid var(--divider)":"none" }}>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ height:324, overflowY:"auto" }}>
                      <div style={{ display:"flex" }}>
                        <div style={{ width:38, flexShrink:0, position:"relative", height:totalH, background:"var(--surface2)", borderRight:"1px solid var(--border)" }}>
                          {Array.from({ length: Math.ceil(SCH_END - 7) }, (_,i) => (
                            <div key={i} style={{ position:"absolute", top:(i+0.5)*SCH_H - 6, right:4, fontSize:11, color:"var(--text3)", lineHeight:1, textAlign:"right" }}>
                              {fmtHour(7+i)}
                            </div>
                          ))}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", position:"relative", height:totalH }}>
                            {Array.from({ length: Math.ceil(SCH_END - 7) }, (_,i) => (
                              <div key={i} style={{ position:"absolute", top:(i+0.5)*SCH_H, left:0, right:0, borderTop:"1px solid var(--divider)", zIndex:0 }} />
                            ))}
                            {DAYS.map((day, di) => (
                              <div key={day} style={{ position:"relative", borderLeft: di>0?"1px solid var(--divider)":"none" }}>
                                {(classByDay[day]||[]).map((cl,ci) => {
                                  if (!cl.startH || cl.startH >= SCH_END || cl.endH <= SCH_START) return null;
                                  const top = (Math.max(cl.startH, SCH_START) - SCH_START) * SCH_H;
                                  const height = (Math.min(cl.endH, SCH_END) - Math.max(cl.startH, SCH_START)) * SCH_H - 2;
                                  return <div key={`cl${ci}`} style={{ position:"absolute", top:top+1, left:1, right:1, height, background:`color-mix(in srgb, ${cl.color} 20%, transparent)`, borderLeft:`2px solid ${cl.color}`, borderRadius:3, overflow:"hidden", padding:"2px 6px", zIndex:2 }}>
                                    <div style={{ fontSize:11, fontWeight:700, color:cl.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{cl.label}</div>
                                    <div style={{ fontSize:10, color:"var(--text3)" }}>{fmtT(cl.startH)}–{fmtT(cl.endH)}</div>
                                  </div>;
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
        </>
      );
      case "calendar": {
        const weekStart2=(()=>{const d=new Date();d.setHours(0,0,0,0);const day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));return d;})();
        const weekEnd2=new Date(weekStart2);weekEnd2.setDate(weekStart2.getDate()+7);
        const weekTasks2=tasks.filter(t=>t.due&&new Date(t.due)>=weekStart2&&new Date(t.due)<weekEnd2);
        const calTabs=[{id:"calendar",label:"Calendar"},{id:"deadlines",label:"Deadlines"},{id:"week",label:"Week"}];
        return (
        <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <SectionTitle>{calTab==="calendar"?"Calendar":calTab==="deadlines"?"Upcoming Deadlines":"Week at a Glance"}</SectionTitle>
            <div style={{display:"flex",gap:2,background:"var(--surface2)",borderRadius:9,padding:3}}>
              {calTabs.map(t=><button key={t.id} className="kk-tab" data-active={calTab===t.id} onClick={()=>setCalTab(t.id)} style={{padding:"3px 10px",borderRadius:7,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:calTab===t.id?"var(--surface)":"transparent",color:calTab===t.id?"var(--primary)":"var(--text2)",boxShadow:calTab===t.id?"0 1px 4px rgba(49,72,122,0.08)":"none",transition:"all .15s"}}>{t.label}</button>)}
            </div>
          </div>
{calTab==="deadlines" ? (() => {
  const now2 = new Date();
  const upcoming = tasks.filter(t => !t.done && t.due).sort((a,b) => new Date(a.due)-new Date(b.due)).slice(0,8);
  const urgencyColor = due => { const d=(new Date(due)-now2)/86400000; return d<0?"var(--error)":d<1?"var(--error)":d<3?"var(--warn)":"var(--success)"; };
  const urgencyLabel = due => { const d=(new Date(due)-now2)/86400000; return d<0?"Overdue":d<1?"Today":d<2?"Tomorrow":new Date(due).toLocaleDateString("en-US",{month:"short",day:"numeric"}); };
  return upcoming.length===0 ? (
    <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"28px 0"}}>No upcoming deadlines!</div>
  ) : (
    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4,maxHeight:280,overflowY:"auto"}}>
      {upcoming.map((t,i) => {
        const color = urgencyColor(t.due);
        return (
          <div key={i} className="card-anim" style={{animationDelay:`${i*0.05}s`,display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"var(--surface2)",borderLeft:`3px solid ${color}`}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:"var(--primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>
              <div style={{fontSize:11,color:"var(--text2)",marginTop:1}}>{[t.course,t.type].filter(Boolean).join(" · ")}</div>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color,background:color+"18",padding:"2px 8px",borderRadius:6,flexShrink:0,whiteSpace:"nowrap"}}>{urgencyLabel(t.due)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })() : calTab==="week" ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:4}}>
              {[
                {label:"Due this week",val:weekTasks2.filter(t=>!t.done).length,color:"var(--primary)"},
                {label:"Completed",val:weekTasks2.filter(t=>t.done).length,color:"var(--success)"},
                {label:"Due today",val:tasks.filter(t=>!t.done&&t.due&&new Date(t.due).toISOString().slice(0,10)===new Date().toISOString().slice(0,10)).length,color:"var(--warn)"},
                {label:"Overdue",val:tasks.filter(t=>!t.done&&t.due&&new Date(t.due)<new Date()).length,color:"var(--error)"},
                {label:"Total tasks",val:tasks.length,color:"var(--accent2)"},
                {label:"Pending todos",val:todos.filter(t=>!t.done).length,color:"var(--text2)"},
              ].map(chip=>(
                <div key={chip.label} className="card-anim" style={{animationDelay:`${["Due this week","Completed","Due today","Overdue","Total tasks","Pending todos"].indexOf(chip.label)*0.05}s`,background:"var(--surface2)",borderRadius:10,padding:"12px 14px",border:"1px solid var(--border)"}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:700,color:chip.color,lineHeight:1}}>{chip.val}</div>
                  <div style={{fontSize:11,color:"var(--text2)",marginTop:4,lineHeight:1.3}}>{chip.label}</div>
                </div>
              ))}
            </div>
          ) : (
          <div style={{marginTop:6, height:384, display:"flex", flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <button className="kk-pill" onClick={prevMonth} style={s.calNavBtn}>‹</button>
              <span style={{fontWeight:600,fontSize:14,color:"var(--primary)"}}>{monthName} {calYear}</span>
              <button className="kk-pill" onClick={nextMonth} style={s.calNavBtn}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gridTemplateRows:"auto",gridAutoRows:"1fr",gap:4,flex:1}}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"var(--text3)",padding:"2px 0"}}>{d}</div>)}
              {calCells.map((d,i)=>{
                const dayTasks = d?(tasksByDate[calKey(d)]||[]):[];
                return (
                  <div key={i} className={d?"cal-day":""} style={{display:"flex",flexDirection:"column",alignItems:"center",borderRadius:6,cursor:d?"pointer":"default",background:isToday(d)?"color-mix(in srgb, var(--primary) 25%, transparent)":"transparent",paddingBottom:dayTasks.length?3:0,height:"100%"}}>
                    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,width:"100%",color:isToday(d)?"#fff":d?"var(--text)":"transparent",fontWeight:isToday(d)?700:400}}>{d||""}</div>
                    {dayTasks.map((t,ti)=>{
                      const color = t.done?"var(--success)":new Date(t.due)<new Date()?"var(--error)":"var(--text2)";
                      return <div key={ti} onMouseEnter={e=>{const rect=e.target.getBoundingClientRect();setHoveredTask({task:t,x:rect.left,y:rect.bottom+4,above:rect.bottom+120>window.innerHeight});}} onMouseLeave={()=>setHoveredTask(null)} onClick={()=>{setEditingTask({...t,due:utcToLocalInput(t.due)});setActivePage("tasks");}} style={{width:"90%",height:3,borderRadius:2,background:color,marginBottom:1,cursor:"pointer",transition:"height .1s"}} className="cal-task-line" />;
                    })}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:10,fontSize:11,color:"var(--text3)",textAlign:"center"}}>Today is {today.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
          </div>
          )}
          {calTab==="calendar" && hoveredTask && (
            <div style={{position:"fixed",left:Math.min(hoveredTask.x,window.innerWidth-230),top:hoveredTask.above?undefined:hoveredTask.y,bottom:hoveredTask.above?window.innerHeight-hoveredTask.y+8:undefined,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 13px",boxShadow:"0 6px 24px color-mix(in srgb, var(--primary) 13%, transparent)",zIndex:9999,minWidth:170,maxWidth:220,pointerEvents:"none"}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{hoveredTask.task.type} · {hoveredTask.task.course}</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:4,lineHeight:1.3}}>{hoveredTask.task.title}</div>
              <div style={{fontSize:11,color:"var(--text3)"}}>{hoveredTask.task.due?new Date(hoveredTask.task.due).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}):"No due date"}</div>
              {hoveredTask.task.done && <div style={{fontSize:11,color:"var(--success)",fontWeight:600,marginTop:4}}>✓ Completed</div>}
              {!hoveredTask.task.done && new Date(hoveredTask.task.due)<new Date() && <div style={{fontSize:11,color:"var(--error)",fontWeight:600,marginTop:4}}>Overdue</div>}
            </div>
          )}
        </>
        );
      }
      case "grades": {
        const LETTER_GRADES = ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];
        const gradePoints = {"A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0};
        const semCourses = (apiSemesters.find(s=>s.semesterName===semester)?.courses||[]).filter(c=>c.courseCode&&!c.componenttype);
        const gradeTabs = [{id:"grades",label:"Grades"},{id:"gpa",label:"GPA"},{id:"goals",label:"Goals"}];
        return (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <SectionTitle>{gradesTab==="grades"?"Course Grades":gradesTab==="gpa"?"GPA":"Goals"}</SectionTitle>
              <div style={{display:"flex",gap:2,background:"var(--surface2)",borderRadius:9,padding:3}}>
                {gradeTabs.map(t=><button key={t.id} className="kk-tab" data-active={gradesTab===t.id} onClick={()=>setGradesTab(t.id)} style={{padding:"3px 10px",borderRadius:7,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:gradesTab===t.id?"var(--surface)":"transparent",color:gradesTab===t.id?"var(--primary)":"var(--text2)",boxShadow:gradesTab===t.id?"0 1px 4px rgba(49,72,122,0.08)":"none",transition:"all .15s"}}>{t.label}</button>)}
              </div>
            </div>
            {gradesTab==="grades" && <CourseGradeSummaryWidget apiSemesters={apiSemesters} selectedSemester={semester} footer={null} onUploadTranscript={() => setShowTranscript(true)}/>}
            {gradesTab==="gpa"    && <GPASummaryWidget apiSemesters={apiSemesters} selectedSemester={semester} onNavigate={setActivePage} footer={null} onUploadTranscript={() => setShowTranscript(true)}/>}
            {gradesTab==="goals"  && (
              semCourses.length===0 ? (
                <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"28px 0"}}>Select a semester with courses to set goals.</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 90px 44px",gap:8,padding:"0 10px",marginBottom:2}}>
                    {["Course","Target","Actual"].map(h=><span key={h} style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</span>)}
                  </div>
                  {semCourses.map((c, i) => {
                    const goal = gradeGoals[c.courseCode]||"";
                    const actual = c.grade||null;
                    const goalPts = gradePoints[goal]; const actualPts = gradePoints[actual?.trim()?.toUpperCase()];
                    const status = goal&&actual&&actualPts!==undefined ? (actualPts>=goalPts?"on-track":"behind") : null;
                    return (
                      <div key={c.courseCode} className="card-anim" style={{animationDelay:`${i*0.05}s`,display:"grid",gridTemplateColumns:"1fr 90px 44px",gap:8,alignItems:"center",padding:"7px 10px",borderRadius:9,background:"var(--surface2)",borderLeft:`3px solid ${status==="on-track"?"#27ae60":status==="behind"?"var(--error)":"var(--border)"}`,position:"relative",overflow:"visible",zIndex:dashDropId==="goal-"+c.courseCode?10:1}}>
                        <span style={{fontSize:12,fontWeight:600,color:"var(--primary)"}}>{c.courseCode}</span>
                        <div style={{position:"relative"}}>
                          <button onClick={(e)=>{e.stopPropagation();const k="goal-"+c.courseCode;setDashDropId(dashDropId===k?"":k);}} style={{width:"100%",padding:"3px 8px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface)",color:goal?"var(--text)":"var(--text3)",cursor:"pointer",fontFamily:"inherit",fontSize:11,display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
                            {goal||"Set goal…"}<span style={{fontSize:8,opacity:0.6,display:"inline-block",transition:"transform .2s",transform:dashDropId==="goal-"+c.courseCode?"rotate(0deg)":"rotate(-90deg)"}}>▾</span>
                          </button>
                          {dashDropId==="goal-"+c.courseCode && (
                            <div onWheel={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"var(--surface)",borderRadius:10,boxShadow:"0 8px 32px rgba(49,72,122,0.15)",border:"1px solid var(--border)",zIndex:300,padding:4,minWidth:"100%",maxHeight:180,overflowY:"auto"}}>
                              <div className="kk-option" onClick={()=>{const next={...gradeGoals,[c.courseCode]:""};setGradeGoals(next);localStorage.setItem("kk_grade_goals",JSON.stringify(next));setDashDropId("");}} style={{padding:"7px 12px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text3)",transition:"background .15s"}}>Set goal…</div>
                              {LETTER_GRADES.map(g=>(
                                <div key={g} className="kk-option" onClick={()=>{const next={...gradeGoals,[c.courseCode]:g};setGradeGoals(next);localStorage.setItem("kk_grade_goals",JSON.stringify(next));setDashDropId("");}} style={{padding:"7px 12px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,background:goal===g?"var(--divider)":"transparent",color:goal===g?"var(--accent)":"var(--primary)",transition:"background .15s"}}>
                                  {g}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span style={{fontSize:13,fontWeight:700,fontFamily:"'Fraunces',serif",textAlign:"right",color:status==="on-track"?"#27ae60":status==="behind"?"var(--error)":actual?"var(--text2)":"var(--text3)"}}>{actual||"—"}</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        );
      }
      case "streak": {
        const streakLabel = streakCount===0?"Start your streak today!":streakCount<3?"Keep it up!":streakCount<7?"Building momentum!":streakCount<30?"You're on fire!":"Unstoppable!";
        const completedToday = tasks.filter(t=>t.done&&t.due&&new Date(t.due).toISOString().slice(0,10)===new Date().toISOString().slice(0,10)).length + todos.filter(t=>t.done).length;
        return (
          <>
            <SectionTitle>Study Streak</SectionTitle>
            <div style={{textAlign:"center",padding:"14px 0 6px"}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:56,fontWeight:700,color:streakCount>0?"var(--accent2)":"var(--text3)",lineHeight:1}}>{streakCount}</div>
              <div style={{fontSize:12,color:"var(--text2)",marginTop:6}}>day{streakCount!==1?"s":""} streak</div>
              <div style={{fontSize:11,color:"var(--accent)",fontWeight:600,marginTop:8}}>{streakLabel}</div>
            </div>
            <div style={{marginTop:14,padding:"8px 14px",background:"var(--surface2)",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"var(--text2)"}}>Today's activity</span>
              <span style={{fontSize:13,fontWeight:700,color:completedToday>0?"#27ae60":"var(--text3)"}}>{completedToday} item{completedToday!==1?"s":""} done</span>
            </div>
          </>
        );
      }
      case "notepad": return (
        <>
          <SectionTitle>Quick Notes</SectionTitle>
          <textarea value={quickNote} onChange={e=>{setQuickNote(e.target.value);localStorage.setItem("kk_quick_note",e.target.value);}}
            placeholder="Jot down anything…"
            style={{width:"100%",marginTop:14,minHeight:150,padding:"10px 12px",border:"1px solid var(--border)",borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",background:"var(--surface2)",color:"var(--text)",resize:"vertical",outline:"none",lineHeight:1.5}}/>
          {quickNote&&<div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}><button onClick={()=>{setQuickNote("");localStorage.removeItem("kk_quick_note");}} style={{fontSize:11,color:"var(--text3)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Clear</button></div>}
        </>
      );
      case "examcountdown": {
        const examKeywords = ["exam","quiz","midterm","final","test"];
        const upcomingExams = tasks.filter(t=>!t.done&&t.due&&examKeywords.some(k=>(t.type||"").toLowerCase().includes(k)||(t.title||"").toLowerCase().includes(k))).sort((a,b)=>new Date(a.due)-new Date(b.due));
        const next = upcomingExams[0];
        if (!next) return (
          <>
            <SectionTitle>Exam Countdown</SectionTitle>
            <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"36px 0"}}>No upcoming exams!</div>
          </>
        );
        const now = new Date(); const due = new Date(next.due);
        const diffMs = due-now; const diffDays = Math.floor(diffMs/86400000); const diffHrs = Math.floor((diffMs%86400000)/3600000);
        const countColor = diffMs<0?"var(--error)":diffDays<3?"var(--error)":diffDays<7?"#e67e22":"var(--primary)";
        return (
          <>
            <SectionTitle>Exam Countdown</SectionTitle>
            <div style={{textAlign:"center",padding:"12px 0 8px"}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Next up</div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--primary)",marginBottom:2,lineHeight:1.3}}>{next.title}</div>
              <div style={{fontSize:11,color:"var(--text2)",marginBottom:16}}>{next.course} · {due.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
              {diffMs<0 ? <div style={{fontFamily:"'Fraunces',serif",fontSize:34,fontWeight:700,color:"var(--error)"}}>Overdue</div>
              : diffDays===0 ? <div style={{fontFamily:"'Fraunces',serif",fontSize:40,fontWeight:700,color:"var(--error)",lineHeight:1}}>Today<div style={{fontSize:14,marginTop:4}}>in {diffHrs}h</div></div>
              : <div style={{fontFamily:"'Fraunces',serif",fontSize:52,fontWeight:700,color:countColor,lineHeight:1}}>{diffDays}<div style={{fontSize:13,color:"var(--text2)",fontFamily:"'DM Sans',sans-serif",fontWeight:400,marginTop:4}}>days away</div></div>}
            </div>
            {upcomingExams.length>1&&<div style={{marginTop:8,padding:"6px 10px",background:"var(--surface2)",borderRadius:8,fontSize:11,color:"var(--text2)",textAlign:"center"}}>+{upcomingExams.length-1} more exam{upcomingExams.length>2?"s":""} upcoming</div>}
          </>
        );
      }
      case "todayclasses": {
        const DAY_MAP = {0:"SUNDAY",1:"MONDAY",2:"TUESDAY",3:"WEDNESDAY",4:"THURSDAY",5:"FRIDAY",6:"SATURDAY"};
        const today3 = DAY_MAP[new Date().getDay()];
        const parseDays3 = str => { if(!str) return []; const m={M:"MONDAY",T:"TUESDAY",W:"WEDNESDAY",R:"THURSDAY",F:"FRIDAY",S:"SATURDAY",U:"SUNDAY"}; return str.split("").map(c=>m[c]).filter(Boolean); };
        const parseT3 = t => { if(!t) return null; const p=Array.isArray(t)?t:String(t).replace(/[^0-9:]/g,"").split(":"); if(p.length===1&&p[0].length===4) return parseInt(p[0].slice(0,2))+parseInt(p[0].slice(2))/60; return parseFloat(p[0])+parseFloat(p[1]||0)/60; };
        const fmtT3 = h => { const hr=Math.floor(h); const mn=Math.round((h-hr)*60); return `${hr%12||12}:${String(mn).padStart(2,"0")}${h>=12?"pm":"am"}`; };
        const semCourses3 = (apiSemesters.find(s=>s.semesterName===semester)?.courses||[]).filter(c=>c.section&&(!c.section?.sectionNumber||!((/^B(?!L)/i.test(c.section.sectionNumber))||/^E/i.test(c.section.sectionNumber))));
        const todayClasses = [];
        semCourses3.forEach(c => {
          const sec = c.section;
          [[sec.days1,sec.beginTime1,sec.endTime1],[sec.days2,sec.beginTime2,sec.endTime2]].forEach(([days,start,end])=>{
            if(!days||!start) return;
            if(parseDays3(days).includes(today3)) todayClasses.push({code:c.courseCode,start:parseT3(start),end:parseT3(end),label:`${fmtT3(parseT3(start))} – ${fmtT3(parseT3(end))}`});
          });
        });
        todayClasses.sort((a,b)=>a.start-b.start);
        return (
          <>
            <SectionTitle>Today's Classes</SectionTitle>
            {todayClasses.length===0 ? (
              <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"28px 0"}}>No classes today!</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
                {todayClasses.map((cl,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:"var(--surface2)",borderLeft:"3px solid var(--accent)"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--primary)"}}>{cl.code}</div>
                      <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{cl.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      }
      case "officehours": {
        const ohData = (() => { try { return JSON.parse(localStorage.getItem("kk_course_office_hours")||"{}"); } catch { return {}; } })();
        const courseData = (() => { try { return JSON.parse(localStorage.getItem("kk_course_data")||"{}"); } catch { return {}; } })();
        const semCodes = (apiSemesters.find(s=>s.semesterName===semester)?.courses||[]).filter(c=>!c.section?.sectionNumber||(!((/^B(?!L)/i.test(c.section.sectionNumber))||/^E/i.test(c.section.sectionNumber)))).map(c=>c.courseCode);
        const entries = semCodes.map(code=>({ code, prof: courseData[code]?.professor||"", oh: ohData[code]||[] })).filter(e=>e.prof||e.oh.length>0);
        return (
          <>
            <SectionTitle>Office Hours</SectionTitle>
            {entries.length===0 ? (
              <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"28px 0"}}>No office hours uploaded yet.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:14,maxHeight:280,overflowY:"auto"}}>
                {entries.map(e=>(
                  <div key={e.code} style={{padding:"10px 14px",borderRadius:10,background:"var(--surface2)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--primary)"}}>{e.code}</span>
                      {e.prof && <span style={{fontSize:11,color:"var(--text2)"}}>{e.prof}</span>}
                    </div>
                    {e.oh.length>0 ? e.oh.map((oh,i)=>(
                      <div key={i} style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{oh.day} · {oh.time}{oh.location?` · ${oh.location}`:""}</div>
                    )) : <div style={{fontSize:11,color:"var(--text3)"}}>No office hours listed</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        );
      }
      case "taskbreakdown": {
        const types = ["Assignment","Quiz","Exam","Project","Lab","Other"];
        const counts = types.map(type=>({ type, total: tasks.filter(t=>(t.type||"Other")===type).length, done: tasks.filter(t=>(t.type||"Other")===type&&t.done).length })).filter(c=>c.total>0);
        const colors = ["var(--accent)","#e67e22","var(--error)","var(--primary)","#27ae60","var(--text3)"];
        const total = tasks.length;
        return (
          <>
            <SectionTitle>Task Breakdown</SectionTitle>
            {total===0 ? (
              <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"28px 0"}}>No tasks yet.</div>
            ) : (
              <div style={{marginTop:14}}>
                <div style={{display:"flex",height:10,borderRadius:99,overflow:"hidden",marginBottom:14,gap:2}}>
                  {counts.map((c,i)=>(
                    <div key={c.type} style={{flex:c.total,background:colors[i%colors.length],minWidth:4,transition:"flex .4s"}} title={`${c.type}: ${c.total}`}/>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {counts.map((c,i)=>(
                    <div key={c.type} style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:colors[i%colors.length],flexShrink:0}}/>
                      <span style={{fontSize:12,color:"var(--text2)",flex:1}}>{c.type}</span>
                      <span style={{fontSize:12,fontWeight:600,color:"var(--primary)"}}>{c.done}/{c.total}</span>
                      <div style={{width:60,height:5,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:99,background:colors[i%colors.length],width:`${Math.round((c.done/c.total)*100)}%`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }
      case "studysessions": {
        const now3 = new Date();
        const upcoming3 = studyEntries.filter(e=>e.start&&new Date(e.start)>=now3).sort((a,b)=>new Date(a.start)-new Date(b.start)).slice(0,6);
        const fmtSession = d => { const dt=new Date(d); return dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+" · "+dt.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}); };
        return (
          <>
            <SectionTitle>Study Sessions</SectionTitle>
            {upcoming3.length===0 ? (
              <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"28px 0"}}>No upcoming study sessions.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14,maxHeight:260,overflowY:"auto"}}>
                {upcoming3.map((e,i)=>(
                  <div key={i} style={{padding:"9px 14px",borderRadius:10,background:"var(--surface2)",borderLeft:"3px solid var(--primary)"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--primary)"}}>{e.task?.course||"Study"}{e.task?.title?` — ${e.task.title}`:""}</div>
                    <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{e.start?fmtSession(e.start):"Unscheduled"}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      }
      case "gpasimulator": {
        const LETTER_GRADES = ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];
        const gradePoints = {"A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0};
        const semCourses4 = (apiSemesters.find(s=>s.semesterName===semester)?.courses||[]).filter(c=>c.courseCode&&Number(c.credits)>0&&(!c.section?.sectionNumber||!((/^B(?!L)/i.test(c.section.sectionNumber))||/^E/i.test(c.section.sectionNumber))));
        const totalCr = semCourses4.reduce((s,c)=>s+Number(c.credits),0);
        const simPoints = semCourses4.reduce((s,c)=>{
          const g = simGrades[c.courseCode] || c.grade?.trim().toUpperCase() || "";
          return gradePoints[g]!==undefined ? s + gradePoints[g]*Number(c.credits) : s;
        }, 0);
        const gradedCr = semCourses4.filter(c=>{
          const g = simGrades[c.courseCode] || c.grade?.trim().toUpperCase() || "";
          return gradePoints[g]!==undefined;
        }).reduce((s,c)=>s+Number(c.credits),0);
        const projGPA = gradedCr>0 ? (simPoints/gradedCr).toFixed(2) : null;
        return (
          <>
            <SectionTitle>GPA Simulator</SectionTitle>
            {semCourses4.length===0 ? (
              <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"28px 0"}}>No courses in selected semester.</div>
            ) : (
              <div style={{marginTop:14}}>
                {projGPA && (
                  <div style={{textAlign:"center",padding:"0 0 12px"}}>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:42,fontWeight:700,color:"var(--primary)",lineHeight:1}}>{projGPA}</div>
                    <div style={{fontSize:11,color:"var(--text2)",marginTop:4}}>projected semester GPA · {gradedCr}/{totalCr} cr graded</div>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {semCourses4.map(c=>{
                    const val = simGrades[c.courseCode] || c.grade?.trim().toUpperCase() || "";
                    const pts = gradePoints[val];
                    return (
                      <div key={c.courseCode} style={{display:"grid",gridTemplateColumns:"1fr auto 36px",gap:8,alignItems:"center",padding:"6px 10px",borderRadius:8,background:"var(--surface2)",borderLeft:`3px solid ${pts===undefined?"var(--border)":pts>=3.7?"#27ae60":pts>=2.7?"#e67e22":"var(--error)"}`,position:"relative",overflow:"visible",zIndex:dashDropId==="sim-"+c.courseCode?10:1}}>
                        <span style={{fontSize:12,fontWeight:600,color:"var(--primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.courseCode}</span>
                        <div style={{position:"relative"}}>
                          <button onClick={(e)=>{e.stopPropagation();const k="sim-"+c.courseCode;setDashDropId(dashDropId===k?"":k);}} style={{padding:"2px 8px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface)",color:val?"var(--text)":"var(--text3)",cursor:"pointer",fontFamily:"inherit",fontSize:11,display:"flex",alignItems:"center",gap:4}}>
                            {val||"—"}<span style={{fontSize:8,opacity:0.6,display:"inline-block",transition:"transform .2s",transform:dashDropId==="sim-"+c.courseCode?"rotate(0deg)":"rotate(-90deg)"}}>▾</span>
                          </button>
                          {dashDropId==="sim-"+c.courseCode && (
                            <div onWheel={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"var(--surface)",borderRadius:10,boxShadow:"0 8px 32px rgba(49,72,122,0.15)",border:"1px solid var(--border)",zIndex:300,padding:4,minWidth:70,maxHeight:180,overflowY:"auto"}}>
                              <div className="kk-option" onClick={()=>{setSimGrades(p=>({...p,[c.courseCode]:""}));setDashDropId("");}} style={{padding:"7px 12px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text3)",transition:"background .15s"}}>—</div>
                              {LETTER_GRADES.map(g=>(
                                <div key={g} className="kk-option" onClick={()=>{setSimGrades(p=>({...p,[c.courseCode]:g}));setDashDropId("");}} style={{padding:"7px 12px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,background:val===g?"var(--divider)":"transparent",color:val===g?"var(--accent)":"var(--primary)",transition:"background .15s"}}>
                                  {g}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span style={{fontSize:11,color:"var(--text3)",textAlign:"right"}}>{c.credits}cr</span>
                      </div>
                    );
                  })}
                </div>
                {Object.keys(simGrades).length>0 && (
                  <button onClick={()=>setSimGrades({})} style={{marginTop:8,fontSize:11,color:"var(--text3)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"block",marginLeft:"auto"}}>Reset</button>
                )}
              </div>
            )}
          </>
        );
      }
      case "prioritytasks": {
        const now4 = new Date();
        const todayStr = now4.toISOString().slice(0,10);
        const overdue = tasks.filter(t=>!t.done&&t.due&&new Date(t.due)<now4&&t.due.slice(0,10)!==todayStr).sort((a,b)=>new Date(a.due)-new Date(b.due));
        const dueToday = tasks.filter(t=>!t.done&&t.due&&t.due.slice(0,10)===todayStr);
        const all = [...overdue,...dueToday];
        return (
          <>
            <SectionTitle>Priority Tasks</SectionTitle>
            {all.length===0 ? (
              <div style={{fontSize:13,color:"var(--text3)",textAlign:"center",padding:"28px 0"}}>Nothing urgent right now!</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:14,maxHeight:280,overflowY:"auto"}}>
                {overdue.length>0 && <div style={{fontSize:10,fontWeight:700,color:"var(--error)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Overdue</div>}
                {overdue.map((t,i)=>(
                  <div key={`o${i}`} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"var(--error-bg)",borderLeft:"3px solid var(--error)"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--error)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>
                      <div style={{fontSize:11,color:"var(--text2)",marginTop:1}}>{[t.course,t.type].filter(Boolean).join(" · ")}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:700,color:"var(--error)",whiteSpace:"nowrap"}}>{new Date(t.due).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                  </div>
                ))}
                {dueToday.length>0 && <div style={{fontSize:10,fontWeight:700,color:"var(--warn1)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2,marginTop:overdue.length?6:0}}>Due Today</div>}
                {dueToday.map((t,i)=>(
                  <div key={`d${i}`} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"var(--warn-bg)",borderLeft:"3px solid var(--warn1)"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>
                      <div style={{fontSize:11,color:"var(--text2)",marginTop:1}}>{[t.course,t.type].filter(Boolean).join(" · ")}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:700,color:"var(--warn1)",whiteSpace:"nowrap"}}>Today</span>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      }
      default: return null;
    }
  };

  const renderWidget = (id, isPinned = false) => {
    const wDef = ALL_WIDGETS.find(w => w.id === id);
    const span = widgetSizes[id] ?? (wDef?.span || 1);
    const isDragging = dragId === id;
    const isTarget  = dragOverId === id && dragId !== id;
    const hasOpenDrop = (id === "grades" && dashDropId.startsWith("goal-")) || (id === "gpasimulator" && dashDropId.startsWith("sim-"));
    const wrapStyle = { gridColumn:`span ${span}`, opacity: isDragging ? 0.4 : 1, outline: isTarget ? "2px solid var(--primary)" : "none", borderRadius:18, transition:"opacity .15s", position:"relative", ...(hasOpenDrop ? {zIndex:10} : {}) };

    const editOverlay = editMode && !isPinned ? (
      <>
        <button onClick={() => toggleWidget(id)} title="Hide widget" style={{
          position:"absolute", top:-8, right:-8, zIndex:10,
          width:22, height:22, borderRadius:"50%", border:"none",
          background:"var(--error)", color:"white", fontSize:14, fontWeight:700,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 2px 6px rgba(0,0,0,0.2)", lineHeight:1
        }}>×</button>
        <div style={{ position:"absolute", bottom:8, right:10, display:"flex", alignItems:"center", gap:4, zIndex:10 }}>
          <button onClick={() => toggleSize(id)} title={span >= 3 ? "Shrink" : "Expand"} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:6, padding:"2px 8px", cursor:"pointer", color:"var(--text2)", fontSize:11, fontFamily:"inherit" }}>
            {span >= 3 ? "↙" : "↗"}
          </button>
          <div draggable onDragStart={() => onDragStart(id)} title="Drag to reorder"
            style={{ cursor:"grab", color:"var(--text2)", fontSize:15, userSelect:"none", padding:"2px 4px" }}>⠿</div>
        </div>
      </>
    ) : null;

    return (
      <section key={id} className="card-anim"
        style={{ ...s.card, ...wrapStyle, display:"flex", flexDirection:"column" }}
        onDragOver={editMode && !isPinned ? e => onDragOver(e,id) : undefined}
        onDrop={editMode && !isPinned ? () => onDrop(id) : undefined}
        onDragEnd={editMode && !isPinned ? onDragEnd : undefined}>
        {editOverlay}
        <div style={{ flex:1 }}>{renderWidgetContent(id)}</div>
      </section>
    );
  };

  return (
      <div style={s.root}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:var(--bg); }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#8FB3E2; border-radius:10px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .card-anim { animation:fadeUp .3s ease both; }
        .card-anim:nth-child(2){animation-delay:.06s} .card-anim:nth-child(3){animation-delay:.12s}
        .card-anim:nth-child(4){animation-delay:.18s} .card-anim:nth-child(5){animation-delay:.24s}
        .card-anim:nth-child(6){animation-delay:.30s} .card-anim:nth-child(7){animation-delay:.36s}
        .card-anim:nth-child(8){animation-delay:.42s}
        .nav-btn { transition:background .15s,color .15s; cursor:pointer; }
        .nav-btn:hover { background:rgba(255,255,255,0.12) !important; }
        .course-card { transition:transform .2s,box-shadow .2s; cursor:pointer; }
        .course-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(49,72,122,0.18) !important; }
        .todo-row { transition:background .15s; }
        .todo-row:hover { background:var(--surface3) !important; }
        .add-btn:hover { background:var(--surface3) !important; }
        .add-btn { transition:background .15s; }
        .cal-day:hover { background:var(--surface3) !important; border-radius:6px; }
        .toggle-opt:hover { background:var(--surface3); }
      `}</style>


        <aside onClick={() => setSidebarOpen(o=>!o)} style={{ ...s.sidebar, width:sidebarOpen ? 224 : 66, cursor:"pointer" }}>
          <div style={{ ...s.sidebarTop, justifyContent: sidebarOpen ? "flex-start" : "center" }}>
            <img src="/KourseKit.jpeg" alt="KourseKit" style={{ width:34, height:34, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
            {sidebarOpen && <span style={{ ...s.logoLabel, marginLeft:12 }}>KourseKit</span>}
          </div>
          <nav style={{flex:1,paddingTop:10}}>
            {NAV_ITEMS.map(item => (
                <div key={item.id} className="nav-btn" onClick={e => { e.stopPropagation(); setActivePage(item.id); }} style={{
                  display:"flex", alignItems:"center", padding:"10px 16px", margin:"2px 8px", borderRadius:10,
                  justifyContent:sidebarOpen?"flex-start":"center",
                  background:activePage===item.id?"rgba(255,255,255,0.15)":"transparent",
                  color:activePage===item.id?"#ffffff":"rgba(255,255,255,0.60)",
                  fontWeight:activePage===item.id?600:400, userSelect:"none", position:"relative",
                }}>
                  <span style={{fontSize:17,minWidth:22,textAlign:"center"}}>{item.icon}</span>
                  {sidebarOpen && <span style={{marginLeft:10,fontSize:14}}>{item.label}</span>}
                  {sidebarOpen && activePage===item.id && <span style={{position:"absolute",right:14,width:6,height:6,borderRadius:"50%",background:"var(--primary)"}} />}
                </div>
            ))}
          </nav>
          <div onClick={e => e.stopPropagation()} style={{margin:"0 8px 16px",borderRadius:10,border:"1px solid rgba(255,255,255,0.18)",background:"rgba(255,255,255,0.10)",display:"flex",alignItems:"center",padding:"8px 10px",gap:8,justifyContent:sidebarOpen?"flex-start":"center"}}>
            <div className="nav-btn" onClick={() => setActivePage("profile")} style={{display:"flex",alignItems:"center",justifyContent:sidebarOpen?"flex-start":"center",gap:8,flex:1,cursor:"pointer",userSelect:"none",minWidth:0,borderRadius:8,padding:"2px 4px",background:activePage==="profile"?"rgba(255,255,255,0.12)":"transparent"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#31487A",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:activePage==="profile"?"2px solid rgba(255,255,255,0.6)":"2px solid transparent",transition:"border-color .15s",overflow:"hidden"}}>
                {(profile.avatar?.startsWith("data:") || profile.avatar?.startsWith("http"))
                    ? <img src={profile.avatar} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : (() => { const a = AVATAR_ICONS.find(x => x.id === profile.avatar); return a ? <a.icon size={13} color="white" /> : <span style={{fontWeight:700,fontSize:11,color:"white",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>{email[0].toUpperCase()}</span>; })()}
              </div>
              {sidebarOpen && (
                <div style={{display:"flex",flexDirection:"column",lineHeight:1.3,overflow:"hidden",minWidth:0}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#ffffff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Student Profile</span>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.42)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{email}</span>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <div className="nav-btn" onClick={() => setActivePage("settings")} style={{flexShrink:0,cursor:"pointer",padding:"4px",borderRadius:7,background:activePage==="settings"?"rgba(255,255,255,0.18)":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <SettingsIcon size={15} color={activePage==="settings"?"#ffffff":"rgba(255,255,255,0.55)"} />
              </div>
            )}
          </div>
        </aside>

        <main style={s.main}>
          <header style={{ ...s.topbar, ...(activePage === "planner" ? { display: "none" } : {}) }}>
            <div>
              <div style={s.greeting}>Hello, <span style={{fontFamily:"'Fraunces',serif",fontStyle:"italic",color:"var(--primary)"}}>{displayName}!</span></div>
              <div style={{fontSize:13,color:"var(--accent2)",marginTop:2}}>{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            </div>

            <div style={{display:"flex", alignItems:"center", gap:8, marginLeft:"auto"}}>
              {activePage === "dashboard" && (
                <SemesterSelect value={semester} onChange={setSemester} semesters={apiSemesters.map(s => s.semesterName)} />
              )}
              {activePage === "dashboard" && (
                <button className="kk-pill" onClick={() => setEditMode(e => !e)} style={{ height:38, padding:"0 16px", borderRadius:10, border: editMode ? "1px solid color-mix(in srgb, var(--primary) 30%, transparent)" : "1px solid var(--border)", background: editMode ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "var(--surface)", color:"var(--primary)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                  {editMode ? "Done" : "Edit Widgets"}
                </button>
              )}
              <button
                  onClick={() => window.location.reload()}
                  title="Refresh"
                  className="kk-pill" style={{...s.bell, fontSize:16, cursor:"pointer", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--primary)"}}
              >
                ↺
              </button>
              <div ref={notifRef} style={{position:"relative"}}>
                <button
                    onClick={() => { setShowNotifPanel(p => { if (p && unreadCount > 0) markAllAsRead(); return !p; }); }}
                    className="kk-pill" style={{...s.bell, position:"relative", border:"1px solid var(--border)", cursor:"pointer"}}
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
                                        <div key={`${n.taskDeadline}-${n.urgency}`} style={{
                                          padding:"9px 16px 10px",
                                          background:"var(--error-fg)",
                                          borderBottom: i < arr.length - 1 ? "1px solid var(--error-border)" : "1px solid var(--border)"
                                        }}>
                                          <div style={{fontSize:12, color:"var(--primary)", lineHeight:1.5}}>{n.message}</div>
                                          <div style={{fontSize:10, color:"var(--text3)", marginTop:3}}>
                                            {timeAgo(n.createdAt)}
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
                                        <div key={`${n.taskDeadline}-${n.urgency}`} style={{
                                          padding:"9px 16px 10px",
                                          background:"var(--surface)",
                                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "1px solid var(--border)"
                                        }}>
                                          <div style={{fontSize:12, color:"var(--primary)", lineHeight:1.5}}>{n.message}</div>
                                          <div style={{fontSize:10, color:"var(--text3)", marginTop:3}}>
                                            {timeAgo(n.createdAt)}
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
                                        <div key={`${n.taskDeadline}-${n.urgency}`} style={{
                                          padding:"9px 16px 10px",
                                          background:"var(--surface)",
                                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "1px solid var(--border)"
                                        }}>
                                          <div style={{fontSize:12, color:"var(--primary)", lineHeight:1.5}}>{n.message}</div>
                                          <div style={{fontSize:10, color:"var(--text3)", marginTop:3}}>
                                            {timeAgo(n.createdAt)}
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
                                        <div key={`${n.taskDeadline}-${n.urgency}`} style={{
                                          padding:"9px 16px 10px",
                                          background:"var(--surface)",
                                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none"
                                        }}>
                                          <div style={{fontSize:12, color:"var(--primary)", lineHeight:1.5}}>{n.message}</div>
                                          <div style={{fontSize:10, color:"var(--text3)", marginTop:3}}>
                                            {timeAgo(n.createdAt)}
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
                {/* Pinned priority zone */}

                {ALL_WIDGETS.filter(w => w.pinned && visible[w.id]).map(w => renderWidget(w.id, true))}
                {ALL_WIDGETS.some(w => w.pinned && visible[w.id]) && widgetOrder.some(id => { const w = ALL_WIDGETS.find(x => x.id === id); return visible[id] && !w?.pinned; }) && (
                  <div style={{ gridColumn:"span 3", height:1, background:"var(--border)", margin:"4px 0" }} />
                )}
                {/* Reorderable widgets */}
                {widgetOrder.filter(id => { const w = ALL_WIDGETS.find(x => x.id === id); return visible[id] && !w?.pinned; }).map(id => renderWidget(id))}
                {/* Hidden widgets strip — only in edit mode */}
                {editMode && widgetOrder.some(id => { const w = ALL_WIDGETS.find(x => x.id === id); return !visible[id] && !w?.pinned; }) && (
                  <div style={{ gridColumn:"span 3", display:"flex", flexWrap:"wrap", gap:8, padding:"14px 18px", background:"var(--surface2)", borderRadius:14, border:"1px dashed var(--border)", alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.07em", marginRight:4 }}>Hidden</span>
                    {widgetOrder.filter(id => { const w = ALL_WIDGETS.find(x => x.id === id); return !visible[id] && !w?.pinned; }).map(id => {
                      const wDef = ALL_WIDGETS.find(w => w.id === id);
                      return (
                        <button key={id} onClick={() => toggleWidget(id)}
                          style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--primary)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                          + {wDef?.label}
                        </button>
                      );
                    })}
                  </div>
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
                  semester={semester}
                  onNotificationsChanged={loadNotifications}
              />
          )}
          {activePage === "reviews" && <Reviews initialCourse={courseDetailsTarget} onNavigateToForum={navigateToForum} />}
          {activePage === "forum" && <Forum initialCourseTag={forumCourseTag} initialProfTag={forumProfTag} onClearFilter={() => { setForumCourseTag(""); setForumProfTag(""); }} />}
          {activePage === "planner" && <StudyPlanner enrolledSections={enrolledSections} semester={semester} onNavigate={setActivePage} />}
          {activePage === "groups" && <StudyGroupFinder courses={[...new Map(semCourseList.map(c => [c.name, { id: c.name, name: c.name }])).values()]} />}
          {activePage === "students" && <StudentDirectory onClose={() => setActivePage("dashboard")} />}
          {activePage === "profile" && (
              <Profile onProfileSave={p => setProfile(p)} onSemestersUpdated={fetchSemesters} activeSemester={semester} />
          )}
          {activePage === "settings" && <Settings onLogout={handleLogout} />}

          {activePage === "courseDetails" && courseDetailsTarget && (
              <CourseDetails
                  course={courseDetailsTarget}
                  onBack={() => setActivePage("dashboard")}
                  onNavigateToForum={navigateToForum}
              />
          )}

        </main>

        {showOnboarding && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px", overflowY:"auto" }}>
            <div style={{ background:"var(--surface)", borderRadius:24, padding:"28px 32px", maxWidth:880, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", maxHeight:"calc(100vh - 64px)", overflowY:"auto", margin:"auto" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:22, color:"var(--primary)", marginBottom:6 }}>Mark your availability</div>
              <div style={{ fontSize:13, color:"var(--text2)", marginBottom:16, lineHeight:1.5 }}>
                Drag on the grid to mark when you're free to study. The Study Planner uses this to schedule your sessions.
              </div>
              <div style={{ marginBottom: -20 }}>
                <DefaultScheduleEditor
                  token={localStorage.getItem("kk_token")}
                  semesterName={semester}
                  onDone={dismissOnboarding}
                  extraAction={
                    <button onClick={dismissOnboarding} style={{ background:"none", border:"none", color:"var(--text2)", fontSize:13, cursor:"pointer", padding:"6px 0", textDecoration:"underline", fontFamily:"'DM Sans',sans-serif" }}>
                      Skip for now
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        )}


        {/* Course Details Panel */}
        {courseDetailsTarget && (() => {
          const cn = courseDetailsTarget;
          const courseEntry = semCourseList.find(c => c.name === cn);
          const sec = courseEntry?.section;
          const professor = courseData[cn]?.professor || courseSyllabi[cn]?.professor || sec?.professorName || null;
          const oh = courseOfficeHours[cn] || [];
          const syllabus = courseSyllabi[cn];
          const color = "var(--primary)";
          const fmtTime = t => { if (!t) return ""; const s = String(t); if (s.includes(":")) return s.slice(0,5); if (s.length===4) return `${s.slice(0,2)}:${s.slice(2)}`; return s; };
          const scheduleLines = [];
          if (sec?.days1 && sec?.beginTime1) scheduleLines.push(`${sec.days1}  ${fmtTime(sec.beginTime1)}–${fmtTime(sec.endTime1)}${sec.building1 ? `  ·  ${sec.building1}${sec.room1 ? " "+sec.room1 : ""}` : ""}`);
          if (sec?.days2 && sec?.beginTime2) scheduleLines.push(`${sec.days2}  ${fmtTime(sec.beginTime2)}–${fmtTime(sec.endTime2)}${sec.building2 ? `  ·  ${sec.building2}${sec.room2 ? " "+sec.room2 : ""}` : ""}`);
          return (
            <div onClick={()=>setCourseDetailsTarget(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
              <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:18,width:"min(480px,96vw)",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 40px rgba(49,72,122,0.22)",fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>
                {/* Header */}
                <div style={{padding:"24px 24px 18px",borderBottom:"1px solid var(--border)",background:`linear-gradient(135deg,${color}18 0%,transparent 100%)`}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                    <div>
                      <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:22,color:color,letterSpacing:"-0.01em"}}>{cn}</div>
                      {sec?.sectionNumber && <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>Section {sec.sectionNumber}{sec?.creditHours ? `  ·  ${sec.creditHours} cr` : (courseEntry?.credits ? `  ·  ${courseEntry.credits} cr` : "")}</div>}
                    </div>
                    <button onClick={()=>setCourseDetailsTarget(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"var(--text3)",lineHeight:1,padding:"2px 4px",marginTop:2}}>✕</button>
                  </div>
                  {courseEntry?.grade && <div style={{display:"inline-block",marginTop:10,background:color+"22",color:color,fontWeight:700,fontSize:13,borderRadius:7,padding:"3px 10px"}}>{courseEntry.grade}</div>}
                </div>

                <div style={{padding:"18px 24px",display:"flex",flexDirection:"column",gap:16,overflowY:"auto",flex:1}}>
                  {/* Professor */}
                  {professor && (
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Professor</div>
                      <div style={{fontSize:14,color:"var(--text)",fontWeight:500}}>{professor}</div>
                    </div>
                  )}

                  {/* Schedule */}
                  {scheduleLines.length > 0 && (
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Class Schedule</div>
                      {scheduleLines.map((l,i)=>(
                        <div key={i} style={{fontSize:13,color:"var(--text2)",lineHeight:1.7}}>{l}</div>
                      ))}
                    </div>
                  )}

                  {/* Office Hours */}
                  {oh.length > 0 && (
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Office Hours</div>
                      {oh.map((o,i)=>(
                        <div key={i} style={{fontSize:13,color:"var(--text2)",lineHeight:1.7}}>{[o.day,o.time,o.location].filter(Boolean).join(" · ")}</div>
                      ))}
                    </div>
                  )}

                  {/* Syllabus Assessments */}
                  {syllabus?.assessments?.length > 0 && (
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Grade Breakdown</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {(() => {
                          const isFinalInList = syllabus.assessments.some(a => /final/i.test(a.name));
                          return syllabus.assessments.map((a,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13}}>
                              <span style={{color:"var(--text)"}}>{a.name}</span>
                              <span style={{fontWeight:600,color:color}}>{a.weight}%</span>
                            </div>
                          )).concat(
                            syllabus.finalExamWeight != null && !isFinalInList ? [
                              <div key="final" style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,paddingTop:5,borderTop:"1px solid var(--border)",marginTop:2}}>
                                <span style={{color:"var(--text)"}}>Final Exam</span>
                                <span style={{fontWeight:600,color:color}}>{syllabus.finalExamWeight}%</span>
                              </div>
                            ] : []
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* No syllabus placeholder */}
                  {!syllabus && (
                    <div style={{background:"var(--surface2)",borderRadius:10,padding:"14px 16px",fontSize:12,color:"var(--text3)",textAlign:"center"}}>
                      No syllabus uploaded yet.<br/>Upload one to see grade breakdown & office hours.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",gap:8}}>
                  <button className="kk-pill" onClick={()=>{setCourseDetailsTarget(null);setSyllabusTarget(cn);}} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid color-mix(in srgb,var(--primary) 30%,transparent)",background:"color-mix(in srgb,var(--primary) 15%,transparent)",color:"var(--primary)",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                    {syllabus ? "Edit Syllabus" : "<><Plus size={13} /> Upload Syllabus</>"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {showTranscript && (
          <TranscriptModal
            onClose={() => setShowTranscript(false)}
            onApply={() => { setShowTranscript(false); fetchSemesters(); }}
          />
        )}

        {syllabusTarget && (
            <SyllabusModal
                courseName={syllabusTarget}
                existingData={courseSyllabi[syllabusTarget] ? {
                  ...courseSyllabi[syllabusTarget],
                  professor: courseData[syllabusTarget]?.professor || courseSyllabi[syllabusTarget]?.professor || "",
                  officeHours: courseOfficeHours[syllabusTarget] || [],
                } : null}
                onClose={() => setSyllabusTarget(null)}
                onApply={data => {
                  const name = syllabusTarget;
                  setSyllabusTarget(null);
                  if (data) {
                    if (data.officeHours?.length) saveCourseOfficeHours(name, data.officeHours);
                    // Sync professor + assessments into kk_course_data (grade calculator reads from here)
                    try {
                      const dm = JSON.parse(localStorage.getItem("kk_course_data") || "{}");
                      const existing = dm[name] || {};
                      const updates = { ...existing };
                      if (data.professor) updates.professor = data.professor;
                      if (data.assessments?.length) {
                        updates.components = data.assessments.map((a, i) => {
                          const t = inferGCType(a.name);
                          return {
                            id: Date.now() + i,
                            type: t,
                            weight: parseFloat(a.weight) || 0,
                            grade: existing.components?.find(c => c.type === t)?.grade ?? "",
                            customType: t === "Other" ? (a.name || "") : "",
                          };
                        });
                      }
                      dm[name] = updates;
                      localStorage.setItem("kk_course_data", JSON.stringify(dm));
                      setCourseData(dm);
                    } catch {}
                    // Always save to kk_course_syllabus
                    try {
                      const all = JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}");
                      const existing = all[name] || {};
                      const payload = {
                        ...existing,
                        assessments: data.assessments ?? existing.assessments ?? [],
                        finalExamWeight: data.finalExamWeight !== undefined ? data.finalExamWeight : (existing.finalExamWeight ?? null),
                        professor: data.professor || existing.professor || null,
                        uploaded: true,
                      };
                      const next = { ...all, [name]: payload };
                      localStorage.setItem("kk_course_syllabus", JSON.stringify(next));
                      setCourseSyllabi(next);
                      fetch(`${API}/api/user-syllabi/${encodeURIComponent(name)}`, {
                        method: "PUT",
                        headers: authHeaders(),
                        body: JSON.stringify(payload),
                      }).catch(() => {});
                    } catch {}
                  }
                }}
            />
        )}
      </div>
  );
}

const s = {
  root:         { display:"flex", minHeight:"100vh", background:"var(--bg)", fontFamily:"'DM Sans',sans-serif" },
  sidebar:      { display:"flex", flexDirection:"column", background:"var(--sidebar-bg)", height:"100vh", position:"sticky", top:0, transition:"width 0.25s ease", overflow:"hidden", flexShrink:0, zIndex:100 },
  sidebarTop:   { display:"flex", alignItems:"center", width:"100%", boxSizing:"border-box", padding:"20px 16px 16px", borderBottom:"1px solid rgba(255,255,255,0.1)" },
  logoMark:     { width:34, height:34, borderRadius:10, background:"#7B5EA7", color:"white", fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  logoLabel:    { fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:18, color:"#ffffff", whiteSpace:"nowrap" },
  userPill:     { display:"flex", alignItems:"center", gap:10, margin:"12px 12px 6px", padding:"10px 12px", background:"rgba(255,255,255,0.08)", borderRadius:12 },
  avatar:       { width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg, #8FB3E2, #A59AC9)", color:"white", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  collapseBtn:  { margin:"8px auto", display:"block", background:"none", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"4px 10px", cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:12 },
  main:         { flex:1, overflowY:"auto", minHeight:"100vh" },
  topbar:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12.5px 28px", background:"var(--bg)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:50, borderBottom:"1px solid var(--border)", gap:14, flexWrap:"wrap" },
  greeting:     { fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:20, color:"var(--primary)" },
  bell:         { width:38, height:38, borderRadius:10, background:"var(--surface)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 },
  grid:         { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gridAutoFlow:"dense", gap:20, padding:"24px 28px 40px" },
  card:         { background:"var(--surface)", borderRadius:18, padding:"20px 22px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid var(--border)" },
  courseCard:   { background:"var(--surface)", borderRadius:12, padding:"12px 14px", minWidth:140, flex:"1 1 140px", boxShadow:"0 2px 12px rgba(49,72,122,0.10)" },
  progressTrack:{ height:10, background:"#D9E1F1", borderRadius:10, overflow:"hidden" },
  progressFill: { height:"100%", background:"linear-gradient(90deg, #31487A, #8FB3E2)", borderRadius:10, transition:"width 0.6s ease" },
  chip:         { flex:1, background:"var(--surface2)", borderRadius:10, padding:"8px 12px", textAlign:"center" },
  todoInput:    { flex:1, padding:"9px 12px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"var(--surface2)", color:"var(--text)" },
  addBtn:       { padding:"9px 16px", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", border:"1px solid color-mix(in srgb, var(--primary) 30%, transparent)", borderRadius:10, fontSize:18, cursor:"pointer", lineHeight:1, transition:"background .15s" },
  todoRow:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:8, background:"var(--surface2)" },
  reviewCard:   { flex:"1 1 260px", background:"var(--bg)", borderRadius:12, padding:"14px 16px" },
  calNavBtn:    { background:"none", border:"1px solid var(--border)", borderRadius:8, width:28, height:28, cursor:"pointer", fontSize:14, color:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, transition:"all .15s" },
};

const sd = {
  trigger: { display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 1px 4px rgba(49,72,122,0.06)" },
  dropdown: { position:"absolute", top:"calc(100% + 8px)", left:0, minWidth:200, background:"var(--surface)", borderRadius:14, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:"6px", overflow:"hidden" },
  option: { padding:"10px 14px", borderRadius:10, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", transition:"background .12s", display:"flex", alignItems:"center" },
  toggleBtn: { display:"flex", alignItems:"center", padding:"8px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:15 },
  togglePanel: { position:"absolute", top:"calc(100% + 8px)", right:0, width:220, background:"var(--surface)", borderRadius:14, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:"14px" },
  smallAddBtn: { fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:8, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--primary)", cursor:"pointer" },
  addEventForm: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:12, padding:"12px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)", alignItems:"center" },
  miniSelect: { padding:"6px 8px", border:"1px      solid var(--border)", borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", cursor:"pointer", outline:"none" },
  miniInput: { padding:"6px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", outline:"none" },
  miniSaveBtn: { padding:"6px 14px", background:"var(--primary)", color:"white", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" },
};