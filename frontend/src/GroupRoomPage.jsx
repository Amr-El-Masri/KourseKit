import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Trash2, UserPlus, UserCheck, X, Heart, ThumbsUp, Flag, AlertTriangle, Paperclip, Image, FileText, Music, File as FileIcon, Mic, MicOff, Pin, ArrowDown } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { initE2EE, fetchMemberPublicKeys, encryptMessage, decryptMessage, encryptFile, decryptFile, restoreFromBackup } from "./e2ee";
import { StudentProfileView } from "./StudentDirectoryPanel";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API = process.env.REACT_APP_API_URL || "${API}";

function getToken() { return localStorage.getItem("kk_token"); }
function getUserId() {
  const t = getToken();
  return t ? JSON.parse(atob(t.split(".")[1])).sub : null;
}

async function apiFetch(path, options = {}) {
    const t = getToken();
    const res = await fetch(`${API}${path}`, {
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

function MemberAvatar({ firstName, lastName, avatar, size = 30 }) {
  if (avatar?.startsWith("data:")) {
    return <img src={avatar} alt="avatar" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
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
    Promise.all([
      fetch(`${API}/api/students/search?query=${encodeURIComponent(member.firstName)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${API}/api/students/${member.userId}/is-following`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).catch(() => false)
    ])
      .then(([data, isFollowing]) => {
        const found = Array.isArray(data)
          ? data.find(s => String(s.id) === String(member.userId))
          : null;
        setProfile(found || null);
        setFollowing(!!isFollowing);
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
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(420px,92vw)", maxHeight:"80vh", background:"var(--bg)", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", borderRadius:16, zIndex:201, display:"flex", flexDirection:"column" }}>
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

function detectFileType(file) {
  const mime = file.type;
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime === "application/pdf") return "PDF";
  return "DOC";
}

function getMimeType(message) {
  const name = (message.attachmentName || "").toLowerCase();
  if (message.attachmentType === "IMAGE") {
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".gif")) return "image/gif";
    if (name.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  }
  if (message.attachmentType === "AUDIO") {
    if (name.endsWith(".mp3")) return "audio/mpeg";
    if (name.endsWith(".wav")) return "audio/wav";
    if (name.endsWith(".ogg")) return "audio/ogg";
    if (name.endsWith(".m4a")) return "audio/mp4";
    return "audio/webm";
  }
  if (message.attachmentType === "PDF") return "application/pdf";
  return "application/octet-stream";
}

function ImageLightbox({ src, name, onClose }) {
  const download = (e) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = src;
    a.download = name || "image";
    a.click();
  };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <img src={src} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", borderRadius:10, objectFit:"contain" }} onClick={e => e.stopPropagation()} />
      <button onClick={onClose} style={{ position:"absolute", top:18, right:22, background:"none", border:"none", color:"#fff", fontSize:28, cursor:"pointer", lineHeight:1 }}>×</button>
      <button onClick={download} style={{ position:"absolute", bottom:24, right:24, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, padding:"8px 14px", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, backdropFilter:"blur(4px)" }}>
        <ArrowDown size={15} /> Download
      </button>
    </div>
  );
}

function CustomAudioPlayer({ src, isOwn }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const { isDark } = useTheme();

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const bg = isOwn ? "var(--primary)" : (isDark ? "var(--surface2)" : "var(--surface2)");
  const fg = isOwn ? "#fff" : "var(--primary)";
  const trackBg = isOwn ? "rgba(255,255,255,0.25)" : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)");
  const trackFill = isOwn ? "#fff" : "var(--primary)";
  const timeFg = isOwn ? "rgba(255,255,255,0.75)" : "var(--text3)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background:bg, minWidth:220, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
      <audio ref={audioRef} src={src} preload="metadata"
        onTimeUpdate={e => setProgress(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onDurationChange={e => setDuration(e.target.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button onClick={toggle} style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:fg, display:"flex", alignItems:"center", flexShrink:0 }}>
        {playing
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill={fg}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill={fg}><polygon points="5,3 19,12 5,21"/></svg>
        }
      </button>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
        <div
          style={{ height:4, borderRadius:99, background:trackBg, cursor:"pointer" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) { audioRef.current.currentTime = pct * duration; setProgress(pct * duration); }
          }}
        >
          <div style={{ width:`${duration ? (progress / duration) * 100 : 0}%`, height:"100%", borderRadius:99, background:trackFill }} />
        </div>
        <div style={{ fontSize:10, color:timeFg }}>{fmt(progress)} / {isFinite(duration) && duration > 0 ? fmt(duration) : "--:--"}</div>
      </div>
    </div>
  );
}

function CustomDocCard({ src, message, isOwn }) {
  const { isDark } = useTheme();
  const bg = isOwn ? "var(--primary)" : (isDark ? "var(--surface2)" : "var(--surface2)");
  const border = isOwn ? "none" : `1px solid var(--border)`;
  const iconBg = isOwn ? "rgba(255,255,255,0.18)" : (isDark ? "rgba(255,255,255,0.07)" : "var(--blue-light-bg)");
  const iconColor = isOwn ? "#fff" : "var(--primary)";
  const titleColor = isOwn ? "#fff" : "var(--text)";
  const subColor = isOwn ? "rgba(255,255,255,0.7)" : "var(--text3)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:bg, borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px", border, maxWidth:280, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
      <div style={{ width:38, height:38, borderRadius:10, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {message.attachmentType === "PDF" ? <FileText size={20} color={iconColor} /> : <FileIcon size={20} color={iconColor} />}
      </div>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:titleColor, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:2 }}>{message.attachmentName}</div>
        <div style={{ fontSize:11, color:subColor }}>
          {message.attachmentType === "PDF" ? "PDF" : "Document"}
          {message.attachmentSize && <span> · {(message.attachmentSize / 1024).toFixed(1)} KB</span>}
        </div>
      </div>
      <a href={src} download={message.attachmentName} onClick={e => e.stopPropagation()} style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:8, background:iconBg, color:iconColor, flexShrink:0, textDecoration:"none" }}>
        <ArrowDown size={14} />
      </a>
    </div>
  );
}

