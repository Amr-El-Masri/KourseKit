import { useState } from "react";

export default function Register({ onRegister, onGoToLogin }) {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  const handle = () => {
    if (!email || !password || !confirm) { setError("Please fill in all fields."); return; }
    if (!email.endsWith("@mail.aub.edu")) { setError("Please use your AUB email (@mail.aub.edu)."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setSuccess(true);
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
        <div style={s.brandMark}>K</div>
        <div style={s.brandName}>KourseKit</div>
        <div style={s.brandTagline}>Join thousands of AUB<br />students staying on track.</div>

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
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
              <h2 style={s.title}>You're registered!</h2>
              <p style={{ fontSize: 14, color: "#7a8fa8", marginBottom: 28, lineHeight: 1.6 }}>
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
              <input
                className="reg-input"
                style={s.input}
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handle()}
              />

              <label style={s.label}>Confirm Password</label>
              <input
                className="reg-input"
                style={s.input}
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handle()}
              />

              <button className="reg-btn" onClick={handle} style={s.btn}>
                Create Account
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
  btn: {
    width: "100%", padding: "13px", background: "#31487A", color: "white",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4,
  },
  loginLink: { textAlign: "center", fontSize: 13, color: "#7a8fa8", marginTop: 20 },
};
