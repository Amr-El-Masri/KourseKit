import { useState } from "react";
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

export default function GradeCalculator() {
  const [activeTab, setActiveTab] = useState("semester");

  const addRow    = setter => setter(p => [...p, { id:Date.now(), name:"", grade:"", credits:"", weight:"", type:"Exam", gpa:"" }]);
  const removeRow = (setter, id) => setter(p => p.length > 1 ? p.filter(r => r.id !== id) : p);
  const updateRow = (setter, id, field, val) => setter(p => p.map(r => r.id === id ? { ...r, [field]:val } : r));

  const [semCourses, setSemCourses] = useState([{ id:1, name:"", grade:"", credits:"" }]);
  const [semResult,  setSemResult]  = useState(null);
  const calcSemGPA = () => {
    setSemResult("–––"); };

  const [cumSems,   setCumSems]   = useState([{ id:1, name:"", gpa:"", credits:"" }]);
  const [cumResult, setCumResult] = useState(null);
  const calcCumGPA = () => {
    setCumResult("–––"); };

  const [components,   setComponents]   = useState([{ id:1, type:"Exam", weight:"", grade:"" }]);
  const [courseResult, setCourseResult] = useState(null);
  const calcCourse = () => {
    setCourseResult("–––"); };

  const [graded,       setGraded]       = useState([{ id:1, weight:"", grade:"" }]);
  const [targetGoal,   setTargetGoal]   = useState("");
  const [targetResult, setTargetResult] = useState(null);
  const calcTarget = () => {
    setTargetResult({ type:"ok", msg:"Result will appear here once connected to the backend." });
  };


  const [simPast,         setSimPast]         = useState([{ id:1, type:"Exam", weight:"", grade:"" }]);
  const [simFutureGrade,  setSimFutureGrade]  = useState("");
  const [simFutureWeight, setSimFutureWeight] = useState("");
  const [simResult,       setSimResult]       = useState(null);
  const calcSim = () => {
    setSimResult({ type:"ok", projected:"–––", totalWeight:"–––", remaining:"–––", grade: simFutureGrade });
  };

  const TABS = [
    { id:"semester",   label:"Semester GPA"},
    { id:"cumulative", label:"Cumulative GPA"},
    { id:"course",     label:"Course Grade"},
    { id:"target",     label:"Target Grade"},
    { id:"simulator",  label:"Grade Simulator"},
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
        .gc-calcbtn:hover { background:#221866 !important; }
      `}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"#31487A", marginBottom:4 }}>
          Grade Calculator
        </div>
        <div style={{ fontSize:13, color:"#A59AC9" }}>
          Calculate your GPA, plan your grades, and simulate future scores
        </div>
      </div>

      <div style={gc.tabBar}>
        {TABS.map(t => (
          <button key={t.id} className="gc-tab-hover" onClick={() => setActiveTab(t.id)} style={{
            ...gc.tab,
            background: activeTab===t.id ? "#31487A" : "transparent",
            color:       activeTab===t.id ? "#ffffff" : "#A59AC9",
            fontWeight:  activeTab===t.id ? 600 : 400,
          }}>
            <span style={{ marginRight:6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── current semester GPA ── */}
      {activeTab==="semester" && (
        <div style={gc.card}>
          <SectionTitle>Current Semester GPA</SectionTitle>
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter each course, your grade (letter or GPA point), and its credit hours.
          </p>
          <div style={gc.headerRow}>
            <span style={gc.colHead}>Course</span>
            <span style={gc.colHead}>Grade (A / A- / 3.7)</span>
            <span style={gc.colHead}>Credits</span>
            <span style={{ width:32 }} />
          </div>
          {semCourses.map(c => (
            <div key={c.id} style={gc.row}>
              <input className="gc-input" value={c.name}    onChange={e=>updateRow(setSemCourses,c.id,"name",e.target.value)}    placeholder="e.g. CMPS 271"   style={gc.input} />
              <input className="gc-input" value={c.grade}   onChange={e=>updateRow(setSemCourses,c.id,"grade",e.target.value)}   placeholder="e.g. A- or 3.7"  style={{ ...gc.input, maxWidth:150 }} />
              <input className="gc-input" value={c.credits} onChange={e=>updateRow(setSemCourses,c.id,"credits",e.target.value)} placeholder="e.g. 3" type="number" style={{ ...gc.input, maxWidth:90 }} />
              <button onClick={() => removeRow(setSemCourses,c.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setSemCourses)} style={gc.addRowBtn}>+ Add Course</button>
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <button className="gc-calcbtn" onClick={calcSemGPA} style={gc.calcBtn}>Calculate GPA</button>
            {semResult && (
              <ResultBadge
                value={semResult}
                label="Semester GPA"
                color={parseFloat(semResult)>=3.7?"#2d7a4a":parseFloat(semResult)>=2.7?"#31487A":"#c0392b"}
              />
            )}
          </div>
        </div>
      )}

      {/* ── cumulativbe GPA ── */}
      {activeTab==="cumulative" && (
        <div style={gc.card}>
          <SectionTitle>Cumulative GPA</SectionTitle>
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter your GPA and credit hours for each completed semester.
          </p>
          <div style={gc.headerRow}>
            <span style={gc.colHead}>Semester</span>
            <span style={gc.colHead}>GPA</span>
            <span style={gc.colHead}>Credits</span>
            <span style={{ width:32 }} />
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
            <button className="gc-calcbtn" onClick={calcCumGPA} style={gc.calcBtn}>Calculate Cumulative GPA</button>
            {cumResult && (
              <ResultBadge
                value={cumResult}
                label="Cumulative GPA"
                color={parseFloat(cumResult)>=3.7?"#2d7a4a":parseFloat(cumResult)>=2.7?"#31487A":"#c0392b"}
              />
            )}
          </div>
        </div>
      )}

      {/* ── current course grade ── */}
      {activeTab==="course" && (
        <div style={gc.card}>
          <SectionTitle>Course Grade (So Far)</SectionTitle>
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter each graded component, its weight, and your grade to see your current standing.
          </p>
          <div style={gc.headerRow}>
            <span style={gc.colHead}>Type</span>
            <span style={gc.colHead}>Weight %</span>
            <span style={gc.colHead}>Grade %</span>
            <span style={{ width:32 }} />
          </div>
          {components.map(c => (
            <div key={c.id} style={gc.row}>
              <select className="gc-input" value={c.type} onChange={e=>updateRow(setComponents,c.id,"type",e.target.value)} style={{ ...gc.input, maxWidth:140, cursor:"pointer" }}>
                {["Exam","Assignment","Project","Quiz","Lab","Participation","Other"].map(t=><option key={t}>{t}</option>)}
              </select>
              <input className="gc-input" value={c.weight} onChange={e=>updateRow(setComponents,c.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={{ ...gc.input, maxWidth:110 }} />
              <input className="gc-input" value={c.grade}  onChange={e=>updateRow(setComponents,c.id,"grade",e.target.value)}  placeholder="e.g. 85" type="number" style={{ ...gc.input, maxWidth:110 }} />
              <button onClick={() => removeRow(setComponents,c.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setComponents)} style={gc.addRowBtn}>+ Add Component</button>
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <button className="gc-calcbtn" onClick={calcCourse} style={gc.calcBtn}>Calculate Grade</button>
            {courseResult && (
              <ResultBadge
                value={`${courseResult}%`}
                label="Current Grade"
                color={parseFloat(courseResult)>=90?"#2d7a4a":parseFloat(courseResult)>=70?"#31487A":"#c0392b"}
              />
            )}
          </div>
        </div>
      )}

      {/* ── target grade ── */}
      {activeTab==="target" && (
        <div style={gc.card}>
          <SectionTitle>Target Course Grade</SectionTitle>
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter grades you've already received, set your target, and find out what you need on the rest.
          </p>
          <div style={gc.headerRow}>
            <span style={gc.colHead}>Weight % (graded so far)</span>
            <span style={gc.colHead}>Grade %</span>
            <span style={{ width:32 }} />
          </div>
          {graded.map(g => (
            <div key={g.id} style={gc.row}>
              <input className="gc-input" value={g.weight} onChange={e=>updateRow(setGraded,g.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={gc.input} />
              <input className="gc-input" value={g.grade}  onChange={e=>updateRow(setGraded,g.id,"grade",e.target.value)}  placeholder="e.g. 78" type="number" style={gc.input} />
              <button onClick={() => removeRow(setGraded,g.id)} style={gc.removeBtn}>✕</button>
            </div>
          ))}
          <button className="gc-addbtn" onClick={() => addRow(setGraded)} style={gc.addRowBtn}>+ Add Component</button>
          <div style={{ display:"flex", gap:12, marginTop:20, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#F4F4F8", border:"1px solid #D4D4DC", borderRadius:10, padding:"8px 14px" }}>
              <span style={{ fontSize:13, color:"#5A3B7B", fontWeight:600 }}>My target grade:</span>
              <input className="gc-input" value={targetGoal} onChange={e=>setTargetGoal(e.target.value)} placeholder="85" type="number" style={{ border:"none", outline:"none", background:"transparent", fontSize:14, fontWeight:600, color:"#31487A", width:60 }} />
              <span style={{ fontSize:13, color:"#A59AC9" }}>%</span>
            </div>
            <button className="gc-calcbtn" onClick={calcTarget} style={gc.calcBtn}>Calculate</button>
          </div>
          {targetResult && (
            <InfoBox
              color={targetResult.type==="good"?"#2d7a4a":targetResult.type==="bad"?"#c0392b":"#31487A"}
              bg={targetResult.type==="good"?"#eef7f0":targetResult.type==="bad"?"#fef0f0":"#F0EEF7"}
              border={targetResult.type==="good"?"#2d7a4a":targetResult.type==="bad"?"#c0392b":"#7B5EA7"}
            >
              {targetResult.msg}
            </InfoBox>
          )}
        </div>
      )}

      {/* ── grade simulator aka what if scenarios ── */}
      {activeTab==="simulator" && (
        <div style={gc.card}>
          <SectionTitle>Grade Simulator</SectionTitle>
          <p style={{ fontSize:13, color:"#A59AC9", marginTop:6, marginBottom:18 }}>
            Enter your grades so far, then simulate a future component to see how it impacts your final grade.
          </p>

          {/* past components */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
              Grades So Far
            </div>
            <div style={gc.headerRow}>
              <span style={gc.colHead}>Type</span>
              <span style={gc.colHead}>Weight %</span>
              <span style={gc.colHead}>Grade %</span>
              <span style={{ width:32 }} />
            </div>
            {simPast.map(c => (
              <div key={c.id} style={gc.row}>
                <select className="gc-input" value={c.type} onChange={e=>updateRow(setSimPast,c.id,"type",e.target.value)} style={{ ...gc.input, maxWidth:140, cursor:"pointer" }}>
                  {["Exam","Assignment","Project","Quiz","Lab","Participation","Other"].map(t=><option key={t}>{t}</option>)}
                </select>
                <input className="gc-input" value={c.weight} onChange={e=>updateRow(setSimPast,c.id,"weight",e.target.value)} placeholder="e.g. 30" type="number" style={{ ...gc.input, maxWidth:110 }} />
                <input className="gc-input" value={c.grade}  onChange={e=>updateRow(setSimPast,c.id,"grade",e.target.value)}  placeholder="e.g. 85" type="number" style={{ ...gc.input, maxWidth:110 }} />
                <button onClick={() => removeRow(setSimPast,c.id)} style={gc.removeBtn}>✕</button>
              </div>
            ))}
            <button className="gc-addbtn" onClick={() => addRow(setSimPast)} style={gc.addRowBtn}>+ Add Component</button>
          </div>

          {/* future components */}
          <div style={{ background:"#F7F5FB", border:"1px solid #D4D4DC", borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#7B5EA7", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>
              Future Component — "What if I get…"
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#A59AC9" }}>Grade %</label>
                <input
                  className="gc-input"
                  value={simFutureGrade}
                  onChange={e => setSimFutureGrade(e.target.value)}
                  placeholder="e.g. 90"
                  type="number"
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
                <button className="gc-calcbtn" onClick={calcSim} style={{ ...gc.calcBtn, alignSelf:"flex-end" }}>Simulate</button>
              </div>
            </div>
          </div>

          {/* simulation result */}
          {simResult && simResult.type === "ok" && (
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
                <div style={{ display:"flex", flexDirection:"column", gap:8, flex:"1 1 200px", justifyContent:"center" }}>
                  <div style={{ fontSize:13, color:"#5A3B7B" }}>
                    <span style={{ fontWeight:600, color:"#31487A" }}>{simResult.totalWeight}%</span> of your grade will be counted
                  </div>
                  {simResult.remaining > 0 && (
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
                    width:`${simResult.projected}%`,
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
          {simResult && simResult.type !== "ok" && (
            <InfoBox color="#c0392b" bg="#fef0f0" border="#c0392b">{simResult.msg}</InfoBox>
          )}
        </div>
      )}
    </div>
  );
}


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
