import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import VerifyEmail from "./VerifyEmail";

const params      = new URLSearchParams(window.location.search);
const resettoken  = params.get("reset_token");
const verifytoken = params.get("verify_token");

function hasValidToken() {
  const kk_token = localStorage.getItem("kk_token");
  if (!kk_token) return false;
  try {
    const payload = JSON.parse(atob(kk_token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      Object.keys(localStorage).filter(k => k.startsWith("kk_")).forEach(k => localStorage.removeItem(k));
      return false;
    }
    return true;
  } catch {
    Object.keys(localStorage).filter(k => k.startsWith("kk_")).forEach(k => localStorage.removeItem(k));
    return false;
  }
}

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

async function tryRefreshToken() {
  const token = localStorage.getItem("kk_token");
  if (!token) return;
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) localStorage.setItem("kk_token", data.token);
    }
  } catch {}
}

export default function App() {
  const [page, setPage] = useState(
    resettoken  ? "reset-password" :
    verifytoken ? "verify-email"   :
    hasValidToken() ? "dashboard" : "login"
  );
  const [prefillEmail, setPrefillEmail] = useState("");
  const [postVerifyToken, setPostVerifyToken] = useState(null);

  useEffect(() => {
    if (hasValidToken()) tryRefreshToken();
  }, []);

  const goToLogin = () => {
    window.history.replaceState({}, document.title, "/");
    setPage("login");
  };

  const onVerified = (email, token) => {
    window.history.replaceState({}, document.title, "/");
    if (token) {
      // Store the JWT so TranscriptModal and semester-save API calls work
      localStorage.setItem("kk_token", token);
      localStorage.setItem("kk_email", email);
      setPostVerifyToken(token);
      setPage("semester-setup");
    } else {
      setPrefillEmail(email);
      setPage("login");
    }
  };

  const logout = () => {
    const keepKeys = [...["kk_course_colors","kk_colorMap"], ...Object.keys(localStorage).filter(k => k.startsWith("kk_schedule_onboarded_"))]; const saved = Object.fromEntries(keepKeys.map(k => [k, localStorage.getItem(k)]).filter(([,v]) => v)); Object.keys(localStorage).filter(k => k.startsWith("kk_")).forEach(k => localStorage.removeItem(k)); Object.entries(saved).forEach(([k,v]) => localStorage.setItem(k,v));
    setPage("login");
  };

  return (
    <>
      {page === "login"          && <Login         onLogin={() => setPage("dashboard")} onGoToRegister={() => setPage("register")} onGoToForgotPassword={() => setPage("forgot-password")} prefillEmail={prefillEmail} />}
      {page === "register"       && <Register       onGoToLogin={goToLogin} />}
      {page === "semester-setup" && <Register       postVerifyToken={postVerifyToken} onGoToLogin={() => setPage("dashboard")} />}
      {page === "dashboard"      && <Dashboard      onLogout={logout} />}
      {page === "forgot-password"&& <ForgotPassword onGoToLogin={goToLogin} />}
      {page === "reset-password" && <ResetPassword  token={resettoken} onGoToLogin={(email) => { setPrefillEmail(email || ""); goToLogin(); }} />}
      {page === "verify-email"   && <VerifyEmail    token={verifytoken} onVerified={onVerified} onGoToLogin={goToLogin} />}
    </>
  );
}
