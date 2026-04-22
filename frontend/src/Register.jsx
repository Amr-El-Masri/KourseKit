import { useState, useRef, useEffect } from "react";
import { PartyPopper, Mail } from "lucide-react";
import TranscriptModal from "./TranscriptModal";
import StudentCourses from "./StudentCourses";

const requirements = [
  { label: "At least 8 characters",       test: p => p.length >= 8 },
  { label: "One uppercase letter (A-Z)",   test: p => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)",   test: p => /[a-z]/.test(p) },
  { label: "One number (0-9)",             test: p => /\d/.test(p) },
  { label: "One special character",        test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(p) },
];

const AUB_SEMESTERS = [
  "Spring 25-26","Summer 25-26","Fall 25-26",
  "Spring 24-25","Summer 24-25","Fall 24-25",
  "Spring 23-24","Summer 23-24","Fall 23-24",
  "Spring 22-23","Summer 22-23","Fall 22-23",
];

function SemesterDropdown({ value, onChange, semesters }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 16 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "11px 14px",
          border: `1px solid ${open ? "var(--border2)" : "var(--border)"}`,
          borderRadius: 10, background: "var(--surface2)",
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, color: value ? "var(--text)" : "var(--text2)",
          transition: "border-color 0.15s",
        }}
      >
        <span>{value || "Select your semester…"}</span>
        <span style={{ color: "var(--text2)", fontSize: 11, display: "inline-block", transition: "transform .2s", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--surface)", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(49,72,122,0.15)", border: "1px solid var(--border)",
          zIndex: 999, padding: 6, maxHeight: 240, overflowY: "auto",
        }}>
          {semesters.map(sem => (
            <div
              key={sem}
              onClick={() => { onChange(sem); setOpen(false); }}
              style={{
                padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center",
                background: sem === value ? "var(--surface3, var(--surface2))" : "transparent",
                color: sem === value ? "var(--primary)" : "var(--text)",
                fontWeight: sem === value ? 600 : 400,
                transition: "background .12s",
              }}
              onMouseEnter={e => { if (sem !== value) e.currentTarget.style.background = "var(--surface2)"; }}
              onMouseLeave={e => { if (sem !== value) e.currentTarget.style.background = "transparent"; }}
            >
              {sem === value && <span style={{ color: "var(--accent)", marginRight: 8, fontSize: 12 }}>✓</span>}
              {sem}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Register({ onGoToLogin, postVerifyToken }) {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  // When postVerifyToken is provided, skip signup and jump straight to semester setup
  const [semStep,   setSemStep]   = useState(!!postVerifyToken);
  const [regToken,  setRegToken]  = useState(postVerifyToken || "");
  // "checkEmail" shows after signup asking user to verify before semester setup
  const [checkEmail, setCheckEmail] = useState(false);
  const [resendLoading,  setResendLoading]  = useState(false);
  const [resendMsg,      setResendMsg]      = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const [semName,       setSemName]       = useState("");
  const [semCourses,    setSemCourses]    = useState([{ id:1, name:"" }]);
  const [semSaving,     setSemSaving]     = useState(false);
  const [semError,      setSemError]      = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const [loading,      setLoading]      = useState(false);
  const [passfocused,  setpassfocused]  = useState(false);
  const [showpass,     setshowpass]     = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);

  const passwordOk   = requirements.every(r => r.test(password));
  const confirmMatch = confirm.length > 0 && password === confirm;
  const confirmWrong = confirm.length > 0 && password !== confirm;

  const handle = async () => {
    if (!email || !password || !confirm) { setError("Please fill in all fields."); return; }
    if (!email.endsWith("@mail.aub.edu")) { setError("Please use your AUB email."); return; }
    if (!passwordOk) { setError("Password does not meet the requirements."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      const res  = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("kk_theme", "light");
        setRegToken(data.token || "");
        setCheckEmail(true);
      } else {
        setError(data.message?.replace(/^error:\s*/i, "") || "Registration failed.");
      }
    } catch (e) {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true); setResendMsg("");
    try {
      const res = await fetch("http://localhost:8080/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMsg(data.success ? "Verification email resent! Check your inbox." : (data.message || "Failed to resend. Try again."));
      if (data.success) {
        setResendCooldown(60);
        cooldownRef.current = setInterval(() => {
          setResendCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current); return 0; } return prev - 1; });
        }, 1000);
      }
    } catch {
      setResendMsg("Could not connect to server.");
    } finally { setResendLoading(false); }
  };

  const handleSemesterSubmit = async () => {
    if (!semName) { setSemError("Please select your current semester."); return; }
    const courses = semCourses.filter(c => c.name.trim());
    setSemSaving(true); setSemError("");
    try {
      await fetch("http://localhost:8080/api/grades/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${regToken}` },
        body: JSON.stringify({ semesterName: semName, courses: courses.flatMap(c => [{ courseCode: c.name.trim(), grade: "", credits: c.credits || 0, sectioncrn: c.sectioncrn || null }, ...(c.linkedSectionCrn ? [{ courseCode: c.name.trim(), grade: "", credits: 0, sectioncrn: c.linkedSectionCrn, componenttype: "Lab" }] : [])]) }),
      });
    } catch {}
    finally { setSemSaving(false); }
    setSuccess(true);
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .reg-btn:hover { background: color-mix(in srgb, var(--primary) 25%, transparent) !important; }
        .reg-btn { transition: background 0.15s; }
        .reg-input:focus { border-color: var(--border2) !important; outline: none; }
      `}</style>

      <div style={s.leftPanel}>
        <img src="/KourseKit.jpeg" alt="KourseKit" style={{ width:90, height:90, borderRadius:18, objectFit:"cover", marginBottom:20, zIndex:1 }} />
        <div style={s.brandName}>KourseKit</div>
        <div style={s.brandTagline}>Your AUB academic life,<br />organized.</div>

        <div style={s.featureList}>
          {["Grade Calculator", "Task Manager", "Study Planner", "Reviews"].map(f => (
            <div key={f} style={s.featurePill}>{f}</div>
          ))}
        </div>

        <div style={s.decorCircle1} />
        <div style={s.decorCircle2} />
      </div>

      <div style={s.rightPanel}>
        <div style={s.card}>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ marginBottom: 16 }}><PartyPopper size={52} color="#6C63FF" /></div>
              <h2 style={s.title}>You're all set!</h2>
              <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24, lineHeight: 1.6 }}>
                {postVerifyToken
                  ? "Your courses have been saved. You can now use KourseKit."
                  : "Your semester has been saved. You can now log in."}
              </p>
              <button className="reg-btn" onClick={onGoToLogin} style={s.btn}>
                {postVerifyToken ? "Go to Dashboard" : "Go to Login"}
              </button>
            </div>
          ) : checkEmail ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ marginBottom: 16 }}><Mail size={52} color="#31487A" /></div>
              <h2 style={s.title}>Check your email</h2>
              <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24, lineHeight: 1.6 }}>
                We sent a verification link to <strong>{email}</strong>.<br />
                Click the link to verify your account and set up your courses.<br />
                <span style={{ fontSize: 12, color: "var(--text3)" }}>The link expires in 15 minutes. Check your spam folder if you don't see it.</span>
              </p>
              {resendMsg && (
                <div style={{ fontSize: 13, color: resendMsg.includes("resent") ? "#2d7a4a" : "var(--error)", marginBottom: 14 }}>
                  {resendMsg}
                </div>
              )}
              {resendCooldown > 0
                ? <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 10 }}>Resend available in {resendCooldown}s</div>
                : <button className="reg-btn" onClick={handleResend} disabled={resendLoading}
                    style={{ ...s.btn, marginBottom: 10, opacity: resendLoading ? 0.7 : 1, cursor: resendLoading ? "not-allowed" : "pointer" }}>
                    {resendLoading ? "Sending…" : "Resend verification email"}
                  </button>
              }
              <button onClick={onGoToLogin}
                style={{ width: "100%", background: "none", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer", padding: "6px 0" }}>
                Go to Login
              </button>
            </div>
          ) : semStep ? (
            <div>
              {showTranscript && (
                <TranscriptModal
                  onClose={() => setShowTranscript(false)}
                  onApply={() => { setShowTranscript(false); setSuccess(true); }}
                />
              )}
              <h2 style={s.title}>One last step</h2>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>
                Tell us your current semester so we can set up your courses.
              </p>

              {semError && <div style={s.errorBox}>{semError}</div>}

              <label style={s.label}>Current Semester</label>
              <SemesterDropdown
                value={semName}
                onChange={val => { setSemName(val); setSemError(""); }}
                semesters={AUB_SEMESTERS}
              />

              <label style={s.label}>Your Courses <span style={{ fontWeight:400, color:"var(--text3)" }}>(optional)</span></label>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
                {semCourses.map(c => (
                  <div key={c.id} style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <div style={{ flex:1 }}>
                      <StudentCourses
                        value={{ code: c.name, sectioncrn: c.sectioncrn, sectionNumber: c.sectionNumber }}
                        onSelect={data => setSemCourses(p => p.map(r => r.id===c.id ? {...r, name:data.code, sectioncrn:data.sectioncrn, sectionNumber:data.sectionNumber, professorName:data.profname, credits:data.credits||0, linkedSectionCrn:data.linkedSectionCrn||null} : r))}
                        inputStyle={{ ...s.input, marginBottom:0 }}
                      />
                    </div>
                    {semCourses.length > 1 && (
                      <button onClick={() => setSemCourses(p => p.filter(r => r.id !== c.id))}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"var(--error)", fontSize:20, lineHeight:1, padding:"0 4px" }}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setSemCourses(p => [...p, { id:Date.now(), name:"" }])}
                style={{ fontSize:13, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", fontWeight:600, marginBottom:20, padding:0 }}>+ Add Course</button>

              <button className="reg-btn" onClick={handleSemesterSubmit} disabled={semSaving || !semName}
                style={{ ...s.btn, opacity: semSaving || !semName ? 0.7 : 1, cursor: semSaving || !semName ? "not-allowed" : "pointer", marginBottom:10 }}>
                {semSaving ? "Saving…" : "Get Started"}
              </button>
              <button onClick={() => setShowTranscript(true)}
                style={{ width:"100%", background:"none", border:"1px solid var(--border)", borderRadius:10, color:"var(--primary)", fontSize:13, fontWeight:600, cursor:"pointer", padding:"10px 0", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>
                Upload Transcript Instead
              </button>
              <button onClick={() => setSuccess(true)}
                style={{ width:"100%", background:"none", border:"none", color:"var(--text2)", fontSize:13, cursor:"pointer", padding:"6px 0" }}>
                Skip for now
              </button>
            </div>
          ) : (
            <>
              <h2 style={s.title}>Create an account</h2>
              <p style={s.subtitle}>Register with your AUB email to get started</p>

              {error && <div style={s.errorBox}>{error}</div>}

              <label style={s.label}>AUB Email</label>
              <input
                className="reg-input"
                style={s.input}
                type="email"
                placeholder="yourname@mail.aub.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handle()}
              />

              <label style={s.label}>Password</label>
              <div style={{ position:"relative", marginBottom:16 }}>
                <input
                  className="reg-input"
                  style={{ ...s.input, marginBottom:0, paddingRight:42 }}
                  type={showpass ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onFocus={() => setpassfocused(true)}
                  onKeyDown={e => e.key === "Enter" && handle()}
                />
                <button type="button" onClick={() => setshowpass(v => !v)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text2)", padding:0, display:"flex", alignItems:"center" }}>
                  {showpass
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              {(passfocused || password.length > 0) && (
                <div style={s.reqBox}>
                  {requirements.map(r => {
                    const met = r.test(password);
                    return (
                      <div key={r.label} style={{ ...s.reqRow, color: met ? "#2e7d32" : "#7a8fa8" }}>
                        <span style={{ marginRight: 7, fontSize: 13 }}>{met ? "✓" : "○"}</span>
                        {r.label}
                      </div>
                    );
                  })}
                </div>
              )}

              <label style={s.label}>Confirm Password</label>
              <input
                className="reg-input"
                style={{
                  ...s.input,
                  borderColor: confirmWrong ? "#e74c3c" : confirmMatch ? "#2e7d32" : "#D4D4DC",
                }}
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handle()}
              />
              {confirmWrong && (
                <p style={{ fontSize: 12, color: "#e74c3c", marginTop: -10, marginBottom: 12 }}>
                  Passwords don't match
                </p>
              )}
              {confirmMatch && (
                <p style={{ fontSize: 12, color: "#2e7d32", marginTop: -10, marginBottom: 12 }}>
                  Passwords match ✓
                </p>
              )}

              <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, cursor:"pointer", fontSize:13, color:"var(--text2)", userSelect:"none" }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  style={{ width:15, height:15, accentColor:"var(--primary)", cursor:"pointer" }} />
                Remember Me
              </label>

              <button className="reg-btn" onClick={handle} disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Creating account…" : "Create Account"}
              </button>

              <p style={s.loginLink}>
                Already have an account?{" "}
                <span
                  onClick={onGoToLogin}
                  style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
                >
                  Sign in
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" },

  leftPanel: {
    width: 420, background: "#31487A", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: 48, position: "relative", overflow: "hidden", flexShrink: 0,
  },
  brandMark: {
    width: 60, height: 60, borderRadius: 16, background: "#7B5EA7",
    color: "white", fontFamily: "'Fraunces', serif", fontWeight: 700,
    fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16, zIndex: 1,
  },
  brandName: {
    fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 32,
    color: "#ffffff", marginBottom: 16, zIndex: 1,
  },
  brandTagline: {
    fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 17,
    color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.6,
    marginBottom: 28, zIndex: 1,
  },
  featureList: { display: "flex", flexDirection: "column", gap: 10, zIndex: 1, width: "100%" },
  featurePill: {
    background: "rgba(255,255,255,0.1)", borderRadius: 10,
    padding: "10px 16px", fontSize: 13, color: "#D9E1F1",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  decorCircle1: {
    position: "absolute", width: 300, height: 300, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.07)", bottom: -80, right: -80,
  },
  decorCircle2: {
    position: "absolute", width: 200, height: 200, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.05)", top: -60, left: -60,
  },

  rightPanel: {
    flex: 1, background: "var(--bg)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
  },
  card: {
    background: "var(--surface)", borderRadius: 20, padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(49,72,122,0.1)", width: "100%", maxWidth: 420,
  },
  title: {
    fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 26,
    color: "var(--primary)", marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: "var(--text2)", marginBottom: 24 },
  errorBox: {
    background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, color: "var(--error)", marginBottom: 16,
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 },
  input: {
    width: "100%", padding: "11px 14px", border: "1px solid var(--border)",
    borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: "var(--text)", background: "var(--surface2)", marginBottom: 16, display: "block",
    transition: "border-color 0.15s",
  },
  reqBox: {
    background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "10px 14px", marginBottom: 16, marginTop: -8,
  },
  reqRow: {
    fontSize: 12, fontWeight: 500, padding: "2px 0", display: "flex", alignItems: "center",
  },
  btn: {
    width: "100%", padding: "13px", background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4,
  },
  loginLink: { textAlign: "center", fontSize: 13, color: "var(--text2)", marginTop: 20 },
};
