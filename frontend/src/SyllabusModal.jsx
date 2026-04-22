import { useState, useRef } from "react";

const API = "http://localhost:8080";
const token = () => localStorage.getItem("kk_token");
const userId = () => {
  const t = token();
  try { return t ? JSON.parse(atob(t.split(".")[1])).sub : null; } catch { return null; }
};

function inferDeadlineType(name) {
  const n = (name || "").toLowerCase();
  if (/final/.test(n)) return "Final Exam";
  if (/midterm/.test(n)) return "Midterm Exam";
  if (/exam/.test(n)) return "Final Exam";
  if (/quiz/.test(n)) return "Quiz";
  if (/project/.test(n)) return "Project";
  if (/lab/.test(n)) return "Lab";
  if (/presentation/.test(n)) return "Presentation";
  if (/reading/.test(n)) return "Reading";
  return "Assignment";
}

export default function SyllabusModal({ courseName, onClose, onApply, existingData }) {
  const [step, setStep] = useState(existingData ? "confirm" : "upload");
  const [doneStats, setDoneStats] = useState({ tasks: 0, hasCalc: false, hasOfficeHours: false });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [openTypeIdx, setOpenTypeIdx] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setError(null); }
  };

  // Editable extracted data — pre-populated when viewing existing syllabus
  const [info, setInfo] = useState({
    courseCode: existingData?.courseCode || courseName || "",
    professor: existingData?.professor || "",
    finalExamWeight: existingData?.finalExamWeight != null ? String(existingData.finalExamWeight) : "",
  });
  const [assessments, setAssessments] = useState(
    (existingData?.assessments || []).map((a, i) => ({ id: i, name: a.name || "", weight: String(a.weight ?? "") }))
  );
  const [deadlines, setDeadlines] = useState(() => {
    if (!existingData?.assessments?.length) return [];
    return existingData.assessments.map((a, i) => ({
      id: i, title: a.name || "", date: "", type: inferDeadlineType(a.name || ""), include: false,
    }));
  });
  const [officeHours, setOfficeHours] = useState(existingData?.officeHours || []);

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
        professor: data.professor || "",
        finalExamWeight: data.finalExamWeight != null ? String(data.finalExamWeight) : "",
      });
      const extractedAssessments = (data.assessments || []).map((a, i) => ({ id: i, name: a.name || "", weight: String(a.weight ?? "") }));
      setAssessments(extractedAssessments);

      // Build deadline rows from extracted deadlines; fall back to seeding from assessments
      const extractedDeadlines = (data.deadlines || []).map((d, i) => ({
        id: i, title: d.title || "", date: d.date || "",
        type: inferDeadlineType(d.title || "") || d.type || "Assignment",
        include: !!d.date,
      }));
      if (extractedDeadlines.length > 0) {
        setDeadlines(extractedDeadlines);
      } else {
        // No deadlines found — seed from assessments so the user can fill in dates
        setDeadlines(extractedAssessments.map((a, i) => ({
          id: i, title: a.name, date: "", type: inferDeadlineType(a.name), include: false,
        })));
      }
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
    let taskCount = 0;
    try {
      // Create tasks from deadlines
      if (applyTasks) {
        const uid = userId();
        if (!uid) throw new Error("Not logged in.");
        for (const d of deadlines.filter(d => d.include && d.date && d.title)) {
          // Parse to "yyyy-MM-dd'T'HH:mm" — skip if unparseable
          let iso;
          try {
            // If already YYYY-MM-DD (from date picker or AI), use directly
            const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(d.date.trim())
              ? d.date.trim()
              : (() => {
                  const parsed = new Date(d.date);
                  if (isNaN(parsed)) return null;
                  const pad = n => String(n).padStart(2, "0");
                  return `${parsed.getFullYear()}-${pad(parsed.getMonth()+1)}-${pad(parsed.getDate())}`;
                })();
            if (!isoDate) continue;
            iso = new Date(`${isoDate}T23:59`).toISOString().slice(0, 19);
          } catch { continue; }
          const res = await fetch(`${API}/api/tasks/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
            body: JSON.stringify({
              course: courseName || info.courseCode,
              title: d.title,
              type: d.type || "Assignment",
              deadline: iso,
              completed: false,
              notes: "",
              allowPastDeadline: true,
              fromSyllabus: true,
            }),
          });
          if (res.ok) {
            const created = await res.json();
            if (created?.id) {
              taskCount++;
              try {
                const raw = JSON.parse(localStorage.getItem("kk_syllabus_task_ids") || "{}");
                const map = Array.isArray(raw) ? {} : raw;
                const key = courseName || info.courseCode || "__unknown";
                map[key] = [...(map[key] || []), String(created.id)];
                localStorage.setItem("kk_syllabus_task_ids", JSON.stringify(map));
              } catch {}
            }
          }
        }
      }

      // Pass data to parent for calculator auto-fill + office hours
      onApply({
        officeHours,
        professor: info.professor || null,
        courseCode: info.courseCode || courseName,
        finalExamWeight: info.finalExamWeight,
        assessments,
        applyCalc,
      });
      setDoneStats({ tasks: taskCount, hasCalc: applyCalc && assessments.length > 0, hasOfficeHours: officeHours.length > 0 });
      setStep("done");
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
    background: "var(--surface)", borderRadius: 16, padding: "28px 32px",
    width: "min(620px, 95vw)", maxHeight: "85vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(49,72,122,0.18)",
    fontFamily: "'DM Sans', sans-serif",
  };
  const label = { fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 4, display: "block" };
  const input = { width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "var(--surface2)", color: "var(--text)" };
const btn = { padding: "10px 20px", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" };
  const btnPrimary = { ...btn, background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)", border: "1.5px solid color-mix(in srgb, var(--primary) 30%, transparent)" };
  const btnSecondary = { ...btn, background: "var(--surface)", color: "var(--text2)", border: "1.5px solid var(--border)" };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{`.sm-btn-p:hover{background:color-mix(in srgb,var(--primary) 25%,transparent)!important}.sm-btn-s:hover{background:var(--surface2)!important;border-color:var(--accent2)!important}`}</style>
      <div style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 20, color: "var(--primary)" }}>
              {existingData ? "Syllabus" : "Upload Syllabus"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{courseName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "var(--text3)", cursor: "pointer" }}>✕</button>
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
                {file ? file.name : "Drag & drop your syllabus PDF here, or click to browse"}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.txt"
                onChange={e => { setFile(e.target.files[0] || null); setError(null); }}
                style={{ display:"none" }} />
            </div>
            {error && <div style={{ fontSize: 12, color: "var(--error)", marginBottom: 10 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="sm-btn-s" onClick={onClose} style={btnSecondary}>Cancel</button>
              <button className="sm-btn-p" onClick={upload} disabled={loading || !file} style={{ ...btnPrimary, opacity: file ? 1 : 0.5 }}>
                {loading ? "Extracting…" : "Extract with AI"}
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div style={{ fontSize: 12, color: "var(--text2)", background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", marginBottom: 18 }}>
              {existingData ? "Editing saved syllabus info. Upload the PDF again to re-extract dates." : "Extracted automatically from syllabus — review and edit before applying."}
            </div>

            {/* Course Info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 12 }}>Course Info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["Course Code", "courseCode"], ["Professor", "professor"], ["Final Exam Weight (%)", "finalExamWeight"]].map(([lbl, key]) => (
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
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 12 }}>Assessments</div>
                {assessments.map((a, i) => (
                  <div key={a.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                    <input style={{ ...input, flex: 2 }} value={a.name} onChange={e => setAssessments(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Name" />
                    <input style={{ ...input, flex: 1, maxWidth: 80 }} value={a.weight} onChange={e => setAssessments(p => p.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))} placeholder="%" type="number" />
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>%</span>
                    <button onClick={() => setAssessments(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setAssessments(p => [...p, { id: Date.now(), name: "", weight: "" }])} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>+ Add assessment</button>
              </div>
            )}

            {/* Deadlines → Tasks */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)" }}>Tasks</div>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={applyTasks} onChange={e => setApplyTasks(e.target.checked)} />
                  Auto-create in Task Manager
                </label>
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                {deadlines.length > 0 ? "Check items and set a date to create them as tasks. Items without a date are skipped." : "No deadlines extracted — add tasks manually below."}
              </div>
              {deadlines.map((d, i) => (
                <div key={d.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center", opacity: d.include ? 1 : 0.5 }}>
                  <input
                    type="checkbox"
                    checked={d.include}
                    onChange={e => { setDeadlines(p => p.map((x, j) => j === i ? { ...x, include: e.target.checked } : x)); if (!e.target.checked && openTypeIdx === i) setOpenTypeIdx(null); }}
                  />
                  <input style={{ ...input, flex: 2 }} value={d.title} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Title" />
                  <input
                    type="date"
                    style={{ ...input, flex: 1, minWidth: 130, cursor: "pointer" }}
                    value={d.date}
                    onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, date: e.target.value, include: !!e.target.value } : x))}
                  />
                  <div style={{ position:"relative", flex:1, maxWidth:130 }}>
                    <button type="button" disabled={!d.include} onClick={() => setOpenTypeIdx(openTypeIdx === i ? null : i)} style={{ ...input, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, cursor: d.include ? "pointer" : "default", opacity: d.include ? 1 : 0.5 }}>
                      <span style={{ fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.type}</span>
                      <span style={{ fontSize:8, opacity:0.6, flexShrink:0, display:"inline-block", transform: openTypeIdx===i ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                    </button>
                    {openTypeIdx === i && (
                      <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, boxShadow:"0 8px 32px rgba(49,72,122,0.18)", zIndex:400, padding:4, maxHeight:200, overflowY:"auto" }}>
                        {["Assignment","Project","Quiz","Midterm Exam","Final Exam","Lab","Reading","Presentation","Other"].map(t => (
                          <div key={t} className="kk-option" onClick={() => { setDeadlines(p => p.map((x,j) => j===i ? {...x,type:t} : x)); setOpenTypeIdx(null); }}
                            style={{ padding:"7px 12px", borderRadius:7, cursor:"pointer", fontSize:12, fontWeight: d.type===t ? 600 : 400, color: d.type===t ? "var(--accent)" : "var(--primary)", background: d.type===t ? "var(--divider)" : "transparent", transition:"background .15s" }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setDeadlines(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setDeadlines(p => [...p, { id: Date.now(), title: "", date: "", type: "Assignment", include: false }])} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>+ Add task</button>
            </div>

            {/* Office Hours */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 10 }}>Office Hours</div>
              {officeHours.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>No office hours extracted — add them manually.</div>
              )}
              {officeHours.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <input
                    style={{ ...input, flex: 1 }}
                    value={o.day || ""}
                    onChange={e => setOfficeHours(p => p.map((x, j) => j === i ? { ...x, day: e.target.value } : x))}
                    placeholder="Day (e.g. Mon)"
                  />
                  <input
                    style={{ ...input, flex: 1 }}
                    value={o.time || ""}
                    onChange={e => setOfficeHours(p => p.map((x, j) => j === i ? { ...x, time: e.target.value } : x))}
                    placeholder="Time (e.g. 2–4pm)"
                  />
                  <input
                    style={{ ...input, flex: 2 }}
                    value={o.location || ""}
                    onChange={e => setOfficeHours(p => p.map((x, j) => j === i ? { ...x, location: e.target.value } : x))}
                    placeholder="Location (optional)"
                  />
                  <button onClick={() => setOfficeHours(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setOfficeHours(p => [...p, { day: "", time: "", location: "" }])} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>+ Add office hours</button>
            </div>

            {/* Apply to Calculator checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--accent2)", marginBottom: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={applyCalc} onChange={e => setApplyCalc(e.target.checked)} />
              Auto-fill KourseKit tools with extracted data
            </label>

            {applyError && <div style={{ fontSize: 12, color: "var(--error)", marginBottom: 10 }}>{applyError}</div>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="sm-btn-s" onClick={() => setStep("upload")} style={btnSecondary}>Back</button>
              <button className="sm-btn-p" onClick={apply} disabled={applying} style={btnPrimary}>
                {applying ? "Applying…" : "Apply"}
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 16 }}>
              Syllabus applied!
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, textAlign: "left" }}>
              {doneStats.tasks > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--success-bg)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--success)" }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>{doneStats.tasks} task{doneStats.tasks !== 1 ? "s" : ""} added to Task Manager</span>
                </div>
              )}
              {doneStats.hasCalc && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface3)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 16 }}>🧮</span>
                  <span style={{ fontSize: 13, color: "var(--accent2)", fontWeight: 600 }}>Grade Calculator pre-filled — select this course in the calculator</span>
                </div>
              )}
              {doneStats.hasOfficeHours && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--blue-light-bg)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--blue-border)" }}>
                  <span style={{ fontSize: 16 }}>🕐</span>
                  <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>Office hours saved to the course card</span>
                </div>
              )}
              {doneStats.tasks === 0 && !doneStats.hasCalc && !doneStats.hasOfficeHours && (
                <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center" }}>Nothing was applied — no items were checked.</div>
              )}
            </div>
            <button className="sm-btn-p" onClick={onClose} style={btnPrimary}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
