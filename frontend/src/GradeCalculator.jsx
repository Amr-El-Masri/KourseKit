import { useState, useEffect, useRef } from "react";

const API = "http://localhost:8080";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("kk_token")}`,
});

async function parseResponse(res) {
  if (res.status === 401 || res.status === 403) {
    throw new Error("Session expired. Please log out and log back in.");
  }
  return res.json();
}

// Converts letter grade to a representative numeric percentage for weighted calculations
function letterToNumeric(input) {
  const s = String(input).trim().toUpperCase();
  const map = { "A+":97, "A":93, "A-":90, "B+":87, "B":83, "B-":80, "C+":77, "C":73, "C-":70, "D+":67, "D":63, "F":50 };
  if (map[s] !== undefined) return map[s];
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Validates that input is a recognised letter grade OR a number 0–100
function isValidGrade(input) {
  const s = String(input).trim().toUpperCase();
  const letters = ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];
  if (letters.includes(s)) return true;
  const n = parseFloat(s);
  return !isNaN(n) && n >= 0 && n <= 100;
}

// Validates that input is a positive number ≤ 100
function isValidWeight(input) {
  const n = parseFloat(String(input).trim());
  return !isNaN(n) && n > 0 && n <= 100;
}

// Accepts letter grade (A+, B-, etc.) or numeric (0–100) to retrun letter grade
function resolveGrade(input) {
  const s = String(input).trim().toUpperCase();
  const letters = ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];
  if (letters.includes(s)) return s;
  const n = parseFloat(s);
  if (isNaN(n)) return s; // let backend reject
  if (n >= 93) return "A+";
  if (n >= 87) return "A";
  if (n >= 83) return "A-";
  if (n >= 79) return "B+";
  if (n >= 75) return "B";
  if (n >= 72) return "B-";
  if (n >= 69) return "C+";
  if (n >= 66) return "C";
  if (n >= 63) return "C-";
  if (n >= 61) return "D+";
  if (n >= 60) return "D";
  return "F";
}

// Shared helper functions
function SectionTitle({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <div style={{ width:3, height:18, background:"var(--accent)", borderRadius:2 }} />
      <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"var(--primary)" }}>{children}</h3>
    </div>
  );
}

function ResultBadge({ value, label, color="var(--primary)" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, background:"var(--divider)", borderRadius:12, padding:"12px 20px", border:"1px solid var(--border)" }}>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:"var(--text2)" }}>{label}</div>
    </div>
  );
}

function InfoBox({ children, color="var(--primary)", bg="var(--divider)", border="var(--accent)" }) {
  return (
    <div style={{ marginTop:16, padding:"14px 18px", background:bg, borderRadius:12, borderLeft:`3px solid ${border}`, fontSize:14, color, fontWeight:500, lineHeight:1.6 }}>
      {children}
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <InfoBox color="var(--error)" bg="var(--error-bg)" border="var(--error)">{children}</InfoBox>
  );
}

function WeightIndicator({ total }) {
  const pct = isNaN(total) ? 0 : total;
  const color  = pct === 100 ? "var(--success)" : pct > 100 ? "var(--error)" : "var(--warn1)";
  const bg     = pct === 100 ? "var(--success-bg)" : pct > 100 ? "var(--error-bg)" : "var(--warn-bg)";
  const border = pct === 100 ? "#2d7a4a33" : pct > 100 ? "#c0392b33" : "#c97d0033";
  return (
    <span style={{ fontSize:13, fontWeight:600, color, padding:"5px 11px", background:bg, borderRadius:8, border:`1px solid ${border}` }}>
      {pct % 1 === 0 ? pct : pct.toFixed(1)}% / 100%
    </span>
  );
}

function letterToGPA(grade) {
  const map = { "A+":4.3,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"F":0.0 };
  return map[String(grade ?? "").trim().toUpperCase()] ?? null;
}
function computeSavedGPA(courses) {
  if (!courses?.length) return null;
  let pts = 0, creds = 0;
  for (const c of courses) {
    const g = letterToGPA(c.grade);
    if (g !== null && Number(c.credits) > 0) { pts += g * Number(c.credits); creds += Number(c.credits); }
  }
  return creds > 0 ? (pts / creds).toFixed(2) : null;
}

const LETTER_GRADES = ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];

const SEMESTER_OPTIONS = [
  "Fall 25-26","Spring 25-26","Summer 25-26",
  "Fall 24-25","Spring 24-25","Summer 24-25",
  "Fall 23-24","Spring 23-24","Summer 23-24",
  "Fall 22-23","Spring 22-23","Summer 22-23",
  "Fall 21-22","Spring 21-22","Summer 21-22",
];

const COMP_TYPES = ["Midterm Exam","Final Exam","Assignment","Project","Quiz","Lab","Presentation","Attendance","Participation","Other"];

function inferType(name) {
  const n = (name || "").toLowerCase();
  // Combined names like "Assignment/Attendance" stay as Other so the label is preserved
  if (n.includes("/") || n.includes("&")) return "Other";
  if (/final/.test(n)) return "Final Exam";
  if (/midterm/.test(n)) return "Midterm Exam";
  if (/exam/.test(n)) return "Final Exam";
  if (/quiz/.test(n)) return "Quiz";
  if (/^assignment$/.test(n) || /\bhw\b/.test(n) || /homework/.test(n)) return "Assignment";
  if (/project/.test(n)) return "Project";
  if (/lab/.test(n)) return "Lab";
  if (/^attendance$/.test(n)) return "Attendance";
  if (/^participation$/.test(n)) return "Participation";
  const exact = COMP_TYPES.find(t => t.toLowerCase() === n);
  if (exact) return exact;
  return "Other";
}

// Grade Calculator page
export default function GradeCalculator({ dashboardCourses = [], savedSemesters = [], selectedSemester = "", onNavigate }) {
  const [activeTab, setActiveTab] = useState("semester");

  // Row helpers (UI only)
  const addRow    = setter => setter(p => [...p, { id:Date.now(), name:"", grade:"", credits:"", weight:"", type:"", gpa:"", customType:"" }]);
  const removeRow = (setter, id) => setter(p => p.length > 1 ? p.filter(r => r.id !== id) : p);
  const updateRow = (setter, id, field, val) => setter(p => p.map(r => r.id === id ? { ...r, [field]:val } : r));

  // Semester GPA
  const [semToLoad, setSelectedLoad] = useState("");
  const [semCourses, setSemCourses] = useState([{ id:1, name:"", grade:"", credits:"" }]);
  const [semResult,  setSemResult]  = useState(null);
  const [semLoading, setSemLoading] = useState(false);
  const [semError,   setSemError]   = useState(null);

  // Highest Impact (integrated — auto-runs after Semester GPA)
  const [impactResult,  setImpactResult]  = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError,   setImpactError]   = useState(null);


  const calcSemGPA = async () => {
    setSemError(null);
    setImpactResult(null);
    setImpactError(null);
    const missingFields = semCourses.some(c => !c.grade || !c.credits);
    if (missingFields) { setSemError("Please fill in grade and credits for all courses."); return; }
    const badGrade = semCourses.find(c => !isValidGrade(c.grade));
    if (badGrade) { setSemError(`"${badGrade.grade}" is not a valid grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    const badCredits = semCourses.find(c => isNaN(parseFloat(c.credits)) || parseFloat(c.credits) <= 0);
    if (badCredits) { setSemError("Credits must be a positive number."); return; }
    setSemLoading(true);
    try {
      const res = await fetch(`${API}/api/grades/semester`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          courses: semCourses.map(c => ({
            courseCode: c.name || "Course",
            grade: resolveGrade(c.grade),
            credits: parseInt(c.credits) || 0,
          })),
        }),
      });
      const data = await parseResponse(res);
      if (!res.ok || data.message?.startsWith("Error")) throw new Error(data.message || "Calculation failed.");
      if (data.gpa == null) throw new Error("Unexpected response from server.");
      setSemResult(data.gpa.toFixed(2));

      // Auto-fetch highest impact when there are 2+ courses
      if (semCourses.length >= 2) {
        setImpactLoading(true);
        try {
          const impactRes = await fetch(`${API}/api/grades/highest-impact`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              courses: semCourses.map(c => ({
                courseCode: c.name || "Course",
                grade: resolveGrade(c.grade),
                credits: parseInt(c.credits) || 0,
              })),
            }),
          });
          const impactData = await parseResponse(impactRes);
          if (!impactRes.ok || impactData.message?.startsWith("Error")) throw new Error(impactData.message || "Could not determine highest impact course.");
          setImpactResult(impactData);
        } catch (e) {
          setImpactError(e.message || "Could not determine highest impact course.");
        } finally {
          setImpactLoading(false);
        }
      }
    } catch (e) {
      setSemError(e.message || "Failed to calculate GPA.");
    } finally {
      setSemLoading(false);
    }
  };

  const loadSnapshot = (snapshot) => {
    setSemCourses(
      (snapshot.courses ?? []).filter(c => !c.componenttype).map((c, i) => ({
        id: Date.now() + i,
        name: c.courseCode || "",
        grade: c.grade || "",
        credits: String(c.credits || ""),
      }))
    );
    setSemResult(null); setSemError(null);
    setImpactResult(null); setImpactError(null);
  };

  // Cumulative GPA
  const [cumSems,    setCumSems]    = useState([{ id:1, name:"", gpa:"", credits:"" }]);
  const [cumResult,  setCumResult]  = useState(null);
  const [cumLoading, setCumLoading] = useState(false);
  const [cumError,   setCumError]   = useState(null);

  // Required Future GPA (integrated — planning panel under Cumulative GPA)
  const [futureTargetGPA,      setFutureTargetGPA]      = useState("");
  const [futureRemainingCreds, setFutureRemainingCreds] = useState("");
  const [futureResult,         setFutureResult]         = useState(null);
  const [futureLoading,        setFutureLoading]        = useState(false);
  const [futureError,          setFutureError]          = useState(null);

  const calcCumGPA = async () => {
    setCumError(null);
    setFutureResult(null);
    const missingFields = cumSems.some(c => !c.gpa || !c.credits);
    if (missingFields) { setCumError("Please fill in GPA and credits for all semesters."); return; }
    const badGpa = cumSems.find(c => isNaN(parseFloat(c.gpa)) || parseFloat(c.gpa) < 0 || parseFloat(c.gpa) > 4.3);
    if (badGpa) { setCumError(`"${badGpa.gpa}" is not a valid GPA. Enter a number between 0 and 4.3.`); return; }
    const badCredits = cumSems.find(c => isNaN(parseFloat(c.credits)) || parseFloat(c.credits) <= 0);
    if (badCredits) { setCumError("Credits must be a positive number."); return; }
    setCumLoading(true);
    try {
      const res = await fetch(`${API}/api/grades/cumulative`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          semesters: cumSems.map(s => ({
            semesterName: s.name || "Semester",
            gpa: parseFloat(s.gpa) || 0,
            credits: parseInt(s.credits) || 0,
          })),
        }),
      });
      const data = await parseResponse(res);
      if (!res.ok || data.message?.startsWith("Error")) throw new Error(data.message || "Calculation failed.");
      if (data.gpa == null) throw new Error("Unexpected response from server.");
      setCumResult({ gpa: data.gpa.toFixed(2), totalCredits: data.totalCredits });
    } catch (e) {
      setCumError(e.message || "Failed to calculate cumulative GPA.");
    } finally {
      setCumLoading(false);
    }
  };

  const calcFutureGPA = async () => {
    setFutureError(null);
    if (!futureTargetGPA || !futureRemainingCreds) {
      setFutureError("Please fill in target CGPA and remaining credits."); return;
    }
    const target = parseFloat(futureTargetGPA);
    if (isNaN(target) || target < 0 || target > 4.3) { setFutureError("Target CGPA must be between 0 and 4.3."); return; }
    const remCreds = parseInt(futureRemainingCreds);
    if (isNaN(remCreds) || remCreds <= 0) { setFutureError("Remaining credits must be a positive number."); return; }
    setFutureLoading(true);
    try {
      const res = await fetch(`${API}/api/grades/required-future-gpa`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          currentCGPA: parseFloat(cumResult.gpa),
          completedCredits: parseInt(cumResult.totalCredits),
          targetCGPA: target,
          remainingCredits: remCreds,
        }),
      });
      const data = await parseResponse(res);
      if (!res.ok || data.message?.startsWith("Error")) throw new Error(data.message || "Calculation failed.");
      setFutureResult(data);
    } catch (e) {
      setFutureError(e.message || "Failed to calculate required future GPA.");
    } finally {
      setFutureLoading(false);
    }
  };

  // Course Grade
  const [components,    setComponents]    = useState([{ id:1, type:"", weight:"", grade:"", customType:"" }]);
  const [courseResult,  setCourseResult]  = useState(null);
  const [courseLoading] = useState(false);
  const [courseError,   setCourseError]   = useState(null);

  const calcCourse = () => {
    setCourseError(null);
    const filled = components.filter(c => c.weight && c.grade);
    if (!filled.length) { setCourseError("Fill in at least one component with a weight and grade."); return; }
    const badGrade = filled.find(c => !isValidGrade(c.grade));
    if (badGrade) { setCourseError(`"${badGrade.grade}" is not a valid grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    const badWeight = filled.find(c => !isValidWeight(c.weight));
    if (badWeight) { setCourseError(`"${badWeight.weight}" is not a valid weight. Enter a number between 1 and 100.`); return; }
    const totalWeight = filled.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
    if (totalWeight > 100) { setCourseError(`Weights add up to ${totalWeight}% — they cannot exceed 100%.`); return; }
    // Normalize by total weight entered (supports partial — "so far" semantics)
    const weightedSum = filled.reduce((s, c) => s + letterToNumeric(c.grade) * (parseFloat(c.weight) || 0), 0);
    const grade = weightedSum / totalWeight;
    setCourseResult({ grade: grade.toFixed(2), letterGrade: resolveGrade(grade.toFixed(0)), isPartial: totalWeight < 100, totalWeight });
  };

  // Target Grade
  const [graded,         setGraded]        = useState([{ id:1, weight:"", grade:"" }]);
  const [finalWeight,    setFinalWeight]    = useState("");
  const [targetGoal,     setTargetGoal]     = useState("");
  const [targetResult,   setTargetResult]   = useState(null);
  const [targetLoading,  setTargetLoading]  = useState(false);
  const [targetError,    setTargetError]    = useState(null);

  const calcTarget = async () => {
    setTargetError(null);
    const autoRows = selectedCourse ? components.filter(c => c.weight && c.grade && isValidGrade(c.grade) && isValidWeight(c.weight)) : [];
    const activeGraded = autoRows.length > 0 ? autoRows : graded;
    if (!finalWeight || !targetGoal) { setTargetError("Please fill in the final exam weight and your target grade."); return; }
    if (activeGraded.length === 0) { setTargetError("No graded components found. Log grades in the Course Grade tab first."); return; }
    const badGrade = activeGraded.find(g => !isValidGrade(g.grade));
    if (badGrade) { setTargetError(`"${badGrade.grade}" is not a valid grade.`); return; }
    if (!isValidWeight(finalWeight)) { setTargetError(`"${finalWeight}" is not a valid final exam weight.`); return; }
    if (!isValidGrade(targetGoal)) { setTargetError(`"${targetGoal}" is not a valid target grade.`); return; }
    setTargetLoading(true);
    try {
      const res = await fetch(`${API}/api/grades/required-final`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          completedAssessments: activeGraded.map(g => ({
            name: "Component",
            grade: letterToNumeric(g.grade),
            weight: parseFloat(g.weight) || 0,
          })),
          finalExamWeight: parseFloat(finalWeight) || 0,
          targetCourseGrade: letterToNumeric(targetGoal),
        }),
      });
      const data = await parseResponse(res);
      if (!res.ok || data.message?.startsWith("Error")) throw new Error(data.message || "Calculation failed.");
      setTargetResult({
        type: data.achievable ? "good" : "bad",
        isAchievable: data.achievable,
        requiredGrade: data.requiredFinalGrade,
        targetLetter: data.targetLetterGrade,
        msg: data.message,
      });
    } catch (e) {
      setTargetError(e.message || "Failed to calculate required grade.");
    } finally {
      setTargetLoading(false);
    }
  };

  // Grade Simulator
  const [simPast,         setSimPast]         = useState([{ id:1, type:"", weight:"", grade:"", customType:"" }]);

  // Single open-dropdown tracker for all row-level dropdowns
  const [openDropId, setOpenDropId] = useState("");

  // Confirm states for Clear all and row deletes
  const [confirmClearSem,    setConfirmClearSem]    = useState(false);
  const [confirmClearCum,    setConfirmClearCum]    = useState(false);
  const [confirmDelSem,      setConfirmDelSem]      = useState(null);
  const [confirmDelCum,      setConfirmDelCum]      = useState(null);

  // Undo toast for row/clear operations
  const [undoToast, setUndoToast] = useState(null); // { msg, onUndo }
  const undoTimerRef = useRef(null);
  const showUndo = (msg, onUndo) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoToast({ msg, onUndo });
    undoTimerRef.current = setTimeout(() => setUndoToast(null), 5000);
  };

  // Per-course persistence helpers
  const loadCourseData = (courseName) => {
    try { return JSON.parse(localStorage.getItem("kk_course_data") || "{}")[courseName] ?? null; } catch { return null; }
  };
  const saveCourseData = (courseName, data) => {
    try {
      const all = JSON.parse(localStorage.getItem("kk_course_data") || "{}");
      localStorage.setItem("kk_course_data", JSON.stringify({ ...all, [courseName]: data }));
    } catch {}
  };
  const loadSyllabus = (courseName) => {
    try { return JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}")[courseName] ?? null; } catch { return null; }
  };

  // Selected course (shared across course/target/simulator tabs)
  const [selectedCourse, setSelectedCourse] = useState("");
  const notBESection = (c) => !c.section?.sectionNumber || !(/^B(?!L)/i.test(c.section.sectionNumber) || /^E/i.test(c.section.sectionNumber));
  const semesterCourses = semToLoad
    ? (savedSemesters.find(s => String(s.id) === String(semToLoad))?.courses || []).filter(c => c.courseCode && notBESection(c)).map(c => ({ name: c.courseCode }))
    : selectedSemester
      ? (savedSemesters.find(s => s.semesterName === selectedSemester)?.courses || []).filter(c => c.courseCode && notBESection(c)).map(c => ({ name: c.courseCode }))
      : dashboardCourses;

  // Switch course — loads saved state or falls back to syllabus extract
  const switchCourse = (courseName) => {
    setSelectedCourse(courseName);
    setCourseResult(null); setTargetResult(null);
    setCourseError(null);  setTargetError(null);
    if (!courseName) {
      setComponents([{ id: Date.now(), type:"", weight:"", grade:"", customType:"" }]);
      setSimPast([{ id: Date.now(), type:"", weight:"", grade:"", customType:"" }]);
      setGraded([{ id: Date.now(), weight:"", grade:"" }]);
      setFinalWeight(""); setTargetGoal("");
      return;
    }
    const saved = loadCourseData(courseName);
    const syl = loadSyllabus(courseName);
    const hasSavedComponents = saved?.components?.some(c => c.type || c.weight || c.grade);
    let compData;
    if (hasSavedComponents) {
      compData = saved.components;
    } else if (syl?.assessments?.length) {
      compData = syl.assessments.map((a, i) => {
        const t = inferType(a.name);
        return { id: Date.now() + i, type: t, weight: String(a.weight ?? ""), grade: "", customType: t === "Other" ? (a.name || "") : "" };
      });
    } else {
      compData = [{ id: Date.now(), type:"", weight:"", grade:"", customType:"" }];
    }
    setComponents(compData);
    // Simulator seeds from the same components, preserving any sim-specific grades already saved
    const hasSavedSimPast = saved?.simPast?.some(c => c.type || c.weight || c.grade);
    if (hasSavedSimPast) {
      setSimPast(saved.simPast);
    } else {
      setSimPast(compData.map(c => ({ ...c, id: Date.now() + Math.random() })));
    }
    if (saved?.graded?.length)      setGraded(saved.graded);
    else                            setGraded([{ id: Date.now(), weight:"", grade:"" }]);
    setFinalWeight(saved?.finalWeight || (syl?.finalExamWeight != null ? String(syl.finalExamWeight) : ""));
    setTargetGoal(saved?.targetGoal ?? "");
  };

  // Auto-save whenever course-specific state changes
  useEffect(() => {
    if (!selectedCourse) return;
    saveCourseData(selectedCourse, { components, graded, finalWeight, targetGoal, simPast });
  }, [selectedCourse, components, graded, finalWeight, targetGoal, simPast]);

  // Auto-load most recent semester from transcript upload
  useEffect(() => {
    const autofill = (() => { try { return JSON.parse(localStorage.getItem("kk_transcript_autofill")); } catch { return null; } })();
    if (autofill?.courses?.length) {
      loadSnapshot(autofill);
      localStorage.removeItem("kk_transcript_autofill");
      setActiveTab("semester");
    }
  }, []);

  // Enter-key shortcut — always calls the latest calc function for the active tab
  const calcRef = useRef({});
  calcRef.current = { calcSemGPA, calcCumGPA, calcCourse, calcTarget };
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Enter") return;
      if (["BUTTON","SELECT","TEXTAREA"].includes(e.target.tagName)) return;
      const fns = calcRef.current;
      if (activeTab === "semester")   fns.calcSemGPA();
      else if (activeTab === "cumulative") fns.calcCumGPA();
      else if (activeTab === "course")     fns.calcCourse();
      else if (activeTab === "target")     fns.calcTarget();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activeTab]);

  // Clear in-memory state when a syllabus is removed from Profile
  const selectedCourseRef = useRef(selectedCourse);
  selectedCourseRef.current = selectedCourse;
  useEffect(() => {
    const handler = (e) => {
      const removed = e.detail?.courseCode;
      if (!removed || removed !== selectedCourseRef.current) return;
      switchCourse(removed); // reloads from localStorage (now empty)
    };
    window.addEventListener("kk_syllabus_changed", handler);
    return () => window.removeEventListener("kk_syllabus_changed", handler);
  }, []);

  const TABS = [
    { id:"semester",   label:"Semester GPA"    },
    { id:"cumulative", label:"Cumulative GPA"   },
    { id:"course",     label:"Course Grade"     },
    { id:"target",     label:"Target Grade"     },
    { id:"simulator",  label:"Grade Simulator"  },
  ];

  return (
    <div style={{ padding:"28px 28px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .gc-input:focus { border-color:var(--border2) !important; outline:none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .gc-anim { animation: fadeUp 0.32s ease both; }
        .gc-row-hover:hover { background:var(--divider) !important; }
        .gc-tab-hover:hover { background:var(--bg); }
        .gc-addbtn:hover { background:var(--surface3) !important; }
        .gc-calcbtn:hover:not(:disabled) { background:var(--primary2) !important; }
        .gc-calcbtn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"var(--primary)", marginBottom:4 }}>
          Grade Calculator
        </div>
        <div style={{ fontSize:13, color:"var(--text2)" }}>
          Calculate your averages, plan your grades, and simulate future scores
        </div>
      </div>


      {/* Course picker — shown on course/target/simulator tabs */}
      {["course","target","simulator"].includes(activeTab) && semesterCourses.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, fontWeight:600, color:"var(--accent2)" }}>Course:</span>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {semesterCourses.map(c => (
              <button key={c.name} className="kk-pill" data-active={selectedCourse === c.name} onClick={() => switchCourse(selectedCourse === c.name ? "" : c.name)} style={{
                fontSize:12, fontWeight:600, padding:"5px 14px", borderRadius:20,
                border: selectedCourse === c.name ? "none" : "1px solid var(--border)",
                background: selectedCourse === c.name ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "var(--bg)",
                color: selectedCourse === c.name ? "var(--primary)" : "var(--accent2)",
                cursor:"pointer", transition:"all .15s",
              }}>
                {c.name}
              </button>
            ))}
          </div>
          {selectedCourse && (
            <span style={{ fontSize:11, color:"var(--text2)" }}>
              {loadCourseData(selectedCourse) ? "● Saved data loaded" : loadSyllabus(selectedCourse) ? "● Syllabus loaded" : ""}
            </span>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display:"flex", marginTop:24, gap:6, width:"fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} className="kk-tab" data-active={activeTab === t.id} onClick={() => setActiveTab(t.id)} style={{
            padding:"8px 18px",
            borderRadius:9,
            fontSize:13,
            fontWeight: activeTab === t.id ? 600 : 400,
            cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",
            transition:"all .15s",
            background: activeTab === t.id ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
            color: activeTab === t.id ? "var(--primary)" : "var(--text2)",
            border: activeTab === t.id ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Semester GPA */}
      {activeTab==="semester" && (
        <div key="semester" className="gc-anim" style={{ ...gc.card, marginTop:24 }}>
          <SectionTitle>Semester GPA</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:18 }}>
            Enter each course, your grade (letter or GPA point), and its credit hours.
          </p>

          {savedSemesters.length === 0 && dashboardCourses.length === 0 && onNavigate && (
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"color-mix(in srgb, var(--primary) 8%, var(--surface))", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", marginBottom:18 }}>
              <span style={{ fontSize:13, color:"var(--text2)" }}>Add your courses in My Semesters to auto-fill this calculator.</span>
              <button onClick={() => onNavigate("profile")} style={{ marginLeft:"auto", fontSize:12, fontWeight:600, color:"var(--primary)", background:"none", border:"1px solid var(--primary)", borderRadius:7, padding:"4px 10px", cursor:"pointer", whiteSpace:"nowrap" }}>Go to My Semesters →</button>
            </div>
          )}

          {savedSemesters.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <div style={{ marginBottom:8 }}>
                <span style={{ fontSize:11, color:"var(--text3)" }}>Past semesters extracted from your uploaded transcripts</span>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {savedSemesters.map(s => (
                <button
                  key={s.id}
                  className="kk-pill"
                  data-active={String(semToLoad) === String(s.id)}
                  onClick={() => { loadSnapshot(s); setSemResult(null); setSelectedLoad(String(s.id)); }}
                  style={{
                    fontSize:12, fontWeight:600, padding:"5px 14px", borderRadius:20,
                    border: String(semToLoad) === String(s.id) ? "none" : "1px solid var(--border)",
                    background: String(semToLoad) === String(s.id) ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "var(--bg)",
                    color: String(semToLoad) === String(s.id) ? "var(--primary)" : "var(--accent2)",
                    cursor:"pointer", transition:"all .15s",
                  }}
                >
                  {s.semesterName}
                </button>
              ))}
              </div>
            </div>
          )}

          <div style={gc.headerRow}>
            <span style={{ ...gc.colHead, flex:1 }}>Course</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:150 }}>Grade</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:90 }}>Credits</span>
            <span style={{ width:28 }} />
          </div>
          {semCourses.map(c => (
            <div key={c.id} style={{ ...gc.row, position:"relative", overflow:"visible" }}>
              {semToLoad ? (
                <div style={{ position:"relative", flex:1 }}>
                  <button onClick={() => setOpenDropId(openDropId === `${c.id}-semcourse` ? "" : `${c.id}-semcourse`)} style={{
                    padding:"9px 12px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                    background:"var(--surface2)", border:"1px solid var(--border)", color: c.name ? "var(--text)" : "var(--text3)",
                    fontFamily:"'DM Sans',sans-serif",
                  }}>
                    {c.name || "Select course"}
                    <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: openDropId === `${c.id}-semcourse` ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                  </button>
                  {openDropId === `${c.id}-semcourse` && (
                    <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                      {(savedSemesters.find(s => String(s.id) === String(semToLoad))?.courses || []).filter(x => x.courseCode && notBESection(x)).map(x => (
                        <div key={x.courseCode} onClick={() => { updateRow(setSemCourses, c.id, "name", x.courseCode); setOpenDropId(""); }}
                          className="kk-option"
                          style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                            transition:"background .15s",
                            background: c.name === x.courseCode ? "var(--divider)" : "transparent",
                            color:      c.name === x.courseCode ? "var(--accent)"  : "var(--primary)" }}>
                          {x.courseCode}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : dashboardCourses.length > 0 ? (
                <div style={{ position:"relative", flex:1 }}>
                  <button onClick={() => setOpenDropId(openDropId === `${c.id}-semcourse` ? "" : `${c.id}-semcourse`)} style={{
                    padding:"9px 12px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                    background:"var(--surface2)", border:"1px solid var(--border)", color: c.name ? "var(--text)" : "var(--text3)",
                    fontFamily:"'DM Sans',sans-serif",
                  }}>
                    {c.name || "Select course"}
                    <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: openDropId === `${c.id}-semcourse` ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                  </button>
                  {openDropId === `${c.id}-semcourse` && (
                    <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                      {dashboardCourses.map(dc => (
                        <div key={dc.id} onClick={() => { updateRow(setSemCourses, c.id, "name", dc.name); setOpenDropId(""); }}
                          className="kk-option"
                          style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                            transition:"background .15s",
                            background: c.name === dc.name ? "var(--divider)" : "transparent",
                            color:      c.name === dc.name ? "var(--accent)"  : "var(--primary)" }}>
                          {dc.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input className="gc-input" value={c.name} onChange={e=>updateRow(setSemCourses,c.id,"name",e.target.value)} placeholder="e.g. CMPS 271" style={gc.input} />
              )}
              <div style={{ position:"relative", flex:1, maxWidth:150 }}>
                <button onClick={() => setOpenDropId(openDropId === `${c.id}-grade` ? "" : `${c.id}-grade`)} style={{
                  padding:"9px 12px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                  background:"var(--surface2)", border:"1px solid var(--border)", color: c.grade ? "var(--text)" : "var(--text3)",
                  fontFamily:"'DM Sans',sans-serif",
                }}>
                  {c.grade || "Grade"}
                  <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: openDropId === `${c.id}-grade` ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                </button>
                {openDropId === `${c.id}-grade` && (
                  <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                    {LETTER_GRADES.map(g => (
                      <div key={g} onClick={() => { updateRow(setSemCourses, c.id, "grade", g); setOpenDropId(""); }}
                        className="kk-option"
                        style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                          transition:"background .15s",
                          background: c.grade === g ? "var(--divider)" : "transparent",
                          color:      c.grade === g ? "var(--accent)"  : "var(--primary)" }}>
                        {g}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input className="gc-input" value={c.credits} onChange={e=>updateRow(setSemCourses,c.id,"credits",e.target.value)} placeholder="e.g. 3" type="number" style={{ ...gc.input, maxWidth:90 }} />
              {confirmDelSem === c.id ? (
                <span style={{ display:"flex", alignItems:"center", gap:2 }}>
                  <button onClick={() => { setConfirmDelSem(null); removeRow(setSemCourses,c.id); }} style={{ ...gc.removeBtn, color:"var(--error)", fontWeight:700 }}>✓</button>
                  <button onClick={() => setConfirmDelSem(null)} style={gc.removeBtn}>✗</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelSem(c.id)} style={gc.removeBtn}>✕</button>
              )}
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setSemCourses)} style={gc.addRowBtn}>+ Add Course</button>
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <button className="gc-calcbtn" onClick={calcSemGPA} disabled={semLoading} style={gc.calcBtn}>
              {semLoading ? "Calculating…" : "Calculate GPA"}
            </button>
            {confirmClearSem ? (
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:12, color:"var(--error)", fontWeight:600 }}>Clear all?</span>
                <button onClick={() => { setConfirmClearSem(false); setSemCourses([{ id:Date.now(), name:"", grade:"", credits:"" }]); setSemResult(null); setSemError(null); setImpactResult(null); setImpactError(null); }} style={{ ...gc.clearBtn, padding:"6px 10px", fontSize:12 }}>Yes</button>
                <button onClick={() => setConfirmClearSem(false)} style={{ ...gc.clearBtn, color:"var(--text2)", borderColor:"var(--border)", padding:"6px 10px", fontSize:12 }}>No</button>
              </span>
            ) : (
              <button onClick={() => setConfirmClearSem(true)} style={gc.clearBtn}>Clear all</button>
            )}
            {semResult && !semError && (
              <ResultBadge
                value={semResult}
                label="Semester GPA"
                color={parseFloat(semResult)>=3.7?"var(--success)":parseFloat(semResult)>=2.7?"var(--primary)":"var(--error)"}
              />
            )}
          </div>
          {semError && <ErrorBox>{semError}</ErrorBox>}

          {/* Highest Impact — auto result after GPA calculation */}
          {semResult && !semError && semCourses.length >= 2 && (
            <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid var(--divider)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>
                Highest Impact Course
              </div>
              {impactLoading && (
                <InfoBox color="var(--accent)" bg="var(--surface2)" border="var(--accent)">Analyzing which course has the greatest impact on your GPA…</InfoBox>
              )}
              {impactResult && !impactError && (
                <>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    <ResultBadge
                      value={impactResult.courseName || `Course ${impactResult.courseIndex + 1}`}
                      label="Highest Impact Course"
                      color="var(--accent)"
                    />
                    <ResultBadge
                      value={impactResult.grade}
                      label="Current Grade"
                      color="var(--primary)"
                    />
                    <ResultBadge
                      value={`${impactResult.credits} cr`}
                      label="Credit Hours"
                      color="var(--primary)"
                    />
                  </div>
                  <InfoBox color="var(--accent2)" bg="var(--surface2)" border="var(--accent)">
                    {impactResult.message}
                  </InfoBox>
                </>
              )}
              {impactError && <ErrorBox>{impactError}</ErrorBox>}
            </div>
          )}
        </div>
      )}

      {/* Cumulative GPA */}
      {activeTab==="cumulative" && (
        <div className="gc-anim" style={{ ...gc.card, marginTop:24 }}>
          <SectionTitle>Cumulative GPA</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:18 }}>
            Enter your GPA and credit hours for each completed semester.
          </p>

          {savedSemesters.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <button
                onClick={() => {
                  const rows = savedSemesters.map((s, i) => {
                    const autoGpa    = computeSavedGPA(s.courses);
                    const autoCredits = (s.courses || []).reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
                    return {
                      id: Date.now() + i,
                      name: s.semesterName,
                      gpa: autoGpa != null ? String(autoGpa) : "",
                      credits: autoCredits > 0 ? String(autoCredits) : "",
                    };
                  });
                  setCumSems(rows);
                  setCumResult(null); setCumError(null);
                  setFutureResult(null); setFutureError(null);
                }}
                style={{ ...gc.calcBtn, padding:"8px 16px" }}
              >
                Load All Semesters
              </button>
            </div>
          )}

          <div style={gc.headerRow}>
            <span style={gc.colHead}>Semester</span>
            <span style={{ ...gc.colHead, maxWidth:120 }}>GPA</span>
            <span style={{ ...gc.colHead, maxWidth:90 }}>Credits</span>
            <span style={{ width:28 }} />
          </div>
          {cumSems.map(c => (
            <div key={c.id} style={{ ...gc.row, position:"relative", overflow:"visible" }}>
              <div style={{ position:"relative", flex:1 }}>
                <button onClick={() => setOpenDropId(openDropId === `${c.id}-sem` ? "" : `${c.id}-sem`)} style={{
                  padding:"9px 12px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                  background:"var(--surface2)", border:"1px solid var(--border)", color: c.name ? "var(--text)" : "var(--text3)",
                  fontFamily:"'DM Sans',sans-serif",
                }}>
                  {c.name || "Select semester"}
                  <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: openDropId === `${c.id}-sem` ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                </button>
                {openDropId === `${c.id}-sem` && (
                  <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                    {(savedSemesters.length > 0 ? savedSemesters.map(s => ({ key: String(s.id), value: s.semesterName })) : SEMESTER_OPTIONS.map(s => ({ key: s, value: s }))).map(opt => (
                      <div key={opt.key} onClick={() => {
                        const name = opt.value;
                        const sem = savedSemesters.find(s => s.semesterName === name);
                        const autoGpa = sem ? computeSavedGPA(sem.courses) : null;
                        const autoCredits = sem ? (sem.courses || []).reduce((sum, sc) => sum + (Number(sc.credits) || 0), 0) : null;
                        setCumSems(p => p.map(r => r.id === c.id ? { ...r, name, gpa: autoGpa != null ? Number(autoGpa).toFixed(2) : r.gpa, credits: autoCredits != null && autoCredits > 0 ? String(autoCredits) : r.credits } : r));
                        setOpenDropId("");
                      }}
                        className="kk-option"
                        style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                          transition:"background .15s",
                          background: c.name === opt.value ? "var(--divider)" : "transparent",
                          color:      c.name === opt.value ? "var(--accent)"  : "var(--primary)" }}>
                        {opt.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input className="gc-input" value={c.gpa}     onChange={e=>updateRow(setCumSems,c.id,"gpa",e.target.value)}     placeholder="e.g. 3.67" type="number" step="0.01" style={{ ...gc.input, maxWidth:120 }} />
              <input className="gc-input" value={c.credits} onChange={e=>updateRow(setCumSems,c.id,"credits",e.target.value)} placeholder="e.g. 15"   type="number" style={{ ...gc.input, maxWidth:90 }} />
              {confirmDelCum === c.id ? (
                <span style={{ display:"flex", alignItems:"center", gap:2 }}>
                  <button onClick={() => { setConfirmDelCum(null); removeRow(setCumSems,c.id); }} style={{ ...gc.removeBtn, color:"var(--error)", fontWeight:700 }}>✓</button>
                  <button onClick={() => setConfirmDelCum(null)} style={gc.removeBtn}>✗</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelCum(c.id)} style={gc.removeBtn}>✕</button>
              )}
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setCumSems)} style={gc.addRowBtn}>+ Add Semester</button>
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <button className="gc-calcbtn" onClick={calcCumGPA} disabled={cumLoading} style={gc.calcBtn}>
              {cumLoading ? "Calculating…" : "Calculate Cumulative GPA"}
            </button>
            {confirmClearCum ? (
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:12, color:"var(--error)", fontWeight:600 }}>Clear all?</span>
                <button onClick={() => { setConfirmClearCum(false); setCumSems([{ id:Date.now(), name:"", gpa:"", credits:"" }]); setCumResult(null); setCumError(null); setFutureResult(null); setFutureError(null); setFutureTargetGPA(""); setFutureRemainingCreds(""); }} style={{ ...gc.clearBtn, padding:"6px 10px", fontSize:12 }}>Yes</button>
                <button onClick={() => setConfirmClearCum(false)} style={{ ...gc.clearBtn, color:"var(--text2)", borderColor:"var(--border)", padding:"6px 10px", fontSize:12 }}>No</button>
              </span>
            ) : (
              <button onClick={() => setConfirmClearCum(true)} style={gc.clearBtn}>Clear all</button>
            )}
            {cumResult && !cumError && (
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <ResultBadge
                  value={cumResult.gpa}
                  label="Cumulative GPA"
                  color={parseFloat(cumResult.gpa)>=3.7?"var(--success)":parseFloat(cumResult.gpa)>=2.7?"var(--primary)":"var(--error)"}
                />
                <ResultBadge
                  value={cumResult.totalCredits}
                  label="Total Credits"
                  color="var(--accent)"
                />
              </div>
            )}
          </div>
          {cumError && <ErrorBox>{cumError}</ErrorBox>}

          {/* Required Future GPA — planning panel auto-shown after result */}
          {cumResult && !cumError && (
            <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid var(--divider)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>
                GPA Planning
              </div>
              <p style={{ fontSize:13, color:"var(--text2)", marginTop:4, marginBottom:14 }}>
                Based on your current CGPA of <strong style={{ color:"var(--primary)" }}>{cumResult.gpa}</strong> across <strong style={{ color:"var(--primary)" }}>{cumResult.totalCredits}</strong> credits — enter your goal to find what GPA you need going forward.
              </p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Target CGPA</label>
                  <input
                    className="gc-input"
                    value={futureTargetGPA}
                    onChange={e => { setFutureTargetGPA(e.target.value); setFutureResult(null); }}
                    placeholder="e.g. 3.70"
                    type="number"
                    step="0.01"
                    style={{ ...gc.input, maxWidth:140 }}
                  />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Remaining Credits</label>
                  <input
                    className="gc-input"
                    value={futureRemainingCreds}
                    onChange={e => { setFutureRemainingCreds(e.target.value); setFutureResult(null); }}
                    placeholder="e.g. 60"
                    type="number"
                    style={{ ...gc.input, maxWidth:140 }}
                  />
                </div>
                <button className="gc-calcbtn" onClick={calcFutureGPA} disabled={futureLoading} style={gc.calcBtn}>
                  {futureLoading ? "Calculating…" : "Plan GPA"}
                </button>
              </div>
              {futureError && <ErrorBox>{futureError}</ErrorBox>}
              {futureResult && !futureError && (
                <>
                  {futureResult.achievable && (
                    <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap" }}>
                      <ResultBadge
                        value={futureResult.requiredGPA?.toFixed(2)}
                        label="Required GPA per Semester"
                        color={futureResult.requiredGPA<=3.3?"var(--success)":futureResult.requiredGPA<=3.7?"var(--primary)":"var(--error)"}
                      />
                    </div>
                  )}
                  <InfoBox
                    color={futureResult.isAchievable?"var(--success)":"var(--error)"}
                    bg={futureResult.isAchievable?"var(--success-bg)":"var(--error-bg)"}
                    border={futureResult.isAchievable?"var(--success)":"var(--error)"}
                  >
                    {futureResult.message}
                  </InfoBox>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Undo toast */}
      {undoToast && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"var(--primary)", color:"#fff", borderRadius:12, padding:"10px 20px", display:"flex", alignItems:"center", gap:14, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,0.18)", fontSize:13, fontWeight:500 }}>
          <span>{undoToast.msg}</span>
          <button onClick={() => { undoToast.onUndo(); setUndoToast(null); if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }} style={{ background:"rgba(255,255,255,0.22)", border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:12, padding:"4px 12px", cursor:"pointer" }}>Undo</button>
        </div>
      )}

      {/* Course Grade */}
      {activeTab==="course" && (
        <div key="course" className="gc-anim" style={{ ...gc.card, marginTop:24 }}>
          <SectionTitle>Course Grade (So Far)</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:4 }}>
            Log your grades as you receive them — they auto-save per course as your grade diary.
          </p>
          {selectedCourse && <div style={{ fontSize:11, color:"var(--success, #2d7a4f)", background:"var(--success-bg, #edfaf3)", border:"1px solid var(--success, #2d7a4f)", borderRadius:8, padding:"5px 10px", marginBottom:14, display:"inline-block", fontWeight:600 }}>✓ Auto-saved for {selectedCourse}</div>}
          {!selectedCourse && <div style={{ height:14 }} />}
          <div style={gc.headerRow}>
            <span style={{ ...gc.colHead, flex:1, maxWidth:140 }}>Type</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Weight %</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Grade</span>
            <span style={{ width:28 }} />
          </div>
          {components.map(c => (
            <div key={c.id} style={{ ...gc.row, alignItems: c.type === "Other" ? "flex-start" : "center", position:"relative", overflow:"visible" }}>
              <div style={{ flex:1, maxWidth:140, position:"relative" }}>
                <button onClick={() => setOpenDropId(openDropId === `${c.id}-type` ? "" : `${c.id}-type`)} style={{
                  padding:"9px 12px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                  background:"var(--surface2)", border:"1px solid var(--border)", color: c.type ? "var(--text)" : "var(--text3)",
                  fontFamily:"'DM Sans',sans-serif",
                }}>
                  {c.type || "Select type…"}
                  <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: openDropId === `${c.id}-type` ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                </button>
                {openDropId === `${c.id}-type` && (
                  <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                    {COMP_TYPES.map(t => (
                      <div key={t} onClick={() => { updateRow(setComponents, c.id, "type", t); setOpenDropId(""); }}
                        className="kk-option"
                        style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                          transition:"background .15s",
                          background: c.type === t ? "var(--divider)" : "transparent",
                          color:      c.type === t ? "var(--accent)"  : "var(--primary)" }}>
                        {t}
                      </div>
                    ))}
                  </div>
                )}
                {c.type === "Other" && (
                  <input className="gc-input" value={c.customType||""} onChange={e=>updateRow(setComponents,c.id,"customType",e.target.value)} placeholder="Specify (optional)" style={{ ...gc.input, width:"100%", marginTop:4, fontSize:12 }} />
                )}
              </div>
              <input className="gc-input" value={c.weight} onChange={e => {
                const val = e.target.value;
                const otherTotal = components.filter(r => r.id !== c.id).reduce((s, r) => s + (parseFloat(r.weight) || 0), 0);
                if (parseFloat(val) + otherTotal > 100) return;
                updateRow(setComponents, c.id, "weight", val);
              }} placeholder="e.g. 30" type="number" style={{ ...gc.input, maxWidth:110 }} />
              <input className="gc-input" value={c.grade}  onChange={e=>updateRow(setComponents,c.id,"grade",e.target.value)}  placeholder="e.g. 85 or A-" style={{ ...gc.input, maxWidth:110 }} />
              <button onClick={() => { const row = components.find(r => r.id === c.id); removeRow(setComponents, c.id); setCourseResult(null); showUndo("Component removed", () => setComponents(p => [...p, row])); }} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setComponents)} style={gc.addRowBtn}>+ Add Component</button>
          <div style={{ display:"flex", gap:12, marginTop:16, alignItems:"center", flexWrap:"wrap" }}>
            <WeightIndicator total={components.reduce((s,c) => s + (parseFloat(c.weight)||0), 0)} />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:12, alignItems:"center", flexWrap:"wrap" }}>
            <button className="gc-calcbtn" onClick={calcCourse} disabled={courseLoading} style={gc.calcBtn}>
              {courseLoading ? "Calculating…" : "Calculate Grade"}
            </button>
            <button onClick={() => { const snap = [...components]; setComponents([{ id:Date.now(), type:"", weight:"", grade:"", customType:"" }]); setCourseResult(null); setCourseError(null); showUndo("All components cleared", () => setComponents(snap)); }} style={gc.clearBtn}>Clear all</button>
            {courseResult && !courseError && (
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
                <ResultBadge
                  value={`${courseResult.grade}%`}
                  label={courseResult.isPartial ? `Grade on ${courseResult.totalWeight}% graded` : "Current Grade"}
                  color={parseFloat(courseResult.grade)>=90?"var(--success)":parseFloat(courseResult.grade)>=70?"var(--primary)":"var(--error)"}
                />
                <ResultBadge
                  value={courseResult.letterGrade}
                  label="Letter Grade"
                  color={parseFloat(courseResult.grade)>=90?"var(--success)":parseFloat(courseResult.grade)>=70?"var(--primary)":"var(--error)"}
                />
                {courseResult.isPartial && (
                  <span style={{ fontSize:11, color:"var(--text2)", fontStyle:"italic" }}>Based on {courseResult.totalWeight}% of course weight so far</span>
                )}
              </div>
            )}
          </div>
          {courseError && <ErrorBox>{courseError}</ErrorBox>}
        </div>
      )}

      {/* Target Grade */}
      {activeTab==="target" && (() => {
        const autoRows = selectedCourse ? components.filter(c => c.weight && c.grade && isValidGrade(c.grade) && isValidWeight(c.weight)) : [];
        const useAuto = autoRows.length > 0;
        const activeGraded = useAuto ? autoRows : graded;
        return (
        <div key="target" className="gc-anim" style={{ ...gc.card, marginTop:24 }}>
          <SectionTitle>Target Course Grade</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:18 }}>
            What do you need on the final exam to hit your target grade?
          </p>

          {useAuto ? (
            <>
              <div style={{ fontSize:12, color:"var(--accent)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", marginBottom:14 }}>
                Using your graded components from <strong>{selectedCourse}</strong> — edit them in the Course Grade tab.
              </div>
              <div style={{ marginBottom:16 }}>
                {autoRows.map((c) => (
                  <div key={c.id} style={{ display:"flex", gap:12, alignItems:"center", padding:"5px 0", borderBottom:"1px solid var(--divider)", fontSize:13 }}>
                    <span style={{ flex:2, color:"var(--text2)", fontWeight:500 }}>{c.type === "Other" ? (c.customType || "Other") : c.type}</span>
                    <span style={{ color:"var(--text2)" }}>{c.weight}%</span>
                    <span style={{ fontWeight:700, color:"var(--primary)" }}>{c.grade}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {selectedCourse && <div style={{ fontSize:12, color:"var(--text2)", marginBottom:12 }}>No grades logged yet — enter grades in the Course Grade tab, or fill in manually below.</div>}
              <div style={gc.headerRow}>
                <span style={gc.colHead}>Weight %</span>
                <span style={gc.colHead}>Grade</span>
                <span style={{ width:28 }} />
              </div>
              {graded.map(g => (
                <div key={g.id} style={gc.row}>
                  <input className="gc-input" value={g.weight} onChange={e=>updateRow(setGraded,g.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={gc.input} />
                  <input className="gc-input" value={g.grade}  onChange={e=>updateRow(setGraded,g.id,"grade",e.target.value)}  placeholder="e.g. 78 or B+" style={gc.input} />
                  <button onClick={() => { const row = graded.find(r => r.id === g.id); removeRow(setGraded, g.id); setTargetResult(null); showUndo("Component removed", () => setGraded(p => [...p, row])); }} style={gc.removeBtn}>✕</button>
                </div>
              ))}
              <button className="gc-addbtn" onClick={() => addRow(setGraded)} style={gc.addRowBtn}>+ Add Component</button>
            </>
          )}

          {/* Weight indicator */}
          <div style={{ display:"flex", gap:12, marginTop:16, alignItems:"center", flexWrap:"wrap" }}>
            <WeightIndicator total={activeGraded.reduce((s,g) => s + (parseFloat(g.weight)||0), 0) + (parseFloat(finalWeight)||0)} />
          </div>

          {/* Final exam weight + target grade row */}
          <div style={{ display:"flex", gap:12, marginTop:12, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 14px" }}>
              <span style={{ fontSize:13, color:"var(--accent2)", fontWeight:600 }}>Final exam weight:</span>
              <input className="gc-input" value={finalWeight} onChange={e=>setFinalWeight(e.target.value)} placeholder="e.g. 40" type="number" style={{ border:"none", outline:"none", background:"transparent", fontSize:14, fontWeight:600, color:"var(--primary)", width:60 }} />
              <span style={{ fontSize:13, color:"var(--text2)" }}>%</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 14px" }}>
              <span style={{ fontSize:13, color:"var(--accent2)", fontWeight:600 }}>My target:</span>
              <input className="gc-input" value={targetGoal} onChange={e=>setTargetGoal(e.target.value)} placeholder="e.g. 85 or B" style={{ border:"none", outline:"none", background:"transparent", fontSize:14, fontWeight:600, color:"var(--primary)", width:90 }} />
            </div>
            <button className="gc-calcbtn" onClick={calcTarget} disabled={targetLoading} style={gc.calcBtn}>
              {targetLoading ? "Calculating…" : "Calculate"}
            </button>
            {!useAuto && <button onClick={() => { const snapG = [...graded]; const snapFW = finalWeight; const snapTG = targetGoal; setGraded([{ id:Date.now(), weight:"", grade:"" }]); setFinalWeight(""); setTargetGoal(""); setTargetResult(null); setTargetError(null); showUndo("Target cleared", () => { setGraded(snapG); setFinalWeight(snapFW); setTargetGoal(snapTG); }); }} style={gc.clearBtn}>Clear all</button>}
          </div>

          {targetError && <ErrorBox>{targetError}</ErrorBox>}

          {targetResult && !targetError && (
            <>
              {targetResult.isAchievable && (
                <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap" }}>
                  <ResultBadge
                    value={`${targetResult.requiredGrade.toFixed(1)}%`}
                    label="Needed on Final"
                    color={targetResult.requiredGrade<=80?"var(--success)":targetResult.requiredGrade<=95?"var(--primary)":"var(--error)"}
                  />
                  <ResultBadge
                    value={targetGoal}
                    label="Your Target"
                    color="var(--accent)"
                  />
                </div>
              )}
              <InfoBox
                color={targetResult.type==="good"?"var(--success)":targetResult.type==="bad"?"var(--error)":"var(--primary)"}
                bg={targetResult.type==="good"?"var(--success-bg)":targetResult.type==="bad"?"var(--error-bg)":"var(--divider)"}
                border={targetResult.type==="good"?"var(--success)":targetResult.type==="bad"?"var(--error)":"var(--accent)"}
              >
                {targetResult.msg}
              </InfoBox>
            </>
          )}
        </div>
        );
      })()}

      {/* Grade Simulator */}
      {activeTab==="simulator" && (() => {
        const filledRows = simPast.filter(c => c.weight && c.grade && isValidGrade(c.grade));
        const totalFilledWeight = filledRows.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
        const totalWeight = simPast.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
        const ungradedWeight = totalWeight - totalFilledWeight;
        const simLive = totalFilledWeight > 0
          ? (() => {
              const g = filledRows.reduce((s, c) => s + letterToNumeric(c.grade) * (parseFloat(c.weight) || 0), 0) / totalFilledWeight;
              return { grade: g.toFixed(1), letterGrade: resolveGrade(g.toFixed(0)), filledWeight: totalFilledWeight, ungradedWeight };
            })()
          : null;
        return (
        <div key="simulator" className="gc-anim" style={{ ...gc.card, marginTop:24 }}>
          <SectionTitle>Grade Simulator</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:18 }}>
            Fill in your grades — actual or hypothetical. Results update live as you type.
          </p>

          {selectedCourse && <div style={{ fontSize:12, color:"var(--accent)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", marginBottom:14 }}>
            Components from <strong>{selectedCourse}</strong>. Leave a grade blank to exclude it from the projection.
          </div>}

          <div style={gc.headerRow}>
            <span style={{ ...gc.colHead, flex:2 }}>Component</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:80 }}>Weight</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:130 }}>Grade (actual or "what if")</span>
            {!selectedCourse && <span style={{ width:28 }} />}
          </div>

          {simPast.map((c, i) => {
            const hasGrade = c.grade && isValidGrade(c.grade);
            return (
              <div key={c.id} style={{ ...gc.row, alignItems:"center", background: "transparent", borderRadius:8, marginBottom:4 }}>
                {selectedCourse ? (
                  <span style={{ flex:2, fontSize:13, color:"var(--text)", fontWeight:500 }}>
                    {c.type === "Other" ? (c.customType || "Other") : c.type}
                    {!hasGrade && <span style={{ fontSize:11, color:"var(--text3)", fontWeight:400, marginLeft:6 }}>← enter a grade to include</span>}
                  </span>
                ) : (
                  <div style={{ flex:2, position:"relative" }}>
                    <button onClick={() => setOpenDropId(openDropId === `sim-${c.id}-type` ? "" : `sim-${c.id}-type`)} style={{
                      padding:"9px 12px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:6, width:"100%", justifyContent:"space-between",
                      background:"var(--surface2)", border:"1px solid var(--border)", color: c.type ? "var(--text)" : "var(--text3)",
                      fontFamily:"'DM Sans',sans-serif",
                    }}>
                      {c.type || "Select type…"}
                      <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: openDropId === `sim-${c.id}-type` ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                    </button>
                    {openDropId === `sim-${c.id}-type` && (
                      <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:"100%", maxHeight:220, overflowY:"auto" }}>
                        {COMP_TYPES.map(t => (
                          <div key={t} onClick={() => { updateRow(setSimPast, c.id, "type", t); setOpenDropId(""); }}
                            className="kk-option"
                            style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                              transition:"background .15s",
                              background: c.type === t ? "var(--divider)" : "transparent",
                              color:      c.type === t ? "var(--accent)"  : "var(--primary)" }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {selectedCourse ? (
                  <span style={{ flex:1, maxWidth:80, fontSize:13, color:"var(--text2)" }}>{c.weight}%</span>
                ) : (
                  <input className="gc-input" value={c.weight} onChange={e=>updateRow(setSimPast,c.id,"weight",e.target.value)} placeholder="%" type="number" style={{ ...gc.input, flex:1, maxWidth:80 }} />
                )}
                <input
                  className="gc-input"
                  value={c.grade}
                  onChange={e => updateRow(setSimPast, c.id, "grade", e.target.value)}
                  placeholder="e.g. 85 or A-"
                  style={{ ...gc.input, flex:1, maxWidth:130, background: hasGrade ? "var(--surface)" : "var(--bg)", fontWeight: hasGrade ? 600 : 400 }}
                />
                {!selectedCourse && <button onClick={() => { const row = simPast.find(r => r.id === c.id); removeRow(setSimPast, c.id); showUndo("Row removed", () => setSimPast(p => [...p, row])); }} style={gc.removeBtn}>✕</button>}
              </div>
            );
          })}
          {!selectedCourse && <button className="gc-addbtn" onClick={() => addRow(setSimPast)} style={{ ...gc.addRowBtn, marginTop:6 }}>+ Add Component</button>}

          {/* Live result */}
          {simLive ? (
            <div style={{ background:"var(--blue-light-bg)", borderRadius:14, border:"1px solid var(--border)", padding:"20px 24px", marginTop:20 }}>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"stretch" }}>
                <div style={{ background:"var(--surface)", borderRadius:12, padding:"14px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(49,72,122,0.09)", flex:"1 1 120px" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700, color:parseFloat(simLive.grade)>=90?"var(--success)":parseFloat(simLive.grade)>=70?"var(--primary)":"var(--error)", lineHeight:1 }}>
                    {simLive.grade}%
                  </div>
                  <div style={{ fontSize:11, color:"var(--text2)", marginTop:6 }}>Projected Grade</div>
                </div>
                <div style={{ background:"var(--surface)", borderRadius:12, padding:"14px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(49,72,122,0.09)", flex:"0 1 auto" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700, color:"var(--accent)", lineHeight:1 }}>{simLive.letterGrade}</div>
                  <div style={{ fontSize:11, color:"var(--text2)", marginTop:6 }}>Letter Grade</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, flex:"1 1 180px", justifyContent:"center", fontSize:13 }}>
                  <div style={{ color:"var(--text2)" }}>Based on <span style={{ fontWeight:700, color:"var(--primary)" }}>{simLive.filledWeight.toFixed(0)}%</span> of your course weight</div>
                  {simLive.ungradedWeight > 0 && <div style={{ color:"var(--text3)" }}><span style={{ fontWeight:600 }}>{simLive.ungradedWeight.toFixed(0)}%</span> still ungraded — fill in a grade above to include it</div>}
                </div>
              </div>
              <div style={{ marginTop:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text2)", marginBottom:4 }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
                <div style={{ height:8, background:"#D9E1F1", borderRadius:10, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:10, transition:"width 0.3s ease", width:`${Math.min(parseFloat(simLive.grade), 100)}%`, background: parseFloat(simLive.grade)>=90 ? "linear-gradient(90deg,#2d7a4a,#45b374)" : parseFloat(simLive.grade)>=70 ? "linear-gradient(90deg,#31487A,#8FB3E2)" : "linear-gradient(90deg,#c0392b,#e07070)" }} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop:20, fontSize:13, color:"var(--text3)", textAlign:"center", padding:"16px 0" }}>Enter at least one grade above to see your projection.</div>
          )}

          <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end" }}>
            <button onClick={() => { const snap = [...simPast]; setSimPast(snap.map(c => ({ ...c, grade: "" }))); showUndo("Grades cleared", () => setSimPast(snap)); }} style={gc.clearBtn}>Clear grades</button>
          </div>
        </div>
        );
      })()}

      {/* Grade Scale Reference */}
      <div style={{ marginTop:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:3, height:18, background:"var(--accent)", borderRadius:2 }} />
          <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"var(--primary)" }}>Grade Scale Reference</h3>
        </div>
        <div style={{ background:"var(--surface)", borderRadius:18, border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", overflow:"hidden" }}>
          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", background:"var(--bg)", borderBottom:"1px solid var(--border)", padding:"10px 20px" }}>
            <span style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Score Range</span>
            <span style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"center" }}>Letter Grade</span>
            <span style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"right" }}>GPA Points</span>
          </div>
          {[
            { range:"93 – 100", letter:"A+", gpa:"4.3 *", color:"var(--success)" },
            { range:"87 – 92",  letter:"A",  gpa:"4.0", color:"var(--success)" },
            { range:"83 – 86",  letter:"A−", gpa:"3.7", color:"var(--success)" },
            { range:"79 – 82",  letter:"B+", gpa:"3.3", color:"var(--primary)" },
            { range:"75 – 78",  letter:"B",  gpa:"3.0", color:"var(--primary)" },
            { range:"72 – 74",  letter:"B−", gpa:"2.7", color:"var(--primary)" },
            { range:"69 – 71",  letter:"C+", gpa:"2.3", color:"var(--accent)" },
            { range:"66 – 68",  letter:"C",  gpa:"2.0", color:"var(--accent)" },
            { range:"63 – 65",  letter:"C−", gpa:"1.7", color:"var(--accent)" },
            { range:"61 – 62",  letter:"D+", gpa:"1.3", color:"var(--error)" },
            { range:"60",       letter:"D",  gpa:"1.0", color:"var(--error)" },
            { range:"Below 60", letter:"F",  gpa:"0.0", color:"var(--error)" },
          ].map((row, i) => (
            <div key={row.letter} style={{
              display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
              padding:"9px 20px",
              background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)",
              borderBottom: i < 11 ? "1px solid var(--border)" : "none",
              alignItems:"center",
            }}>
              <span style={{ fontSize:13, color:"var(--accent2)", fontFamily:"'DM Sans',sans-serif" }}>{row.range}</span>
              <span style={{ fontSize:15, fontWeight:700, color:row.color, fontFamily:"'Fraunces',serif", textAlign:"center" }}>{row.letter}</span>
              <span style={{ fontSize:13, fontWeight:600, color:row.color, textAlign:"right", fontFamily:"'DM Sans',sans-serif" }}>{row.gpa}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:11, color:"var(--text3)", marginTop:8, marginLeft:4 }}>
          * A+ carries 4.3 quality points, but AUB caps the cumulative GPA at 4.0.
        </p>
      </div>
    </div>
  );
}

// Styles
const gc = {
  tabBar:    { display:"flex", gap:4, background:"var(--surface)", padding:5, borderRadius:14, border:"1px solid var(--border)", marginBottom:24, flexWrap:"wrap" },
  tab:       { padding:"9px 22px", border:"none", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s, color .15s", display:"flex", alignItems:"center" },
  card:      { background:"var(--surface)", borderRadius:16, padding:"24px 26px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid var(--border)" },
  headerRow: { display:"flex", gap:12, marginBottom:8, paddingBottom:8, borderBottom:"1px solid var(--border)" },
  colHead:   { fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", flex:1 },
  row:       { display:"flex", gap:12, marginBottom:8, alignItems:"center" },
  input:     { flex:1, padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", outline:"none", transition:"border-color .15s" },
  removeBtn: { width:28, height:28, border:"none", background:"none", color:"var(--text3)", cursor:"pointer", fontSize:14, borderRadius:6, flexShrink:0 },
  addRowBtn: { padding:"7px 14px", background:"var(--divider)", color:"var(--accent)", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:4, transition:"background .15s" },
  calcBtn:   { padding:"10px 22px", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" },
  clearBtn:  { padding:"9px 16px", background:"var(--bg)", color:"var(--error)", border:"1px solid var(--error-border)", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" },
};
