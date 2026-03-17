import { useState, useEffect, useRef } from "react";
import { Banana, Cat, Dog, Eclipse, Telescope, Panda, Turtle } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./ThemeContext";

function getTokenRole() {
  try {
    const token = localStorage.getItem("kk_token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).role || null;
  } catch { return null; }
}

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
  "Arts & Sciences": [
    "Applied Mathematics", "Arabic Language and Literature", "Archaeology",
    "Art History", "Biology", "Chemistry", "Computer Science", "Earth Sciences",
    "Economics", "English Language", "English Literature", "History",
    "Mathematics", "Media and Communication", "Philosophy", "Physics",
    "Political Studies", "Psychology", "Public Administration",
    "Sociology-Anthropology", "Statistics", "Studio Arts",
  ],
  "Engineering & Architecture": [
    "Architecture", "Chemical Engineering", "Civil and Environmental Engineering",
    "Computer and Communications Engineering", "Construction Engineering",
    "Electrical and Computer Engineering", "Graphic Design", "Industrial Engineering",
    "Landscape Architecture", "Mechanical Engineering",
  ],
  "Business": [
    "Agri-Business", "Business Administration",
  ],
  "Health Sciences": [
    "Environmental Health", "Health Communication", "Medical Imaging Sciences",
    "Medical Laboratory Sciences", "Nutrition and Dietetics",
    "Nutrition and Dietetics Coordinated Program",
  ],
  "Medicine": ["Medicine"],
  "Nursing":  ["Nursing"],
  "Education": ["Elementary Education", "Agri-culture", "Food Sciences and Management"],
};

const MINORS_BY_FACULTY = {
  "Arts & Sciences": [
    "Applied Mathematics", "Arabic Studies", "Archaeology", "Art History",
    "Biology", "Chemistry", "Computer Science", "Economics", "English Literature",
    "Environmental Studies", "History", "Mathematics", "Media and Communication",
    "Philosophy", "Physics", "Political Studies", "Psychology",
    "Public Administration", "Sociology-Anthropology", "Statistics", "Studio Arts",
  ],
  "Engineering & Architecture": [
    "Architecture", "Computer and Communications Engineering",
    "Electrical and Computer Engineering", "Industrial Engineering",
  ],
  "Business": ["Business Administration", "Finance", "Marketing"],
  "Health Sciences": ["Health Communication", "Nutrition and Dietetics"],
  "Medicine":  [],
  "Nursing":   [],
  "Education": ["Elementary Education"],
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
  minorFaculty: "",
  minor:        false,
  minorName:    "",
  status:       "freshman",
  cumGPA:       "",
  totalCredits: "",
  bio:          "",
  avatar:       null,
  doubleMajor:   false,
  secondMajor:   "",
  secondFaculty: "Arts & Sciences",
  doubleMinor:   false,
  secondMinorFaculty: "",
  secondMinor:   "",
  tripleMinor:   false,
  thirdMinorFaculty: "",
  thirdMinor:    "",
  emailRemindersEnabled: true,
};

async function profileFetch(path, options = {}) {
  const t = localStorage.getItem("kk_token");
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${t}` },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const gpaColor = g => {
  const v = parseFloat(g);
  if (isNaN(v)) return "var(--text3)";
  if (v >= 3.7) return "#2d7a4a";
  if (v >= 3.0) return "var(--primary)";
  if (v >= 2.0) return "#b7680a";
  return "var(--error)";
};

const statusObj = id => STUDENT_STATUSES.find(s => s.id === id) || STUDENT_STATUSES[0];

const API = "http://localhost:8080";
const semAuthHeaders = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("kk_token")}` });
const LETTER_GRADES = ["","A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F"];
const fmtDateShort = iso => { try { return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); } catch { return ""; } };
const AUB_SEMESTERS = [
  "Spring 25-26","Summer 25-26","Fall 25-26",
  "Spring 24-25","Summer 24-25","Fall 24-25",
  "Spring 23-24","Summer 23-24","Fall 23-24",
  "Spring 22-23","Summer 22-23","Fall 22-23",
];