function DecryptedMedia({ message, isOwn, onSrcReady }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!message.attachmentUrl) { setLoading(false); return; }
    let cancelled = false;
    let objectUrl;
    const load = async () => {
      try {
        const resolveUrl = url => url?.startsWith("http") ? url : `${API}${url}`;
        if (message.rawAes) {
          const res = await fetch(resolveUrl(message.attachmentUrl));
          const buf = await res.arrayBuffer();
          const decrypted = await decryptFile(buf, message.rawAes);
          objectUrl = URL.createObjectURL(new Blob([decrypted], { type: getMimeType(message) }));
          if (!cancelled) { setSrc(objectUrl); onSrcReady?.(objectUrl); }
        } else {
          const fallback = resolveUrl(message.attachmentUrl);
          if (!cancelled) { setSrc(fallback); onSrcReady?.(fallback); }
        }
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [message.id, message.attachmentUrl, message.rawAes]);

  if (loading) return <div style={{ fontSize: 12, color: "var(--text3)", padding: "6px 0" }}>Decrypting…</div>;
  if (!src) return null;

  if (message.attachmentType === "IMAGE") {
    return (
      <>
        {lightbox && <ImageLightbox src={src} name={message.attachmentName} onClose={() => setLightbox(false)} />}
        <img
          src={src}
          alt={message.attachmentName}
          style={{ maxWidth: 260, maxHeight: 200, borderRadius: 10, display: "block", cursor: "zoom-in", objectFit: "cover" }}
          onClick={() => setLightbox(true)}
        />
      </>
    );
  }
  if (message.attachmentType === "AUDIO") {
    return <CustomAudioPlayer src={src} isOwn={isOwn} />;
  }
  return <CustomDocCard src={src} message={message} isOwn={isOwn} />;
}

