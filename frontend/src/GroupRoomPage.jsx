import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Trash2, UserPlus, UserCheck, X, Heart, ThumbsUp, Flag, AlertTriangle } from "lucide-react";
import { StudentProfileView } from "./StudentDirectoryPanel";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API_BASE = "http://localhost:8080";
function getToken() { return localStorage.getItem("kk_token"); }
function getUserId() {
  const t = getToken();
  return t ? JSON.parse(atob(t.split(".")[1])).sub : null;
}

async function apiFetch(path, options = {}) {
    const t = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
        "Content-Type": "application/json",
        ...(t && { Authorization: `Bearer ${t}` }),
        },
        ...options,
    });
    if (res.status === 204) return null;
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
}

function MemberAvatar({ firstName, lastName, size = 30 }) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#8FB3E2,#A59AC9)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "white", flexShrink: 0,
    }}>
      {initials || "?"}
    </div>
  );
}

function MemberProfilePanel({ member, onClose }) {
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [following, setFollowing] = useState(false);
  const token = localStorage.getItem("kk_token");
  const currentUserId = getUserId();
  const isMe = String(member.userId) === String(currentUserId);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8080/api/students/search?query=${encodeURIComponent(member.firstName)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const found = Array.isArray(data)
          ? data.find(s => String(s.id) === String(member.userId))
          : null;
        setProfile(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [member.userId]);

  const handleFriendToggle = (student) => {
    setFollowing(f => !f);
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:200, backdropFilter:"blur(2px)" }} />
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:380, background:"var(--bg)", boxShadow:"-8px 0 32px rgba(0,0,0,0.15)", zIndex:201, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 22px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:"var(--primary)" }}>Member Profile</div>
          <button onClick={onClose} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text2)" }}>
            <X size={15}/>
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"18px 22px" }}>
          {loading
            ? <div style={{ textAlign:"center", color:"var(--text3)", fontSize:13, paddingTop:40 }}>Loading profile…</div>
            : profile
              ? <StudentProfileView
                  student={profile}
                  onBack={onClose}
                  isFriend={following}
                  onFriendToggle={handleFriendToggle}
                />
              : <div style={{ textAlign:"center", color:"var(--text3)", fontSize:13, paddingTop:40 }}>No profile info available.</div>
          }
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message, isOwn, onDelete, onReact, onReport, currentUserId, selectedMessageId, setSelectedMessageId }) {
  const showMenu = selectedMessageId === message.id;
  const setShowMenu = (val) => setSelectedMessageId(val ? message.id : null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const clickTimer = useRef(null);

  let reactions = {};
  try { reactions = JSON.parse(message.reactionsJson || "{}"); } catch {}
  const heartUsers = reactions["heart"] || [];
  const thumbUsers = reactions["thumbsup"] || [];
  const myReaction = heartUsers.includes(Number(currentUserId)) ? "heart"
    : thumbUsers.includes(Number(currentUserId)) ? "thumbsup" : null;

  const handleClick = (e) => {
    if (e.target.closest("button")) return;
    if (clickTimer.current) { //if the user double clicks its a heart (like on insta)
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onReact(message.id, "heart");
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        setShowMenu(!showMenu);
      }, 220);
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    setSubmittingReport(true);
    await onReport(message.id, message.senderId, reportReason.trim());
    setSubmittingReport(false);
    setShowReportModal(false);
    setReportReason("");
    setShowMenu(false);
  };

  if (message.isDeleted) {
    return (
      <div style={{ textAlign: isOwn ? "right" : "left", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>Message deleted</span>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems: isOwn ? "flex-end" : "flex-start", marginBottom: 10, position:"relative" }}>
      {!isOwn && (
        <div style={{ fontSize:11, fontWeight:600, color:"var(--accent2)", marginBottom:3, marginLeft:4 }}>
          {message.senderFirstName} {message.senderLastName}
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:6, flexDirection: isOwn ? "row-reverse" : "row" }}>
        <div
          onClick={handleClick}
          style={{
            maxWidth:380, padding:"9px 14px",
            borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
            background: isOwn ? "var(--primary)" : "var(--surface2)",
            color: isOwn ? "#fff" : "var(--text)",
            fontSize:13, lineHeight:1.5,
            boxShadow:"0 1px 4px rgba(0,0,0,0.07)",
            cursor:"pointer", userSelect:"none",
            outline: showMenu ? "2px solid var(--accent)" : "none",
          }}
        >
          {message.content}
        </div>

        {isOwn && (
          <button
            onClick={() => onDelete(message.id)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:4, display:"flex", alignItems:"center", opacity:0.6 }}
            title="Delete message"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {(heartUsers.length > 0 || thumbUsers.length > 0) && (
        <div style={{ display:"flex", gap:4, marginTop:4, marginLeft: isOwn ? 0 : 4, marginRight: isOwn ? 4 : 0 }}>
          {heartUsers.length > 0 && (
            <span style={{ fontSize:11, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:99, padding:"2px 7px", display:"flex", alignItems:"center", gap:3 }}>
              <Heart size={10} color={myReaction === "heart" ? "#e74c3c" : "var(--text3)"} fill={myReaction === "heart" ? "#e74c3c" : "none"} />
              {heartUsers.length}
            </span>
          )}
          {thumbUsers.length > 0 && (
            <span style={{ fontSize:11, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:99, padding:"2px 7px", display:"flex", alignItems:"center", gap:3 }}>
              <ThumbsUp size={10} color={myReaction === "thumbsup" ? "var(--primary)" : "var(--text3)"} fill={myReaction === "thumbsup" ? "var(--primary)" : "none"} />
              {thumbUsers.length}
            </span>
          )}
        </div>
      )}

      <div style={{ fontSize:10, color:"var(--text3)", marginTop:3, marginLeft: isOwn ? 0 : 4, marginRight: isOwn ? 4 : 0 }}>
        {new Date(message.sentAt).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:true })}
      </div>

      {showMenu && (
        <div style={{
          position:"absolute", bottom:"100%", [isOwn ? "right" : "left"]:0,
          background:"var(--surface)", border:"1px solid var(--border)",
          borderRadius:12, boxShadow:"0 4px 20px rgba(49,72,122,0.15)",
          padding:"8px", display:"flex", gap:6, zIndex:50, marginBottom:4,
        }}>
          <button
            onClick={() => { onReact(message.id, "heart"); setShowMenu(false); }}
            title="Heart"
            style={{ background: myReaction==="heart" ? "#fdecea" : "var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}
          >
            <Heart size={14} color={myReaction==="heart" ? "#e74c3c" : "var(--text2)"} fill={myReaction==="heart" ? "#e74c3c" : "none"} />
          </button>
          <button
            onClick={() => { onReact(message.id, "thumbsup"); setShowMenu(false); }}
            title="Thumbs up"
            style={{ background: myReaction==="thumbsup" ? "var(--blue-light-bg)" : "var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}
          >
            <ThumbsUp size={14} color={myReaction==="thumbsup" ? "var(--primary)" : "var(--text2)"} fill={myReaction==="thumbsup" ? "var(--primary)" : "none"} />
          </button>
          {!isOwn && (
            <button
              onClick={() => { setShowReportModal(true); setShowMenu(false); }}
              title="Report"
              style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, color:"var(--error)" }}
            >
              <Flag size={14} />
            </button>
          )}
          <button
            onClick={() => setShowMenu(false)}
            style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", color:"var(--text3)", fontSize:12 }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {showReportModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setShowReportModal(false)}>
          <div style={{ background:"var(--surface)", borderRadius:16, padding:"24px", width:340, boxShadow:"0 8px 40px rgba(0,0,0,0.18)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
              <AlertTriangle size={16} color="var(--error)" /> Report Message
            </div>
            <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14 }}>
              Describe the issue. The host will review this report.
            </div>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="e.g. Disrespectful language, harassment…"
              rows={3}
              style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", outline:"none", resize:"none", boxSizing:"border-box" }}
            />
            <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
              <button onClick={() => setShowReportModal(false)}
                style={{ padding:"8px 16px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--text2)", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                Cancel
              </button>
              <button onClick={submitReport} disabled={!reportReason.trim() || submittingReport}
                style={{ padding:"8px 16px", borderRadius:9, border:"none", background:"var(--error)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", opacity: submittingReport ? 0.7 : 1 }}>
                {submittingReport ? "Sending…" : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupRoomPage({ group, onBack }) {
  const [members,  setMembers]  = useState([]);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [viewingMember, setViewingMember] = useState(null);
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const currentUserId = getUserId();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    apiFetch(`/api/study-groups/${group.id}/members`)
      .then(data => setMembers(data || []))
      .catch(() => {});
  }, [group.id]);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/group-messages/${group.id}/history`)
      .then(data => { setMessages(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [group.id]);

  useEffect(() => {
    const token = getToken();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },

      onConnect: () => {
        client.subscribe(`/topic/group/${group.id}`, (frame) => {
          const incoming = JSON.parse(frame.body);
          setMessages(prev => {
            const exists = prev.find(m => m.id === incoming.id);
            if (exists) return prev.map(m => m.id === incoming.id ? incoming : m);
            return [...prev, incoming];
          });
        });
      },

      onDisconnect: () => {},
      onStompError: () => setError("Connection lost. Please refresh."),
    });

    client.activate();
    stompClient.current = client;

    return () => { client.deactivate(); };
  }, [group.id]);

  //to send a messaeg (via websocket)
  const sendMessage = () => {
    const content = input.trim();
    if (!content || !stompClient.current?.connected) return;
    stompClient.current.publish({
        destination: `/app/chat/${group.id}`,
        body: JSON.stringify({ content, senderId: String(currentUserId) }), });
    setInput(""); };

  // to delete a message
  const deleteMessage = async (messageId) => {
    try {
      await apiFetch(`/api/group-messages/${messageId}`, { method: "DELETE" });
    } catch (e) {
      setError(e.message || "Could not delete message.");
    }
  };

    const reactToMessage = async (messageId, emoji) => {
      try {
          await apiFetch(`/api/group-messages/${messageId}/react`, {
          method: "POST",
          body: JSON.stringify({ emoji }),
          });
        } catch (e) {}
    };

  const reportMessage = async (messageId, reportedUserId, reason) => {
    try {
        await apiFetch(`/api/group-messages/reports`, {
        method: "POST",
        body: JSON.stringify({ messageId, reportedUserId, reason }),
        });
    } catch (e) {
        setError(e.message || "Could not submit report."); }
  };

  const loadReports = async () => {
    try {
        const data = await apiFetch(`/api/group-messages/${group.id}/reports`);
        setReports(data || []);
      } catch (e) {}
    };

  const updateReportStatus = async (reportId, status) => {
    try {
        await apiFetch(`/api/group-messages/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        });
        await loadReports();
      } catch (e) {}
    };

  const isHost = members.some(m => String(m.userId) === String(currentUserId) && m.role === "HOST");
  const [sessions, setSessions] = useState([]);
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [sessionForm, setSessionForm] = useState({ date: "", startTime: "", duration: 1 });
  const [sessionLoading, setSessionLoading] = useState(false);
  const [syncedSessions, setSyncedSessions] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [renameValue, setRenameValue] = useState(group.name);
  const [renameLoading, setRenameLoading] = useState(false);
    
  const loadSessions = async () => {
    try {
      const data = await apiFetch(`/api/group-sessions/${group.id}`);
      setSessions(data || []);
    } catch (e) {}
  };

  useEffect(() => { loadSessions(); }, [group.id]);

  const submitSession = async () => {
    if (!sessionForm.date || !sessionForm.startTime) return;
    setSessionLoading(true);
    try {
      await apiFetch(`/api/group-sessions/${group.id}/create`, {
        method: "POST",
        body: JSON.stringify({
          date: sessionForm.date,
          startTime: sessionForm.startTime,
          duration: Number(sessionForm.duration),
          endTime: sessionForm.startTime,
        }),
      });
      setSessionForm({ date: "", startTime: "", duration: 1 });
      setShowSessionPanel(false);
      await loadSessions();
    } catch (e) {
      setError(e.message || "Could not schedule session.");
    }
    setSessionLoading(false);
  };

  const syncToPlanner = async (sessionId) => {
    try {
      await apiFetch(`/api/group-sessions/${sessionId}/sync`, { method: "POST" });
      setSyncedSessions(prev => ({ ...prev, [sessionId]: true }));
    } catch (e) {
      setError(e.message || "Could not add to planner.");
    }
  };

  const removeMember = async (memberId) => {
    try {
      await apiFetch(`/api/study-groups/${group.id}/remove-member/${memberId}`, { method: "DELETE" });
      setMembers(prev => prev.filter(m => m.userId !== memberId));
    } catch (e) { setError(e.message); }
  };

  const assignHost = async (memberId) => {
    try {
      await apiFetch(`/api/study-groups/${group.id}/assign-host/${memberId}`, { method: "PATCH" });
      setMembers(prev => prev.map(m => ({
        ...m,
        role: m.userId === memberId ? "HOST" : m.role
      })));
    } catch (e) { setError(e.message); }
  };

  const renameGroup = async () => {
    if (!renameValue.trim()) return;
    setRenameLoading(true);
    try {
      await apiFetch(`/api/study-groups/${group.id}/rename`, {
        method: "PATCH",
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      group.name = renameValue.trim();
    } catch (e) { setError(e.message); }
    setRenameLoading(false);
  };

  const deleteGroup = async () => {
    if (!window.confirm("Are you sure you want to delete this group? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/study-groups/${group.id}`, { method: "DELETE" });
      onBack();
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ padding: "28px 28px 0", maxWidth: 1100, fontFamily: "'DM Sans',sans-serif", height: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        .msg-input:focus { border-color: var(--primary) !important; }
        .send-btn:hover { opacity: 0.85; }
        .member-row:hover { background: var(--surface2) !important; cursor: pointer; }
      `}</style>

      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--primary)", fontFamily: "'DM Sans',sans-serif", marginBottom: 16 }}
        >
          <ArrowLeft size={15} /> Back to Study Groups
        </button>

        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 22, color: "var(--primary)", marginBottom: 2 }}>
          {group.name}
        </div>
        <div style={{ fontSize: 13, color: "var(--accent2)" }}>{group.courseName}</div>

        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          {isHost && (
          <button
              onClick={() => setShowSessionPanel(v => !v)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--primary)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
          >
                {showSessionPanel ? "Hide Scheduler" : "Schedule Session"}
          </button> )}
          {isHost && (
          <button
              onClick={() => { setShowReports(true); loadReports(); }}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--error)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:0 }}
          >
              <Flag size={13} /> View Reports {reports.length > 0 && `(${reports.length})`}
          </button> )}
        </div>
      {showSessionPanel && isHost && (
          <div style={{ marginTop:12, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 18px", maxWidth:420 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:14, color:"var(--primary)", marginBottom:12 }}>Schedule Next Study Session</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--text2)", display:"block", marginBottom:4 }}>Date</label>
                <input type="date" value={sessionForm.date}
                  onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontFamily:"inherit", background:"var(--surface2)", color:"var(--text)", outline:"none" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--text2)", display:"block", marginBottom:4 }}>Start Time</label>
                <input type="time" value={sessionForm.startTime}
                  onChange={e => setSessionForm(f => ({ ...f, startTime: e.target.value }))}
                  style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontFamily:"inherit", background:"var(--surface2)", color:"var(--text)", outline:"none" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--text2)", display:"block", marginBottom:4 }}>Duration (hours)</label>
                <input type="number" min="0.5" max="8" step="0.5" value={sessionForm.duration}
                  onChange={e => setSessionForm(f => ({ ...f, duration: e.target.value }))}
                  style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontFamily:"inherit", background:"var(--surface2)", color:"var(--text)", outline:"none" }} />
              </div>
              <button onClick={submitSession} disabled={sessionLoading || !sessionForm.date || !sessionForm.startTime}
                style={{ padding:"9px 0", borderRadius:9, border:"none", background:"var(--primary)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", opacity: sessionLoading ? 0.7 : 1 }}>
                {sessionLoading ? "Scheduling…" : "Schedule Session"}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 9, padding: "9px 14px", fontSize: 13, color: "var(--error)", marginBottom: 12, flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0, paddingBottom: 28 }}>

        <div style={{ width: 160, flexShrink: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 14px", display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={() => setShowSettings(true)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", cursor:"pointer", fontFamily:"inherit" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--primary)" }}>Members</span>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--primary)", background:"var(--blue-light-bg)", borderRadius:99, padding:"2px 8px" }}>{members.length}</span>
          </button>
          {isHost && (
            <button onClick={() => { setShowSettings(true); }}
              style={{ display:"flex", alignItems:"center", gap:6, width:"100%", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, color:"var(--text2)" }}>
              ⚙️ Settings
            </button>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
            {loading && (
              <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, paddingTop: 40 }}>Loading messages…</div>
            )}
            {!loading && messages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, paddingTop: 40 }}>
                No messages yet. Say hello!
              </div>
            )}
            {messages.map(m => (
                <MessageBubble
                    key={m.id}
                    message={m}
                    isOwn={String(m.senderId) === String(currentUserId)}
                    onDelete={deleteMessage}
                    onReact={reactToMessage}
                    onReport={reportMessage}
                    currentUserId={currentUserId}
                    selectedMessageId={selectedMessageId}
                    setSelectedMessageId={setSelectedMessageId}
                /> ))}
            <div ref={messagesEndRef} />

            {showReports && (
                <>
                 <div onClick={() => setShowReports(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:200, backdropFilter:"blur(2px)" }} />
                    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:420, background:"var(--bg)", boxShadow:"-8px 0 32px rgba(0,0,0,0.15)", zIndex:201, display:"flex", flexDirection:"column" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 22px", borderBottom:"1px solid var(--border)" }}>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:"var(--primary)" }}>Reports</div>
                        <button onClick={() => setShowReports(false)} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text2)" }}>
                        <X size={15}/>
                        </button>
                    </div>
                    <div style={{ flex:1, overflowY:"auto", padding:"18px 22px" }}>
                        {reports.length === 0
                        ? <div style={{ textAlign:"center", color:"var(--text3)", fontSize:13, paddingTop:40 }}>No reports yet.</div>
                        : reports.map(r => (
                            <div key={r.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                                <span style={{ fontSize:12, fontWeight:700, color:"var(--primary)" }}>
                                {r.reportedByFirstName} reported {r.reportedUserFirstName} {r.reportedUserLastName}
                                </span>
                                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6,
                                background: r.status==="PENDING" ? "var(--error-bg)" : r.status==="REVIEWED" ? "var(--blue-light-bg)" : "var(--success-bg)",
                                color: r.status==="PENDING" ? "var(--error)" : r.status==="REVIEWED" ? "var(--primary)" : "var(--success)",
                                }}>
                                {r.status}
                                </span>
                            </div>
                            <div style={{ fontSize:12, color:"var(--text2)", marginBottom:10, lineHeight:1.5 }}>{r.reason}</div>
                            <div style={{ display:"flex", gap:6 }}>
                                {r.status === "PENDING" && (
                                <button onClick={() => updateReportStatus(r.id, "REVIEWED")}
                                    style={{ padding:"5px 12px", borderRadius:7, border:"1px solid var(--border)", background:"var(--blue-light-bg)", color:"var(--primary)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                                    Mark Reviewed
                                </button>
                                )}
                                {r.status !== "RESOLVED" && (
                                <button onClick={() => updateReportStatus(r.id, "RESOLVED")}
                                    style={{ padding:"5px 12px", borderRadius:7, border:"none", background:"var(--success-bg)", color:"var(--success)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                                    Resolve
                                </button>
                                )}
                                {r.status !== "RESOLVED" && (
                                <button onClick={() => updateReportStatus(r.id, "REVIEWED")}
                                    style={{ padding:"5px 12px", borderRadius:7, border:"none", background:"var(--error-bg)", color:"var(--error)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                                    Forward to Admin
                                </button>
                                )}
                            </div>
                            </div>
                        ))
                        }
                    </div>
                    </div>
                </>
              )}
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <input
              className="msg-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message…"
              style={{
                flex: 1, padding: "10px 14px", border: "1px solid var(--border)",
                borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                background: "var(--surface2)", color: "var(--text)", outline: "none",
                transition: "border-color 0.15s",
              }}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 10, border: "none",
                background: input.trim() ? "var(--primary)" : "var(--border)",
                color: "#fff", cursor: input.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "opacity 0.15s",
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {viewingMember && (
        <MemberProfilePanel
            member={viewingMember}
            onClose={() => setViewingMember(null)}
        />
        )}

      {showSettings && (
        <>
          <div onClick={() => setShowSettings(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:200, backdropFilter:"blur(2px)" }} />
          <div style={{ position:"fixed", top:0, right:0, bottom:0, width:380, background:"var(--bg)", boxShadow:"-8px 0 32px rgba(0,0,0,0.15)", zIndex:201, display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 22px", borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:"var(--primary)" }}>Group Settings</div>
              <button onClick={() => setShowSettings(false)} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text2)" }}>
                <X size={15}/>
              </button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"18px 22px", display:"flex", flexDirection:"column", gap:24 }}>

              {isHost && (
                <div>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Rename Group</div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                style={{ flex:1, padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontFamily:"inherit", background:"var(--surface2)", color:"var(--text)", outline:"none" }} />
                <button onClick={renameGroup} disabled={renameLoading}
                  style={{ padding:"8px 14px", borderRadius:8, border:"none", background:"var(--primary)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  {renameLoading ? "Saving…" : "Save"} </button>
                      </div>
                    </div>
                )}

                <div>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Members — {members.length}</div>
          {members.map(m => (
            <div key={m.userId} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
              <div className="member-row" onClick={() => { setViewingMember(m); setShowSettings(false); }}
                style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", flex:1 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:"var(--blue-light-bg)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"var(--primary)", flexShrink:0 }}>
                  {m.firstName?.[0]}{m.lastName?.[0]}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--primary)" }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize:11, color:"var(--text2)", textTransform:"capitalize" }}>{m.role?.toLowerCase()}</div>
                </div>
              </div>
              {isHost && String(m.userId) !== String(currentUserId) && (
                <div style={{ display:"flex", gap:6, marginLeft:8 }}>
                  {m.role !== "HOST" && (
                    <button onClick={() => assignHost(m.userId)}
                      style={{ padding:"5px 10px", borderRadius:7, border:"1px solid var(--border)", background:"var(--blue-light-bg)", color:"var(--primary)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      Make Host
                    </button>
                  )}
                  <button onClick={() => removeMember(m.userId)}
                    style={{ padding:"5px 10px", borderRadius:7, border:"none", background:"var(--error-bg)", color:"var(--error)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {sessions.length > 0 && (
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Upcoming Sessions</div>
            {sessions.map(s => (
              <div key={s.id} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--primary)" }}>
                  {new Date(s.date).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })} — {s.startTime?.slice(0,5)} ({s.duration}h)
                </div>
                <div style={{ fontSize:11, color:"var(--text2)", marginBottom:8 }}>Set by {s.createdByFirstName} {s.createdByLastName}</div>
                <button onClick={() => syncToPlanner(s.id)} disabled={syncedSessions[s.id]}
                  style={{ padding:"5px 12px", borderRadius:7, border:"1px solid var(--border)", background: syncedSessions[s.id] ? "var(--surface2)" : "var(--blue-light-bg)", color: syncedSessions[s.id] ? "var(--text3)" : "var(--primary)", fontSize:11, fontWeight:600, cursor: syncedSessions[s.id] ? "default" : "pointer", fontFamily:"inherit" }}>
                  {syncedSessions[s.id] ? "✓ Added to Planner" : "Add to My Planner"}
                </button>
              </div>
            ))}
          </div>
        )}

                {(
                  <button onClick={async () => {
                    try { await apiFetch(`/api/study-groups/${group.id}/leave`, { method: "DELETE" }); onBack(); }
                    catch (e) { setError(e.message); }
                  }}
                    style={{ padding:"10px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--text2)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    Leave Group
                  </button>
                )}

                {isHost && (
                  <button onClick={deleteGroup}
                    style={{ padding:"10px", borderRadius:9, border:"none", background:"var(--error-bg)", color:"var(--error)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    Delete Group
                  </button>
                )}

              </div>
            </div>
          </>
        )}

    </div>
  );
}
