import { useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
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
  "Arts & Sciences":          ["Computer Science","Mathematics","Physics","Chemistry","Biology","Psychology","Philosophy","Political Science","Economics","English","Arabic","Sociology","Statistics","Geology"],
  "Engineering & Architecture":["Computer & Communications Engineering","Electrical & Computer Engineering","Civil Engineering","Mechanical Engineering","Chemical Engineering","Architecture","Landscape Architecture"],
  "Business":                 ["Business Administration","Accounting","Finance","Marketing","Management","Entrepreneurship"],
  "Health Sciences":          ["Nutrition","Environmental Health","Health Management"],
  "Medicine":                 ["Medicine (MD)"],
  "Nursing":                  ["Nursing"],
  "Education":                ["Education","Early Childhood Education"],
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

// ── Default profile ───────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  firstName:   "",
  lastName:    "",
  email:       "",
  faculty:     "Arts & Sciences",
  major:       "Computer Science",
  status:      "freshman",
  cumGPA:      "",
  totalCredits:"",
  bio:         "",
};

function loadProfile(email) {
  try {
    const saved = localStorage.getItem("kk_profile");
    if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved), email };
  } catch {}
  return { ...DEFAULT_PROFILE, email };
}

function saveProfile(profile) {
  // TODO: replace with API call → PUT /api/profile
  // body: { ...profile }  →  response: { success: true, profile: { ...profile } }
  localStorage.setItem("kk_profile", JSON.stringify(profile));
}

// ── GPA color ─────────────────────────────────────────────────────────────────
const gpaColor = g => {
  const v = parseFloat(g);
  if (isNaN(v)) return "#B8A9C9";
  if (v >= 3.7) return "#2d7a4a";
  if (v >= 3.0) return "#31487A";
  if (v >= 2.0) return "#b7680a";
  return "#c0392b";
};

const statusObj = id => STUDENT_STATUSES.find(s=>s.id===id) || STUDENT_STATUSES[0];

