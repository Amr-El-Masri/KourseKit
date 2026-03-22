import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./ThemeContext";

const API = "http://localhost:8080";

const passrequirements = [
  { label: "At least 8 characters",     test: p => p.length >= 8 },
  { label: "One uppercase letter (A-Z)", test: p => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)", test: p => /[a-z]/.test(p) },
  { label: "One number (0-9)",           test: p => /\d/.test(p) },
  { label: "One special character",      test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function Settings({ onLogout }) {
  const email = localStorage.getItem("kk_email") || "student@mail.aub.edu";
  const { theme } = useTheme();

  const [emailReminders, setEmailReminders] = useState(
    localStorage.getItem("kk_email_reminders") !== "false"
  );
  const [notifPrefs, setNotifPrefs] = useState({ overdue: true, dueToday: true, threeDays: true });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("kk_token");
    if (!token) return;
    fetch(`${API}/api/profile/notification-prefs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setNotifPrefs(d); })
      .catch(() => {});
  }, []);

  const toggleNotifPref = async (key) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    try {
      const token = localStorage.getItem("kk_token");
      await fetch(`${API}/api/profile/notification-prefs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      });
    } catch { setNotifPrefs(notifPrefs); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("kk_token");
      const res = await fetch(`${API}/api/profile`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        Object.keys(localStorage).filter(k => k.startsWith("kk_")).forEach(k => localStorage.removeItem(k));
        onLogout();
      }
    } catch { setDeleting(false); }
  };

  const [changing,    setChanging]    = useState(false);
  const [current,     setCurrent]     = useState("");
  const [newpass,     setNewpass]     = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [passerror,   setPasserror]   = useState("");
  const [passsuccess, setPasssuccess] = useState(false);
  const [passloading, setPassloading] = useState(false);
  const [newpass2,    setNewpass2]    = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);

  const newpassok    = passrequirements.every(r => r.test(newpass));
  const confirmmatch = confirm.length > 0 && newpass === confirm;
  const confirmwrong = confirm.length > 0 && newpass !== confirm;

  const toggleEmailReminders = async () => {
    const newValue = !emailReminders;
    setEmailReminders(newValue);
    localStorage.setItem("kk_email_reminders", String(newValue));
    try {
      const token = localStorage.getItem("kk_token");
      await fetch(`${API}/api/profile/email-reminders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ emailRemindersEnabled: newValue }),
      });
    } catch {
      setEmailReminders(!newValue);
    }
  };

  const handleChangePassword = async () => {
    if (!current || !newpass || !confirm) { setPasserror("Please fill in all fields."); return; }
    if (!newpassok)          { setPasserror("New password does not meet the requirements."); return; }
    if (newpass !== confirm) { setPasserror("Passwords don't match."); return; }
    setPassloading(true);
    try {
      const res  = await fetch(`${API}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("kk_token")}` },
        body: JSON.stringify({ email, currentpass: current, newpass }),
      });
      const data = await res.json();
      if (data.success) {
        setPasssuccess(true);
        setChanging(false);
        setCurrent(""); setNewpass(""); setConfirm(""); setPasserror("");
        setTimeout(() => setPasssuccess(false), 3000);
      } else {
        setPasserror(data.message || "Failed to change password.");
      }
    } catch {
      setPasserror("Could not connect to server.");
    } finally {
      setPassloading(false);
    }
  };

  const row = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid var(--border)",
  };

  const label = { fontSize: 13, fontWeight: 500, color: "var(--accent2)" };
  const sub   = { fontSize: 11, color: "var(--text2)", marginTop: 2 };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    border: "1px solid var(--border)", borderRadius: 8,
    padding: "9px 12px", fontSize: 13,
    background: "var(--surface2)", color: "var(--text)",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    marginBottom: 14,
  };

  const eyeBtn = {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text2)", padding: 0, display: "flex", alignItems: "center",
  };

  const eyeOff = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
  const eyeOn  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <div style={{ padding: "32px 36px", fontFamily: "'DM Sans', sans-serif", maxWidth: 860 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 24, color: "var(--primary)", marginBottom: 24 }}>
        Account Settings
      </div>

      {/* Appearance */}
      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Appearance</div>
        <div style={row}>
          <div>
            <div style={label}>{theme === "light" ? "Light Mode" : "Dark Mode"}</div>
            <div style={sub}>Switch to {theme === "light" ? "dark" : "light"} mode</div>
          </div>
          <ThemeToggle showLabel={false} />
        </div>
      </div>

      {/* Notifications */}
      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Notifications</div>
        {[
          { key: "emailReminders", label: "Email Reminders", desc: "Receive email notifications for upcoming deadlines", value: emailReminders, toggle: toggleEmailReminders },
          { key: "overdue",    label: "Overdue alerts",       desc: "Notify when a task deadline has passed",         value: notifPrefs.overdue,    toggle: () => toggleNotifPref("overdue") },
          { key: "dueToday",  label: "Due today",             desc: "Notify on the day a task is due",               value: notifPrefs.dueToday,   toggle: () => toggleNotifPref("dueToday") },
          { key: "threeDays", label: "Due in 3 days",         desc: "Notify 3 days before a deadline",               value: notifPrefs.threeDays,  toggle: () => toggleNotifPref("threeDays") },
        ].map(({ key, label: lbl, desc, value, toggle }, i, arr) => (
          <div key={key} style={{ ...row, ...(i === arr.length - 1 ? { borderBottom: "none" } : {}) }}>
            <div>
              <div style={label}>{lbl}</div>
              <div style={sub}>{desc}</div>
            </div>
            <button onClick={toggle} style={{ width: 46, height: 26, borderRadius: 13, border: "none", outline: "none", padding: 0, cursor: "pointer", flexShrink: 0, background: value ? "var(--accent)" : "#b0b8c8", position: "relative", transition: "background 0.2s" }}>
              <span style={{ position: "absolute", top: 3, left: value ? 24 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s", display: "block" }} />
            </button>
          </div>
        ))}
      </div>

      {/* Account */}
      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "20px 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Account</div>

        <div style={row}>
          <div style={label}>AUB Email</div>
          <span style={{ fontWeight: 600, color: "var(--primary)", fontSize: 13 }}>{email}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
          {passsuccess && <span style={{ fontSize: 12, color: "#2d7a4a", fontWeight: 600 }}>Updated</span>}
          <button
            onClick={() => { setChanging(c => !c); setPasserror(""); }}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginLeft: "auto" }}
          >
            {changing ? "Cancel" : "Change Password"}
          </button>
        </div>

        {changing && (
          <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            {passerror && (
              <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--error)", marginBottom: 12 }}>
                {passerror}
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Password</div>
            <div style={{ position: "relative", marginBottom: 0 }}>
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={e => { setCurrent(e.target.value); setPasserror(""); }}
                placeholder="Enter current password"
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} style={eyeBtn}>
                {showCurrent ? eyeOff : eyeOn}
              </button>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>New Password</div>
            <div style={{ position: "relative", marginBottom: 0 }}>
              <input
                type={showNew ? "text" : "password"}
                value={newpass}
                onChange={e => { setNewpass(e.target.value); setPasserror(""); }}
                onFocus={() => setNewpass2(true)}
                placeholder="Create a new password"
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowNew(v => !v)} style={eyeBtn}>
                {showNew ? eyeOff : eyeOn}
              </button>
            </div>

            {(newpass2 || newpass.length > 0) && (
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, marginTop: -8 }}>
                {passrequirements.map(r => {
                  const met = r.test(newpass);
                  return (
                    <div key={r.label} style={{ fontSize: 11, fontWeight: 500, color: met ? "#2e7d32" : "var(--text2)", padding: "2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{met ? "✓" : "○"}</span>{r.label}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Confirm New Password</div>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setPasserror(""); }}
              onKeyDown={e => e.key === "Enter" && handleChangePassword()}
              placeholder="Re-enter your new password"
              style={{ ...inputStyle, borderColor: confirmwrong ? "#e74c3c" : confirmmatch ? "#2e7d32" : "var(--border)" }}
            />
            {confirmwrong && <p style={{ fontSize: 11, color: "#e74c3c", marginTop: -10, marginBottom: 12 }}>Passwords don't match</p>}
            {confirmmatch && <p style={{ fontSize: 11, color: "#2e7d32", marginTop: -10, marginBottom: 12 }}>Passwords match</p>}

            <button
              onClick={handleChangePassword}
              disabled={passloading}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 9, border: "none",
                background: "var(--primary)", color: "#fff", fontSize: 13,
                fontWeight: 700, cursor: passloading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", opacity: passloading ? 0.7 : 1,
              }}
            >
              {passloading ? "Saving..." : "Update Password"}
            </button>
          </div>
        )}
      </div>

      {/* Account Deletion */}
      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--error-border)", padding: "20px 24px", marginBottom: 20, marginTop: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--error)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Account Deletion</div>
        {!deleteConfirm ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={label}>Delete Account</div>
              <div style={sub}>Permanently delete your account and all data. This cannot be undone.</div>
            </div>
            <button onClick={() => setDeleteConfirm(true)} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--error-border)", background: "var(--error-bg)", color: "var(--error)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
              Delete Account
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: "var(--error)", fontWeight: 600, marginBottom: 12 }}>Are you sure? This will permanently delete your account and all your data.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDeleteAccount} disabled={deleting} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: "var(--error)", color: "white", fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button onClick={() => setDeleteConfirm(false)} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text2)", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--error-bg)", border: "1px solid var(--error-border)",
            borderRadius: 10, padding: "10px 20px",
            color: "var(--error)", fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
