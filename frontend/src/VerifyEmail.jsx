import { useState, useEffect, useRef } from "react";
import { LoaderCircle, MailCheck, MailWarning } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

export default function VerifyEmail({ token, onVerified, onGoToLogin }) {
  const [status, setStatus] = useState("loading"); // loading then success then error
  const [error,  setError]  = useState("");
  const didRun = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation which would mark the
    // token as used on the first call and produce a false "already used" error
    // on the second call, causing a brief flash of the failure state.
    if (didRun.current) return;
    didRun.current = true;

    if (!token) {
      setStatus("error");
      setError("No token");
      return;
    }

    fetch(`${API}/api/auth/verify?token=` + encodeURIComponent(token))
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus("success");
          setTimeout(() => onVerified(data.email, data.token), 1500);
        } else {
          setStatus("error");
          setError(data.message || "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Could not reach the server");
      });
  }, []);

  const icon    = status === "loading" ? <LoaderCircle size={52} color="#A59AC9" /> : status === "success" ? <MailCheck size={52} color="#2d7a4a" /> : <MailWarning size={52} color="#c0392b" />;
  const title   = status === "loading" ? "Verifying your email…"
                : status === "success" ? "Email Verified!"
                : "Verification Failed";
  const message = status === "loading" ? "Please wait a moment."
                : status === "success" ? "Your account is ready. Redirecting to login…"
                : error;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .ve-btn:hover { background: var(--primary2) !important; }
        .ve-btn { transition: background 0.15s; }
      `}</style>

      <div style={s.leftPanel}>
        <img src="/logo.png" alt="KourseKit" style={{ width:72, height:72, objectFit:"contain", marginBottom:4 }} />
        <div style={s.brandName}>KourseKit</div>
        <div style={s.brandTagline}>Your academic life,<br />organized.</div>
        <div style={s.decorCircle1} />
        <div style={s.decorCircle2} />
      </div>

      <div style={s.rightPanel}>
        <div style={{ ...s.card, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
            <img src="/logo.png" alt="KourseKit" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: "var(--primary)" }}>KourseKit</span>
          </div>
          <div style={{ marginBottom: 16 }}>{icon}</div>
          <h2 style={s.title}>{title}</h2>
          <p style={s.msg}>{message}</p>

          {status === "error" && (
            <button className="ve-btn" onClick={onGoToLogin} style={s.btn}>
              Go to Login
            </button>
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
    flex: 1, background: "var(--bg)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
  },
  card: {
    background: "var(--surface)", borderRadius: 20, padding: "48px 40px",
    boxShadow: "0 4px 24px rgba(30,58,110,0.1)", width: "100%", maxWidth: 400,
  },
  title: {
    fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 26,
    color: "var(--primary)", marginBottom: 12,
  },
  msg: { fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 24 },
  btn: {
    padding: "13px 32px", background: "var(--primary)", color: "white",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
};
