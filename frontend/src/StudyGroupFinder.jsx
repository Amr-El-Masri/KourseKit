import { useState, useEffect } from "react";
import { Users, Lock, Globe, Plus, ArrowRight, Search, X, Copy, Check } from "lucide-react";
import GroupRoomPage from "./GroupRoomPage";

const API_BASE = "http://localhost:8080";

function getToken() { return localStorage.getItem("kk_token"); }

async function apiFetch(path, options = {}) {
  try {
    const t = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(t && { Authorization: `Bearer ${t}` }),
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
    } catch (e) {
    throw e;
  }
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 3, height: 18, background: "var(--accent)", borderRadius: 2 }} />
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {children}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 48 }}>
      <div style={{
        width: 28, height: 28, border: "3px solid var(--border)",
        borderTopColor: "var(--primary)", borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text3)", fontSize: 13 }}>
      {message}
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "var(--error-bg)", border: "1px solid var(--error-border)",
      borderRadius: 10, padding: "10px 14px", marginBottom: 16,
      fontSize: 13, color: "var(--error)",
    }}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 0, marginLeft: 10 }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function StudyGroupCard({ group, onJoin, isMyGroup }) {
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    await onJoin(group.id);
    setJoining(false);
  };

  return (
    <div className="sg-card" style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "16px 18px",
      boxShadow: "0 2px 10px rgba(49,72,122,0.06)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 15, color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {group.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--accent2)", marginTop: 2, fontWeight: 500 }}>
            {group.courseName}
          </div>
        </div>
        <span style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
          background: group.isPrivate ? "var(--surface3)" : "var(--blue-light-bg)",
          color: group.isPrivate ? "var(--accent2)" : "var(--primary)",
          flexShrink: 0,
        }}>
          {group.isPrivate ? <Lock size={10} /> : <Globe size={10} />}
          {group.isPrivate ? "Private" : "Public"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--text2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={12} />
          {group.memberCount}{group.maxMembers ? ` / ${group.maxMembers}` : ""} members
        </span>
        <span>Host: {group.hostFirstName} {group.hostLastName}</span>
      </div>

      {!isMyGroup && (
        <button
          onClick={handleJoin}
          disabled={joining || group.memberCount >= group.maxMembers}
          style={{
            marginTop: 4,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 0", borderRadius: 9,
            border: group.memberCount >= group.maxMembers ? "1px solid var(--border)" : "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            background: group.memberCount >= group.maxMembers ? "var(--surface2)" : "color-mix(in srgb, var(--primary) 15%, transparent)",
            color: group.memberCount >= group.maxMembers ? "var(--text2)" : "var(--primary)",
            fontSize: 13, fontWeight: 600, cursor: group.memberCount >= group.maxMembers ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans',sans-serif",
            opacity: joining ? 0.7 : 1,
            transition: "background 0.15s",
          }}
        >
          {joining ? "Joining…" : group.memberCount >= group.maxMembers ? "Full" : <><ArrowRight size={14} /> Join Group</>}
        </button>
      )}
      {isMyGroup && (
        <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, padding: "6px 0 2px" }}>
          You're in this group
        </div>
      )}
    </div>
  );
}

function MyGroupCard({ group, onOpen }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!group.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="sg-card" style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "16px 18px",
      boxShadow: "0 2px 10px rgba(49,72,122,0.06)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 15, color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {group.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--accent2)", marginTop: 2, fontWeight: 500 }}>
            {group.courseName}
          </div>
        </div>
        <span style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
          background: group.isPrivate ? "var(--surface3)" : "var(--blue-light-bg)",
          color: group.isPrivate ? "var(--accent2)" : "var(--primary)",
          flexShrink: 0,
        }}>
          {group.isPrivate ? <Lock size={10} /> : <Globe size={10} />}
          {group.isPrivate ? "Private" : "Public"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--text2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={12} />
          {group.memberCount}{group.maxMembers ? ` / ${group.maxMembers}` : ""} members
        </span>
      </div>

      {/* invite code copy, which should only be shown if the user is a host */}
      {group.inviteCode && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--surface2)", borderRadius: 8, padding: "7px 12px",
          border: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>
            Code: <span style={{ fontWeight: 700, color: "var(--primary)", letterSpacing: "0.1em" }}>{group.inviteCode}</span>
          </span>
          <button onClick={copyCode} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "var(--success)" : "var(--text2)", padding: 0, display: "flex", alignItems: "center" }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      <button className="kk-pill"
        onClick={() => onOpen(group)}
        style={{
          marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 0", borderRadius: 9, border: "1px solid var(--border)",
          background: "var(--surface2)", color: "var(--primary)",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif", transition: "all .15s",
        }}
      >
        Open Group <ArrowRight size={14} />
      </button>
    </div>
  );
}

