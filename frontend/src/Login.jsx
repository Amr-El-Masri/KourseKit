import { useState } from "react";

export default function Login({ onLogin, onGoToRegister, onGoToForgotPassword, prefillEmail }) {
  const [email, setEmail]           = useState(prefillEmail || localStorage.getItem("kk_remembered_email") || "");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [showPassword, setShowPw]   = useState(false);
  const [rememberMe,   setRememberMe] = useState(false);

  const handle = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (!email.endsWith("@mail.aub.edu")) { setError("Please use your AUB email"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    try {
      const res  = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        const previousEmail = localStorage.getItem("kk_email");
        if (previousEmail && previousEmail !== email) {
          Object.keys(localStorage).filter(k => k.startsWith("kk_") && !k.startsWith("kk_e2ee_")).forEach(k => localStorage.removeItem(k));
        }
        localStorage.setItem("kk_token", data.token);
        localStorage.setItem("kk_email", email);
        if (rememberMe) localStorage.setItem("kk_remembered_email", email);
        else localStorage.removeItem("kk_remembered_email");
        onLogin();
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch (e) {
      setError("Could not connect to server.");
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .login-btn:hover { background: color-mix(in srgb, var(--primary) 25%, transparent) !important; }
        .login-btn { transition: background 0.15s; }
        .login-input:focus { border-color: var(--border2) !important; outline: none; }
      `}</style>

      <div style={s.leftPanel}>
        <img src="/KourseKit.jpeg" alt="KourseKit" style={{ width:90, height:90, borderRadius:18, objectFit:"cover", marginBottom:20, zIndex:1 }} />
        <div style={s.brandName}>KourseKit</div>
        <div style={s.brandTagline}>Your AUB academic life,<br />organized.</div>
        <div style={s.decorCircle1} />
        <div style={s.decorCircle2} />
      </div>

      <div style={s.rightPanel}>
        <div style={s.card}>
          <h2 style={s.title}>Welcome back</h2>
          <p style={s.subtitle}>Sign in with your AUB email to continue</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <label style={s.label}>Email</label>
          <input
            className="login-input"
            style={s.input}
            type="email"
            placeholder="yourname@mail.aub.edu"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handle()}
          />

          <label style={s.label}>Password</label>
          <div style={{ position:"relative", marginBottom:18 }}>
            <input
              className="login-input"
              style={{ ...s.input, marginBottom:0, paddingRight:42 }}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handle()}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text2)", padding:0, display:"flex", alignItems:"center" }}>
              {showPassword
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>

          <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, cursor:"pointer", fontSize:13, color:"var(--text2)", userSelect:"none" }}>
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
              style={{ width:15, height:15, accentColor:"var(--primary)", cursor:"pointer" }} />
            Remember Me
          </label>

          <button className="login-btn" onClick={handle} style={s.btn}>
            Sign In
          </button>

          <p style={{ textAlign: "center", fontSize: 13, marginTop: 14 }}>
            <span onClick={onGoToForgotPassword} style={{ color: "var(--accent)", fontWeight: 500, cursor: "pointer" }}>
              Forgot Password?
            </span>
          </p>

          <p style={s.registerLink}>
            Don't have an account?{" "}
            <span onClick={onGoToRegister} style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>
              Register
            </span>
          </p>
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
    fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 18,
    color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 1.6, zIndex: 1,
  },
  decorCircle1: {
    position: "absolute", width: 300, height: 300, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.08)", bottom: -80, right: -80,
  },
  decorCircle2: {
    position: "absolute", width: 200, height: 200, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.06)", top: -60, left: -60,
  },

  rightPanel: {
    flex: 1, background: "var(--bg)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
  },
  card: {
    background: "var(--surface)", borderRadius: 20, padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(30,58,110,0.1)", width: "100%", maxWidth: 400,
  },
  title: {
    fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 26,
    color: "var(--primary)", marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: "var(--text2)", marginBottom: 28 },
  errorBox: {
    background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, color: "var(--error)", marginBottom: 16,
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 },
  input: {
    width: "100%", padding: "11px 14px", border: "1px solid var(--border)",
    borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: "var(--text)", background: "var(--surface2)", marginBottom: 18, display: "block",
    transition: "border-color 0.15s",
  },
  btn: {
    width: "100%", padding: "13px", background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4,
  },
  registerLink: { textAlign: "center", fontSize: 13, color: "var(--text2)", marginTop: 20 },
};
