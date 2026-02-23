import { useState } from "react";
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
      localStorage.removeItem("kk_token");
      localStorage.removeItem("kk_email");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("kk_token");
    localStorage.removeItem("kk_email");
    return false;
  }
}

export default function App() {
  const [page, setPage] = useState(
    resettoken  ? "reset-password" :
    verifytoken ? "verify-email"   :
    hasValidToken() ? "dashboard" : "login"
  );
  const [prefillEmail, setPrefillEmail] = useState("");

  const goToLogin = () => {
    window.history.replaceState({}, document.title, "/");
    setPage("login");
  };

  const onVerified = (email) => {
    setPrefillEmail(email);
    window.history.replaceState({}, document.title, "/");
    setPage("login");
  };

  return (
    <>
      {page === "login"          && <Login         onLogin={() => setPage("dashboard")} onGoToRegister={() => setPage("register")} onGoToForgotPassword={() => setPage("forgot-password")} prefillEmail={prefillEmail} />}
      {page === "register"       && <Register       onRegister={() => setPage("dashboard")} onGoToLogin={goToLogin} />}
      {page === "dashboard"      && <Dashboard      onLogout={() => { localStorage.removeItem("kk_token"); localStorage.removeItem("kk_email"); setPage("login"); }} />}
      {page === "forgot-password"&& <ForgotPassword onGoToLogin={goToLogin} />}
      {page === "reset-password" && <ResetPassword  token={resettoken} onGoToLogin={(email) => { setPrefillEmail(email || ""); goToLogin(); }} />}
      {page === "verify-email"   && <VerifyEmail    token={verifytoken} onVerified={onVerified} onGoToLogin={goToLogin} />}
    </>
  );
}