function CreateGroupModal({ courses, onClose, onCreated }) {
  const [name,          setName]          = useState("");
  const [courseId,      setCourseId]      = useState(courses[0]?.id || "");
  const [courseDropOpen, setCourseDropOpen] = useState(false);
  const [isPrivate,     setIsPrivate]     = useState(false);
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async () => {
    if (!name.trim())  { setError("Please enter a group name."); return; }
    if (!courseId)     { setError("Please select a course."); return; }
    setLoading(true);
    setError("");
    try {
      const group = await apiFetch("/api/study-groups/create", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), courseCode: courseId, isPrivate, maxMembers: Number(maxMembers) }),
      });
      onCreated(group);
      onClose();
    } catch (e) {
      setError(e.message || "Could not create group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", borderRadius: 20, padding: "28px 32px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 20, color: "var(--primary)" }}>Create Study Group</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: 4 }}><X size={18} /></button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={labelStyle}>Group Name</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. CMPS 202 Study Squad"
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Course</div>
            <div style={{ position: "relative" }}>
              <button className="kk-select" onClick={() => setCourseDropOpen(o => !o)} style={{
                ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 6, cursor: "pointer", textAlign: "left",
              }}>
                {courses.find(c => String(c.id) === String(courseId))?.name || "Select course"}
                <span style={{ fontSize: 7, opacity: 0.6, display: "inline-block", transform: courseDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}>▼</span>
              </button>
              {courseDropOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "var(--surface)", borderRadius: 12, boxShadow: "0 8px 32px rgba(49,72,122,0.15)", border: "1px solid var(--border)", zIndex: 200, padding: 6, minWidth: "100%", maxHeight: 220, overflowY: "auto" }}>
                  {courses.map(c => (
                    <div key={c.id} className="kk-option" onClick={() => { setCourseId(String(c.id)); setCourseDropOpen(false); }}
                      style={{ padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                        background: String(courseId) === String(c.id) ? "var(--divider)" : "transparent",
                        color: String(courseId) === String(c.id) ? "var(--accent)" : "var(--primary)",
                        transition: "background .15s" }}>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={labelStyle}>Max Members</div>
            <input
              type="number" min={2} max={50}
              value={maxMembers}
              onChange={e => setMaxMembers(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>Between 2 and 50 members</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface2)", borderRadius: 10, padding: "12px 14px" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>Private Group</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Requires an invite code to join</div>
            </div>
            <button
              onClick={() => setIsPrivate(v => !v)}
              style={{
                width: 46, height: 26, borderRadius: 13, border: "none", outline: "none",
                padding: 0, cursor: "pointer",
                background: isPrivate ? "var(--accent)" : "#b0b8c8",
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: isPrivate ? 24 : 3,
                width: 20, height: 20, borderRadius: "50%", background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s", display: "block",
              }} />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 4, padding: "11px 0", borderRadius: 10,
              border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
              background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)",
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "background .15s",
            }}
          >
            {loading ? "Creating…" : <><Plus size={15} /> Create Group</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinPrivateModal({ onClose, onJoined }) {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleJoin = async () => {
    if (!code.trim()) { setError("Please enter an invite code."); return; }
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/study-groups/join/private?inviteCode=${code.trim().toUpperCase()}`, { method: "POST" });
      onJoined();
      onClose();
    } catch (e) {
      setError(e.message || "Invalid invite code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", borderRadius: 20, padding: "28px 32px", width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 20, color: "var(--primary)" }}>Join Private Group</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: 4 }}><X size={18} /></button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.5 }}>
          Enter the invite code shared by the group host.
        </div>

        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && handleJoin()}
          placeholder="e.g. AB12CD34"
          style={{ ...inputStyle, letterSpacing: "0.12em", fontWeight: 700, fontSize: 15 }}
          maxLength={8}
        />

        <button
          onClick={handleJoin}
          disabled={loading}
          style={{
            marginTop: 8, width: "100%", padding: "11px 0", borderRadius: 10,
            border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)",
            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.7 : 1,
            transition: "background .15s",
          }}
        >
          {loading ? "Joining…" : "Join Group"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid var(--border)", borderRadius: 10,
  padding: "9px 12px", fontSize: 13,
  background: "var(--surface2)", color: "var(--text)",
  fontFamily: "'DM Sans',sans-serif", outline: "none",
  transition: "border-color .15s",
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "var(--text2)",
  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
};

export default function StudyGroupFinder({ courses = [] }) {
  const [tab,             setTab]             = useState(() => sessionStorage.getItem("kk_sg_tab") || "find");
  const [publicGroups,    setPublicGroups]    = useState([]);
  const [myGroups,        setMyGroups]        = useState([]);
  const [selectedCourse,  setSelectedCourse]  = useState(courses[0]?.id?.toString() || null);
  const [search,          setSearch]          = useState("");
  const [loadingPublic,   setLoadingPublic]   = useState(true);
  const [loadingMine,     setLoadingMine]     = useState(true);
  const [error,           setError]           = useState("");
  const [showCreate,      setShowCreate]      = useState(false);
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [courseDropOpen, setCourseDropOpen] = useState(false);
  const [myGroupsFilter, setMyGroupsFilter] = useState("all");

  useEffect(() => {
    if (!selectedCourse) return;
    setLoadingPublic(true);
    setError("");
    apiFetch(`/api/study-groups/course/${selectedCourse}`)
      .then(data => setPublicGroups(data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoadingPublic(false));
  }, [selectedCourse]);

 useEffect(() => {
    setLoadingMine(true);
    apiFetch("/api/study-groups/my-groups")
      .then(data => setMyGroups(data || []))
      .catch(() => {})
      .finally(() => setLoadingMine(false));
  }, []);

  const handleJoinPublic = async (groupId) => {
    setError("");
    try {
      await apiFetch(`/api/study-groups/${groupId}/join`, { method: "POST" });
      const [updated, mine] = await Promise.all([
        apiFetch(`/api/study-groups/course/${selectedCourse}`),
        apiFetch("/api/study-groups/my-groups"),
      ]);
      setPublicGroups(updated || []);
      setMyGroups(mine || []);
    } catch (e) {
      setError(e.message || "Could not join group.");
    }
  };

  const handleCreated = async () => {
    const mine = await apiFetch("/api/study-groups/my-groups").catch(() => []);
    setMyGroups(mine || []);
    setTab("mine");
  };

  const handlePrivateJoined = async () => {
    const mine = await apiFetch("/api/study-groups/my-groups").catch(() => []);
    setMyGroups(mine || []);
    setTab("mine");
  };

  const myGroupIds = new Set(myGroups.map(g => g.id));

  const filteredMyGroups = myGroups.filter(g => {
    if (myGroupsFilter === "hosting") return g.isHost === true;
    if (myGroupsFilter === "member") return g.isHost !== true;
    return true;
  });

  const filteredPublic = publicGroups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.hostFirstName?.toLowerCase().includes(search.toLowerCase()) ||
    g.hostLastName?.toLowerCase().includes(search.toLowerCase())
  );

  if (openGroup) {
    return <GroupRoomPage
      group={openGroup}
      onBack={() => setOpenGroup(null)}
      myGroups={myGroups}
      onSwitchGroup={(g) => setOpenGroup(g)}
    />; }

  return (
    <div style={{ padding: "28px 28px 60px", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sg-card { animation: fadeUp 0.32s ease both; transition: box-shadow 0.2s; }
        .sg-card:hover { box-shadow: 0 6px 24px rgba(49,72,122,0.13) !important; }
        .sg-tab:hover:not([data-active="true"]) { background: var(--surface3) !important; }
        .sg-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='16' viewBox='0 0 10 16' fill='none'%3E%3Cpolyline points='1,6 5,2 9,6' stroke='%238899aa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpolyline points='1,10 5,14 9,10' stroke='%238899aa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 34px !important; }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 26, color: "var(--primary)", marginBottom: 4 }}>
          Study Groups
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)" }}>
          Find or host a study group for your courses
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="kk-pill"
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 10,
            border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", transition: "all .15s",
          }}
        >
          <Plus size={15} /> Host a Group
        </button>
        <button className="kk-pill"
          onClick={() => setShowJoinPrivate(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--primary)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", transition: "all .15s",
          }}
        >
          <Lock size={13} /> Enter Invite Code
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 24, width: "fit-content" }}>
        {[
          { id: "find", label: "Find Groups" },
          { id: "mine", label: `My Groups${myGroups.length > 0 ? ` (${myGroups.length})` : ""}` },
        ].map(t => (
          <button
            key={t.id}
            className="sg-tab kk-tab"
            data-active={tab === t.id}
            onClick={() => { setTab(t.id); sessionStorage.setItem("kk_sg_tab", t.id); }}
            style={{
              padding: "8px 18px", borderRadius: 9, fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .15s",
              background: tab === t.id ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
              color: tab === t.id ? "var(--primary)" : "var(--text2)",
              border: tab === t.id ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {tab === "find" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", minWidth: 200, width: "auto" }}>
              <button className="kk-select" onClick={() => setCourseDropOpen(o => !o)} style={{
                padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "space-between",
                background: "var(--surface2)", border: "1px solid var(--border)",
                color: selectedCourse ? "var(--text)" : "var(--text3)",
                fontFamily: "'DM Sans',sans-serif", transition: "background .15s, border-color .15s",
              }}>
                {courses.find(c => String(c.id) === String(selectedCourse))?.name || "Select course"}
                <span style={{ fontSize: 7, opacity: 0.6, display: "inline-block", transform: courseDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}>▼</span>
              </button>
              {courseDropOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "var(--surface)", borderRadius: 12, boxShadow: "0 8px 32px rgba(49,72,122,0.15)", border: "1px solid var(--border)", zIndex: 200, padding: 6, minWidth: "100%", maxHeight: 220, overflowY: "auto" }}>
                  {courses.length === 0
                    ? <div style={{ padding: "9px 14px", fontSize: 13, color: "var(--text3)" }}>No courses found</div>
                    : courses.map(c => (
                      <div key={c.id} className="kk-option" onClick={() => { setSelectedCourse(String(c.id)); setCourseDropOpen(false); }}
                        style={{ padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                          background: String(selectedCourse) === String(c.id) ? "var(--divider)" : "transparent",
                          color: String(selectedCourse) === String(c.id) ? "var(--accent)" : "var(--primary)",
                          transition: "background .15s" }}>
                        {c.name}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups…"
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>
          </div>

          <SectionLabel>Public Groups for This Course</SectionLabel>

          {loadingPublic && <Spinner />}

          {!loadingPublic && filteredPublic.length === 0 && (
            <EmptyState message={search ? "No groups match your search." : "No public groups for this course yet. Be the first to host one!"} />
          )}

          {!loadingPublic && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {filteredPublic.map((g) => (
                <StudyGroupCard
                  key={g.id}
                  group={g}
                  onJoin={handleJoinPublic}
                  isMyGroup={myGroupIds.has(g.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "mine" && (
        <div>
          <SectionLabel>Groups You're In</SectionLabel>

          <div style={{ display:"flex", gap:6, marginBottom:16 }}>
            {[
              { id:"all", label:"All" },
              { id:"hosting", label:"Hosting" },
              { id:"member", label:"Member" },
            ].map(f => (
              <button key={f.id} className="kk-tab" data-active={myGroupsFilter === f.id} onClick={() => setMyGroupsFilter(f.id)}
                style={{ padding:"8px 18px", borderRadius:9, fontSize:13, fontWeight: myGroupsFilter === f.id ? 600 : 400,
                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                  background: myGroupsFilter === f.id ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
                  color: myGroupsFilter === f.id ? "var(--primary)" : "var(--text2)",
                  border: myGroupsFilter === f.id ? "1.5px solid var(--primary)" : "1.5px solid var(--border)" }}>
                {f.label}
              </button>
            ))}
          </div>

          {loadingMine && <Spinner />}

          {!loadingMine && myGroups.length === 0 && (
            <EmptyState message="You haven't joined any study groups yet." />
          )}

          {!loadingMine && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {filteredMyGroups.map(g => (
                <MyGroupCard
                  key={g.id}
                  group={g}
                  onOpen={(group) => setOpenGroup(group)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate      && <CreateGroupModal     courses={courses} onClose={() => setShowCreate(false)}      onCreated={handleCreated}       />}
      {showJoinPrivate && <JoinPrivateModal                       onClose={() => setShowJoinPrivate(false)} onJoined={handlePrivateJoined}  />}
    </div>
  );
}