function CourseSearchInput({ value = "", onSelect }) {
  const [query,   setQuery]   = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropPos,  setDropPos] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    if (query === value || query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`${API}/api/courses/search?query=${encodeURIComponent(query)}`)
        .then(r => r.json()).then(setResults).catch(() => setResults([])).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query, value]);

  const showDrop = results.length > 0 || loading;
  useEffect(() => {
    if (showDrop && inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    if (!showDrop) setDropPos(null);
  }, [showDrop]);

  return (
    <div style={{ position:"relative" }}>
      <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search course (e.g. CMPS 200)"
        style={{ width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", outline:"none" }} />
      {showDrop && dropPos && (
        <div style={{ position:"fixed", top:dropPos.top, left:dropPos.left, width:dropPos.width, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, boxShadow:"0 4px 16px rgba(49,72,122,0.1)", zIndex:9999, maxHeight:180, overflowY:"auto" }}>
          {loading && <div style={{ padding:"10px 14px", fontSize:12, color:"var(--text2)" }}>Searching…</div>}
          {results.map(c => (
            <div key={c.id} onClick={() => { onSelect(c.courseCode); setQuery(c.courseCode); setResults([]); }}
              style={{ padding:"9px 14px", fontSize:13, color:"var(--text)", cursor:"pointer", borderBottom:"1px solid #F4F4F8" }}
              onMouseEnter={e => e.currentTarget.style.background="var(--surface3)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <span style={{ fontWeight:600 }}>{c.courseCode}</span>
              {c.title && <span style={{ color:"var(--text2)", marginLeft:8 }}>{c.title}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile({ onProfileSave, onLogout }) {
  const email = localStorage.getItem("kk_email") || "student@mail.aub.edu";
  const isAdmin = getTokenRole() === "ADMIN";
  const [section, setSection] = useState("profile");
  const { theme, toggleTheme, isDark } = useTheme();
  const [syllabi, setSyllabi] = useState(() => { try { return JSON.parse(localStorage.getItem("kk_course_syllabus") || "{}"); } catch { return {}; } });
  const [confirmingRemove, setConfirmingRemove] = useState(null); // course name
  const [profile,    setProfile]    = useState({ ...DEFAULT_PROFILE, email });
  const [editing,    setEditing]    = useState(false);
  const [draft,      setDraft]      = useState({ ...DEFAULT_PROFILE, email });
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
  const [newSemCourses, setNewSemCourses] = useState([{ id:1, code:"", credits:"", grade:"" }]);
  const [editingId,    setEditingId]    = useState(null);
  const [editName,     setEditName]     = useState("");
  const [editCourses,  setEditCourses]  = useState([]);
  const [semSaveLoad,  setSemSaveLoad]  = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  function restoreFacultyFields(data) {
    if (data.minor && data.minorName) {
      const fac = Object.keys(MINORS_BY_FACULTY).find(f => MINORS_BY_FACULTY[f].includes(data.minorName));
      if (fac) data.minorFaculty = fac;
    }
    if (data.doubleMinor && data.secondMinor) {
      const fac = Object.keys(MINORS_BY_FACULTY).find(f => MINORS_BY_FACULTY[f].includes(data.secondMinor));
      if (fac) data.secondMinorFaculty = fac;
    }
    if (data.tripleMinor && data.thirdMinor) {
      const fac = Object.keys(MINORS_BY_FACULTY).find(f => MINORS_BY_FACULTY[f].includes(data.thirdMinor));
      if (fac) data.thirdMinorFaculty = fac;
    }
    return data;
  }

  useEffect(() => {
    profileFetch("/api/profile")
      .then(data => {
        restoreFacultyFields(data);
        setProfile(data);
        setDraft(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API}/api/grades/saved`, { headers: semAuthHeaders() })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setSemesters(sortSemesters(data)))
      .catch(() => {});
  }, []);

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

const refetchSemesters = () =>
  fetch(`${API}/api/grades/saved`, { headers: semAuthHeaders() })
    .then(r => r.json())
    .then(data => Array.isArray(data) && setSemesters(sortSemesters(data)))
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
      setCreating(false); setNewSemName(""); setNewSemCourses([{ id:1, code:"", credits:"", grade:"" }]);
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
    setEditCourses((sem.courses || []).map((c,i) => ({ id: i+1, code: c.courseCode || "", credits: String(c.credits || ""), grade: c.grade || "" })));
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
    return updated;
  });

  const handleSave = async () => {
    let savedData = draft;
    try {
      const res = await profileFetch("/api/profile", { method: "PUT", body: JSON.stringify(draft) });
      restoreFacultyFields(res);
      savedData = res;
      setProfile(res);
      setDraft(res);
    } catch { setProfile(draft); }
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (onProfileSave) onProfileSave(savedData);
  };

  const handleCancel = () => { setDraft(profile); setEditing(false); };

  const toggleEmailReminders = async () => {
    const newValue = !profile.emailRemindersEnabled;
    setProfile(p => ({ ...p, emailRemindersEnabled: newValue }));
    try {
      await profileFetch("/api/profile/email-reminders", {
        method: "PUT",
        body: JSON.stringify({ emailRemindersEnabled: newValue }),
      });
    } catch {
      setProfile(p => ({ ...p, emailRemindersEnabled: !newValue }));
    }
  };

  const selectAvatar = async (iconId) => {
    const updated = { ...profile, avatar: iconId };
    try {
      await profileFetch("/api/profile", { method: "PUT", body: JSON.stringify({ avatar: iconId }) });
    } catch {}
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
    <div style={{ padding:"28px 28px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .pf-input:focus { border-color:#8FB3E2 !important; outline:none; }
        .pf-status:hover { border-color:var(--accent) !important; }
      `}</style>

      {isAdmin && (
        <div style={{ 
          display:"flex", 
          gap:4, 
          background:"var(--surface)",  
          padding:5,                     
          borderRadius:14,              
          marginBottom:24, 
          width:"fit-content",
          border:"1px solid var(--border)" 
        }}>
          {[{ id:"profile", label:"My Profile" }, { id:"admin", label:"Admin" }].map(t => (
            <button key={t.id} onClick={() => setSection(t.id)} style={{
              padding:"6px 20px", 
              border:"none", 
              borderRadius:8, 
              fontSize:13, 
              fontWeight:600,  
              cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",
              background: section === t.id ? "var(--primary)" : "transparent",
              color:      section === t.id ? "#fff"    : "var(--text2)",
            }}>{t.label}</button>
            ))}
          </div>
        )}

      {isAdmin && section === "admin" && (
        <AdminDashboard token={localStorage.getItem("kk_token")} />
      )}

      {section === "profile" && <>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"var(--primary)", marginBottom:4 }}>My Profile</div>
        <div style={{ fontSize:13, color:"var(--text2)" }}>Your info shows up on the dashboard greeting and affects how KourseKit personalizes your experience.</div>
      </div>

      <div style={{ background:"var(--surface)", borderRadius:20, border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", overflow:"hidden", marginBottom:20 }}>
        <div style={{ padding:"24px 28px 24px" }}>

          <div style={{ display:"flex", alignItems:"flex-end", gap:16, marginBottom:20 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div onClick={() => setProfilepic(o => !o)} style={{
                width:72, height:72, borderRadius:20, border:"3px solid var(--border)",
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
                  background:"var(--surface)", borderRadius:14, border:"1px solid var(--border)",
                  boxShadow:"0 8px 32px rgba(49,72,122,0.15)", padding:10,
                  display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, width:196,
                }}>
                  <div onClick={() => selectAvatar(null)} title="Default (initials)" style={{
                    width:36, height:36, borderRadius:10, cursor:"pointer",
                    background: !profile.avatar ? "var(--accent)" : "linear-gradient(135deg,#8FB3E2,#A59AC9)",
                    border: !profile.avatar ? "2px solid #31487A" : "2px solid transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"white", fontWeight:700, fontSize:13, fontFamily:"'Fraunces',serif",
                  }}>{initials}</div>
                  {AVATAR_ICONS.map(({ id, icon: Icon }) => (
                    <div key={id} onClick={() => selectAvatar(id)} title={id} style={{
                      width:36, height:36, borderRadius:10, cursor:"pointer",
                      background: profile.avatar === id ? "var(--accent)" : "linear-gradient(135deg,#8FB3E2,#A59AC9)",
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
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:22, color:"var(--primary)" }}>{displayName}</div>
              <div style={{ fontSize:12, color:"var(--text2)" }}>{profile.email}</div>
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
            <StatChip label="Status"         value={`${st.label} · ${st.desc}`} color="var(--accent)" bg="var(--surface3)" />
            <StatChip label="Major" value={(() => { const m = [profile.major, profile.doubleMajor && profile.secondMajor].filter(Boolean).sort(); return m.length > 1 ? m[0] + " & " + m[1] : (m[0] || "—"); })()} color="var(--primary)" bg="var(--blue-light-bg)" />
            {profile.minor && profile.minorName && <StatChip label="Minor" value={(() => { const m = [profile.minorName, profile.doubleMinor && profile.secondMinor, profile.tripleMinor && profile.thirdMinor].filter(Boolean).sort(); return m.length > 1 ? m.slice(0,-1).join(", ") + " & " + m[m.length-1] : m[0]; })()} color="var(--success)" bg="var(--success-bg)" />}
            <StatChip label="Cumulative GPA" value={profile.cumGPA || "—"} color={gpaColor(profile.cumGPA)} bg="var(--bg)" />
            {profile.totalCredits && <StatChip label="Credits" value={`${profile.totalCredits} cr`} color="var(--accent2)" bg="var(--surface3)" />}
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
                  <select className="pf-input" value={draft.faculty}
                    onChange={e => { set("faculty", e.target.value); set("major", ""); }}
                    style={{ ...pf.input, cursor:"pointer" }}>
                    {FACULTIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={pf.label}>Major</label>
                  <select className="pf-input" value={draft.major}
                    onChange={e => set("major", e.target.value)}
                    style={{ ...pf.input, cursor:"pointer" }}>
                    <option value="">Select major…</option>
                    {(MAJORS_BY_FACULTY[draft.faculty] || []).map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ ...pf.label, marginBottom:10 }}>Minor?</label>
                <div style={{ display:"flex", gap:8, marginBottom: draft.minorFaculty ? 12 : 0 }}>
                  {[{val:true,label:"Yes"},{val:false,label:"No"}].map(opt => (
                    <button key={String(opt.val)} onClick={() => { set("minor", opt.val); set("minorFaculty", opt.val ? (draft.minorFaculty || "Arts & Sciences") : ""); set("minorName", ""); if (!opt.val) { set("doubleMinor", false); set("secondMinorFaculty", ""); set("secondMinor", ""); set("tripleMinor", false); set("thirdMinorFaculty", ""); set("thirdMinor", ""); } }} style={{
                      padding:"7px 18px", borderRadius:10, border:"1px solid", cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:"all .15s",
                      borderColor: !!draft.minorFaculty === opt.val ? "var(--accent)" : "var(--border)",
                      background:  !!draft.minorFaculty === opt.val ? "var(--accent)" : "var(--surface2)",
                      color:       !!draft.minorFaculty === opt.val ? "#fff"    : "var(--accent2)",
                      fontWeight:  !!draft.minorFaculty === opt.val ? 600 : 400,
                    }}>{opt.label}</button>
                  ))}
                </div>
                {draft.minorFaculty && (
                  <>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14 }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <label style={pf.label}>Minor Faculty</label>
                        <select className="pf-input" value={draft.minorFaculty}
                          onChange={e => { set("minorFaculty", e.target.value); set("minorName", ""); }}
                          style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                          {FACULTIES.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div style={{ flex:1, minWidth:200 }}>
                        <label style={pf.label}>Minor</label>
                        <select className="pf-input" value={draft.minorName || ""}
                          onChange={e => set("minorName", e.target.value)}
                          style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                          <option value="">Select minor…</option>
                          {(MINORS_BY_FACULTY[draft.minorFaculty] || []).map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom:14 }}>
                      <label style={{ ...pf.label, marginBottom:10 }}>Second Minor?</label>
                      <div style={{ display:"flex", gap:8, marginBottom: draft.secondMinorFaculty ? 12 : 0 }}>
                        {[{val:true,label:"Yes"},{val:false,label:"No"}].map(opt => (
                          <button key={String(opt.val)} onClick={() => { set("doubleMinor", opt.val); set("secondMinorFaculty", opt.val ? (draft.secondMinorFaculty || "Arts & Sciences") : ""); set("secondMinor", ""); if (!opt.val) { set("tripleMinor", false); set("thirdMinorFaculty", ""); set("thirdMinor", ""); } }} style={{
                            padding:"7px 18px", borderRadius:10, border:"1px solid", cursor:"pointer",
                            fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:"all .15s",
                            borderColor: !!draft.secondMinorFaculty === opt.val ? "var(--accent)" : "var(--border)",
                            background:  !!draft.secondMinorFaculty === opt.val ? "var(--accent)" : "var(--surface2)",
                            color:       !!draft.secondMinorFaculty === opt.val ? "#fff"    : "var(--accent2)",
                            fontWeight:  !!draft.secondMinorFaculty === opt.val ? 600 : 400,
                          }}>{opt.label}</button>
                        ))}
                      </div>
                      {draft.secondMinorFaculty && (
                        <>
                          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14 }}>
                            <div style={{ flex:1, minWidth:200 }}>
                              <label style={pf.label}>Second Minor Faculty</label>
                              <select className="pf-input" value={draft.secondMinorFaculty}
                                onChange={e => { set("secondMinorFaculty", e.target.value); set("secondMinor", ""); }}
                                style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                                {FACULTIES.map(f => <option key={f}>{f}</option>)}
                              </select>
                            </div>
                            <div style={{ flex:1, minWidth:200 }}>
                              <label style={pf.label}>Second Minor</label>
                              <select className="pf-input" value={draft.secondMinor || ""}
                                onChange={e => set("secondMinor", e.target.value)}
                                style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                                <option value="">Select minor…</option>
                                {(MINORS_BY_FACULTY[draft.secondMinorFaculty] || []).map(m => <option key={m}>{m}</option>)}
                              </select>
                            </div>
                          </div>

                          <div style={{ marginBottom:14 }}>
                            <label style={{ ...pf.label, marginBottom:10 }}>Third Minor?</label>
                            <div style={{ display:"flex", gap:8, marginBottom: draft.thirdMinorFaculty ? 12 : 0 }}>
                              {[{val:true,label:"Yes"},{val:false,label:"No"}].map(opt => (
                                <button key={String(opt.val)} onClick={() => { set("tripleMinor", opt.val); set("thirdMinorFaculty", opt.val ? (draft.thirdMinorFaculty || "Arts & Sciences") : ""); set("thirdMinor", ""); }} style={{
                                  padding:"7px 18px", borderRadius:10, border:"1px solid", cursor:"pointer",
                                  fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:"all .15s",
                                  borderColor: !!draft.thirdMinorFaculty === opt.val ? "var(--accent)" : "var(--border)",
                                  background:  !!draft.thirdMinorFaculty === opt.val ? "var(--accent)" : "var(--surface2)",
                                  color:       !!draft.thirdMinorFaculty === opt.val ? "#fff"    : "var(--accent2)",
                                  fontWeight:  !!draft.thirdMinorFaculty === opt.val ? 600 : 400,
                                }}>{opt.label}</button>
                              ))}
                            </div>
                            {draft.thirdMinorFaculty && (
                              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                                <div style={{ flex:1, minWidth:200 }}>
                                  <label style={pf.label}>Third Minor Faculty</label>
                                  <select className="pf-input" value={draft.thirdMinorFaculty}
                                    onChange={e => { set("thirdMinorFaculty", e.target.value); set("thirdMinor", ""); }}
                                    style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                                    {FACULTIES.map(f => <option key={f}>{f}</option>)}
                                  </select>
                                </div>
                                <div style={{ flex:1, minWidth:200 }}>
                                  <label style={pf.label}>Third Minor</label>
                                  <select className="pf-input" value={draft.thirdMinor || ""}
                                    onChange={e => set("thirdMinor", e.target.value)}
                                    style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                                    <option value="">Select minor…</option>
                                    {(MINORS_BY_FACULTY[draft.thirdMinorFaculty] || []).map(m => <option key={m}>{m}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ ...pf.label, marginBottom:10 }}>Double Major?</label>
                <div style={{ display:"flex", gap:8, marginBottom: draft.doubleMajor ? 12 : 0 }}>
                  {[{val:true,label:"Yes"},{val:false,label:"No"}].map(opt => (
                    <button key={String(opt.val)} onClick={() => { set("doubleMajor", opt.val); if (!opt.val) { set("secondMajor", ""); set("secondFaculty", "Arts & Sciences"); } else { set("secondFaculty", draft.secondFaculty || "Arts & Sciences"); } }} style={{
                      padding:"7px 18px", borderRadius:10, border:"1px solid", cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:"all .15s",
                      borderColor: draft.doubleMajor === opt.val ? "var(--accent)" : "var(--border)",
                      background:  draft.doubleMajor === opt.val ? "var(--accent)" : "var(--surface2)",
                      color:       draft.doubleMajor === opt.val ? "#fff"    : "var(--accent2)",
                      fontWeight:  draft.doubleMajor === opt.val ? 600 : 400,
                    }}>{opt.label}</button>
                  ))}
                </div>
                {draft.doubleMajor && (
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <label style={pf.label}>Second Faculty</label>
                      <select className="pf-input" value={draft.secondFaculty || "Arts & Sciences"}
                        onChange={e => { set("secondFaculty", e.target.value); set("secondMajor", ""); set("secondMinor", ""); }}
                        style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                        {FACULTIES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                      <label style={pf.label}>Second Major</label>
                      <select className="pf-input" value={draft.secondMajor}
                        onChange={e => set("secondMajor", e.target.value)}
                        style={{ ...pf.input, cursor:"pointer", marginBottom:0 }}>
                        <option value="">Select major…</option>
                        {(MAJORS_BY_FACULTY[draft.secondFaculty] || []).map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <label style={pf.label}>Academic Status</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                {STUDENT_STATUSES.map(s => (
                  <button key={s.id} className="pf-status" onClick={() => set("status", s.id)} style={{
                    padding:"8px 14px", borderRadius:10, border:"1px solid",
                    cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                    borderColor: draft.status === s.id ? "var(--accent)" : "var(--border)",
                    background:  draft.status === s.id ? "var(--accent)" : "var(--surface2)",
                    color:       draft.status === s.id ? "#ffffff" : "var(--accent2)",
                    fontWeight:  draft.status === s.id ? 600 : 400,
                  }}>
                    <div style={{ fontSize:13 }}>{s.label}</div>
                    <div style={{ fontSize:10, opacity:.75 }}>{s.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={pf.label}>Cumulative GPA <span style={{ color:"var(--text3)", fontWeight:400 }}>(optional)</span></label>
                  <input className="pf-input" value={draft.cumGPA} onChange={e => set("cumGPA", e.target.value)}
                    placeholder="e.g. 3.45" type="number" step="0.01" min="0" max="4"
                    style={pf.input} />
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={pf.label}>Total Credits <span style={{ color:"var(--text3)", fontWeight:400 }}>(optional)</span></label>
                  <input className="pf-input" value={draft.totalCredits} onChange={e => set("totalCredits", e.target.value)}
                    placeholder="e.g. 60" type="number"
                    style={pf.input} />
                </div>
              </div>

              <label style={pf.label}>Bio <span style={{ color:"var(--text3)", fontWeight:400 }}>(optional)</span></label>
              <textarea className="pf-input" value={draft.bio} onChange={e => set("bio", e.target.value)}
                placeholder="A short description about yourself..."
                rows={3}
                style={{ ...pf.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
              />

              <div style={{ fontSize:11, color:"var(--text3)", marginTop:-8, marginBottom:16 }}>
                GPA and credits here are self-reported — once backend is connected, this will sync with your actual academic record.
              </div>
            </div>
          )}

          {!editing && profile.bio && (
            <div style={{ marginTop:16, fontSize:13, color:"var(--accent2)", lineHeight:1.7, borderTop:"1px solid #F4F4F8", paddingTop:16 }}>
              {profile.bio}
            </div>
          )}
        </div>
      </div>

      <div style={{ background:"var(--surface)", borderRadius:16, border:"1px solid var(--border)", padding:"20px 24px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Account</div>

        <div style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          padding:"8px 0",
          borderBottom:"1px solid #F4F4F8",
          }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--accent2)" }}>
                {theme === "light" ? "Light Mode" : "Dark Mode"}
              </div>
              <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                Switch to {theme === "light" ? "dark" : "light"} mode
              </div>
            </div>
          <ThemeToggle showLabel={false} />
        </div>

        <div style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          padding:"8px 0",
          borderBottom:"1px solid #F4F4F8",
          marginBottom:12
          }}>
            <div style={{ fontSize:13, fontWeight:500, color:"var(--accent2)" }}>
              Email Reminders
            </div>
          <button
            onClick={toggleEmailReminders}
            style={{
              width:46, height:26, borderRadius:13, border:"none", outline:"none",
              padding:0, cursor:"pointer", flexShrink:0,
              background: profile.emailRemindersEnabled ? "var(--accent)" : "#b0b8c8",
              position:"relative", transition:"background 0.2s",
            }}
            aria-label="Toggle email reminders"
          >
            <span style={{
              position:"absolute", top:3, left: profile.emailRemindersEnabled ? 24 : 3,
              width:20, height:20, borderRadius:"50%", background:"white",
              boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
              transition:"left 0.2s", display:"block",
            }} />
          </button>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13 }}>
          <span style={{ color:"var(--accent2)" }}>AUB Email</span>
          <span style={{ fontWeight:600, color:"var(--primary)" }}>{profile.email}</span>
        </div>

        <div style={{ height:1, background:"var(--bg)", margin:"12px 0" }} />
        
        <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", fontSize:13, gap:8 }}>
          {passsuccess && <span style={{ fontSize:12, color:"#2d7a4a", fontWeight:600 }}>✓ Updated</span>}
          <button
            onClick={() => { setchanging(!changing); setpasserror(""); }}
            style={{ background:"none", border:"none", color:"var(--accent)", fontSize:13, fontWeight:600, cursor:"pointer", padding:0 }}
          >
            {changing ? "Cancel" : "Change Password"}
          </button>
        </div>

        {changing && (
          <div style={{ marginTop:14, borderTop:"1px solid #F4F4F8", paddingTop:14 }}>
            {passerror && (
              <div style={{ background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:8, padding:"8px 12px", fontSize:12, color:"var(--error)", marginBottom:12 }}>
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
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text2)", padding:0, display:"flex", alignItems:"center" }}>
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
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text2)", padding:0, display:"flex", alignItems:"center" }}>
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
                    <div key={r.label} style={{ fontSize:11, fontWeight:500, color: met ? "#2e7d32" : "var(--text2)", padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
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
              style={{ ...pf.input, borderColor: confirmwrong ? "#e74c3c" : confirmmatch ? "#2e7d32" : "var(--border)" }}
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
      <div style={{ background:"var(--surface)", borderRadius:16, border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", padding:"24px 28px", marginTop:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)" }}>My Semesters</div>
          {!creating && (
            <button onClick={() => { setCreating(true); setEditingId(null); }} style={{ background:"var(--primary)", color:"white", border:"none", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              + New Semester
            </button>
          )}
        </div>

        {/* Create form */}
        {creating && (
          <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
            <select
              value={newSemName} onChange={e => setNewSemName(e.target.value)}
              style={{ ...pf.input, marginBottom:12, cursor:"pointer" }}
            >
              <option value="">Select semester…</option>
              {AUB_SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Course Name</span>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Credits</span>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Grade</span>
              <span />
            </div>
            {newSemCourses.map(c => (
              <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                <CourseSearchInput value={c.code} onSelect={code => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r,code} : r))} />
                <input value={c.credits} onChange={e => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r,credits:e.target.value} : r))} placeholder="3" type="number" style={{ ...pf.input, marginBottom:0, fontSize:13 }} />
                <select value={c.grade} onChange={e => setNewSemCourses(p => p.map(r => r.id===c.id ? {...r,grade:e.target.value} : r))} style={{ ...pf.input, marginBottom:0, fontSize:13, cursor:"pointer" }}>
                  {LETTER_GRADES.map(g => <option key={g} value={g}>{g === "" ? "—" : g}</option>)}
                </select>
                <button onClick={() => setNewSemCourses(p => p.filter(r => r.id !== c.id))} style={{ background:"none", border:"none", color:"var(--text3)", fontSize:16, cursor:"pointer", padding:0 }}>✕</button>
              </div>
            ))}
            <button onClick={() => setNewSemCourses(p => [...p, { id:Date.now(), code:"", credits:"", grade:"" }])} style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600 }}>+ Add Course</button>
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={createSemester} disabled={semSaveLoad || !newSemName.trim()} style={{ ...pf.saveBtn, fontSize:13, opacity: semSaveLoad || !newSemName.trim() ? 0.6 : 1 }}>{semSaveLoad ? "Saving…" : "Save Semester"}</button>
              <button onClick={() => { setCreating(false); setNewSemName(""); setNewSemCourses([{ id:1, code:"", credits:"", grade:"" }]); }} style={{ ...pf.cancelBtn }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Semester list */}
        {semesters.length === 0 && !creating && (
          <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text3)", fontSize:13 }}>No semesters yet. Create one above.</div>
        )}
        {semesters.map(sem => (
          <div key={sem.id} style={{ border:"1px solid var(--border)", borderRadius:12, marginBottom:10 }}>
            {/* Card header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"var(--surface2)", borderRadius:"12px 12px 0 0" }}>
              <div>
                <span style={{ fontWeight:700, fontSize:14, color:"var(--primary)" }}>{sem.semesterName}</span>
                <span style={{ fontSize:11, color:"var(--text3)", marginLeft:10 }}>{(sem.courses||[]).length} course{(sem.courses||[]).length !== 1 ? "s" : ""} · {fmtDateShort(sem.createdAt)}</span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => editingId === sem.id ? setEditingId(null) : startEdit(sem)} style={{ fontSize:12, fontWeight:600, padding:"5px 12px", border:"1px solid var(--border)", borderRadius:8, background:"var(--surface)", color:"var(--primary)", cursor:"pointer" }}>
                  {editingId === sem.id ? "Close" : "Edit"}
                </button>
                {deleteConfirmId === sem.id ? (
                  <>
                    <button onClick={() => deleteSemester(sem.id)} style={{ fontSize:12, fontWeight:600, padding:"5px 12px", border:"none", borderRadius:8, background:"var(--error)", color:"white", cursor:"pointer" }}>Confirm</button>
                    <button onClick={() => setDeleteConfirmId(null)} style={{ fontSize:12, padding:"5px 10px", border:"1px solid var(--border)", borderRadius:8, background:"var(--surface)", color:"var(--text2)", cursor:"pointer" }}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirmId(sem.id)} style={{ fontSize:12, padding:"5px 10px", border:"1px solid var(--error-border)", borderRadius:8, background:"var(--surface)", color:"var(--error)", cursor:"pointer" }}>Delete</button>
                )}
              </div>
            </div>

            {/* Course list (view mode) */}
            {editingId !== sem.id && (sem.courses||[]).length > 0 && (
              <div style={{ padding:"10px 16px", display:"flex", flexDirection:"column", gap:4 }}>
                {(sem.courses||[]).map((c,i) => (
                  <div key={i} style={{ display:"flex", gap:12, fontSize:13, color:"var(--text-body)" }}>
                    <span style={{ fontWeight:600, minWidth:100 }}>{c.courseCode}</span>
                    <span style={{ color:"var(--text2)" }}>{c.credits} cr</span>
                    <span style={{ color:"var(--accent)", fontWeight:600 }}>{c.grade}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Edit mode */}
            {editingId === sem.id && (
              <div style={{ padding:"14px 16px" }}>
                <select value={editName} onChange={e => setEditName(e.target.value)} style={{ ...pf.input, marginBottom:10, cursor:"pointer" }}>
                  <option value="">Select semester…</option>
                  {AUB_SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Course Name</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Credits</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase" }}>Grade</span>
                  <span />
                </div>
                {editCourses.map(c => (
                  <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px 32px", gap:6, marginBottom:6 }}>
                    <CourseSearchInput value={c.code} onSelect={code => setEditCourses(p => p.map(r => r.id===c.id ? {...r,code} : r))} />
                    <input value={c.credits} onChange={e => setEditCourses(p => p.map(r => r.id===c.id ? {...r,credits:e.target.value} : r))} placeholder="3" type="number" style={{ ...pf.input, marginBottom:0, fontSize:13 }} />
                    <select value={c.grade} onChange={e => setEditCourses(p => p.map(r => r.id===c.id ? {...r,grade:e.target.value} : r))} style={{ ...pf.input, marginBottom:0, fontSize:13, cursor:"pointer" }}>
                      {LETTER_GRADES.map(g => <option key={g} value={g}>{g === "" ? "—" : g}</option>)}
                    </select>
                    <button onClick={() => setEditCourses(p => p.filter(r => r.id !== c.id))} style={{ background:"none", border:"none", color:"var(--text3)", fontSize:16, cursor:"pointer", padding:0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setEditCourses(p => [...p, { id:Date.now(), code:"", credits:"", grade:"" }])} style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600 }}>+ Add Course</button>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button onClick={saveEdit} disabled={semSaveLoad} style={{ ...pf.saveBtn, fontSize:13, opacity: semSaveLoad ? 0.6 : 1 }}>{semSaveLoad ? "Saving…" : "Save Changes"}</button>
                  <button onClick={() => setEditingId(null)} style={{ ...pf.cancelBtn }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Course Syllabi */}
      {Object.keys(syllabi).length > 0 && (
        <div style={{ background:"var(--surface)", borderRadius:16, border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)", padding:"24px 28px", marginTop:20 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)", marginBottom:4 }}>Uploaded Syllabi</div>
          <div style={{ fontSize:13, color:"var(--text2)", marginBottom:16 }}>Remove a syllabus to re-upload or clear its extracted data.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {Object.keys(syllabi).map(course => (
              <div key={course} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--surface2)", borderRadius:10, padding:"10px 14px", border:"1px solid #E8E4F0" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--primary)" }}>{course}</div>
                  <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
                    {syllabi[course]?.assessments?.length ? `${syllabi[course].assessments.length} assessment${syllabi[course].assessments.length !== 1 ? "s" : ""}` : "No assessments"}
                  </div>
                </div>
                {confirmingRemove === course ? (
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, color:"var(--error)", fontWeight:600 }}>Remove?</span>
                    <button
                      onClick={async () => {
                        try {
                          // Delete syllabus-imported tasks from backend
                          const token = localStorage.getItem("kk_token");
                          const userId = token ? JSON.parse(atob(token.split(".")[1])).sub : null;
                          const taskIds = JSON.parse(localStorage.getItem("kk_syllabus_task_ids") || "[]");
                          if (userId && taskIds.length > 0) {
                            await Promise.all(taskIds.map(id =>
                              fetch(`http://localhost:8080/api/tasks/${userId}/delete/${id}`, {
                                method: "DELETE",
                                headers: { "Authorization": `Bearer ${token}` },
                              }).catch(() => {})
                            ));
                          }
                          const next = { ...syllabi };
                          delete next[course];
                          localStorage.setItem("kk_course_syllabus", JSON.stringify(next));
                          setSyllabi(next);
                          window.dispatchEvent(new Event("kk_syllabus_changed"));
                          const data = JSON.parse(localStorage.getItem("kk_course_data") || "{}");
                          delete data[course];
                          localStorage.setItem("kk_course_data", JSON.stringify(data));
                          const oh = JSON.parse(localStorage.getItem("kk_course_office_hours") || "{}");
                          delete oh[course];
                          localStorage.setItem("kk_course_office_hours", JSON.stringify(oh));
                          localStorage.removeItem("kk_syllabus_task_ids");
                        } catch {}
                        setConfirmingRemove(null);
                      }}
                      style={{ background:"var(--error)", border:"none", borderRadius:8, padding:"4px 10px", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}
                    >Yes</button>
                    <button
                      onClick={() => setConfirmingRemove(null)}
                      style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"4px 10px", color:"var(--text2)", fontSize:12, cursor:"pointer" }}
                    >Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingRemove(course)}
                    style={{ background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:8, padding:"5px 12px", color:"var(--error)", fontSize:12, fontWeight:600, cursor:"pointer" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop:24 }}>
        <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:8, background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:10, padding:"10px 20px", color:"var(--error)", fontWeight:600, fontSize:14, cursor:"pointer" }}>
          Log out
        </button>
      </div>
      </>}
    </div>
  );
}

function StatChip({ label, value, color, bg }) {
  return (
    <div style={{ background:bg, borderRadius:12, padding:"10px 16px", border:"1px solid var(--border)", minWidth:100 }}>
      <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:700, color, fontFamily:"'DM Sans',sans-serif" }}>{value}</div>
    </div>
  );
}

const pf = {
  label:     { display:"block", fontSize:12, fontWeight:600, color:"var(--text)", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", marginBottom:14, display:"block", transition:"border-color .15s", outline:"none" },
  editBtn:   { padding:"8px 18px", background:"var(--bg)", color:"var(--primary)", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  saveBtn:   { padding:"8px 20px", background:"var(--primary)", color:"white", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"8px 16px", background:"var(--bg)", color:"var(--text2)", border:"1px solid var(--border)", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};
