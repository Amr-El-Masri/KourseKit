import { useState } from "react";

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
      <div style={{ width:3, height:18, background:"#7B5EA7", borderRadius:2 }} />
      <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"#31487A" }}>{children}</h3>
    </div>
  );
}

function ResultBadge({ value, label, color="#31487A" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, background:"#F0EEF7", borderRadius:12, padding:"12px 20px", border:"1px solid #D4D4DC" }}>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:"#A59AC9" }}>{label}</div>
    </div>
  );
}

function InfoBox({ children, color="#31487A", bg="#F0EEF7", border="#7B5EA7" }) {
  return (
    <div style={{ marginTop:16, padding:"14px 18px", background:bg, borderRadius:12, borderLeft:`3px solid ${border}`, fontSize:14, color, fontWeight:500, lineHeight:1.6 }}>
      {children}
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <InfoBox color="#c0392b" bg="#fef0f0" border="#c0392b">{children}</InfoBox>
  );
}

// Grade Calculator page
export default function GradeCalculator() {
  const [activeTab, setActiveTab] = useState("semester");

  // Row helpers (UI only)
  const addRow    = setter => setter(p => [...p, { id:Date.now(), name:"", grade:"", credits:"", weight:"", type:"Exam", gpa:"" }]);
  const removeRow = (setter, id) => setter(p => p.length > 1 ? p.filter(r => r.id !== id) : p);
  const updateRow = (setter, id, field, val) => setter(p => p.map(r => r.id === id ? { ...r, [field]:val } : r));

  // Semester GPA
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
  const [components,    setComponents]    = useState([{ id:1, type:"Exam", weight:"", grade:"" }]);
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
    setCourseLoading(true);
    try {
      const res = await fetch(`${API}/api/grades/course-grade`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          assessments: components.map(c => ({
            name: c.type,
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
  const [simPast,         setSimPast]         = useState([{ id:1, type:"Exam", weight:"", grade:"" }]);
  const [simFutureGrade,  setSimFutureGrade]  = useState("");
  const [simFutureWeight, setSimFutureWeight] = useState("");
  const [simResult,       setSimResult]       = useState(null);
  const [simLoading,      setSimLoading]      = useState(false);
  const [simError,        setSimError]        = useState(null);

  const calcSim = async () => {
    setSimError(null);
    const missingFields = simPast.some(c => !c.weight || !c.grade) || !simFutureGrade || !simFutureWeight;
    if (missingFields) { setSimError("Please fill in all past components and the future component fields."); return; }
    const badGrade = simPast.find(c => !isValidGrade(c.grade));
    if (badGrade) { setSimError(`"${badGrade.grade}" is not a valid grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    const badWeight = simPast.find(c => !isValidWeight(c.weight));
    if (badWeight) { setSimError(`"${badWeight.weight}" is not a valid weight. Enter a number between 1 and 100.`); return; }
    if (!isValidGrade(simFutureGrade)) { setSimError(`"${simFutureGrade}" is not a valid grade. Use a letter (A+, B−…) or a number 0–100.`); return; }
    if (!isValidWeight(simFutureWeight)) { setSimError(`"${simFutureWeight}" is not a valid weight. Enter a number between 1 and 100.`); return; }
    setSimLoading(true);
    try {
      const allComponents = [
        ...simPast.map(c => ({ name: c.type, grade: letterToNumeric(c.grade), weight: parseFloat(c.weight) || 0 })),
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
        .gc-input:focus { border-color:#8FB3E2 !important; outline:none; }
        .gc-row-hover:hover { background:#F0EEF7 !important; }
        .gc-tab-hover:hover { background:#F4F4F8; }
        .gc-addbtn:hover { background:#e8e0f7 !important; }
        .gc-calcbtn:hover:not(:disabled) { background:#221866 !important; }
        .gc-calcbtn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"#31487A", marginBottom:4 }}>
          Grade Calculator
        </div>
        <div style={{ fontSize:13, color:"#A59AC9" }}>
          Calculate your GPA, plan your grades, and simulate future scores
        </div>
      </div>

      {/* Tab bar */}
      <div style={gc.tabBar}>
        {TABS.map(t => (
          <button key={t.id} className="gc-tab-hover" onClick={() => setActiveTab(t.id)} style={{
            ...gc.tab,
            background: activeTab===t.id ? "#31487A" : "transparent",
            color:       activeTab===t.id ? "#ffffff" : "#A59AC9",
            fontWeight:  activeTab===t.id ? 600 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Semester GPA */}
      {activeTab==="semester" && (
        <div style={gc.card}>
          <SectionTitle>Current Semester GPA</SectionTitle>
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter each course, your grade (letter or GPA point), and its credit hours.
          </p>
          <div style={gc.headerRow}>
            <span style={{ ...gc.colHead, flex:1 }}>Course</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:150 }}>Grade</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:90 }}>Credits</span>
            <span style={{ width:28 }} />
          </div>
          {semCourses.map(c => (
            <div key={c.id} style={gc.row}>
              <input className="gc-input" value={c.name}    onChange={e=>updateRow(setSemCourses,c.id,"name",e.target.value)}    placeholder="e.g. CMPS 271"   style={gc.input} />
              <input className="gc-input" value={c.grade}   onChange={e=>updateRow(setSemCourses,c.id,"grade",e.target.value)}   placeholder="e.g. A+ or 93"  style={{ ...gc.input, maxWidth:150 }} />
              <input className="gc-input" value={c.credits} onChange={e=>updateRow(setSemCourses,c.id,"credits",e.target.value)} placeholder="e.g. 3" type="number" style={{ ...gc.input, maxWidth:90 }} />
              <button onClick={() => removeRow(setSemCourses,c.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setSemCourses)} style={gc.addRowBtn}>+ Add Course</button>
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <button className="gc-calcbtn" onClick={calcSemGPA} disabled={semLoading} style={gc.calcBtn}>
              {semLoading ? "Calculating…" : "Calculate GPA"}
            </button>
            {semResult && !semError && (
              <ResultBadge
                value={semResult}
                label="Semester GPA"
                color={parseFloat(semResult)>=3.7?"#2d7a4a":parseFloat(semResult)>=2.7?"#31487A":"#c0392b"}
              />
            )}
          </div>
          {semError && <ErrorBox>{semError}</ErrorBox>}

          {/* Highest Impact — auto result after GPA calculation */}
          {semResult && !semError && semCourses.length >= 2 && (
            <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid #F0EEF7" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>
                Highest Impact Course
              </div>
              {impactLoading && (
                <InfoBox color="#7B5EA7" bg="#F7F5FB" border="#7B5EA7">Analyzing which course has the greatest impact on your GPA…</InfoBox>
              )}
              {impactResult && !impactError && (
                <>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    <ResultBadge
                      value={impactResult.courseName || `Course ${impactResult.courseIndex + 1}`}
                      label="Highest Impact Course"
                      color="#7B5EA7"
                    />
                    <ResultBadge
                      value={impactResult.grade}
                      label="Current Grade"
                      color="#31487A"
                    />
                    <ResultBadge
                      value={`${impactResult.credits} cr`}
                      label="Credit Hours"
                      color="#31487A"
                    />
                  </div>
                  <InfoBox color="#5A3B7B" bg="#F7F5FB" border="#7B5EA7">
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
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter your GPA and credit hours for each completed semester.
          </p>
          <div style={gc.headerRow}>
            <span style={gc.colHead}>Semester</span>
            <span style={{ ...gc.colHead, maxWidth:120 }}>GPA</span>
            <span style={{ ...gc.colHead, maxWidth:90 }}>Credits</span>
            <span style={{ width:28 }} />
          </div>
          {cumSems.map(c => (
            <div key={c.id} style={gc.row}>
              <input className="gc-input" value={c.name}    onChange={e=>updateRow(setCumSems,c.id,"name",e.target.value)}    placeholder="e.g. Fall 24-25"  style={gc.input} />
              <input className="gc-input" value={c.gpa}     onChange={e=>updateRow(setCumSems,c.id,"gpa",e.target.value)}     placeholder="e.g. 3.67" type="number" step="0.01" style={{ ...gc.input, maxWidth:120 }} />
              <input className="gc-input" value={c.credits} onChange={e=>updateRow(setCumSems,c.id,"credits",e.target.value)} placeholder="e.g. 15"   type="number" style={{ ...gc.input, maxWidth:90 }} />
              <button onClick={() => removeRow(setCumSems,c.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setCumSems)} style={gc.addRowBtn}>+ Add Semester</button>
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <button className="gc-calcbtn" onClick={calcCumGPA} disabled={cumLoading} style={gc.calcBtn}>
              {cumLoading ? "Calculating…" : "Calculate Cumulative GPA"}
            </button>
            {cumResult && !cumError && (
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <ResultBadge
                  value={cumResult.gpa}
                  label="Cumulative GPA"
                  color={parseFloat(cumResult.gpa)>=3.7?"#2d7a4a":parseFloat(cumResult.gpa)>=2.7?"#31487A":"#c0392b"}
                />
                <ResultBadge
                  value={cumResult.totalCredits}
                  label="Total Credits"
                  color="#7B5EA7"
                />
              </div>
            )}
          </div>
          {cumError && <ErrorBox>{cumError}</ErrorBox>}

          {/* Required Future GPA — planning panel auto-shown after result */}
          {cumResult && !cumError && (
            <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid #F0EEF7" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>
                GPA Planning
              </div>
              <p style={{ fontSize:13, color:"#A59AC9", marginTop:4, marginBottom:14 }}>
                Based on your current CGPA of <strong style={{ color:"#31487A" }}>{cumResult.gpa}</strong> across <strong style={{ color:"#31487A" }}>{cumResult.totalCredits}</strong> credits — enter your goal to find what GPA you need going forward.
              </p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Target CGPA</label>
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
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Remaining Credits</label>
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
                  {futureResult.isAchievable && (
                    <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap" }}>
                      <ResultBadge
                        value={futureResult.requiredGPA?.toFixed(2)}
                        label="Required GPA per Semester"
                        color={futureResult.requiredGPA<=3.3?"#2d7a4a":futureResult.requiredGPA<=3.7?"#31487A":"#c0392b"}
                      />
                    </div>
                  )}
                  <InfoBox
                    color={futureResult.isAchievable?"#2d7a4a":"#c0392b"}
                    bg={futureResult.isAchievable?"#eef7f0":"#fef0f0"}
                    border={futureResult.isAchievable?"#2d7a4a":"#c0392b"}
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
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter each graded component, its weight, and your grade to see your current standing.
          </p>
          <div style={gc.headerRow}>
            <span style={{ ...gc.colHead, flex:1, maxWidth:140 }}>Type</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Weight %</span>
            <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Grade</span>
            <span style={{ width:28 }} />
          </div>
          {components.map(c => (
            <div key={c.id} style={gc.row}>
              <select className="gc-input" value={c.type} onChange={e=>updateRow(setComponents,c.id,"type",e.target.value)} style={{ ...gc.input, maxWidth:140, cursor:"pointer" }}>
                {["Exam","Assignment","Project","Quiz","Lab","Participation","Other"].map(t=><option key={t}>{t}</option>)}
              </select>
              <input className="gc-input" value={c.weight} onChange={e=>updateRow(setComponents,c.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={{ ...gc.input, maxWidth:110 }} />
              <input className="gc-input" value={c.grade}  onChange={e=>updateRow(setComponents,c.id,"grade",e.target.value)}  placeholder="e.g. 85 or A-" style={{ ...gc.input, maxWidth:110 }} />
              <button onClick={() => removeRow(setComponents,c.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setComponents)} style={gc.addRowBtn}>+ Add Component</button>
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <button className="gc-calcbtn" onClick={calcCourse} disabled={courseLoading} style={gc.calcBtn}>
              {courseLoading ? "Calculating…" : "Calculate Grade"}
            </button>
            {courseResult && !courseError && (
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <ResultBadge
                  value={`${courseResult.grade}%`}
                  label="Current Grade"
                  color={parseFloat(courseResult.grade)>=90?"#2d7a4a":parseFloat(courseResult.grade)>=70?"#31487A":"#c0392b"}
                />
                <ResultBadge
                  value={courseResult.letterGrade}
                  label="Letter Grade"
                  color={parseFloat(courseResult.grade)>=90?"#2d7a4a":parseFloat(courseResult.grade)>=70?"#31487A":"#c0392b"}
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
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
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
              <button onClick={() => removeRow(setGraded,g.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setGraded)} style={gc.addRowBtn}>+ Add Component</button>

          {/* Final exam weight + target grade row */}
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#F4F4F8", border:"1px solid #D4D4DC", borderRadius:10, padding:"8px 14px" }}>
              <span style={{ fontSize:13, color:"#5A3B7B", fontWeight:600 }}>Final exam weight:</span>
              <input className="gc-input" value={finalWeight} onChange={e=>setFinalWeight(e.target.value)} placeholder="e.g. 40" type="number" style={{ border:"none", outline:"none", background:"transparent", fontSize:14, fontWeight:600, color:"#31487A", width:60 }} />
              <span style={{ fontSize:13, color:"#A59AC9" }}>%</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#F4F4F8", border:"1px solid #D4D4DC", borderRadius:10, padding:"8px 14px" }}>
              <span style={{ fontSize:13, color:"#5A3B7B", fontWeight:600 }}>My target grade:</span>
              <input className="gc-input" value={targetGoal} onChange={e=>setTargetGoal(e.target.value)} placeholder="e.g. 85 or B" style={{ border:"none", outline:"none", background:"transparent", fontSize:14, fontWeight:600, color:"#31487A", width:90 }} />
            </div>
            <button className="gc-calcbtn" onClick={calcTarget} disabled={targetLoading} style={gc.calcBtn}>
              {targetLoading ? "Calculating…" : "Calculate"}
            </button>
          </div>

          {targetError && <ErrorBox>{targetError}</ErrorBox>}

          {targetResult && !targetError && (
            <>
              {targetResult.isAchievable && (
                <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap" }}>
                  <ResultBadge
                    value={`${targetResult.requiredGrade.toFixed(1)}%`}
                    label="Needed on Final"
                    color={targetResult.requiredGrade<=80?"#2d7a4a":targetResult.requiredGrade<=95?"#31487A":"#c0392b"}
                  />
                  <ResultBadge
                    value={targetResult.targetLetter}
                    label="Target Letter Grade"
                    color="#7B5EA7"
                  />
                </div>
              )}
              <InfoBox
                color={targetResult.type==="good"?"#2d7a4a":targetResult.type==="bad"?"#c0392b":"#31487A"}
                bg={targetResult.type==="good"?"#eef7f0":targetResult.type==="bad"?"#fef0f0":"#F0EEF7"}
                border={targetResult.type==="good"?"#2d7a4a":targetResult.type==="bad"?"#c0392b":"#7B5EA7"}
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
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter your grades so far, then simulate a future component to see how it impacts your final grade.
          </p>

          {/* Past components */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
              Grades So Far
            </div>
            <div style={gc.headerRow}>
              <span style={{ ...gc.colHead, flex:1, maxWidth:140 }}>Type</span>
              <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Weight %</span>
              <span style={{ ...gc.colHead, flex:1, maxWidth:110 }}>Grade</span>
              <span style={{ width:28 }} />
            </div>
            {simPast.map(c => (
              <div key={c.id} style={gc.row}>
                <select className="gc-input" value={c.type} onChange={e=>updateRow(setSimPast,c.id,"type",e.target.value)} style={{ ...gc.input, maxWidth:140, cursor:"pointer" }}>
                  {["Exam","Assignment","Project","Quiz","Lab","Participation","Other"].map(t=><option key={t}>{t}</option>)}
                </select>
                <input className="gc-input" value={c.weight} onChange={e=>updateRow(setSimPast,c.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={{ ...gc.input, maxWidth:110 }} />
                <input className="gc-input" value={c.grade}  onChange={e=>updateRow(setSimPast,c.id,"grade",e.target.value)}  placeholder="e.g. 85 or A-" style={{ ...gc.input, maxWidth:110 }} />
                <button onClick={() => removeRow(setSimPast,c.id)} style={gc.removeBtn}>✕</button>
              </div>
            ))}
            <button className="gc-addbtn" onClick={() => addRow(setSimPast)} style={gc.addRowBtn}>+ Add Component</button>
          </div>

          {/* Future component */}
          <div style={{ background:"#F7F5FB", border:"1px solid #D4D4DC", borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#7B5EA7", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>
              Future Component — "What if I get…"
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#A59AC9" }}>Grade</label>
                <input
                  className="gc-input"
                  value={simFutureGrade}
                  onChange={e => setSimFutureGrade(e.target.value)}
                  placeholder="e.g. 90 or A-"
                  style={{ ...gc.input, maxWidth:120 }}
                />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#A59AC9" }}>Weight %</label>
                <input
                  className="gc-input"
                  value={simFutureWeight}
                  onChange={e => setSimFutureWeight(e.target.value)}
                  placeholder="e.g. 40"
                  type="number"
                  style={{ ...gc.input, maxWidth:120 }}
                />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"transparent" }}>.</label>
                <button className="gc-calcbtn" onClick={calcSim} disabled={simLoading} style={{ ...gc.calcBtn, alignSelf:"flex-end" }}>
                  {simLoading ? "Simulating…" : "Simulate"}
                </button>
              </div>
            </div>
          </div>

          {simError && <ErrorBox>{simError}</ErrorBox>}

          {/* Simulation result */}
          {simResult && simResult.type === "ok" && !simError && (
            <div style={{ background:"#eef2fb", borderRadius:14, border:"1px solid #D4D4DC", padding:"20px 24px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#8FB3E2", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>
                Simulation Result
              </div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"stretch" }}>
                <div style={{ background:"white", borderRadius:12, padding:"14px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(49,72,122,0.09)", flex:"1 1 120px" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700, color:parseFloat(simResult.projected)>=90?"#2d7a4a":parseFloat(simResult.projected)>=70?"#31487A":"#c0392b", lineHeight:1 }}>
                    {simResult.projected}%
                  </div>
                  <div style={{ fontSize:11, color:"#A59AC9", marginTop:6 }}>Projected Final Grade</div>
                </div>
                <div style={{ background:"white", borderRadius:12, padding:"14px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(49,72,122,0.09)", flex:"0 1 auto" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700, color:"#7B5EA7", lineHeight:1 }}>
                    {simResult.letterGrade}
                  </div>
                  <div style={{ fontSize:11, color:"#A59AC9", marginTop:6 }}>Letter Grade</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, flex:"1 1 200px", justifyContent:"center" }}>
                  <div style={{ fontSize:13, color:"#5A3B7B" }}>
                    <span style={{ fontWeight:600, color:"#31487A" }}>{simResult.totalWeight}%</span> of your grade will be counted
                  </div>
                  {parseInt(simResult.remaining) > 0 && (
                    <div style={{ fontSize:13, color:"#5A3B7B" }}>
                      <span style={{ fontWeight:600, color:"#31487A" }}>{simResult.remaining}%</span> remains ungraded
                    </div>
                  )}
                  <div style={{ fontSize:13, color:"#5A3B7B" }}>
                    If you score <span style={{ fontWeight:600, color:"#7B5EA7" }}>{simResult.grade}%</span> on this component, your grade will be <span style={{ fontWeight:600, color:"#31487A" }}>{simResult.projected}%</span>.
                  </div>
                </div>
              </div>
              {/* mini grade bar */}
              <div style={{ marginTop:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#A59AC9", marginBottom:4 }}>
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
          <div style={{ width:3, height:18, background:"#7B5EA7", borderRadius:2 }} />
          <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"#31487A" }}>Grade Scale Reference</h3>
        </div>
        <div style={{ background:"#ffffff", borderRadius:18, border:"1px solid #D4D4DC", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", overflow:"hidden" }}>
          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", background:"#F4F4F8", borderBottom:"1px solid #E8E8F0", padding:"10px 20px" }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em" }}>Score Range</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"center" }}>Letter Grade</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"right" }}>GPA Points</span>
          </div>
          {[
            { range:"93 – 100", letter:"A+", gpa:"4.3 *", color:"#2d7a4a" },
            { range:"87 – 92",  letter:"A",  gpa:"4.0", color:"#2d7a4a" },
            { range:"83 – 86",  letter:"A−", gpa:"3.7", color:"#2d7a4a" },
            { range:"79 – 82",  letter:"B+", gpa:"3.3", color:"#31487A" },
            { range:"75 – 78",  letter:"B",  gpa:"3.0", color:"#31487A" },
            { range:"72 – 74",  letter:"B−", gpa:"2.7", color:"#31487A" },
            { range:"69 – 71",  letter:"C+", gpa:"2.3", color:"#7B5EA7" },
            { range:"66 – 68",  letter:"C",  gpa:"2.0", color:"#7B5EA7" },
            { range:"63 – 65",  letter:"C−", gpa:"1.7", color:"#7B5EA7" },
            { range:"61 – 62",  letter:"D+", gpa:"1.3", color:"#c0392b" },
            { range:"60",       letter:"D",  gpa:"1.0", color:"#c0392b" },
            { range:"Below 60", letter:"F",  gpa:"0.0", color:"#c0392b" },
          ].map((row, i) => (
            <div key={row.letter} style={{
              display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
              padding:"9px 20px",
              background: i % 2 === 0 ? "#ffffff" : "#FAFAFA",
              borderBottom: i < 11 ? "1px solid #F4F4F8" : "none",
              alignItems:"center",
            }}>
              <span style={{ fontSize:13, color:"#5A3B7B", fontFamily:"'DM Sans',sans-serif" }}>{row.range}</span>
              <span style={{ fontSize:15, fontWeight:700, color:row.color, fontFamily:"'Fraunces',serif", textAlign:"center" }}>{row.letter}</span>
              <span style={{ fontSize:13, fontWeight:600, color:row.color, textAlign:"right", fontFamily:"'DM Sans',sans-serif" }}>{row.gpa}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:11, color:"#B8A9C9", marginTop:8, marginLeft:4 }}>
          * A+ carries 4.3 quality points, but AUB caps the cumulative GPA at 4.0.
        </p>
      </div>
    </div>
  );
}

// Styles
const gc = {
  tabBar:    { display:"flex", gap:4, background:"#ffffff", padding:5, borderRadius:14, border:"1px solid #D4D4DC", marginBottom:24, flexWrap:"wrap" },
  tab:       { padding:"9px 16px", border:"none", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s, color .15s", display:"flex", alignItems:"center" },
  card:      { background:"#ffffff", borderRadius:18, padding:"24px 26px", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", border:"1px solid #D4D4DC", maxWidth:800 },
  headerRow: { display:"flex", gap:12, marginBottom:8, paddingBottom:8, borderBottom:"1px solid #F4F4F8" },
  colHead:   { fontSize:11, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", flex:1 },
  row:       { display:"flex", gap:12, marginBottom:8, alignItems:"center" },
  input:     { flex:1, padding:"9px 12px", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#F7F5FB", outline:"none", transition:"border-color .15s" },
  removeBtn: { width:28, height:28, border:"none", background:"none", color:"#B8A9C9", cursor:"pointer", fontSize:14, borderRadius:6, flexShrink:0 },
  addRowBtn: { padding:"7px 14px", background:"#F0EEF7", color:"#7B5EA7", border:"1px solid #D4D4DC", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:4, transition:"background .15s" },
  calcBtn:   { padding:"10px 22px", background:"#31487A", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" },
};