function MessageBubble({ message, isOwn, showName, showTime, onDelete, onReact, onReport, onPin, onViewProfile, avatarOverride, currentUserId, selectedMessageId, setSelectedMessageId, msgRef, highlighted }) {
  const { isDark } = useTheme();
  const mediaSrcRef = useRef(null);
  const showMenu = selectedMessageId === message.id;
  const setShowMenu = (val) => setSelectedMessageId(val ? message.id : null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportType, setReportType] = useState("message");
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

    await onReport(
      reportType === "message" ? message.id : null,
      message.senderId,
      reportReason.trim()
    );

    setSubmittingReport(false);
    setShowReportModal(false);
    setReportReason("");
    setShowMenu(false);
  };

  if (message.isSystem) {
    return (
      <div style={{ textAlign: "center", margin: "10px 0", padding: "0 16px" }}>
        <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--surface2)", borderRadius: 99, padding: "3px 12px", display: "inline-block" }}>
          {message.content}
        </span>
      </div>
    );
  }

  if (message.isDeleted) {
    return (
      <div style={{ textAlign: isOwn ? "right" : "left", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>Message deleted</span>
      </div>
    );
  }

  const displayName = message.senderTag || `${message.senderFirstName} ${message.senderLastName}`;

  return (
    <div ref={msgRef} style={{ display:"flex", flexDirection:"column", alignItems: isOwn ? "flex-end" : "flex-start", marginBottom: showTime ? 10 : 2, position:"relative", borderRadius: 10, transition: "background 0.4s", background: highlighted ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent" }}>
      {showName && !isOwn && (
        <div style={{ fontSize:11, fontWeight:600, color:"var(--accent2)", marginBottom:3, marginLeft:38 }}>
          {displayName}
        </div>
      )}

      <div style={{ display:"flex", alignItems:"flex-end", gap:6, flexDirection: isOwn ? "row-reverse" : "row" }}>
        {!isOwn && (
          showTime
            ? <div onClick={() => onViewProfile(message.senderId)} style={{ cursor:"pointer", flexShrink:0 }}>
                <MemberAvatar firstName={message.senderFirstName} lastName={message.senderLastName} avatar={avatarOverride || message.senderAvatar} size={28} />
              </div>
            : <div style={{ width:28, flexShrink:0 }} />
        )}
        <div style={{ display:"flex", flexDirection:"column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
          {message.attachmentUrl && !message.isDeleted && (
            <div style={{ marginBottom: message.content ? 8 : 0 }} onClick={message.attachmentType === "AUDIO" ? handleClick : undefined}>
              <DecryptedMedia message={message} isOwn={isOwn} onSrcReady={s => { mediaSrcRef.current = s; }} />
            </div>
          )}
          {message.content && (
            <div
              onClick={handleClick}
              style={{
                maxWidth:340, padding:"9px 14px", wordBreak:"break-word", overflowWrap:"break-word",
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
          )}
          {!message.content && !message.attachmentUrl && (
            <div onClick={handleClick} style={{ position:"absolute", inset:0, zIndex:0 }} />
          )}
          {(heartUsers.length > 0 || thumbUsers.length > 0) && (
            <div style={{ display:"flex", gap:3, marginTop:-10, marginBottom:2, [isOwn ? "marginRight" : "marginLeft"]: 8, zIndex:2 }}>
              {heartUsers.length > 0 && (
                <span style={{ fontSize:11, background: isDark ? "var(--surface)" : "#fff", border:"1px solid var(--border)", borderRadius:99, padding:"2px 7px", display:"flex", alignItems:"center", gap:3, boxShadow:"0 1px 4px rgba(0,0,0,0.12)" }}>
                  <Heart size={10} color="#e74c3c" fill={myReaction === "heart" ? "#e74c3c" : "none"} />
                  <span style={{ color: isDark ? "var(--text)" : "#333", fontWeight:600 }}>{heartUsers.length}</span>
                </span>
              )}
              {thumbUsers.length > 0 && (
                <span style={{ fontSize:11, background: isDark ? "var(--surface)" : "#fff", border:"1px solid var(--border)", borderRadius:99, padding:"2px 7px", display:"flex", alignItems:"center", gap:3, boxShadow:"0 1px 4px rgba(0,0,0,0.12)" }}>
                  <ThumbsUp size={10} color={myReaction === "thumbsup" ? "var(--primary)" : "var(--text3)"} fill={myReaction === "thumbsup" ? "var(--primary)" : "none"} />
                  <span style={{ color: isDark ? "var(--text)" : "#333", fontWeight:600 }}>{thumbUsers.length}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {showTime && (
        <div style={{ fontSize:10, color:"var(--text3)", marginTop:3, textAlign: isOwn ? "right" : "left", marginLeft: isOwn ? 0 : 34 }}>
          {new Date(message.sentAt + "Z").toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:true })}
        </div>
      )}

      {showMenu && (
        <div style={{
          position:"absolute", bottom:"100%", [isOwn ? "right" : "left"]:0,
          background:"var(--surface)", border:"1px solid var(--border)",
          borderRadius:12, boxShadow:"0 4px 20px rgba(49,72,122,0.15)",
          padding:"8px", display:"flex", gap:6, zIndex:50, marginBottom:4,
        }}>
          <button
            className="btn-msg-action btn-msg-heart"
            onClick={() => { onReact(message.id, "heart"); setShowMenu(false); }}
            title="Heart"
            style={{ background: myReaction==="heart" ? "color-mix(in srgb, #e74c3c 18%, var(--surface2))" : "var(--surface2)", border: myReaction==="heart" ? "1px solid color-mix(in srgb, #e74c3c 40%, transparent)" : "1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}
          >
            <Heart size={14} color={myReaction==="heart" ? "#e74c3c" : "var(--text2)"} fill={myReaction==="heart" ? "#e74c3c" : "none"} />
          </button>
          <button
            className="btn-msg-action btn-msg-thumb"
            onClick={() => { onReact(message.id, "thumbsup"); setShowMenu(false); }}
            title="Thumbs up"
            style={{ background: myReaction==="thumbsup" ? "color-mix(in srgb, var(--primary) 18%, var(--surface2))" : "var(--surface2)", border: myReaction==="thumbsup" ? "1px solid color-mix(in srgb, var(--primary) 40%, transparent)" : "1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}
          >
            <ThumbsUp size={14} color={myReaction==="thumbsup" ? "var(--primary)" : "var(--text2)"} fill={myReaction==="thumbsup" ? "var(--primary)" : "none"} />
          </button>
          <button
            className="btn-msg-action"
            onClick={() => { onPin(message.id); setShowMenu(false); }}
            title={message.pinned ? "Unpin" : "Pin"}
            style={{ background: message.pinned ? "color-mix(in srgb, var(--primary) 18%, var(--surface2))" : "var(--surface2)", border: message.pinned ? "1px solid color-mix(in srgb, var(--primary) 40%, transparent)" : "1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, color: message.pinned ? "var(--primary)" : "var(--text2)" }}
          >
            <Pin size={14} color={message.pinned ? "var(--primary)" : "var(--text2)"}/>
          </button>
          {!isOwn && (
            <button
              className="btn-msg-action btn-msg-report"
              onClick={() => { setShowReportModal(true); setShowMenu(false); }}
              title="Report"
              style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, color:"var(--error)" }}
            >
              <Flag size={14} />
            </button>
          )}
          {message.attachmentUrl && message.attachmentType === "IMAGE" && (
            <button
              className="btn-msg-action"
              onClick={() => {
                if (!mediaSrcRef.current) return;
                const a = document.createElement("a");
                a.href = mediaSrcRef.current;
                a.download = message.attachmentName || "file";
                a.click();
                setShowMenu(false);
              }}
              title="Download"
              style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, color:"var(--primary)" }}
            >
              <ArrowDown size={14} />
            </button>
          )}
          {isOwn && (
            <button
              className="btn-msg-action btn-msg-report"
              onClick={() => { onDelete(message.id); setShowMenu(false); }}
              title="Delete"
              style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, color:"var(--error)" }}
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            className="btn-msg-close"
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
              <AlertTriangle size={16} color="var(--error)" /> Report
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              <button onClick={() => setReportType("message")}
                style={{ flex:1, padding:"7px 0", borderRadius:8, border:"1px solid var(--border)", background: reportType==="message" ? "var(--error-bg)" : "var(--surface2)", color: reportType==="message" ? "var(--error)" : "var(--text2)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                This Message
              </button>
              <button onClick={() => setReportType("member")}
                style={{ flex:1, padding:"7px 0", borderRadius:8, border:"1px solid var(--border)", background: reportType==="member" ? "var(--error-bg)" : "var(--surface2)", color: reportType==="member" ? "var(--error)" : "var(--text2)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                This Member
              </button>
            </div>
            <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14 }}>
              {reportType === "message" ? "Describe the issue with this message." : "Describe the issue with this member."} The host will review this report.
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

export default function GroupRoomPage({ group, onBack, myGroups = [], onSwitchGroup }) {
  const [members,  setMembers]  = useState([]);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [viewingMember, setViewingMember] = useState(null);
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const pendingFileRef = useRef(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [expandedPinId, setExpandedPinId] = useState(null);
  const currentUserId = getUserId();
  const privateKeyRef = useRef(null);
  const memberKeysRef = useRef({});
  const [e2eeReady, setE2eeReady] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [restoreModal, setRestoreModal] = useState(null); // { encryptedPrivateKey }
  const [restorePassword, setRestorePassword] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Task 1: init E2EE — load or generate keypair from IndexedDB, upload public key
  useEffect(() => {
    initE2EE(String(currentUserId), apiFetch).then((result) => {
      if (result.needsRestore) {
        setRestoreModal({ encryptedPrivateKey: result.encryptedPrivateKey });
        return;
      }
      privateKeyRef.current = result.privateKey;
      memberKeysRef.current[String(currentUserId)] = result.publicKey;
      setE2eeReady(true);
    }).catch(() => setE2eeReady(true)); // degrade gracefully
  }, []);

  const handleRestore = async () => {
    if (!restorePassword) return;
    setRestoreLoading(true); setRestoreError("");
    try {
      const { privateKey, publicKey } = await restoreFromBackup(restoreModal.encryptedPrivateKey, restorePassword, String(currentUserId), apiFetch);
      privateKeyRef.current = privateKey;
      memberKeysRef.current[String(currentUserId)] = publicKey;
      setRestoreModal(null); setRestorePassword("");
      setE2eeReady(true);
    } catch {
      setRestoreError("Wrong password or corrupted backup.");
    } finally { setRestoreLoading(false); }
  };

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 1800);
    }
  };

  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Task 2 (part 1): fetch members + their public keys after E2EE is ready
  useEffect(() => {
    if (!e2eeReady) return;
    apiFetch(`/api/study-groups/${group.id}/members`)
      .then(async data => {
        const mems = data || [];
        setMembers(mems);
        const inGroup = mems.some(m => String(m.userId) === String(currentUserId));
        if (!inGroup) {
          setIsKicked(true);
          localStorage.removeItem("kk_last_group");
          return;
        }
        const ids = mems.map(m => m.userId).filter(Boolean);
        if (ids.length) {
          const fetched = await fetchMemberPublicKeys(ids, apiFetch);
          delete fetched[String(currentUserId)]; // keep our locally-generated key
          memberKeysRef.current = { ...memberKeysRef.current, ...fetched };
        }
      })
      .catch(() => { setIsKicked(true); localStorage.removeItem("kk_last_group"); });
  }, [group.id, e2eeReady]);

  // Task 3: load history and decrypt each message
  useEffect(() => {
    if (!e2eeReady) return;
    setLoading(true);
    apiFetch(`/api/group-messages/${group.id}/history`)
      .then(async data => {
        const msgs = data || [];
        const decrypted = await Promise.all(msgs.map(m => decryptMessage(m, currentUserId, privateKeyRef.current)));
        setMessages(decrypted.filter(m => !m._notMember && !m._decryptFailed));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [group.id, e2eeReady]);

  useEffect(() => {
    const token = getToken();
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        // Task 3: decrypt incoming WebSocket messages
        client.subscribe(`/topic/group/${group.id}`, async (frame) => {
          const incoming = JSON.parse(frame.body);
          const msg = await decryptMessage(incoming, currentUserId, privateKeyRef.current);
          if (msg._notMember) return;
          setMessages(prev => {
            const exists = prev.find(m => m.id === msg.id);
            if (exists) return prev.map(m => m.id === msg.id ? msg : m);
            return [...prev, msg];
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

  // Task 2 (part 2): encrypt with AES, wrap key per member, send via WebSocket
  const sendMessage = async () => {
    const plaintext = input.trim();
    if (!plaintext && !pendingFileRef.current) return;
    if (!stompClient.current?.connected) return;
    setInput("");
    setUploading(true);
    try {
      const ids = members.map(m => m.userId).filter(Boolean);
      if (ids.length) {
        const fetched = await fetchMemberPublicKeys(ids, apiFetch);
        delete fetched[String(currentUserId)];
        memberKeysRef.current = { ...memberKeysRef.current, ...fetched };
      }
      console.log("[E2EE] encrypting for members:", Object.keys(memberKeysRef.current));
      const { content, iv, encryptedKeys, rawAes } = await encryptMessage(plaintext || "", memberKeysRef.current);
      let attachmentUrl = null, attachmentType = null, attachmentName = null, attachmentSize = null;
      if (pendingFileRef.current) {
        const file = pendingFileRef.current;
        const fileBytes = await file.arrayBuffer();
        const encryptedBuf = await encryptFile(fileBytes, rawAes);
        const encFile = new File([encryptedBuf], file.name + ".enc", { type: "application/octet-stream" });
        const formData = new FormData();
        formData.append("file", encFile);
        formData.append("groupId", String(group.id));
        const token = getToken();
        const res = await fetch(`${API}/api/files/upload?groupId=${group.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          attachmentUrl = data.url;
          attachmentType = attachment?.fileType ?? null;
          attachmentName = file.name;
          attachmentSize = file.size;
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err.message || "Could not upload file.");
          setUploading(false);
          return;
        }
        pendingFileRef.current = null;
        setAttachment(null);
      }
      stompClient.current.publish({
        destination: `/app/chat/${group.id}`,
        body: JSON.stringify({
          content, iv, encryptedKeys,
          senderId: String(currentUserId),
          attachmentUrl,
          attachmentType,
          attachmentName,
          attachmentSize: attachmentSize != null ? String(attachmentSize) : null,
        }),
      });
    } catch {
      setError("Could not send message.");
    }
    setUploading(false);
  };

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
        body: JSON.stringify({ messageId, reportedUserId, reason, studyGroupId: group.id }),
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
  const [pinnedMessages, setPinnedMessages] = useState([]);
  useEffect(() => {
    if (!e2eeReady) return;
    apiFetch(`/api/group-messages/${group.id}/pinned`).then(async data => {
      if (!Array.isArray(data)) return;
      const decrypted = await Promise.all(data.map(m => decryptMessage(m, currentUserId, privateKeyRef.current)));
      setPinnedMessages(decrypted);
    }).catch(() => {});
  }, [group.id, e2eeReady]);
  const pinMessage = async (messageId) => {
    try {
      const updated = await apiFetch(`/api/group-messages/${messageId}/pin`, { method: "PATCH" });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: updated.pinned } : m));
      setPinnedMessages(prev => {
        const decryptedMsg = messages.find(m => m.id === messageId);
        const merged = decryptedMsg ? { ...decryptedMsg, pinned: updated.pinned } : updated;
        return updated.pinned ? [merged, ...prev.filter(p => p.id !== messageId)] : prev.filter(p => p.id !== messageId);
      });
    } catch (e) { setError(e.message); }
  };
  const [sessions, setSessions] = useState([]);
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [sessionForm, setSessionForm] = useState({ date: "", startTime: "", duration: 1 });
  const [sessionLoading, setSessionLoading] = useState(false);
  const [syncedSessions, setSyncedSessions] = useState({});
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({ date: "", startTime: "", duration: 1 });
  const [editLoading, setEditLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const myMember = members.find(m => String(m.userId) === String(currentUserId));
  const [tagValue, setTagValue] = useState("");
  const [tagLoading, setTagLoading] = useState(false);
  useEffect(() => { if (myMember?.tag != null) setTagValue(myMember.tag); }, [myMember?.tag]);
  const saveTag = async () => {
    setTagLoading(true);
    try {
      const updated = await apiFetch(`/api/study-groups/${group.id}/my-tag`, { method: "PATCH", body: JSON.stringify({ tag: tagValue }) });
      setMembers(prev => prev.map(m => String(m.userId) === String(currentUserId) ? { ...m, tag: updated.tag } : m));
    } catch {}
    setTagLoading(false);
  };
  const [renameValue, setRenameValue] = useState(group.name);
  const [renameLoading, setRenameLoading] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }
    
  const loadSessions = async () => {
    try {
      const data = await apiFetch(`/api/group-sessions/${group.id}`);
      setSessions(data || []);
      const synced = {};
      (data || []).forEach(s => { if (s.isSynced) synced[s.id] = true; });
      setSyncedSessions(synced);
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
      await apiFetch(`/api/group-sessions/${sessionId}/add-to-planner`, { method: "POST" });
      setSyncedSessions(prev => ({ ...prev, [sessionId]: true }));
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isSynced: true } : s));
    } catch (e) {
      setError(e.message || "Could not add to planner.");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingFileRef.current = file;
    setAttachment({ fileName: file.name, fileType: detectFileType(file), fileSize: file.size });
    e.target.value = "";
  };

const clearAttachment = () => { setAttachment(null); pendingFileRef.current = null; };

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/mp4";
    const ext = mimeType.startsWith("audio/mp4") ? "m4a" : "webm";
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const name = `voice-note-${Date.now()}.${ext}`;
      const file = new File([blob], name, { type: mimeType });
      stream.getTracks().forEach(t => t.stop());
      pendingFileRef.current = file;
      setAttachment({ fileName: name, fileType: "AUDIO", fileSize: blob.size });
    };

    mediaRecorder.start();
    setRecording(true);
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);

  } catch (e) {
    setError("Microphone access denied. Please allow microphone permissions.");
  }
};

const stopRecording = () => {
  mediaRecorderRef.current?.stop();
  setRecording(false);
  clearInterval(recordingTimerRef.current);
  setRecordingTime(0);
};

  const deleteSession = (sessionId) => {
    setConfirmAction({ message: "Delete this session?", onConfirm: async () => {
      try {
        await apiFetch(`/api/group-sessions/${sessionId}`, { method: "DELETE" });
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (e) { setError(e.message); }
    }});
  };

  const openEditSession = (s) => {
    setEditingSession(s.id);
    setEditForm({ date: s.date, startTime: s.startTime?.slice(0,5), duration: s.duration });
  };

  const submitEditSession = async () => {
    if (!editForm.date || !editForm.startTime) return;
    setEditLoading(true);

    try {
      const updated = await apiFetch(`/api/group-sessions/${editingSession}`, {
        method: "PATCH",
        body: JSON.stringify({
          date: editForm.date,
          startTime: editForm.startTime,
          duration: Number(editForm.duration),
          endTime: editForm.startTime,
        }),
      });

      setSessions(prev => prev.map(s => s.id === editingSession ? updated : s));
      setEditingSession(null);
    } catch (e) { setError(e.message); }
    setEditLoading(false);
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

  const deleteGroup = () => {
    setConfirmAction({ message: "Delete this group? This cannot be undone.", onConfirm: async () => {
      try {
        await apiFetch(`/api/study-groups/${group.id}`, { method: "DELETE" });
        onBack();
      } catch (e) { setError(e.message); }
    }});
  };

  if (isKicked) {
    return (
      <div style={{ padding: "28px 28px 60px", fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
        <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border,color-mix(in srgb,var(--error) 30%,transparent))", borderRadius: 14, padding: "28px 36px", textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🚪</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, color: "var(--error)", marginBottom: 8 }}>You've been removed</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>You're no longer a member of <strong>{group.name}</strong>. You can ask the host for a new invite code to rejoin.</div>
          <button onClick={onBack} style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: "var(--error)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Back to Groups</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 28px 0", maxWidth: "100%", fontFamily: "'DM Sans',sans-serif", height: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}>
      {confirmAction && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"var(--surface)", borderRadius:16, padding:"28px 32px", boxShadow:"0 8px 32px rgba(0,0,0,0.18)", maxWidth:360, width:"90%", textAlign:"center" }}>
            <div style={{ fontSize:15, color:"var(--text)", marginBottom:20, fontWeight:500 }}>{confirmAction.message}</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding:"9px 22px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--text2)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              <button onClick={async () => { const fn = confirmAction.onConfirm; setConfirmAction(null); await fn(); }} style={{ padding:"9px 22px", borderRadius:9, border:"none", background:"var(--error-bg)", color:"var(--error)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        .msg-input:focus { border-color: var(--primary) !important; }
        .send-btn:hover { opacity: 0.85; }
        .member-row:hover { background: var(--surface2) !important; cursor: pointer; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .btn-settings:hover { background: var(--surface2) !important; border-color: var(--primary) !important; color: var(--primary) !important; }
        .btn-reports:hover { background: color-mix(in srgb, var(--error) 10%, var(--surface)) !important; border-color: color-mix(in srgb, var(--error) 40%, transparent) !important; }
        .btn-make-host:hover { background: color-mix(in srgb, var(--primary) 20%, transparent) !important; border-color: var(--primary) !important; }
        .btn-remove:hover { background: color-mix(in srgb, var(--error) 25%, transparent) !important; }
        .btn-delete-group:hover { background: color-mix(in srgb, var(--error) 25%, transparent) !important; border-color: color-mix(in srgb, var(--error) 60%, transparent) !important; }
        .btn-group-switch:hover { background: var(--blue-light-bg) !important; }
        .btn-group-switch.active { background: var(--blue-light-bg); border-left: 3px solid var(--primary); }
        .btn-msg-action { transition: background 0.12s, border-color 0.12s; }
        .btn-msg-action:hover { background: var(--surface) !important; border-color: var(--primary) !important; }
        .btn-msg-heart:hover { background: color-mix(in srgb, #e74c3c 15%, var(--surface)) !important; border-color: color-mix(in srgb, #e74c3c 40%, transparent) !important; }
        .btn-msg-thumb:hover { background: color-mix(in srgb, var(--primary) 15%, var(--surface)) !important; border-color: var(--primary) !important; }
        .btn-msg-report:hover { background: color-mix(in srgb, var(--error) 15%, var(--surface)) !important; border-color: var(--error) !important; }
        .btn-msg-close:hover { background: var(--surface2) !important; }
      `}</style>

      {restoreModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"var(--surface)", borderRadius:16, padding:28, width:360, boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, color:"var(--primary)", marginBottom:8 }}>Restore Encryption Keys</div>
            <div style={{ fontSize:13, color:"var(--text2)", marginBottom:18, lineHeight:1.5 }}>
              A backup of your private key was found on the server. Enter your backup password to decrypt your messages on this device.
            </div>
            <input
              type="password"
              value={restorePassword}
              onChange={e => { setRestorePassword(e.target.value); setRestoreError(""); }}
              onKeyDown={e => e.key === "Enter" && handleRestore()}
              placeholder="Backup password"
              style={{ width:"100%", padding:"10px 14px", borderRadius:9, border:"1.5px solid var(--border)", background:"var(--surface2)", color:"var(--text)", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", marginBottom:8, boxSizing:"border-box" }}
            />
            {restoreError && <div style={{ fontSize:12, color:"var(--error)", marginBottom:8 }}>{restoreError}</div>}
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button onClick={handleRestore} disabled={restoreLoading || !restorePassword} style={{ flex:1, padding:"10px 0", borderRadius:9, border:"none", background:"var(--primary)", color:"#fff", fontWeight:600, fontSize:13, cursor: restoreLoading || !restorePassword ? "not-allowed" : "pointer", opacity: restoreLoading || !restorePassword ? 0.6 : 1 }}>
                {restoreLoading ? "Restoring…" : "Restore"}
              </button>
              <button onClick={() => { setRestoreModal(null); setRestorePassword(""); setRestoreError(""); setE2eeReady(true); }} style={{ flex:1, padding:"10px 0", borderRadius:9, border:"1.5px solid var(--border)", background:"var(--surface)", color:"var(--text2)", fontWeight:500, fontSize:13, cursor:"pointer" }}>
                Skip
              </button>
            </div>
            <div style={{ fontSize:11, color:"var(--text3)", marginTop:10, lineHeight:1.4 }}>Skipping means old messages on this device can't be decrypted.</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--primary)", fontFamily: "'DM Sans',sans-serif", marginBottom: 16 }}
        >
          <ArrowLeft size={15} /> Back to Study Groups
        </button>

        <div onClick={() => setShowGroupInfo(true)} style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 22, color: "var(--primary)", marginBottom: 2, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
          {group.name}
          <span style={{ fontSize:12, fontWeight:500, color:"var(--text3)", fontFamily:"'DM Sans',sans-serif" }}>ⓘ</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--accent2)" }}>{group.courseName}</div>

        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          <button className="btn-settings"
              onClick={() => setShowSettings(true)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text2)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}
          >
              Settings
          </button>
          {isHost && (
          <button className="kk-pill"
              onClick={() => setShowSessionPanel(v => !v)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9,
                border: showSessionPanel ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                background: showSessionPanel ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
                color:"var(--primary)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}
          >
                {showSessionPanel ? "Hide Scheduler" : "Schedule Study Session"}
          </button> )}
          {isHost && (
          <button className="btn-reports"
              onClick={() => { setShowReports(true); loadReports(); }}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--error)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:0, transition:"all .15s" }}
          >
              <Flag size={13} /> View Reports {reports.length > 0 && `(${reports.length})`}
          </button> )}
        </div>
      {showSessionPanel && isHost && (
          <div style={{ marginTop:12, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:14, color:"var(--primary)", marginBottom:12 }}>Schedule Study Session</div>
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
                style={{ padding:"9px 0", borderRadius:9, border:"1px solid color-mix(in srgb, var(--primary) 30%, transparent)", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", opacity: sessionLoading ? 0.7 : 1, transition:"background .15s" }}>
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

        <div style={{ width: 160, flexShrink: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 10px", display:"flex", flexDirection:"column", gap:6, overflowY:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em", padding:"4px 6px", marginBottom:4 }}>My Groups</div>
          {myGroups.map(g => (
            <button key={g.id} onClick={() => onSwitchGroup(g)} className={`btn-group-switch${g.id === group.id ? " active" : ""}`}
              style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", padding:"8px 10px", borderRadius:10, border:"none", background: g.id === group.id ? "var(--blue-light-bg)" : "var(--surface2)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", borderLeft: g.id === group.id ? "3px solid var(--primary)" : "3px solid transparent", transition:"all 0.15s" }}>
              <span style={{ fontSize:12, fontWeight:700, color:"var(--primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", width:"100%" }}>{g.name}</span>
              <span style={{ fontSize:10, color:"var(--text2)", marginTop:2 }}>{g.courseName}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>

          {pinnedMessages.length > 0 && (
            <div style={{ borderBottom: "1px solid var(--border)", padding: "8px 14px", background: "color-mix(in srgb, var(--primary) 6%, var(--surface))", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize: 10, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                <Pin size={11} /> Pinned
              </div>
              {pinnedMessages.map(p => {
                const isLong = p.content && p.content.length > 80;
                const isExpanded = expandedPinId === p.id;
                const attachmentLabel = !p.content && p.attachmentType
                  ? p.attachmentType === "IMAGE" ? <span style={{ display:"flex", alignItems:"center", gap:4 }}><Image size={12} /> Image</span>
                  : p.attachmentType === "AUDIO" ? <span style={{ display:"flex", alignItems:"center", gap:4 }}><Music size={12} /> Voice note</span>
                  : p.attachmentType === "PDF" ? <span style={{ display:"flex", alignItems:"center", gap:4 }}><FileText size={12} /> PDF</span>
                  : <span style={{ display:"flex", alignItems:"center", gap:4 }}><Paperclip size={12} /> File</span>
                  : null;
                return (
                <div key={p.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div
                    onClick={() => {
                      if (isLong) setExpandedPinId(isExpanded ? null : p.id);
                      scrollToMessage(p.id);
                    }}
                    style={{ fontSize: 12, color: "var(--text)", flex: 1, cursor: "pointer", lineHeight: 1.5, minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word" }}
                  >
                    {attachmentLabel
                      ? <span style={{ color: "var(--text3)", fontStyle: "italic" }}>{attachmentLabel}</span>
                      : isLong && !isExpanded
                        ? <>{p.content.slice(0, 80)}<span style={{ color: "var(--text3)" }}>… <span style={{ color: "var(--primary)", fontWeight: 600 }}>see more</span></span></>
                        : p.content
                    }
                  </div>
                  <button onClick={() => pinMessage(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: "2px 4px", flexShrink: 0, display:"flex", alignItems:"center", marginTop: 1 }}><X size={12} /></button>
                </div>
                );
              })}
            </div>
          )}

          <div
            style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.outline = "2px dashed var(--primary)"; }}
            onDragLeave={e => { e.currentTarget.style.outline = "none"; }}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.style.outline = "none";
              const file = e.dataTransfer.files[0];
              if (!file) return;
              pendingFileRef.current = file;
              setAttachment({ fileName: file.name, fileType: detectFileType(file), fileSize: file.size });
            }}
          >
            {loading && (
              <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, paddingTop: 40 }}>Loading messages…</div>
            )}
            {!loading && messages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, paddingTop: 40 }}>
                No messages yet. Say hello!
              </div>
            )}
            {messages.map((m, i) => {
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const isOwn = String(m.senderId) === String(currentUserId);
                const sameAsPrev = prev && String(prev.senderId) === String(m.senderId);
                const sameAsNext = next && String(next.senderId) === String(m.senderId);
                return (
                <MessageBubble
                    key={m.id}
                    message={m}
                    isOwn={isOwn}
                    showName={!isOwn && !sameAsPrev}
                    showTime={!sameAsNext}
                    onDelete={deleteMessage}
                    onReact={reactToMessage}
                    onReport={reportMessage}
                    onPin={pinMessage}
                    onViewProfile={(senderId) => { const mem = members.find(x => String(x.userId) === String(senderId)); if (mem) setViewingMember(mem); }}
                    avatarOverride={members.find(x => String(x.userId) === String(m.senderId))?.avatar}
                    currentUserId={currentUserId}
                    selectedMessageId={selectedMessageId}
                    setSelectedMessageId={setSelectedMessageId}
                    msgRef={el => { if (el) messageRefs.current[m.id] = el; else delete messageRefs.current[m.id]; }}
                    highlighted={highlightedMessageId === m.id}
                />);})}
            <div ref={messagesEndRef} />

            {showReports && (
                <>
                 <div onClick={() => setShowReports(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:200, backdropFilter:"blur(2px)" }} />
                    <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(520px,92vw)", maxHeight:"80vh", background:"var(--bg)", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", borderRadius:16, zIndex:201, display:"flex", flexDirection:"column" }}>
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

          <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>

            {recording && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:10 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--error)", animation:"pulse 1s infinite" }} />
                <span style={{ fontSize:12, fontWeight:600, color:"var(--error)" }}>
                  Recording… {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
                </span>
                <button onClick={stopRecording}
                  style={{ marginLeft:"auto", padding:"4px 10px", borderRadius:7, border:"none", background:"var(--error)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  Stop
                </button>
              </div>
            )}

            {attachment && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10 }}>
                <span style={{ fontSize:18 }}>
                  {attachment.fileType === "IMAGE" ? <Image size={18} /> : attachment.fileType === "PDF" ? <FileText size={18} /> : attachment.fileType === "AUDIO" ? <Music size={18} /> : <FileIcon size={18} />}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{attachment.fileName}</div>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>{(attachment.fileSize / 1024).toFixed(1)} KB</div>
                </div>
                <button onClick={clearAttachment} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", fontSize:16, padding:4 }}>×</button>
              </div>
            )}

            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,audio/*"
                style={{ display:"none" }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ width:40, height:40, borderRadius:10, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--text2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18, opacity: uploading ? 0.5 : 1 }}
                title="Attach file"
              >
                {uploading ? <span style={{ fontSize:12 }}>…</span> : <Paperclip size={16} />}
              </button>

              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={uploading}
                style={{
                  width:40, height:40, borderRadius:10, border:"1px solid var(--border)",
                  background: recording ? "var(--error-bg)" : "var(--surface2)",
                  color: recording ? "var(--error)" : "var(--text2)",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0, opacity: uploading ? 0.5 : 1,
                  transition:"all 0.15s",
                }}
                title={recording ? "Stop recording" : "Record voice note"}
              >
                {recording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                className="msg-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={attachment ? "Add a caption…" : "Type a message…"}
                style={{
                  flex:1, padding:"10px 14px", border:"1px solid var(--border)",
                  borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif",
                  background:"var(--surface2)", color:"var(--text)", outline:"none",
                  transition:"border-color 0.15s",
                }}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() && !attachment}
                style={{
                  width:40, height:40, borderRadius:10, border:"none",
                  background: (input.trim() || attachment) ? "var(--primary)" : "var(--border)",
                  color:"#fff", cursor: (input.trim() || attachment) ? "pointer" : "not-allowed",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0, transition:"opacity 0.15s",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ width: 200, flexShrink: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 12px", display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Sessions</div>
          {sessions.length === 0 && (
            <div style={{ fontSize:12, color:"var(--text3)", textAlign:"center", paddingTop:12 }}>No sessions yet</div>
          )}
          {sessions.map(s => (
            <div key={s.id} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
              {editingSession === s.id ? (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width:"100%", padding:"5px 8px", border:"1px solid var(--border)", borderRadius:7, fontSize:11, fontFamily:"inherit", background:"var(--surface)", color:"var(--text)", outline:"none" }} />
                  <input type="time" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                    style={{ width:"100%", padding:"5px 8px", border:"1px solid var(--border)", borderRadius:7, fontSize:11, fontFamily:"inherit", background:"var(--surface)", color:"var(--text)", outline:"none" }} />
                  <input type="number" min="0.5" max="8" step="0.5" value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
                    style={{ width:"100%", padding:"5px 8px", border:"1px solid var(--border)", borderRadius:7, fontSize:11, fontFamily:"inherit", background:"var(--surface)", color:"var(--text)", outline:"none" }} />
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={submitEditSession} disabled={editLoading}
                      style={{ flex:1, padding:"5px 0", borderRadius:7, border:"none", background:"var(--primary)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      {editLoading ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingSession(null)}
                      style={{ padding:"5px 8px", borderRadius:7, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text2)", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--primary)", marginBottom:2 }}>
                    {new Date(s.date).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text2)", marginBottom:6 }}>{s.startTime?.slice(0,5)} · {s.duration}h</div>
                  <button onClick={() => syncToPlanner(s.id)} disabled={syncedSessions[s.id]}
                    style={{ width:"100%", padding:"5px 0", borderRadius:7, border:"1px solid var(--border)", background: syncedSessions[s.id] ? "var(--surface2)" : "var(--blue-light-bg)", color: syncedSessions[s.id] ? "var(--text3)" : "var(--primary)", fontSize:11, fontWeight:600, cursor: syncedSessions[s.id] ? "default" : "pointer", fontFamily:"inherit", marginBottom:4 }}>
                    {syncedSessions[s.id] ? "✓ Added" : "+ Planner"}
                  </button>
                  {isHost && (
                    <div style={{ display:"flex", gap:4, marginTop:2 }}>
                      <button onClick={() => openEditSession(s)}
                        style={{ flex:1, padding:"4px 0", borderRadius:7, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text2)", fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        Edit
                      </button>
                      <button onClick={() => deleteSession(s.id)}
                        style={{ flex:1, padding:"4px 0", borderRadius:7, border:"none", background:"var(--error-bg)", color:"var(--error)", fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
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
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(460px,92vw)", maxHeight:"80vh", background:"var(--bg)", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", borderRadius:16, zIndex:201, display:"flex", flexDirection:"column" }}>
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
                    <button className="kk-pill" onClick={renameGroup} disabled={renameLoading}
                      style={{ padding:"8px 14px", borderRadius:8, border:"1px solid color-mix(in srgb, var(--primary) 30%, transparent)", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"background .15s" }}>
                      {renameLoading ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Members — {members.length}</div>
                {members.map(m => (
                  <div key={m.userId} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                    <div className="member-row" onClick={() => { setViewingMember(m); setShowSettings(false); }}
                      style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", flex:1 }}>
                      <MemberAvatar firstName={m.firstName} lastName={m.lastName} avatar={m.avatar} size={30} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--primary)" }}>{m.tag || `${m.firstName} ${m.lastName}`}</div>
                        <div style={{ fontSize:11, color:"var(--text2)", textTransform:"capitalize" }}>{m.role?.toLowerCase()}</div>
                      </div>
                    </div>
                    {isHost && String(m.userId) !== String(currentUserId) && (
                      <div style={{ display:"flex", gap:6, marginLeft:8 }}>
                        {m.role !== "HOST" && (
                          <button className="btn-make-host" onClick={() => assignHost(m.userId)}
                            style={{ padding:"5px 10px", borderRadius:7, border:"1px solid var(--border)", background:"var(--blue-light-bg)", color:"var(--primary)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                            Make Host
                          </button>
                        )}
                        <button className="btn-remove" onClick={() => removeMember(m.userId)}
                          style={{ padding:"5px 10px", borderRadius:7, border:"none", background:"var(--error-bg)", color:"var(--error)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
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
                      {editingSession === s.id ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                            style={{ width:"100%", padding:"6px 8px", border:"1px solid var(--border)", borderRadius:7, fontSize:12, fontFamily:"inherit", background:"var(--surface)", color:"var(--text)", outline:"none" }} />
                          <input type="time" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                            style={{ width:"100%", padding:"6px 8px", border:"1px solid var(--border)", borderRadius:7, fontSize:12, fontFamily:"inherit", background:"var(--surface)", color:"var(--text)", outline:"none" }} />
                          <input type="number" min="0.5" max="8" step="0.5" value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
                            style={{ width:"100%", padding:"6px 8px", border:"1px solid var(--border)", borderRadius:7, fontSize:12, fontFamily:"inherit", background:"var(--surface)", color:"var(--text)", outline:"none" }} />
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={submitEditSession} disabled={editLoading}
                              style={{ flex:1, padding:"6px 0", borderRadius:7, border:"none", background:"var(--primary)", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                              {editLoading ? "Saving…" : "Save"}
                            </button>
                            <button onClick={() => setEditingSession(null)}
                              style={{ padding:"6px 12px", borderRadius:7, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text2)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize:13, fontWeight:600, color:"var(--primary)" }}>
                            {new Date(s.date).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })} — {s.startTime?.slice(0,5)} ({s.duration}h)
                          </div>
                          <div style={{ fontSize:11, color:"var(--text2)", marginBottom:8 }}>Set by {s.createdByFirstName} {s.createdByLastName}</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            <button onClick={() => syncToPlanner(s.id)} disabled={syncedSessions[s.id]}
                              style={{ padding:"5px 12px", borderRadius:7, border:"1px solid var(--border)", background: syncedSessions[s.id] ? "var(--surface2)" : "var(--blue-light-bg)", color: syncedSessions[s.id] ? "var(--text3)" : "var(--primary)", fontSize:11, fontWeight:600, cursor: syncedSessions[s.id] ? "default" : "pointer", fontFamily:"inherit" }}>
                              {syncedSessions[s.id] ? "✓ Added" : "Add to Planner"}
                            </button>
                            {isHost && (
                              <>
                                <button onClick={() => openEditSession(s)}
                                  style={{ padding:"5px 12px", borderRadius:7, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text2)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                                  Edit
                                </button>
                                <button onClick={() => deleteSession(s.id)}
                                  style={{ padding:"5px 12px", borderRadius:7, border:"none", background:"var(--error-bg)", color:"var(--error)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Add Member Tag</div>
                <div style={{ fontSize:11, color:"var(--text3)", marginBottom:8 }}>Appears instead of your name.</div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={tagValue} onChange={e => setTagValue(e.target.value)} placeholder="e.g. coding connoisseur"
                    style={{ flex:1, padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontFamily:"inherit", background:"var(--surface2)", color:"var(--text)", outline:"none" }} />
                  <button className="kk-pill" onClick={saveTag} disabled={tagLoading}
                    style={{ padding:"8px 14px", borderRadius:8, border:"1px solid color-mix(in srgb, var(--primary) 30%, transparent)", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    {tagLoading ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button className="kk-pill" onClick={() => setConfirmAction({ message: "Leave this group?", onConfirm: async () => {
                  try { await apiFetch(`/api/study-groups/${group.id}/leave`, { method: "DELETE" }); onBack(); }
                  catch (e) { setError(e.message); }
                }})}
                  style={{ padding:"10px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--text2)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                  Leave Group
                </button>

                {isHost && (
                  <button className="kk-pill btn-delete-group" onClick={deleteGroup}
                    style={{ padding:"10px", borderRadius:9, border:"1px solid color-mix(in srgb, var(--error) 30%, transparent)", background:"var(--error-bg)", color:"var(--error)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                    Delete Group
                  </button>
                )}
              </div>

            </div>
          </div>
        </>
      )}

        {showGroupInfo && (
        <>
          <div onClick={() => setShowGroupInfo(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:200, backdropFilter:"blur(2px)" }} />
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(420px,92vw)", maxHeight:"80vh", background:"var(--bg)", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", borderRadius:16, zIndex:201, display:"flex", flexDirection:"column" }}>
            
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 22px", borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:"var(--primary)" }}>Group Info</div>
              <button onClick={() => setShowGroupInfo(false)} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text2)" }}>
                <X size={15}/>
              </button>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"22px" }}>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24, gap:10 }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,var(--primary),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:700, color:"#fff" }}>
                  {group.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:20, color:"var(--primary)", textAlign:"center" }}>{group.name}</div>
                <div style={{ fontSize:12, color:"var(--text2)" }}>{group.courseName}</div>
                <div style={{ fontSize:12, color:"var(--text3)" }}>{members.length} member{members.length !== 1 ? "s" : ""}</div>
              </div>

              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Members</div>
                {members.map(m => (
                  <div key={m.userId} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 6px", borderBottom:"1px solid var(--border)", borderRadius:8 }}>
                    <div className="member-row" onClick={() => { setViewingMember(m); setShowGroupInfo(false); }}
                      style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", flex:1 }}>
                      <MemberAvatar firstName={m.firstName} lastName={m.lastName} avatar={m.avatar} size={34} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--primary)" }}>{m.tag || `${m.firstName} ${m.lastName}`}</div>
                        <div style={{ fontSize:11, color:"var(--text2)", textTransform:"capitalize" }}>{m.role?.toLowerCase()}</div>
                      </div>
                    </div>
                    {String(m.userId) !== String(currentUserId) && (
                      <button onClick={() => {
                        const reason = window.prompt("Reason for reporting this member?");
                        if (reason?.trim()) reportMessage(null, m.userId, reason.trim());
                      }}
                        style={{ padding:"4px 8px", borderRadius:7, border:"none", background:"var(--error-bg)", color:"var(--error)", fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0, marginLeft:8 }}>
                        Report
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Media, Links & Docs</div>
                {(() => {
                  const mediaMessages = messages.filter(m => !m.isDeleted && m.attachmentUrl && (m.attachmentType === "IMAGE" || m.attachmentType === "AUDIO"));
                  const docMessages = messages.filter(m => !m.isDeleted && m.attachmentUrl && (m.attachmentType === "PDF" || m.attachmentType === "DOC"));
                  const urlRegex = /https?:\/\/[^\s]+/g;
                  const linkMessages = messages.filter(m => !m.isDeleted && !m.attachmentUrl && m.content && urlRegex.test(m.content));
                  if (!mediaMessages.length && !docMessages.length && !linkMessages.length) {
                    return <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"16px", textAlign:"center", color:"var(--text3)", fontSize:12 }}>No media shared yet.</div>;
                  }
                  return (
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {mediaMessages.length > 0 && (
                        <div>
                          <div style={{ fontSize:11, color:"var(--text3)", marginBottom:6, fontWeight:600 }}>Media</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            {mediaMessages.map(m => (
                              <div key={m.id}>
                                <DecryptedMedia message={m} isOwn={false} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {docMessages.length > 0 && (
                        <div>
                          <div style={{ fontSize:11, color:"var(--text3)", marginBottom:6, fontWeight:600 }}>Docs</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                            {docMessages.map(m => (
                              <DecryptedMedia key={m.id} message={m} isOwn={false} />
                            ))}
                          </div>
                        </div>
                      )}
                      {linkMessages.length > 0 && (
                        <div>
                          <div style={{ fontSize:11, color:"var(--text3)", marginBottom:6, fontWeight:600 }}>Links</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            {linkMessages.map(m => {
                              const urls = m.content.match(/https?:\/\/[^\s]+/g) || [];
                              return urls.map((url, i) => (
                                <a key={m.id + i} href={url} target="_blank" rel="noreferrer"
                                  style={{ fontSize:12, color:"var(--primary)", wordBreak:"break-all", padding:"6px 10px", background:"var(--surface2)", borderRadius:8, border:"1px solid var(--border)", display:"block", textDecoration:"none" }}>
                                  {url}
                                </a>
                              ));
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
