import { useState, useEffect } from "react";
import { ArrowLeft, Users } from "lucide-react";

const API_BASE = "http://localhost:8080";
function getToken() { return localStorage.getItem("kk_token"); }
async function apiFetch(path, options = {}) {
  const t = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(t && { Authorization: `Bearer ${t}` }) },
    ...options,
  });
  if (res.status === 204) return null;
  return res.json();
}

export default function GroupRoomPage({ group, onBack }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    apiFetch(`/api/study-groups/${group.id}/members`)
      .then(data => setMembers(data || []))
      .catch(() => {});
  }, [group.id]);

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 960, fontFamily: "'DM Sans',sans-serif" }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--primary)", fontFamily: "'DM Sans',sans-serif", marginBottom: 24 }}
      >
        <ArrowLeft size={15} /> Back to Study Groups
      </button>

      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 24, color: "var(--primary)", marginBottom: 4 }}>
        {group.name}
      </div>
      <div style={{ fontSize: 13, color: "var(--accent2)", marginBottom: 24 }}>{group.courseName}</div>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ width: 220, flexShrink: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Members ({members.length})
          </div>
          {members.map(m => (
            <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--blue-light-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                {m.firstName?.[0]}{m.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{m.firstName} {m.lastName}</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13, minHeight: 300 }}>
          Chat coming soon
        </div>
      </div>
    </div>
  );
}