// ── Profile page ──────────────────────────────────────────────────────────────
export default function Profile({ onProfileSave }) {
  const email = localStorage.getItem("kk_email") || "student@mail.aub.edu";
  const [profile, setProfile] = useState(() => loadProfile(email));
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(profile);
  const [saved,   setSaved]   = useState(false);

  const set = (k, v) => setDraft(p => {
    const updated = { ...p, [k]:v };
    // when faculty changes, reset major to first option in that faculty
    if (k === "faculty") updated.major = MAJORS_BY_FACULTY[v]?.[0] || "";
    return updated;
  });

  const handleSave = () => {
    saveProfile(draft);
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (onProfileSave) onProfileSave(draft); // bubble up to Dashboard
  };

  const handleCancel = () => { setDraft(profile); setEditing(false); };

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

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"#31487A", marginBottom:4 }}>My Profile</div>
        <div style={{ fontSize:13, color:"#A59AC9" }}>Your info shows up on the dashboard greeting and affects how KourseKit personalizes your experience.</div>
      </div>

      {/* Profile card */}
      <div style={{ background:"#ffffff", borderRadius:20, border:"1px solid #D4D4DC", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", overflow:"hidden", marginBottom:20 }}>

        {/* Avatar + info */}
        <div style={{ padding:"24px 28px 24px" }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:16, marginBottom:20 }}>
            <div style={{
              width:72, height:72, borderRadius:20, border:"3px solid #ffffff",
              background:"linear-gradient(135deg,#8FB3E2,#7B5EA7)",
              color:"white", fontWeight:700, fontSize:26,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Fraunces',serif", flexShrink:0, boxShadow:"0 4px 12px rgba(49,72,122,0.18)",
            }}>{initials}</div>
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
                ? <button onClick={() => { setDraft(profile); setEditing(true); }} style={pf.editBtn}>✏️ Edit Profile</button>
                : <>
                    <button onClick={handleSave}   style={pf.saveBtn}>Save</button>
                    <button onClick={handleCancel} style={pf.cancelBtn}>Cancel</button>
                  </>
              }
            </div>
          </div>

          {/* Stats row — always visible */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom: editing ? 24 : 0 }}>
            <StatChip label="Status"       value={`${st.label} · ${st.desc}`} color="#7B5EA7" bg="#F0EEF7" />
            <StatChip label="Major"        value={profile.major || "—"}        color="#31487A" bg="#eef2fb" />
            <StatChip label="Cumulative GPA" value={profile.cumGPA || "—"}    color={gpaColor(profile.cumGPA)} bg="#F4F4F8" />
            {profile.totalCredits && <StatChip label="Credits" value={`${profile.totalCredits} cr`} color="#5A3B7B" bg="#F0EEF7" />}
          </div>

          {/* Edit form */}
          {editing && (
            <div style={{ borderTop:"1px solid #F4F4F8", paddingTop:24 }}>

              {/* Name row */}
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:160 }}>
                  <label style={pf.label}>First Name</label>
                  <input className="pf-input" value={draft.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="e.g. Sarah" style={pf.input} />
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <label style={pf.label}>Last Name</label>
                  <input className="pf-input" value={draft.lastName} onChange={e=>set("lastName",e.target.value)} placeholder="e.g. Khalil" style={pf.input} />
                </div>
              </div>

              {/* Faculty + Major */}
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={pf.label}>Faculty</label>
                  <select className="pf-input" value={draft.faculty} onChange={e=>set("faculty",e.target.value)} style={{ ...pf.input, cursor:"pointer" }}>
                    {FACULTIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={pf.label}>Major</label>
                  <select className="pf-input" value={draft.major} onChange={e=>set("major",e.target.value)} style={{ ...pf.input, cursor:"pointer" }}>
                    {(MAJORS_BY_FACULTY[draft.faculty] || []).map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Status */}
              <label style={pf.label}>Academic Status</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                {STUDENT_STATUSES.map(s => (
                  <button key={s.id} className="pf-status" onClick={() => set("status", s.id)} style={{
                    padding:"8px 14px", borderRadius:10, border:"1px solid",
                    cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                    borderColor: draft.status===s.id ? "#7B5EA7" : "#D4D4DC",
                    background:  draft.status===s.id ? "#7B5EA7" : "#F7F5FB",
                    color:       draft.status===s.id ? "#ffffff" : "#5A3B7B",
                    fontWeight:  draft.status===s.id ? 600 : 400,
                  }}>
                    <div style={{ fontSize:13 }}>{s.label}</div>
                    <div style={{ fontSize:10, opacity:.75 }}>{s.desc}</div>
                  </button>
                ))}
              </div>

              {/* GPA + credits */}
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={pf.label}>Cumulative GPA <span style={{ color:"#B8A9C9", fontWeight:400 }}>(optional)</span></label>
                  <input className="pf-input" value={draft.cumGPA} onChange={e=>set("cumGPA",e.target.value)}
                    placeholder="e.g. 3.45" type="number" step="0.01" min="0" max="4"
                    style={pf.input} />
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={pf.label}>Total Credits <span style={{ color:"#B8A9C9", fontWeight:400 }}>(optional)</span></label>
                  <input className="pf-input" value={draft.totalCredits} onChange={e=>set("totalCredits",e.target.value)}
                    placeholder="e.g. 60" type="number"
                    style={pf.input} />
                </div>
              </div>

              {/* Bio */}
              <label style={pf.label}>Bio <span style={{ color:"#B8A9C9", fontWeight:400 }}>(optional)</span></label>
              <textarea className="pf-input" value={draft.bio} onChange={e=>set("bio",e.target.value)}
                placeholder="A short description about yourself..."
                rows={3}
                style={{ ...pf.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
              />

              <div style={{ fontSize:11, color:"#B8A9C9", marginTop:-8, marginBottom:16 }}>
                ⚠️ GPA and credits here are self-reported — once backend is connected, this will sync with your actual academic record.
              </div>
            </div>
          )}

          {/* Bio display (not editing) */}
          {!editing && profile.bio && (
            <div style={{ marginTop:16, fontSize:13, color:"#5A3B7B", lineHeight:1.7, borderTop:"1px solid #F4F4F8", paddingTop:16 }}>
              {profile.bio}
            </div>
          )}
        </div>
      </div>

      {/* Account info card */}
      <div style={{ background:"#ffffff", borderRadius:16, border:"1px solid #D4D4DC", padding:"20px 24px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#A59AC9", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Account</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13 }}>
          <span style={{ color:"#5A3B7B" }}>AUB Email</span>
          <span style={{ fontWeight:600, color:"#31487A" }}>{profile.email}</span>
        </div>
        <div style={{ height:1, background:"#F4F4F8", margin:"12px 0" }} />
        <div style={{ fontSize:12, color:"#B8A9C9" }}>
          {/* TODO: add Change Password button → POST /api/auth/change-password */}
          Password changes and account management will be available once the backend is connected.
        </div>
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

// ── Styles ────────────────────────────────────────────────────────────────────
const pf = {
  label:     { display:"block", fontSize:12, fontWeight:600, color:"#2a2050", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#F7F5FB", marginBottom:14, display:"block", transition:"border-color .15s", outline:"none" },
  editBtn:   { padding:"8px 18px", background:"#F4F4F8", color:"#31487A", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  saveBtn:   { padding:"8px 20px", background:"#31487A", color:"white", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"8px 16px", background:"#F4F4F8", color:"#A59AC9", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};
