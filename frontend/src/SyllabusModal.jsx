import { useState, useRef } from "react";

const API = "http://localhost:8080";
const token = () => localStorage.getItem("kk_token");
const userId = () => localStorage.getItem("kk_email");

export default function SyllabusModal({ courseName, onClose, onApply }) {
  const [step, setStep] = useState("upload"); // upload | confirm
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  // Editable extracted data
  const [info, setInfo] = useState({
    courseCode: "", credits: "", professor: "", finalExamWeight: "",
  });
  const [assessments, setAssessments] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [officeHours, setOfficeHours] = useState([]);

  // Which sections to apply
  const [applyTasks,  setApplyTasks]  = useState(true);
  const [applyCalc,   setApplyCalc]   = useState(true);

  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);

  const upload = async () => {
    if (!file) { setError("Please select a file."); return; }
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/api/syllabus/extract`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed.");
      setInfo({
        courseCode: data.courseCode || courseName || "",
        credits: data.credits != null ? String(data.credits) : "",
        professor: data.professor || "",
        finalExamWeight: data.finalExamWeight != null ? String(data.finalExamWeight) : "",
      });
      setAssessments((data.assessments || []).map((a, i) => ({ id: i, name: a.name || "", weight: String(a.weight ?? "") })));
      setDeadlines((data.deadlines || []).map((d, i) => ({ id: i, title: d.title || "", date: d.date || "", type: d.type || "Assignment", include: true })));
      setOfficeHours(data.officeHours || []);
      setStep("confirm");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setApplying(true); setApplyError(null);
    try {
      // Create tasks from deadlines
      if (applyTasks) {
        const uid = userId();
        for (const d of deadlines.filter(d => d.include && d.date)) {
          let iso = d.date;
          // try to parse date string into ISO datetime
          try {
            const parsed = new Date(d.date);
            if (!isNaN(parsed)) iso = parsed.toISOString().slice(0, 16).replace("T", "T");
            else iso = new Date().toISOString().slice(0, 16);
          } catch { iso = new Date().toISOString().slice(0, 16); }
          await fetch(`${API}/api/tasks/${uid}/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
            body: JSON.stringify({
              course: info.courseCode || courseName,
              title: d.title,
              type: d.type || "Assignment",
              priority: "MEDIUM",
              deadline: iso,
              notes: "",
            }),
          });
        }
      }

      // Pass data to parent for calculator auto-fill
      if (applyCalc) {
        onApply({
          courseCode: info.courseCode || courseName,
          credits: info.credits,
          finalExamWeight: info.finalExamWeight,
          assessments,
        });
      } else {
        onApply(null);
      }
    } catch (e) {
      setApplyError("Some items may not have saved: " + e.message);
    } finally {
      setApplying(false);
    }
  };

  const overlay = {
    position: "fixed", inset: 0, background: "rgba(30,20,60,0.45)",
    zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
  };
  const box = {
    background: "#fff", borderRadius: 16, padding: "28px 32px",
    width: "min(620px, 95vw)", maxHeight: "85vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(49,72,122,0.18)",
    fontFamily: "'DM Sans', sans-serif",
  };
  const label = { fontSize: 12, fontWeight: 600, color: "#7B5EA7", marginBottom: 4, display: "block" };
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #D4D4DC", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" };
  const btn = { padding: "10px 20px", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 20, color: "#31487A" }}>
              Upload Syllabus
            </div>
            <div style={{ fontSize: 12, color: "#A59AC9", marginTop: 2 }}>{courseName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#B8A9C9", cursor: "pointer" }}>✕</button>
        </div>

        {step === "upload" && (
          <>
            <div style={{ border: "2px dashed #D4D4DC", borderRadius: 12, padding: "32px 20px", textAlign: "center", background: "#F7F5FB", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#A59AC9", marginBottom: 12 }}>Upload your course syllabus (PDF or .txt)</div>
              <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={e => { setFile(e.target.files[0] || null); setError(null); }}
                style={{ fontSize: 13, color: "#5A3B7B" }} />
            </div>
            {error && <div style={{ fontSize: 12, color: "#c0392b", marginBottom: 10 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{ ...btn, background: "#F4F4F8", color: "#A59AC9" }}>Cancel</button>
              <button onClick={upload} disabled={loading || !file} style={{ ...btn, background: "#31487A", color: "#fff", opacity: file ? 1 : 0.5 }}>
                {loading ? "Extracting…" : "Extract with AI"}
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            {/* Course Info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#31487A", marginBottom: 12 }}>Course Info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["Course Code", "courseCode"], ["Credits", "credits"], ["Professor", "professor"], ["Final Exam Weight (%)", "finalExamWeight"]].map(([lbl, key]) => (
                  <div key={key}>
                    <span style={label}>{lbl}</span>
                    <input style={input} value={info[key]} onChange={e => setInfo(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Assessments */}
            {assessments.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#31487A", marginBottom: 12 }}>Assessments</div>
                {assessments.map((a, i) => (
                  <div key={a.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                    <input style={{ ...input, flex: 2 }} value={a.name} onChange={e => setAssessments(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Name" />
                    <input style={{ ...input, flex: 1, maxWidth: 80 }} value={a.weight} onChange={e => setAssessments(p => p.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))} placeholder="%" type="number" />
                    <span style={{ fontSize: 12, color: "#A59AC9" }}>%</span>
                    <button onClick={() => setAssessments(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setAssessments(p => [...p, { id: Date.now(), name: "", weight: "" }])} style={{ fontSize: 12, color: "#7B5EA7", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>+ Add assessment</button>
              </div>
            )}

            {/* Deadlines */}
            {deadlines.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#31487A" }}>Deadlines → Tasks</div>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#A59AC9", cursor: "pointer" }}>
                    <input type="checkbox" checked={applyTasks} onChange={e => setApplyTasks(e.target.checked)} />
                    Auto-create tasks
                  </label>
                </div>
                {deadlines.map((d, i) => (
                  <div key={d.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center", opacity: d.include ? 1 : 0.4 }}>
                    <input type="checkbox" checked={d.include} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, include: e.target.checked } : x))} />
                    <input style={{ ...input, flex: 2 }} value={d.title} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Title" />
                    <input style={{ ...input, flex: 1 }} value={d.date} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} placeholder="Date" />
                    <select style={{ ...input, flex: 1, maxWidth: 110, cursor: "pointer" }} value={d.type} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}>
                      {["Assignment","Exam","Quiz","Project","Lab","Presentation","Other"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Office Hours */}
            {officeHours.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#31487A", marginBottom: 8 }}>Office Hours</div>
                {officeHours.map((o, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#5A3B7B", marginBottom: 4 }}>
                    {o.day} {o.time} {o.location && `— ${o.location}`}
                  </div>
                ))}
              </div>
            )}

            {/* Apply to Calculator checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5A3B7B", marginBottom: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={applyCalc} onChange={e => setApplyCalc(e.target.checked)} />
              Auto-fill Grade Calculator (assessments, credits, final exam weight)
            </label>

            {applyError && <div style={{ fontSize: 12, color: "#c0392b", marginBottom: 10 }}>{applyError}</div>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setStep("upload")} style={{ ...btn, background: "#F4F4F8", color: "#A59AC9" }}>Back</button>
              <button onClick={apply} disabled={applying} style={{ ...btn, background: "#31487A", color: "#fff" }}>
                {applying ? "Applying…" : "Apply"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
