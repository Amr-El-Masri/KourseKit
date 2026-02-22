import { useState } from "react";

export default function ForgotPassword({ onGoToLogin }) {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email) { setError("Please enter your email"); return; }
    if (!email.endsWith("@mail.aub.edu")) { setError("Please use your AUB email"); return; }

    setLoading(true);
    try {
      const res  = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (e) {
      setError("Could not connect to server");
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
        .fp-btn:hover { background: #221866 !important; }
        .fp-btn { transition: background 0.15s; }
        .fp-input:focus { border-color: #8FB3E2 !important; outline: none; }
      `}</style>

      <div style={s.leftPanel}>
        <div style={s.brandMark}>K</div>
        <div style={s.brandName}>KourseKit</div>
        <div style={s.brandTagline}>Your academic life,<br />organized.</div>
        <div style={s.decorCircle1} />
        <div style={s.decorCircle2} />
      </div>

      <div style={s.rightPanel}>
        <div style={s.card}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#31487A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" fill="#eef2f9" stroke="#31487A"/>
                  <polyline points="2,4 12,13 22,4"/>
                </svg>
              </div>
              <h2 style={s.title}>Check your email</h2>
              <p style={{ fontSize: 14, color: "#7a8fa8", lineHeight: 1.7, marginBottom: 28 }}>
                A password reset link has been sent to <strong>{email}</strong>.<br />
                It expires in 30 minutes.
              </p>
              <button className="fp-btn" onClick={onGoToLogin} style={s.btn}>
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <h2 style={s.title}>Forgot Password?</h2>
              <p style={s.subtitle}>Enter your AUB email and we'll send you a reset link</p>

              {error && <div style={s.errorBox}>{error}</div>}

              <label style={s.label}>AUB Email</label>
              <input
                className="fp-input"
                style={s.input}
                type="email"
                placeholder="yourname@mail.aub.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handle()}
              />

              <button
                className="fp-btn"
                onClick={handle}
                disabled={loading}
                style={{ ...s.btn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>

              <p style={s.backLink}>
                <span onClick={onGoToLogin} style={{ color: "#31487A", fontWeight: 600, cursor: "pointer" }}>
                  ← Back to Login
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
    flex: 1, background: "#F4F4F8",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
  },
  card: {
    background: "#ffffff", borderRadius: 20, padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(30,58,110,0.1)", width: "100%", maxWidth: 400,
  },
  title: {
    fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 26,
    color: "#31487A", marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: "#7a8fa8", marginBottom: 28 },
  errorBox: {
    background: "#fef0f0", border: "1px solid #f5c6c6", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, color: "#c0392b", marginBottom: 16,
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#2d3a4a", marginBottom: 6 },
  input: {
    width: "100%", padding: "11px 14px", border: "1px solid #D4D4DC",
    borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: "#2d3a4a", background: "#F7F5FB", marginBottom: 18, display: "block",
    transition: "border-color 0.15s",
  },
  btn: {
    width: "100%", padding: "13px", background: "#31487A", color: "white",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4,
  },
  backLink: { textAlign: "center", fontSize: 13, color: "#7a8fa8", marginTop: 20 },
};
