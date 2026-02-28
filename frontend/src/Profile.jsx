import { useState, useEffect } from "react";
import { Banana, Cat, Dog, Eclipse, Telescope, Panda, Turtle } from "lucide-react";

const AVATAR_ICONS = [
  { id:"Banana", icon: Banana },
  { id:"Telescope", icon: Telescope  },
  { id:"Eclipse", icon: Eclipse    },
  { id:"Cat", icon: Cat   },
  { id:"Dog", icon: Dog    },
  { id:"Panda", icon: Panda  },
  { id:"Turtle", icon: Turtle   },
];
const passrequirements = [
  { label: "At least 8 characters",     test: p => p.length >= 8 },
  { label: "One uppercase letter (A-Z)", test: p => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)", test: p => /[a-z]/.test(p) },
  { label: "One number (0-9)",           test: p => /\d/.test(p) },
  { label: "One special character",      test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(p) },
];

const FACULTIES = [
  "Arts & Sciences",
  "Engineering & Architecture",
  "Business",
  "Health Sciences",
  "Medicine",
  "Nursing",
  "Education",
];

const MAJORS_BY_FACULTY = {
  "Arts & Sciences":            ["Computer Science","Mathematics","Physics","Chemistry","Biology","Psychology","Philosophy","Political Science","Economics","English","Arabic","Sociology","Statistics","Geology"],
  "Engineering & Architecture": ["Computer & Communications Engineering","Electrical & Computer Engineering","Civil Engineering","Mechanical Engineering","Chemical Engineering","Architecture","Landscape Architecture"],
  "Business":                   ["Business Administration","Accounting","Finance","Marketing","Management","Entrepreneurship"],
  "Health Sciences":            ["Nutrition","Environmental Health","Health Management"],
  "Medicine":                   ["Medicine (MD)"],
  "Nursing":                    ["Nursing"],
  "Education":                  ["Education","Early Childhood Education"],
};

const STUDENT_STATUSES = [
  { id:"freshman",  label:"Freshman",  desc:"1st year" },
  { id:"sophomore", label:"Sophomore", desc:"2nd year" },
  { id:"junior",    label:"Junior",    desc:"3rd year" },
  { id:"senior",    label:"Senior",    desc:"4th year" },
  { id:"E1",        label:"E1",        desc:"Eng. year 1" },
  { id:"E2",        label:"E2",        desc:"Eng. year 2" },
  { id:"E3",        label:"E3",        desc:"Eng. year 3" },
  { id:"E4",        label:"E4",        desc:"Eng. year 4" },
  { id:"E5",        label:"E5",        desc:"Eng. year 5" },
];

const DEFAULT_PROFILE = {
  firstName:    "",
  lastName:     "",
  email:        "",
  faculty:      "Arts & Sciences",
  major:        "Computer Science",
  status:       "freshman",
  cumGPA:       "",
  totalCredits: "",
  bio:          "",
  avatar:       null,
};

function loadProfile(email) {
  try {
    const saved = localStorage.getItem("kk_profile");
    if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved), email };
  } catch {}
  return { ...DEFAULT_PROFILE, email };
}

function saveProfile(profile) {
  localStorage.setItem("kk_profile", JSON.stringify(profile));
}

const gpaColor = g => {
  const v = parseFloat(g);
  if (isNaN(v)) return "#B8A9C9";
  if (v >= 3.7) return "#2d7a4a";
  if (v >= 3.0) return "#31487A";
  if (v >= 2.0) return "#b7680a";
  return "#c0392b";
};

const statusObj = id => STUDENT_STATUSES.find(s => s.id === id) || STUDENT_STATUSES[0];

