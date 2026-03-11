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

const COMP_TYPES = ["Midterm Exam","Final Exam","Assignment","Project","Quiz","Lab","Attendance","Participation","Other"];

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
export default function GradeCalculator({ dashboardCourses = [], savedSemesters = [], selectedSemester = "" }) {
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
      (snapshot.courses ?? []).map((c, i) => ({
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
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError,   setCourseError]   = useState(null);

  const calcCourse = async () => {
    setCourseError(null);
    const missingFields = components.some(c => !c.weight || !c.grade);
    if (missingFields) { setCourseError("Please fill in weight and grade for all components."); return; }
    const badGrade = components.find(c => !isValidGrade(c.grade));
    if (badGrade) { setCourseError(`"${badGrade.grade}" is not a valid grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    const badWeight = components.find(c => !isValidWeight(c.weight));
    if (badWeight) { setCourseError(`"${badWeight.weight}" is not a valid weight. Enter a number between 1 and 100.`); return; }
    const totalWeight = components.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
    if (totalWeight > 100) { setCourseError(`Weights add up to ${totalWeight}% — they cannot exceed 100%.`); return; }
    setCourseLoading(true);
    try {
      const res = await fetch(`${API}/api/grades/course-grade`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          assessments: components.map(c => ({
            name: c.type === "Other" ? (c.customType.trim() || "Other") : c.type,
            grade: letterToNumeric(c.grade),
            weight: parseFloat(c.weight) || 0,
          })),
        }),
      });
      const data = await parseResponse(res);
      if (!res.ok || data.message?.startsWith("Error")) throw new Error(data.message || "Calculation failed.");
      if (data.grade == null) throw new Error("Unexpected response from server.");
      setCourseResult({ grade: data.grade.toFixed(2), letterGrade: data.letterGrade ?? "—" });
    } catch (e) {
      setCourseError(e.message || "Failed to calculate grade.");
    } finally {
      setCourseLoading(false);
    }
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
    const missingFields = graded.some(g => !g.weight || !g.grade) || !finalWeight || !targetGoal;
    if (missingFields) { setTargetError("Please fill in all graded components, final exam weight, and target grade."); return; }
    const badGrade = graded.find(g => !isValidGrade(g.grade));
    if (badGrade) { setTargetError(`"${badGrade.grade}" is not a valid grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    const badWeight = graded.find(g => !isValidWeight(g.weight));
    if (badWeight) { setTargetError(`"${badWeight.weight}" is not a valid weight. Enter a number between 1 and 100.`); return; }
    if (!isValidWeight(finalWeight)) { setTargetError(`"${finalWeight}" is not a valid final exam weight. Enter a number between 1 and 100.`); return; }
    if (!isValidGrade(targetGoal)) { setTargetError(`"${targetGoal}" is not a valid target grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    setTargetLoading(true);
    try {
      const res = await fetch(`${API}/api/grades/required-final`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          completedAssessments: graded.map(g => ({
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
  const [simFutureGrade,  setSimFutureGrade]  = useState("");
  const [simFutureWeight, setSimFutureWeight] = useState("");
  const [simResult,       setSimResult]       = useState(null);
  const [simLoading,      setSimLoading]      = useState(false);
  const [simError,        setSimError]        = useState(null);

  // Confirm states for Clear all and row deletes
  const [confirmClearSem,    setConfirmClearSem]    = useState(false);
  const [confirmClearCum,    setConfirmClearCum]    = useState(false);
  const [confirmClearCourse, setConfirmClearCourse] = useState(false);
  const [confirmClearTarget, setConfirmClearTarget] = useState(false);
  const [confirmClearSim,    setConfirmClearSim]    = useState(false);
  const [confirmDelSem,      setConfirmDelSem]      = useState(null);
  const [confirmDelCum,      setConfirmDelCum]      = useState(null);
  const [confirmDelComp,     setConfirmDelComp]     = useState(null);
  const [confirmDelGraded,   setConfirmDelGraded]   = useState(null);
  const [confirmDelSim,      setConfirmDelSim]      = useState(null);

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
  const semesterCourses = selectedSemester
    ? (savedSemesters.find(s => s.semesterName === selectedSemester)?.courses || []).filter(c => c.courseCode).map(c => ({ name: c.courseCode }))
    : dashboardCourses;

  // Switch course — loads saved state or falls back to syllabus extract
  const switchCourse = (courseName) => {
    setSelectedCourse(courseName);
    setCourseResult(null); setTargetResult(null); setSimResult(null);
    setCourseError(null);  setTargetError(null);  setSimError(null);
    if (!courseName) {
      setComponents([{ id: Date.now(), type:"", weight:"", grade:"", customType:"" }]);
      setSimPast([{ id: Date.now(), type:"", weight:"", grade:"", customType:"" }]);
      setGraded([{ id: Date.now(), weight:"", grade:"" }]);
      setFinalWeight(""); setTargetGoal(""); setSimFutureGrade(""); setSimFutureWeight("");
      return;
    }
    const saved = loadCourseData(courseName);
    if (saved) {
      if (saved.components?.length)  setComponents(saved.components);
      if (saved.graded?.length)      setGraded(saved.graded);
      if (saved.finalWeight != null) setFinalWeight(saved.finalWeight);
      if (saved.targetGoal != null)  setTargetGoal(saved.targetGoal);
      if (saved.simPast?.length)     setSimPast(saved.simPast);
      if (saved.simFutureGrade != null)  setSimFutureGrade(saved.simFutureGrade);
      if (saved.simFutureWeight != null) setSimFutureWeight(saved.simFutureWeight);
    } else {
      const syl = loadSyllabus(courseName);
      if (syl?.assessments?.length) {
        setComponents(syl.assessments.map((a, i) => {
          const t = inferType(a.name);
          return { id: Date.now() + i, type: t, weight: String(a.weight ?? ""), grade: "", customType: t === "Other" ? (a.name || "") : "" };
        }));
        setSimPast(syl.assessments.map((a, i) => {
          const t = inferType(a.name);
          return { id: Date.now() + i, type: t, weight: String(a.weight ?? ""), grade: "", customType: t === "Other" ? (a.name || "") : "" };
        }));
      } else {
        setComponents([{ id: Date.now(), type:"", weight:"", grade:"", customType:"" }]);
        setSimPast([{ id: Date.now(), type:"", weight:"", grade:"", customType:"" }]);
      }
      setGraded([{ id: Date.now(), weight:"", grade:"" }]);
      setFinalWeight(syl?.finalExamWeight != null ? String(syl.finalExamWeight) : "");
      setTargetGoal("");
      setSimFutureGrade(""); setSimFutureWeight("");
    }
  };

  // Auto-save whenever course-specific state changes
  useEffect(() => {
    if (!selectedCourse) return;
    saveCourseData(selectedCourse, { components, graded, finalWeight, targetGoal, simPast, simFutureGrade, simFutureWeight });
  }, [selectedCourse, components, graded, finalWeight, targetGoal, simPast, simFutureGrade, simFutureWeight]);

  const calcSim = async () => {
    setSimError(null);
    const missingFields = simPast.some(c => !c.weight || !c.grade) || !simFutureGrade || !simFutureWeight;
    if (missingFields) { setSimError("Please fill in all past components and the future component fields."); return; }
    const badGrade = simPast.find(c => !isValidGrade(c.grade));
    if (badGrade) { setSimError(`"${badGrade.grade}" is not a valid grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    const badWeight = simPast.find(c => !isValidWeight(c.weight));
    if (badWeight) { setSimError(`"${badWeight.weight}" is not a valid weight. Enter a number between 1 and 100.`); return; }
    const totalSimWeight = simPast.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0) + (parseFloat(simFutureWeight) || 0);
    if (totalSimWeight > 100) { setSimError(`Weights add up to ${totalSimWeight}% — they cannot exceed 100%.`); return; }
    if (!isValidGrade(simFutureGrade)) { setSimError(`"${simFutureGrade}" is not a valid grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    if (!isValidWeight(simFutureWeight)) { setSimError(`"${simFutureWeight}" is not a valid weight. Enter a number between 1 and 100.`); return; }
    setSimLoading(true);
    try {
      const allComponents = [
        ...simPast.map(c => ({ name: c.type === "Other" ? (c.customType.trim() || "Other") : c.type, grade: letterToNumeric(c.grade), weight: parseFloat(c.weight) || 0 })),
        { name: "Future Component", grade: letterToNumeric(simFutureGrade), weight: parseFloat(simFutureWeight) || 0 },
      ];
      const totalWeight = allComponents.reduce((sum, c) => sum + c.weight, 0);
      const remaining   = Math.max(0, 100 - totalWeight);

      const res = await fetch(`${API}/api/grades/course-grade`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ assessments: allComponents }),
      });
      const data = await parseResponse(res);
      if (!res.ok || data.message?.startsWith("Error")) throw new Error(data.message || "Simulation failed.");
      if (data.grade == null) throw new Error("Unexpected response from server.");
      setSimResult({
        type: "ok",
        projected: data.grade.toFixed(2),
        letterGrade: data.letterGrade ?? "—",
        totalWeight: totalWeight.toFixed(0),
        remaining: remaining.toFixed(0),
        grade: simFutureGrade,
      });
    } catch (e) {
      setSimError(e.message || "Failed to simulate grade.");
    } finally {
      setSimLoading(false);
    }
  };

  // Enter-key shortcut — always calls the latest calc function for the active tab
  const calcRef = useRef({});
  calcRef.current = { calcSemGPA, calcCumGPA, calcCourse, calcTarget, calcSim };
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Enter") return;
      if (["BUTTON","SELECT","TEXTAREA"].includes(e.target.tagName)) return;
      const fns = calcRef.current;
      if (activeTab === "semester")   fns.calcSemGPA();
      else if (activeTab === "cumulative") fns.calcCumGPA();
      else if (activeTab === "course")     fns.calcCourse();
      else if (activeTab === "target")     fns.calcTarget();
      else if (activeTab === "simulator")  fns.calcSim();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activeTab]);



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
              <button key={c.name} onClick={() => switchCourse(selectedCourse === c.name ? "" : c.name)} style={{
                fontSize:12, fontWeight:600, padding:"5px 14px", borderRadius:20,
                border: selectedCourse === c.name ? "none" : "1px solid var(--border)",
                background: selectedCourse === c.name ? "var(--primary)" : "var(--bg)",
                color: selectedCourse === c.name ? "#fff" : "var(--accent2)",
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
      <div style={{ 
        display:"flex", 
        background:"var(--surface)", 
        border:"1px solid var(--border)", 
        borderRadius:14, 
        padding:5, 
        width:"fit-content", 
        gap:4 
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding:"9px 16px", 
            border:"none", 
            borderRadius:10, 
            fontSize:13, 
            fontWeight:600,
            cursor:"pointer", 
            fontFamily:"'DM Sans',sans-serif", 
            transition:"all .15s",
            background: activeTab === t.id ? "var(--primary)" : "transparent",
            color: activeTab === t.id ? "#ffffff" : "var(--text2)",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Semester GPA */}
      {activeTab==="semester" && (
        <div style={gc.card}>
          <SectionTitle>Current Semester GPA</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:18 }}>
            Enter each course, your grade (letter or GPA point), and its credit hours.
          </p>

          {savedSemesters.length > 0 && (
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:18 }}>
              <select value={semToLoad} onChange={e => setSelectedLoad(e.target.value)} style={{ ...gc.input, flex:1, maxWidth:260, cursor:"pointer" }}>
                <option value="">Load from My Semesters…</option>
                {savedSemesters.map(s => <option key={s.id} value={s.id}>{s.semesterName}</option>)}
              </select>
              <button
                onClick={() => {
                  const sem = savedSemesters.find(s => String(s.id) === String(semToLoad));
                  if (sem) { loadSnapshot(sem); setSelectedLoad(""); }
                }}
                disabled={!semToLoad}
                style={{ ...gc.calcBtn, padding:"8px 16px", opacity: semToLoad ? 1 : 0.45 }}
              >
                Load
              </button>
            </div>
          )}

          <div style={gc.headerRow}>
            <span style={{ ...gc.colHead, flex:1 }}>Course</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:150 }}>Grade</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:90 }}>Credits</span>
            <span style={{ width:28 }} />
          </div>
          {semCourses.map(c => (
            <div key={c.id} style={gc.row}>
              {dashboardCourses.length > 0 ? (
                <select className="gc-input" value={c.name} onChange={e=>updateRow(setSemCourses,c.id,"name",e.target.value)} style={{ ...gc.input, cursor:"pointer" }}>
                  <option value="">Select course</option>
                  {dashboardCourses.map(dc => <option key={dc.id} value={dc.name}>{dc.name}</option>)}
                </select>
              ) : (
                <input className="gc-input" value={c.name} onChange={e=>updateRow(setSemCourses,c.id,"name",e.target.value)} placeholder="e.g. CMPS 271" style={gc.input} />
              )}
              <select className="gc-input" value={c.grade} onChange={e=>updateRow(setSemCourses,c.id,"grade",e.target.value)} style={{ ...gc.input, maxWidth:150, cursor:"pointer" }}>
                <option value="">Grade</option>
                {LETTER_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
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
        <div style={gc.card}>
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
            <div key={c.id} style={gc.row}>
              <select className="gc-input" value={c.name} onChange={e => {
                const name = e.target.value;
                const sem = savedSemesters.find(s => s.semesterName === name);
                const autoGpa = sem ? computeSavedGPA(sem.courses) : null;
                const autoCredits = sem ? (sem.courses || []).reduce((sum, sc) => sum + (Number(sc.credits) || 0), 0) : null;
                setCumSems(p => p.map(r => r.id === c.id ? { ...r, name, gpa: autoGpa != null ? Number(autoGpa).toFixed(2) : r.gpa, credits: autoCredits != null && autoCredits > 0 ? String(autoCredits) : r.credits } : r));
              }} style={{ ...gc.input, cursor:"pointer" }}>
                <option value="">Select semester</option>
                {savedSemesters.length > 0
                  ? savedSemesters.map(s => <option key={s.id} value={s.semesterName}>{s.semesterName}</option>)
                  : SEMESTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)
                }
              </select>
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

      {/* Course Grade */}
      {activeTab==="course" && (
        <div style={gc.card}>
          <SectionTitle>Course Grade (So Far)</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:18 }}>
            Enter each graded component, its weight, and your grade to see your current standing.
          </p>
          <div style={gc.headerRow}>
            <span style={{ ...gc.colHead, flex:1, maxWidth:140 }}>Type</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Weight %</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Grade</span>
            <span style={{ width:28 }} />
          </div>
          {components.map(c => (
            <div key={c.id} style={{ ...gc.row, alignItems: c.type === "Other" ? "flex-start" : "center" }}>
              <div style={{ flex:1, maxWidth:140 }}>
                <select className="gc-input" value={c.type} onChange={e=>updateRow(setComponents,c.id,"type",e.target.value)} style={{ ...gc.input, width:"100%", cursor:"pointer" }}>
                  <option value="">Select type…</option>
                  {COMP_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
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
              {confirmDelComp === c.id ? (
                <span style={{ display:"flex", alignItems:"center", gap:2 }}>
                  <button onClick={() => { setConfirmDelComp(null); removeRow(setComponents,c.id); }} style={{ ...gc.removeBtn, color:"var(--error)", fontWeight:700 }}>✓</button>
                  <button onClick={() => setConfirmDelComp(null)} style={gc.removeBtn}>✗</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelComp(c.id)} style={gc.removeBtn}>✕</button>
              )}
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
            {confirmClearCourse ? (
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:12, color:"var(--error)", fontWeight:600 }}>Clear all?</span>
                <button onClick={() => { setConfirmClearCourse(false); setComponents([{ id:Date.now(), type:"", weight:"", grade:"", customType:"" }]); setCourseResult(null); setCourseError(null); }} style={{ ...gc.clearBtn, padding:"6px 10px", fontSize:12 }}>Yes</button>
                <button onClick={() => setConfirmClearCourse(false)} style={{ ...gc.clearBtn, color:"var(--text2)", borderColor:"var(--border)", padding:"6px 10px", fontSize:12 }}>No</button>
              </span>
            ) : (
              <button onClick={() => setConfirmClearCourse(true)} style={gc.clearBtn}>Clear all</button>
            )}
            {courseResult && !courseError && (
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <ResultBadge
                  value={`${courseResult.grade}%`}
                  label="Current Grade"
                  color={parseFloat(courseResult.grade)>=90?"var(--success)":parseFloat(courseResult.grade)>=70?"var(--primary)":"var(--error)"}
                />
                <ResultBadge
                  value={courseResult.letterGrade}
                  label="Letter Grade"
                  color={parseFloat(courseResult.grade)>=90?"var(--success)":parseFloat(courseResult.grade)>=70?"var(--primary)":"var(--error)"}
                />
              </div>
            )}
          </div>
          {courseError && <ErrorBox>{courseError}</ErrorBox>}
        </div>
      )}

      {/* Target Grade */}
      {activeTab==="target" && (
        <div style={gc.card}>
          <SectionTitle>Target Course Grade</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:18 }}>
            Enter your graded components, your final exam weight, and your target — find out what you need.
          </p>
          <div style={gc.headerRow}>
            <span style={gc.colHead}>Weight %</span>
            <span style={gc.colHead}>Grade</span>
            <span style={{ width:28 }} />
          </div>
          {graded.map(g => (
            <div key={g.id} style={gc.row}>
              <input className="gc-input" value={g.weight} onChange={e=>updateRow(setGraded,g.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={gc.input} />
              <input className="gc-input" value={g.grade}  onChange={e=>updateRow(setGraded,g.id,"grade",e.target.value)}  placeholder="e.g. 78 or B+" style={gc.input} />
              {confirmDelGraded === g.id ? (
                <span style={{ display:"flex", alignItems:"center", gap:2 }}>
                  <button onClick={() => { setConfirmDelGraded(null); removeRow(setGraded,g.id); }} style={{ ...gc.removeBtn, color:"var(--error)", fontWeight:700 }}>✓</button>
                  <button onClick={() => setConfirmDelGraded(null)} style={gc.removeBtn}>✗</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelGraded(g.id)} style={gc.removeBtn}>✕</button>
              )}
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setGraded)} style={gc.addRowBtn}>+ Add Component</button>

          {/* Weight indicator (graded components + final exam) */}
          <div style={{ display:"flex", gap:12, marginTop:16, alignItems:"center", flexWrap:"wrap" }}>
            <WeightIndicator total={graded.reduce((s,g) => s + (parseFloat(g.weight)||0), 0) + (parseFloat(finalWeight)||0)} />
          </div>

          {/* Final exam weight + target grade row */}
          <div style={{ display:"flex", gap:12, marginTop:12, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 14px" }}>
              <span style={{ fontSize:13, color:"var(--accent2)", fontWeight:600 }}>Final exam weight:</span>
              <input className="gc-input" value={finalWeight} onChange={e=>{ setFinalWeight(e.target.value); }} placeholder="e.g. 40" type="number" style={{ border:"none", outline:"none", background:"transparent", fontSize:14, fontWeight:600, color:"var(--primary)", width:60 }} />
              <span style={{ fontSize:13, color:"var(--text2)" }}>%</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 14px" }}>
              <span style={{ fontSize:13, color:"var(--accent2)", fontWeight:600 }}>My target grade:</span>
              <input className="gc-input" value={targetGoal} onChange={e=>setTargetGoal(e.target.value)} placeholder="e.g. 85 or B" style={{ border:"none", outline:"none", background:"transparent", fontSize:14, fontWeight:600, color:"var(--primary)", width:90 }} />
            </div>
            <button className="gc-calcbtn" onClick={calcTarget} disabled={targetLoading} style={gc.calcBtn}>
              {targetLoading ? "Calculating…" : "Calculate"}
            </button>
            {confirmClearTarget ? (
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:12, color:"var(--error)", fontWeight:600 }}>Clear all?</span>
                <button onClick={() => { setConfirmClearTarget(false); setGraded([{ id:Date.now(), weight:"", grade:"" }]); setFinalWeight(""); setTargetGoal(""); setTargetResult(null); setTargetError(null); }} style={{ ...gc.clearBtn, padding:"6px 10px", fontSize:12 }}>Yes</button>
                <button onClick={() => setConfirmClearTarget(false)} style={{ ...gc.clearBtn, color:"var(--text2)", borderColor:"var(--border)", padding:"6px 10px", fontSize:12 }}>No</button>
              </span>
            ) : (
              <button onClick={() => setConfirmClearTarget(true)} style={gc.clearBtn}>Clear all</button>
            )}
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
                    value={targetResult.targetLetter}
                    label="Target Letter Grade"
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
      )}

      {/* Grade Simulator */}
      {activeTab==="simulator" && (
        <div style={gc.card}>
          <SectionTitle>Grade Simulator</SectionTitle>
          <p style={{ fontSize:13, color:"var(--text2)", marginTop:6, marginBottom:18 }}>
            Enter your grades so far, then simulate a future component to see how it impacts your final grade.
          </p>

          {/* Past components */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
              Grades So Far
            </div>
            <div style={gc.headerRow}>
              <span style={{ ...gc.colHead, flex:1, maxWidth:140 }}>Type</span>
              <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Weight %</span>
              <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Grade</span>
              <span style={{ width:28 }} />
            </div>
            {simPast.map(c => (
              <div key={c.id} style={{ ...gc.row, alignItems: c.type === "Other" ? "flex-start" : "center" }}>
                <div style={{ flex:1, maxWidth:140 }}>
                  <select className="gc-input" value={c.type} onChange={e=>updateRow(setSimPast,c.id,"type",e.target.value)} style={{ ...gc.input, width:"100%", cursor:"pointer" }}>
                    <option value="">Select type…</option>
                    {COMP_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                  {c.type === "Other" && (
                    <input className="gc-input" value={c.customType||""} onChange={e=>updateRow(setSimPast,c.id,"customType",e.target.value)} placeholder="Specify (optional)" style={{ ...gc.input, width:"100%", marginTop:4, fontSize:12 }} />
                  )}
                </div>
                <input className="gc-input" value={c.weight} onChange={e => {
                  const val = e.target.value;
                  const otherTotal = simPast.filter(r => r.id !== c.id).reduce((s, r) => s + (parseFloat(r.weight) || 0), 0) + (parseFloat(simFutureWeight) || 0);
                  if (parseFloat(val) + otherTotal > 100) return;
                  updateRow(setSimPast, c.id, "weight", val);
                }} placeholder="e.g. 30" type="number" style={{ ...gc.input, maxWidth:110 }} />
                <input className="gc-input" value={c.grade}  onChange={e=>updateRow(setSimPast,c.id,"grade",e.target.value)}  placeholder="e.g. 85 or A-" style={{ ...gc.input, maxWidth:110 }} />
                {confirmDelSim === c.id ? (
                  <span style={{ display:"flex", alignItems:"center", gap:2 }}>
                    <button onClick={() => { setConfirmDelSim(null); removeRow(setSimPast,c.id); }} style={{ ...gc.removeBtn, color:"var(--error)", fontWeight:700 }}>✓</button>
                    <button onClick={() => setConfirmDelSim(null)} style={gc.removeBtn}>✗</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDelSim(c.id)} style={gc.removeBtn}>✕</button>
                )}
              </div>
            ))}
            <button className="gc-addbtn" onClick={() => addRow(setSimPast)} style={gc.addRowBtn}>+ Add Component</button>
          </div>

          {/* Future component */}
          <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>
              Future Component — "What if I get…"
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--text2)" }}>Grade</label>
                <input
                  className="gc-input"
                  value={simFutureGrade}
                  onChange={e => setSimFutureGrade(e.target.value)}
                  placeholder="e.g. 90 or A-"
                  style={{ ...gc.input, maxWidth:120 }}
                />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--text2)" }}>Weight %</label>
                <input
                  className="gc-input"
                  value={simFutureWeight}
                  onChange={e => {
                    const val = e.target.value;
                    const pastTotal = simPast.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
                    if (parseFloat(val) + pastTotal > 100) return;
                    setSimFutureWeight(val);
                  }}
                  placeholder="e.g. 40"
                  type="number"
                  style={{ ...gc.input, maxWidth:120 }}
                />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"transparent" }}>.</label>
                <div style={{ display:"flex", gap:8, alignSelf:"flex-end" }}>
                  <button className="gc-calcbtn" onClick={calcSim} disabled={simLoading} style={gc.calcBtn}>
                    {simLoading ? "Simulating…" : "Simulate"}
                  </button>
                  {confirmClearSim ? (
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ fontSize:12, color:"var(--error)", fontWeight:600 }}>Clear all?</span>
                      <button onClick={() => { setConfirmClearSim(false); setSimPast([{ id:Date.now(), type:"", weight:"", grade:"", customType:"" }]); setSimFutureGrade(""); setSimFutureWeight(""); setSimResult(null); setSimError(null); }} style={{ ...gc.clearBtn, padding:"6px 10px", fontSize:12 }}>Yes</button>
                      <button onClick={() => setConfirmClearSim(false)} style={{ ...gc.clearBtn, color:"var(--text2)", borderColor:"var(--border)", padding:"6px 10px", fontSize:12 }}>No</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmClearSim(true)} style={gc.clearBtn}>Clear all</button>
                  )}
                </div>
              </div>
            </div>
            {/* Live weight total for simulator */}
            <div style={{ marginTop:14 }}>
              <WeightIndicator total={simPast.reduce((s,c) => s + (parseFloat(c.weight)||0), 0) + (parseFloat(simFutureWeight)||0)} />
            </div>
          </div>

          {simError && <ErrorBox>{simError}</ErrorBox>}

          {/* Simulation result */}
          {simResult && simResult.type === "ok" && !simError && (
            <div style={{ background:"var(--blue-light-bg)", borderRadius:14, border:"1px solid var(--border)", padding:"20px 24px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--border2)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>
                Simulation Result
              </div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"stretch" }}>
                <div style={{ background:"white", borderRadius:12, padding:"14px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(49,72,122,0.09)", flex:"1 1 120px" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700, color:parseFloat(simResult.projected)>=90?"var(--success)":parseFloat(simResult.projected)>=70?"var(--primary)":"var(--error)", lineHeight:1 }}>
                    {simResult.projected}%
                  </div>
                  <div style={{ fontSize:11, color:"var(--text2)", marginTop:6 }}>Projected Final Grade</div>
                </div>
                <div style={{ background:"white", borderRadius:12, padding:"14px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(49,72,122,0.09)", flex:"0 1 auto" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700, color:"var(--accent)", lineHeight:1 }}>
                    {simResult.letterGrade}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text2)", marginTop:6 }}>Letter Grade</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, flex:"1 1 200px", justifyContent:"center" }}>
                  <div style={{ fontSize:13, color:"var(--accent2)" }}>
                    <span style={{ fontWeight:600, color:"var(--primary)" }}>{simResult.totalWeight}%</span> of your grade will be counted
                  </div>
                  {parseInt(simResult.remaining) > 0 && (
                    <div style={{ fontSize:13, color:"var(--accent2)" }}>
                      <span style={{ fontWeight:600, color:"var(--primary)" }}>{simResult.remaining}%</span> remains ungraded
                    </div>
                  )}
                  <div style={{ fontSize:13, color:"var(--accent2)" }}>
                    If you score <span style={{ fontWeight:600, color:"var(--accent)" }}>{simResult.grade}%</span> on this component, your grade will be <span style={{ fontWeight:600, color:"var(--primary)" }}>{simResult.projected}%</span>.
                  </div>
                </div>
              </div>
              {/* mini grade bar */}
              <div style={{ marginTop:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text2)", marginBottom:4 }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
                <div style={{ height:8, background:"#D9E1F1", borderRadius:10, overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:10, transition:"width 0.5s ease",
                    width:`${Math.min(parseFloat(simResult.projected), 100)}%`,
                    background: parseFloat(simResult.projected)>=90
                      ? "linear-gradient(90deg,#2d7a4a,#45b374)"
                      : parseFloat(simResult.projected)>=70
                      ? "linear-gradient(90deg,#31487A,#8FB3E2)"
                      : "linear-gradient(90deg,#c0392b,#e07070)",
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grade Scale Reference */}
      <div style={{ maxWidth:800, marginTop:28 }}>
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
  tab:       { padding:"9px 16px", border:"none", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s, color .15s", display:"flex", alignItems:"center" },
  card:      { background:"var(--surface)", borderRadius:18, padding:"24px 26px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid var(--border)", maxWidth:800 },
  headerRow: { display:"flex", gap:12, marginBottom:8, paddingBottom:8, borderBottom:"1px solid var(--border)" },
  colHead:   { fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", flex:1 },
  row:       { display:"flex", gap:12, marginBottom:8, alignItems:"center" },
  input:     { flex:1, padding:"9px 12px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", outline:"none", transition:"border-color .15s" },
  removeBtn: { width:28, height:28, border:"none", background:"none", color:"var(--text3)", cursor:"pointer", fontSize:14, borderRadius:6, flexShrink:0 },
  addRowBtn: { padding:"7px 14px", background:"var(--divider)", color:"var(--accent)", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:4, transition:"background .15s" },
  calcBtn:   { padding:"10px 22px", background:"var(--primary)", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" },
  clearBtn:  { padding:"9px 16px", background:"var(--bg)", color:"var(--error)", border:"1px solid var(--error-border)", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" },
};
