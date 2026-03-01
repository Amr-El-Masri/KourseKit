import { useState } from "react";
import { PartyPopper } from "lucide-react";

const requirements = [
  { label: "At least 8 characters",       test: p => p.length >= 8 },
  { label: "One uppercase letter (A-Z)",   test: p => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)",   test: p => /[a-z]/.test(p) },
  { label: "One number (0-9)",             test: p => /\d/.test(p) },
  { label: "One special character",        test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function Register({ onGoToLogin }) {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  const [loading,      setLoading]      = useState(false);
  const [passfocused,  setpassfocused]  = useState(false);
  const [showpass,     setshowpass]     = useState(false);

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
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message?.replace(/^error:\s*/i, "") || "Registration failed.");
      }
    } catch (e) {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .reg-btn:hover { background: #221866 !important; }
        .reg-btn { transition: background 0.15s; }
        .reg-input:focus { border-color: #8FB3E2 !important; outline: none; }
      `}</style>

      <div style={s.leftPanel}>
        <img src="/logo.png" alt="KourseKit" style={{ width:72, height:72, objectFit:"contain", marginBottom:4 }} />
        <div style={s.brandName}>KourseKit</div>
        <div style={s.brandTagline}>Your AUB academic life,<br />organized.</div>

        <div style={s.featureList}>
          {["Grade Calculator", "Task Manager", "Semester Planner", "Anonymous Reviews"].map(f => (
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
              <h2 style={s.title}>You're registered!</h2>
              <p style={{ fontSize: 14, color: "#7a8fa8", marginBottom: 12, lineHeight: 1.6 }}>
                Your account has been created. You can now log in with your AUB email.
              </p>
              <button className="reg-btn" onClick={onGoToLogin} style={s.btn}>
                Go to Login
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
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#A59AC9", padding:0, display:"flex", alignItems:"center" }}>
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

              <button className="reg-btn" onClick={handle} disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Creating account…" : "Create Account"}
              </button>

              <p style={s.loginLink}>
                Already have an account?{" "}
                <span
                  onClick={onGoToLogin}
                  style={{ color: "#31487A", fontWeight: 600, cursor: "pointer" }}
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
    flex: 1, background: "#F4F4F8",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
  },
  card: {
    background: "#ffffff", borderRadius: 20, padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(49,72,122,0.1)", width: "100%", maxWidth: 420,
  },
  title: {
    fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 26,
    color: "#31487A", marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: "#7a8fa8", marginBottom: 24 },
  errorBox: {
    background: "#fef0f0", border: "1px solid #f5c6c6", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, color: "#c0392b", marginBottom: 16,
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#2a2050", marginBottom: 6 },
  input: {
    width: "100%", padding: "11px 14px", border: "1px solid #D4D4DC",
    borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: "#2a2050", background: "#F7F5FB", marginBottom: 16, display: "block",
    transition: "border-color 0.15s",
  },
  reqBox: {
    background: "#f7f5fb", border: "1px solid #e2ddf0", borderRadius: 10,
    padding: "10px 14px", marginBottom: 16, marginTop: -8,
  },
  reqRow: {
    fontSize: 12, fontWeight: 500, padding: "2px 0", display: "flex", alignItems: "center",
  },
  btn: {
    width: "100%", padding: "13px", background: "#31487A", color: "white",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4,
  },
  loginLink: { textAlign: "center", fontSize: 13, color: "#7a8fa8", marginTop: 20 },
};