const API = "http://localhost:8080";
const semAuthHeaders = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("kk_token")}` });
const LETTER_GRADES = ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];
const fmtDateShort = iso => { try { return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); } catch { return ""; } };

export default function Profile({ onProfileSave, onLogout, onLoadSemester }) {
  const email = localStorage.getItem("kk_email") || "student@mail.aub.edu";
  const [profile,    setProfile]    = useState(() => loadProfile(email));
  const [editing,    setEditing]    = useState(false);
  const [draft,      setDraft]      = useState(profile);
  const [saved,      setSaved]      = useState(false);
  const [profilepic, setProfilepic] = useState(false);

  const [changing,    setchanging]    = useState(false);
  const [current,     setcurrent]     = useState("");
  const [newpass,     setnewpass]     = useState("");
  const [confirm,     setconfirm]     = useState("");
  const [passerror,   setpasserror]   = useState("");
  const [passsuccess, setpasssuccess] = useState(false);
  const [passloading, setpassloading] = useState(false);
  const [newpass2,    setnewpass2]    = useState(false);
  const [showCurrent, setshowCurrent] = useState(false);
  const [showNew,     setshowNew]     = useState(false);

  // My Semesters
  const [semesters,    setSemesters]    = useState([]);
  const [creating,     setCreating]     = useState(false);
  const [newSemName,   setNewSemName]   = useState("");
  const [newSemCourses, setNewSemCourses] = useState([{ id:1, code:"", credits:"", grade:"A" }]);
  const [editingId,    setEditingId]    = useState(null);
  const [editName,     setEditName]     = useState("");
  const [editCourses,  setEditCourses]  = useState([]);
  const [semSaveLoad,  setSemSaveLoad]  = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/grades/saved`, { headers: semAuthHeaders() })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setSemesters(data))
      .catch(() => {});
  }, []);

  const refetchSemesters = () =>
    fetch(`${API}/api/grades/saved`, { headers: semAuthHeaders() })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setSemesters(data))
      .catch(() => {});

  const createSemester = async () => {
    if (!newSemName.trim()) return;
    const courses = newSemCourses.filter(c => c.code.trim());
    setSemSaveLoad(true);
    try {
      await fetch(`${API}/api/grades/saved`, {
        method: "POST",
        headers: semAuthHeaders(),
        body: JSON.stringify({ semesterName: newSemName.trim(), courses: courses.map(c => ({ courseCode: c.code, grade: c.grade, credits: parseInt(c.credits) || 0 })) }),
      });
      await refetchSemesters();
      setCreating(false); setNewSemName(""); setNewSemCourses([{ id:1, code:"", credits:"", grade:"A" }]);
    } catch {}
    finally { setSemSaveLoad(false); }
  };

  const saveEdit = async () => {
    setSemSaveLoad(true);
    try {
      const courses = editCourses.filter(c => c.code.trim());
      await fetch(`${API}/api/grades/saved/${editingId}`, {
        method: "PUT",
        headers: semAuthHeaders(),
        body: JSON.stringify({ semesterName: editName.trim(), courses: courses.map(c => ({ courseCode: c.code, grade: c.grade, credits: parseInt(c.credits) || 0 })) }),
      });
      await refetchSemesters();
      setEditingId(null);
    } catch {}
    finally { setSemSaveLoad(false); }
  };

  const deleteSemester = async (id) => {
    await fetch(`${API}/api/grades/saved/${id}`, { method: "DELETE", headers: semAuthHeaders() });
    setDeleteConfirmId(null);
    await refetchSemesters();
  };

  const startEdit = (sem) => {
    setEditingId(sem.id);
    setEditName(sem.semesterName);
    setEditCourses((sem.courses || []).map((c,i) => ({ id: i+1, code: c.courseCode || "", credits: String(c.credits || ""), grade: c.grade || "A" })));
  };

  const newpassok    = passrequirements.every(r => r.test(newpass));
  const confirmmatch = confirm.length > 0 && newpass === confirm;
  const confirmwrong = confirm.length > 0 && newpass !== confirm;

  const handlechangepassword = async () => {
    if (!current || !newpass || !confirm) { setpasserror("Please fill in all fields."); return; }
    if (!newpassok)          { setpasserror("New password does not meet the requirements."); return; }
    if (newpass !== confirm) { setpasserror("Passwords don't match."); return; }
    setpassloading(true);
    try {
      const res  = await fetch("http://localhost:8080/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("kk_token")}` },
        body: JSON.stringify({ email, currentpass: current, newpass }),
      });
      const data = await res.json();
      if (data.success) {
        setpasssuccess(true);
        setchanging(false);
        setcurrent(""); setnewpass(""); setconfirm(""); setpasserror("");
        setTimeout(() => setpasssuccess(false), 3000);
      } else {
        setpasserror(data.message || "Failed to change password.");
      }
    } catch {
      setpasserror("Could not connect to server.");
    } finally {
      setpassloading(false);
    }
  };

  const set = (k, v) => setDraft(p => {
    const updated = { ...p, [k]: v };
    if (k === "faculty") updated.major = MAJORS_BY_FACULTY[v]?.[0] || "";
    return updated;
  });

  const handleSave = () => {
    saveProfile(draft);
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (onProfileSave) onProfileSave(draft);
  };

  const handleCancel = () => { setDraft(profile); setEditing(false); };

  const selectAvatar = (iconId) => {
    const updated = { ...profile, avatar: iconId };
    saveProfile(updated);
    setProfile(updated);
    setProfilepic(false);
    if (onProfileSave) onProfileSave(updated);
  };

  const displayName = profile.firstName || profile.lastName
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Student";

  const initials = profile.firstName && profile.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : (profile.firstName?.[0] || profile.email?.[0] || "S").toUpperCase();

  const st = statusObj(profile.status);

  return (
    <div style={{ padding:"28px 28px 60px", maxWidth:760 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .pf-input:focus { border-color:#8FB3E2 !important; outline:none; }
        .pf-status:hover { border-color:#7B5EA7 !important; }
      `}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"#31487A", marginBottom:4 }}>My Profile</div>
        <div style={{ fontSize:13, color:"#A59AC9" }}>Your info shows up on the dashboard greeting and affects how KourseKit personalizes your experience.</div>
      </div>

      <div style={{ background:"#ffffff", borderRadius:20, border:"1px solid #D4D4DC", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", overflow:"hidden", marginBottom:20 }}>
        <div style={{ padding:"24px 28px 24px" }}>

          <div style={{ display:"flex", alignItems:"flex-end", gap:16, marginBottom:20 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div onClick={() => setProfilepic(o => !o)} style={{
                width:72, height:72, borderRadius:20, border:"3px solid #ffffff",
                background:"linear-gradient(135deg,#8FB3E2,#7B5EA7)",
                color:"white", fontWeight:700, fontSize:26,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Fraunces',serif", boxShadow:"0 4px 12px rgba(49,72,122,0.18)",
                cursor:"pointer",
              }}>
                {profile.avatar
                  ? (() => { const a = AVATAR_ICONS.find(x => x.id === profile.avatar); return a ? <a.icon size={32} color="white" /> : initials; })()
                  : initials}
              </div>
              {profilepic && (
                <div style={{
                  position:"absolute", top:80, left:0, zIndex:100,
                  background:"#ffffff", borderRadius:14, border:"1px solid #D4D4DC",
                  boxShadow:"0 8px 32px rgba(49,72,122,0.15)", padding:10,
                  display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, width:196,
                }}>
                  <div onClick={() => selectAvatar(null)} title="Default (initials)" style={{
                    width:36, height:36, borderRadius:10, cursor:"pointer",
                    background: !profile.avatar ? "#7B5EA7" : "linear-gradient(135deg,#8FB3E2,#A59AC9)",
                    border: !profile.avatar ? "2px solid #31487A" : "2px solid transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"white", fontWeight:700, fontSize:13, fontFamily:"'Fraunces',serif",
                  }}>{initials}</div>
                  {AVATAR_ICONS.map(({ id, icon: Icon }) => (
                    <div key={id} onClick={() => selectAvatar(id)} title={id} style={{
                      width:36, height:36, borderRadius:10, cursor:"pointer",
                      background: profile.avatar === id ? "#7B5EA7" : "linear-gradient(135deg,#8FB3E2,#A59AC9)",
                      border: profile.avatar === id ? "2px solid #31487A" : "2px solid transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .15s",
                    }}>
                      <Icon size={18} color="white" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ paddingBottom:4 }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:22, color:"#31487A" }}>{displayName}</div>
              <div style={{ fontSize:12, color:"#A59AC9" }}>{profile.email}</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:10, paddingBottom:4 }}>
              {saved && (
                <div style={{ fontSize:12, fontWeight:600, color:"#2d7a4a", background:"#eef7f0", border:"1px solid #b7d9c0", borderRadius:8, padding:"6px 14px", display:"flex", alignItems:"center", gap:6 }}>
                  ✓ Saved
                </div>
              )}
              {!editing
                ? <button onClick={() => { setDraft(profile); setEditing(true); }} style={pf.editBtn}>Edit Profile</button>
                : <>
                    <button onClick={handleSave}   style={pf.saveBtn}>Save</button>
                    <button onClick={handleCancel} style={pf.cancelBtn}>Cancel</button>
                  </>
              }
            </div>
          </div>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom: editing ? 24 : 0 }}>
            <StatChip label="Status"         value={`${st.label} · ${st.desc}`} color="#7B5EA7" bg="#F0EEF7" />
            <StatChip label="Major"          value={profile.major || "—"}        color="#31487A" bg="#eef2fb" />
            <StatChip label="Cumulative GPA" value={profile.cumGPA || "—"}      color={gpaColor(profile.cumGPA)} bg="#F4F4F8" />
            {profile.totalCredits && <StatChip label="Credits" value={`${profile.totalCredits} cr`} color="#5A3B7B" bg="#F0EEF7" />}
          </div>

          {editing && (
            <div style={{ borderTop:"1px solid #F4F4F8", paddingTop:24 }}>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:160 }}>
                  <label style={pf.label}>First Name</label>
                  <input className="pf-input" value={draft.firstName} onChange={e => set("firstName", e.target.value)} placeholder="e.g. Sarah" style={pf.input} />
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <label style={pf.label}>Last Name</label>
                  <input className="pf-input" value={draft.lastName} onChange={e => set("lastName", e.target.value)} placeholder="e.g. Khalil" style={pf.input} />
                </div>
              </div>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={pf.label}>Faculty</label>
                  <select className="pf-input" value={draft.faculty} onChange={e => set("faculty", e.target.value)} style={{ ...pf.input, cursor:"pointer" }}>
                    {FACULTIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={pf.label}>Major</label>
                  <select className="pf-input" value={draft.major} onChange={e => set("major", e.target.value)} style={{ ...pf.input, cursor:"pointer" }}>
                    {(MAJORS_BY_FACULTY[draft.faculty] || []).map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <label style={pf.label}>Academic Status</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                {STUDENT_STATUSES.map(s => (
                  <button key={s.id} className="pf-status" onClick={() => set("status", s.id)} style={{
                    padding:"8px 14px", borderRadius:10, border:"1px solid",
                    cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                    borderColor: draft.status === s.id ? "#7B5EA7" : "#D4D4DC",
                    background:  draft.status === s.id ? "#7B5EA7" : "#F7F5FB",
                    color:       draft.status === s.id ? "#ffffff" : "#5A3B7B",
                    fontWeight:  draft.status === s.id ? 600 : 400,
                  }}>
                    <div style={{ fontSize:13 }}>{s.label}</div>
                    <div style={{ fontSize:10, opacity:.75 }}>{s.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={pf.label}>Cumulative GPA <span style={{ color:"#B8A9C9", fontWeight:400 }}>(optional)</span></label>
                  <input className="pf-input" value={draft.cumGPA} onChange={e => set("cumGPA", e.target.value)}
                    placeholder="e.g. 3.45" type="number" step="0.01" min="0" max="4"
                    style={pf.input} />
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={pf.label}>Total Credits <span style={{ color:"#B8A9C9", fontWeight:400 }}>(optional)</span></label>
                  <input className="pf-input" value={draft.totalCredits} onChange={e => set("totalCredits", e.target.value)}
                    placeholder="e.g. 60" type="number"
                    style={pf.input} />
                </div>
              </div>

              <label style={pf.label}>Bio <span style={{ color:"#B8A9C9", fontWeight:400 }}>(optional)</span></label>
              <textarea className="pf-input" value={draft.bio} onChange={e => set("bio", e.target.value)}
                placeholder="A short description about yourself..."
                rows={3}
                style={{ ...pf.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
              />

              <div style={{ fontSize:11, color:"#B8A9C9", marginTop:-8, marginBottom:16 }}>
                GPA and credits here are self-reported — once backend is connected, this will sync with your actual academic record.
              </div>
            </div>
          )}

          {!editing && profile.bio && (
            <div style={{ marginTop:16, fontSize:13, color:"#5A3B7B", lineHeight:1.7, borderTop:"1px solid #F4F4F8", paddingTop:16 }}>
              {profile.bio}
            </div>
          )}
        </div>
      </div>

      <div style={{ background:"#ffffff", borderRadius:16, border:"1px solid #D4D4DC", padding:"20px 24px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#A59AC9", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Account</div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13 }}>
          <span style={{ color:"#5A3B7B" }}>AUB Email</span>
          <span style={{ fontWeight:600, color:"#31487A" }}>{profile.email}</span>
        </div>

        <div style={{ height:1, background:"#F4F4F8", margin:"12px 0" }} />

        <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", fontSize:13, gap:8 }}>
          {passsuccess && <span style={{ fontSize:12, color:"#2d7a4a", fontWeight:600 }}>✓ Updated</span>}
          <button
            onClick={() => { setchanging(!changing); setpasserror(""); }}
            style={{ background:"none", border:"none", color:"#7B5EA7", fontSize:13, fontWeight:600, cursor:"pointer", padding:0 }}
          >
            {changing ? "Cancel" : "Change Password"}
          </button>
        </div>

        {changing && (
          <div style={{ marginTop:14, borderTop:"1px solid #F4F4F8", paddingTop:14 }}>
            {passerror && (
              <div style={{ background:"#fef0f0", border:"1px solid #f5c6c6", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#c0392b", marginBottom:12 }}>
                {passerror}
              </div>
            )}

            <label style={pf.label}>Current Password</label>
            <div style={{ position:"relative", marginBottom:14 }}>
              <input className="pf-input"
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={e => { setcurrent(e.target.value); setpasserror(""); }}
                placeholder="Enter current password"
                style={{ ...pf.input, marginBottom:0, paddingRight:40 }}
              />
              <button type="button" onClick={() => setshowCurrent(v => !v)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#A59AC9", padding:0, display:"flex", alignItems:"center" }}>
                {showCurrent
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            <label style={pf.label}>New Password</label>
            <div style={{ position:"relative", marginBottom:14 }}>
              <input className="pf-input"
                type={showNew ? "text" : "password"}
                value={newpass}
                onChange={e => { setnewpass(e.target.value); setpasserror(""); }}
                onFocus={() => setnewpass2(true)}
                placeholder="Create a new password"
                style={{ ...pf.input, marginBottom:0, paddingRight:40 }}
              />
              <button type="button" onClick={() => setshowNew(v => !v)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#A59AC9", padding:0, display:"flex", alignItems:"center" }}>
                {showNew
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {(newpass2 || newpass.length > 0) && (
              <div style={{ background:"#f7f5fb", border:"1px solid #e2ddf0", borderRadius:8, padding:"8px 12px", marginBottom:14, marginTop:-10 }}>
                {passrequirements.map(r => {
                  const met = r.test(newpass);
                  return (
                    <div key={r.label} style={{ fontSize:11, fontWeight:500, color: met ? "#2e7d32" : "#A59AC9", padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
                      <span>{met ? "✓" : "○"}</span>{r.label}
                    </div>
                  );
                })}
              </div>
            )}

            <label style={pf.label}>Confirm New Password</label>
            <input className="pf-input"
              type="password"
              value={confirm}
              onChange={e => { setconfirm(e.target.value); setpasserror(""); }}
              onKeyDown={e => e.key === "Enter" && handlechangepassword()}
              placeholder="Re-enter your new password"
              style={{ ...pf.input, borderColor: confirmwrong ? "#e74c3c" : confirmmatch ? "#2e7d32" : "#D4D4DC" }}
            />
            {confirmwrong && <p style={{ fontSize:11, color:"#e74c3c", marginTop:-10, marginBottom:12 }}>Passwords don't match</p>}
            {confirmmatch && <p style={{ fontSize:11, color:"#2e7d32", marginTop:-10, marginBottom:12 }}>Passwords match ✓</p>}

            <button onClick={handlechangepassword} disabled={passloading}
              style={{ ...pf.saveBtn, fontSize:13, opacity: passloading ? 0.7 : 1 }}>
              {passloading ? "Saving…" : "Update Password"}
            </button>
          </div>
        )}
      </div>
      {/* My Semesters */}
      <div style={{ background:"#ffffff", borderRadius:16, border:"1px solid #D4D4DC", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", padding:"24px 28px", marginTop:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"#31487A" }}>My Semesters</div>
          {!creating && (
            <button onClick={() => { setCreating(true); setEditingId(null); }} style={{ background:"#31487A", color:"white", border:"none", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              + New Semester
            </button>
          )}
        </div>

        {/* Create form */}
        {creating && (
          <div style={{ background:"#F7F5FB", border:"1px solid #D4D4DC", borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
            <input
              value={newSemName} onChange={e => setNewSemName(e.target.value)}
              placeholder="Semester name (e.g. Fall 24-25)"
              style={{ ...pf.input, marginBottom:12 }}
            />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#A59AC9", textTransform:"uppercase" }}>Course Name</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#A59AC9", textTransform:"uppercase" }}>Credits</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#A59AC9", textTransform:"uppercase" }}>Grade</span>
              <span />
            </div>
            {newSemCourses.map(c => (
              <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                <input value={c.code} onChange={e => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r,code:e.target.value} : r))} placeholder="e.g. CMPS 200" style={{ ...pf.input, marginBottom:0, fontSize:13 }} />
                <input value={c.credits} onChange={e => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r,credits:e.target.value} : r))} placeholder="3" type="number" style={{ ...pf.input, marginBottom:0, fontSize:13 }} />
                <select value={c.grade} onChange={e => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r,grade:e.target.value} : r))} style={{ ...pf.input, marginBottom:0, fontSize:13, cursor:"pointer" }}>
                  {LETTER_GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
                <button onClick={() => setNewSemCourses(p => p.filter(r => r.id !== c.id))} style={{ background:"none", border:"none", color:"#B8A9C9", fontSize:16, cursor:"pointer", padding:0 }}>✕</button>
              </div>
            ))}
            <button onClick={() => setNewSemCourses(p => [...p, { id:Date.now(), code:"", credits:"", grade:"A" }])} style={{ fontSize:12, color:"#7B5EA7", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600 }}>+ Add Course</button>
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={createSemester} disabled={semSaveLoad || !newSemName.trim()} style={{ ...pf.saveBtn, fontSize:13, opacity: semSaveLoad || !newSemName.trim() ? 0.6 : 1 }}>{semSaveLoad ? "Saving…" : "Save Semester"}</button>
              <button onClick={() => { setCreating(false); setNewSemName(""); setNewSemCourses([{ id:1, code:"", credits:"", grade:"A" }]); }} style={{ ...pf.cancelBtn }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Semester list */}
        {semesters.length === 0 && !creating && (
          <div style={{ textAlign:"center", padding:"24px 0", color:"#B8A9C9", fontSize:13 }}>No semesters yet. Create one above.</div>
        )}
        {semesters.map(sem => (
          <div key={sem.id} style={{ border:"1px solid #D4D4DC", borderRadius:12, marginBottom:10, overflow:"hidden" }}>
            {/* Card header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#F7F5FB" }}>
              <div>
                <span style={{ fontWeight:700, fontSize:14, color:"#31487A" }}>{sem.semesterName}</span>
                <span style={{ fontSize:11, color:"#B8A9C9", marginLeft:10 }}>{(sem.courses||[]).length} course{(sem.courses||[]).length !== 1 ? "s" : ""} · {fmtDateShort(sem.createdAt)}</span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => editingId === sem.id ? setEditingId(null) : startEdit(sem)} style={{ fontSize:12, fontWeight:600, padding:"5px 12px", border:"1px solid #D4D4DC", borderRadius:8, background:"white", color:"#31487A", cursor:"pointer" }}>
                  {editingId === sem.id ? "Close" : "Edit"}
                </button>
                {onLoadSemester && (
                  <button onClick={() => onLoadSemester(sem)} style={{ fontSize:12, fontWeight:600, padding:"5px 12px", border:"none", borderRadius:8, background:"#31487A", color:"white", cursor:"pointer" }}>
                    Load into Calculator
                  </button>
                )}
                {deleteConfirmId === sem.id ? (
                  <>
                    <button onClick={() => deleteSemester(sem.id)} style={{ fontSize:12, fontWeight:600, padding:"5px 12px", border:"none", borderRadius:8, background:"#c0392b", color:"white", cursor:"pointer" }}>Confirm</button>
                    <button onClick={() => setDeleteConfirmId(null)} style={{ fontSize:12, padding:"5px 10px", border:"1px solid #D4D4DC", borderRadius:8, background:"white", color:"#A59AC9", cursor:"pointer" }}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirmId(sem.id)} style={{ fontSize:12, padding:"5px 10px", border:"1px solid #f5c6c6", borderRadius:8, background:"white", color:"#c0392b", cursor:"pointer" }}>Delete</button>
                )}
              </div>
            </div>

            {/* Course list (view mode) */}
            {editingId !== sem.id && (sem.courses||[]).length > 0 && (
              <div style={{ padding:"10px 16px", display:"flex", flexDirection:"column", gap:4 }}>
                {(sem.courses||[]).map((c,i) => (
                  <div key={i} style={{ display:"flex", gap:12, fontSize:13, color:"#4a3a6a" }}>
                    <span style={{ fontWeight:600, minWidth:100 }}>{c.courseCode}</span>
                    <span style={{ color:"#A59AC9" }}>{c.credits} cr</span>
                    <span style={{ color:"#7B5EA7", fontWeight:600 }}>{c.grade}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Edit mode */}
            {editingId === sem.id && (
              <div style={{ padding:"14px 16px" }}>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...pf.input, marginBottom:10 }} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#A59AC9", textTransform:"uppercase" }}>Course Name</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#A59AC9", textTransform:"uppercase" }}>Credits</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#A59AC9", textTransform:"uppercase" }}>Grade</span>
                  <span />
                </div>
                {editCourses.map(c => (
                  <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                    <input value={c.code} onChange={e => setEditCourses(p => p.map(r => r.id===c.id ? {...r,code:e.target.value} : r))} placeholder="e.g. CMPS 200" style={{ ...pf.input, marginBottom:0, fontSize:13 }} />
                    <input value={c.credits} onChange={e => setEditCourses(p => p.map(r => r.id===c.id ? {...r,credits:e.target.value} : r))} placeholder="3" type="number" style={{ ...pf.input, marginBottom:0, fontSize:13 }} />
                    <select value={c.grade} onChange={e => setEditCourses(p => p.map(r => r.id===c.id ? {...r,grade:e.target.value} : r))} style={{ ...pf.input, marginBottom:0, fontSize:13, cursor:"pointer" }}>
                      {LETTER_GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                    <button onClick={() => setEditCourses(p => p.filter(r => r.id !== c.id))} style={{ background:"none", border:"none", color:"#B8A9C9", fontSize:16, cursor:"pointer", padding:0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setEditCourses(p => [...p, { id:Date.now(), code:"", credits:"", grade:"A" }])} style={{ fontSize:12, color:"#7B5EA7", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600 }}>+ Add Course</button>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button onClick={saveEdit} disabled={semSaveLoad} style={{ ...pf.saveBtn, fontSize:13, opacity: semSaveLoad ? 0.6 : 1 }}>{semSaveLoad ? "Saving…" : "Save Changes"}</button>
                  <button onClick={() => setEditingId(null)} style={{ ...pf.cancelBtn }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop:24 }}>
        <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:8, background:"#fff0f0", border:"1px solid #f5c6c6", borderRadius:10, padding:"10px 20px", color:"#c0392b", fontWeight:600, fontSize:14, cursor:"pointer" }}>
          Log out
        </button>
      </div>
    </div>
  );
}

function StatChip({ label, value, color, bg }) {
  return (
    <div style={{ background:bg, borderRadius:12, padding:"10px 16px", border:"1px solid #D4D4DC", minWidth:100 }}>
      <div style={{ fontSize:10, fontWeight:700, color:"#B8A9C9", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:700, color, fontFamily:"'DM Sans',sans-serif" }}>{value}</div>
    </div>
  );
}

const pf = {
  label:     { display:"block", fontSize:12, fontWeight:600, color:"#2a2050", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#F7F5FB", marginBottom:14, display:"block", transition:"border-color .15s", outline:"none" },
  editBtn:   { padding:"8px 18px", background:"#F4F4F8", color:"#31487A", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  saveBtn:   { padding:"8px 20px", background:"#31487A", color:"white", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"8px 16px", background:"#F4F4F8", color:"#A59AC9", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};
