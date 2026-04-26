import { useState, useRef } from "react";
import { Plus } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

const token = () => localStorage.getItem("kk_token");

const LETTER_GRADES = ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];
const AUB_SEMESTERS = [
  "Spring 25-26","Summer 25-26","Fall 25-26",
  "Spring 24-25","Summer 24-25","Fall 24-25",
  "Spring 23-24","Summer 23-24","Fall 23-24",
  "Spring 22-23","Summer 22-23","Fall 22-23",
];

export default function TranscriptModal({ onClose, onApply }) {
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [doneStats, setDoneStats] = useState({ semesters: 0, courses: 0 });
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setError(null); }
  };

  const upload = async () => {
    if (!file) { setError("Please select a file."); return; }
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/api/transcript/extract`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed.");
      setSemesters((data || []).map((sem, si) => ({
        id: si,
        name: sem.semesterName || "",
        include: true,
        courses: (sem.courses || []).map((c, ci) => ({
          id: ci,
          code: c.courseCode || "",
          credits: String(c.credits || ""),
          grade: c.grade || "",
        })),
      })));
      setStep("confirm");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setApplying(true); setApplyError(null);
    let semCount = 0;
    let courseCount = 0;
    const savedIds = [];
    const semesterSnapshots = [];
    try {
      const toSave = semesters.filter(s => s.include && s.name.trim());
      for (const sem of toSave) {
        const courses = sem.courses.filter(c => c.code.trim() && c.credits && c.grade);
        const res = await fetch(`${API}/api/grades/saved`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({
            semesterName: sem.name.trim(),
            courses: courses.map(c => ({
              courseCode: c.code,
              grade: c.grade,
              credits: parseInt(c.credits) || 0,
            })),
          }),
        });
        if (res.ok) {
          const created = await res.json();
          if (created?.id) savedIds.push(String(created.id));
          semCount++;
          courseCount += courses.length;
          semesterSnapshots.push({ name: sem.name.trim(), courses });
        }
      }

      // Store IDs for removal later
      const allIds = (() => {
        try { return [...JSON.parse(localStorage.getItem("kk_transcript_sem_ids") || "[]"), ...savedIds]; }
        catch { return savedIds; }
      })();
      localStorage.setItem("kk_transcript_sem_ids", JSON.stringify(allIds));

      // Store transcript info for Profile display
      const uploadedAt = new Date().toISOString();
      localStorage.setItem("kk_transcript_info", JSON.stringify({ uploadedAt, semesterCount: semCount, courseCount }));

      // Persist to backend
      try {
        const token = localStorage.getItem("kk_token");
        await fetch(`${API}/api/transcript-info`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ uploadedAt: uploadedAt.replace("Z", "").slice(0, 19), semesterCount: semCount, courseCount, semIds: JSON.stringify(allIds) }),
        });
      } catch {}

      // Store most recent semester for GradeCalculator autofill
      if (semesterSnapshots.length > 0) {
        const latest = semesterSnapshots[semesterSnapshots.length - 1];
        try {
          localStorage.setItem("kk_transcript_autofill", JSON.stringify({
            semesterName: latest.name,
            courses: latest.courses.map(c => ({
              courseCode: c.code,
              grade: c.grade,
              credits: parseInt(c.credits) || 0,
            })),
          }));
        } catch {}
      }

      setDoneStats({ semesters: semCount, courses: courseCount });
      setStep("done");
      if (onApply) onApply({ semesterCount: semCount, courseCount });
    } catch (e) {
      setApplyError("Some semesters may not have saved: " + e.message);
    } finally {
      setApplying(false);
    }
  };

  const updateSem    = (id, field, val) => setSemesters(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeSem    = (id) => setSemesters(p => p.filter(s => s.id !== id));
  const addCourse    = (semId) => setSemesters(p => p.map(s => s.id === semId ? { ...s, courses: [...s.courses, { id: Date.now(), code: "", credits: "", grade: "" }] } : s));
  const updateCourse = (semId, cId, field, val) => setSemesters(p => p.map(s => s.id === semId ? { ...s, courses: s.courses.map(c => c.id === cId ? { ...c, [field]: val } : c) } : s));
  const removeCourse = (semId, cId) => setSemesters(p => p.map(s => s.id === semId ? { ...s, courses: s.courses.filter(c => c.id !== cId) } : s));

  const overlay = { position:"fixed", inset:0, background:"rgba(30,20,60,0.45)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" };
  const box    = { background:"var(--surface)", borderRadius:16, padding:"28px 32px", width:"min(680px, 95vw)", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(49,72,122,0.18)", fontFamily:"'DM Sans', sans-serif" };
  const inp    = { width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none", background:"var(--surface2)", color:"var(--text)" };
  const btn    = { padding:"10px 20px", borderRadius:10, border:"none", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" };

  const includedCount = semesters.filter(s => s.include).length;

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:20, color:"var(--primary)" }}>Upload Transcript</div>
            <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>AI extracts your semester history and fills in Grade History</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"var(--text3)", cursor:"pointer" }}>✕</button>
        </div>

        {step === "upload" && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${dragging ? "var(--primary)" : "var(--border)"}`, borderRadius:12, padding:"32px 20px", textAlign:"center", background: dragging ? "var(--surface3, var(--surface2))" : "var(--surface2)", marginBottom:16, cursor:"pointer", transition:"border-color .15s, background .15s" }}>
              <div style={{ fontSize:13, color:"var(--text2)", marginBottom:8 }}>
                {file ? file.name : "Drag & drop your transcript PDF here, or click to browse"}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.txt"
                onChange={e => { setFile(e.target.files[0] || null); setError(null); }}
                style={{ display:"none" }} />
            </div>
            {error && <div style={{ fontSize:12, color:"var(--error)", marginBottom:10 }}>{error}</div>}
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={onClose} style={{ ...btn, background:"var(--bg)", color:"var(--text2)" }}>Cancel</button>
              <button onClick={upload} disabled={loading || !file} style={{ ...btn, background:"var(--primary)", color:"var(--surface)", opacity: file ? 1 : 0.5 }}>
                {loading ? "Extracting…" : "Extract with AI"}
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div style={{ fontSize:13, color:"var(--text2)", marginBottom:16 }}>
              Review the extracted semesters. Uncheck any you don't want to save.
            </div>

            {semesters.map(sem => (
              <div key={sem.id} style={{ border:"1px solid var(--border)", borderRadius:12, marginBottom:12, overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--surface2)", padding:"10px 14px" }}>
                  <input type="checkbox" checked={sem.include} onChange={e => updateSem(sem.id, "include", e.target.checked)} />
                  <select
                    value={sem.name}
                    onChange={e => updateSem(sem.id, "name", e.target.value)}
                    style={{ ...inp, flex:1, marginBottom:0, cursor:"pointer" }}
                  >
                    <option value="">Select semester…</option>
                    {AUB_SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    {sem.name && !AUB_SEMESTERS.includes(sem.name) && (
                      <option value={sem.name}>{sem.name}</option>
                    )}
                  </select>
                  <span style={{ fontSize:11, color:"var(--text3)" }}>{sem.courses.length} course{sem.courses.length !== 1 ? "s" : ""}</span>
                  <button onClick={() => removeSem(sem.id)} style={{ background:"none", border:"none", color:"var(--error)", cursor:"pointer", fontSize:16, padding:4, lineHeight:1 }}>✕</button>
                </div>

                {sem.include && (
                  <div style={{ padding:"10px 14px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 70px 90px 28px", gap:6, marginBottom:6 }}>
                      {["Course","Credits","Grade",""].map(h => (
                        <span key={h} style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>{h}</span>
                      ))}
                    </div>
                    {sem.courses.map(c => (
                      <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr 70px 90px 28px", gap:6, marginBottom:6 }}>
                        <input style={{ ...inp, marginBottom:0 }} value={c.code} onChange={e => updateCourse(sem.id, c.id, "code", e.target.value)} placeholder="e.g. CMPS 200" />
                        <input style={{ ...inp, marginBottom:0 }} value={c.credits} onChange={e => updateCourse(sem.id, c.id, "credits", e.target.value)} placeholder="3" type="number" />
                        <select style={{ ...inp, marginBottom:0, cursor:"pointer" }} value={c.grade} onChange={e => updateCourse(sem.id, c.id, "grade", e.target.value)}>
                          <option value="">—</option>
                          {LETTER_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <button onClick={() => removeCourse(sem.id, c.id)} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:14, padding:0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => addCourse(sem.id)} style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600 }}><><Plus size={13} /> Add Course</></button>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => setSemesters(p => [...p, { id: Date.now(), name: "", include: true, courses: [{ id: 1, code: "", credits: "", grade: "" }] }])}
              style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", marginBottom:16, fontWeight:600, padding:0 }}
            >
              <><Plus size={13} /> Add Semester</>
            </button>

            {applyError && <div style={{ fontSize:12, color:"var(--error)", marginBottom:10 }}>{applyError}</div>}

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setStep("upload")} style={{ ...btn, background:"var(--bg)", color:"var(--text2)" }}>Back</button>
              <button
                onClick={apply}
                disabled={applying || includedCount === 0}
                style={{ ...btn, background:"var(--primary)", color:"var(--surface)", opacity: applying || includedCount === 0 ? 0.5 : 1 }}
              >
                {applying ? "Saving…" : `Save ${includedCount} Semester${includedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign:"center", padding:"12px 0 4px" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>✓</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:18, color:"var(--primary)", marginBottom:16 }}>
              Transcript imported!
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24, textAlign:"left" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--success-bg)", borderRadius:10, padding:"10px 14px", border:"1px solid var(--success)" }}>
                <span style={{ fontSize:13, color:"var(--success)", fontWeight:600 }}>
                  {doneStats.semesters} semester{doneStats.semesters !== 1 ? "s" : ""} · {doneStats.courses} course{doneStats.courses !== 1 ? "s" : ""} saved to Grade History
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--surface3)", borderRadius:10, padding:"10px 14px", border:"1px solid var(--border)" }}>
                <span style={{ fontSize:13, color:"var(--accent2)", fontWeight:600 }}>
                  Most recent semester pre-loaded in Semester GPA calculator
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ ...btn, background:"var(--primary)", color:"var(--surface)" }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
