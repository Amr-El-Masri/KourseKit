import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";

export default function App() {
  const [page, setPage] = useState(
    localStorage.getItem("kk_token") ? "dashboard" : "login"
  );

  return (
    <>
      {page === "login"     && <Login     onLogin={() => setPage("dashboard")} onGoToRegister={() => setPage("register")} />}
      {page === "register"  && <Register  onRegister={() => setPage("dashboard")} onGoToLogin={() => setPage("login")} />}
      {page === "dashboard" && <Dashboard onLogout={() => { localStorage.removeItem("kk_token"); localStorage.removeItem("kk_email"); setPage("login"); }} />}
    </>
  );
}
