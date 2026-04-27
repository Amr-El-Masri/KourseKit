import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, ArrowLeft, Trash2, Flag, Search, ChevronUp, BookOpen, GraduationCap, LayoutGrid, Check, User, Plus, Banana, Cat, Dog, Eclipse, Telescope, Panda } from "lucide-react";
import { StudentProfileView } from "./StudentDirectoryPanel";

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

const AVATAR_ICONS = [
  { id:"Banana", icon:Banana }, { id:"Telescope", icon:Telescope },
  { id:"Eclipse", icon:Eclipse }, { id:"Cat", icon:Cat },
  { id:"Dog", icon:Dog }, { id:"Panda", icon:Panda },
];

function ForumAvatar({ avatar, displayName, size = 30, onClick }) {
  const base = { width: size, height: size, borderRadius: "50%", flexShrink: 0, cursor: onClick ? "pointer" : "default" };
  if (avatar?.startsWith("data:") || avatar?.startsWith("http")) {
    return <img src={avatar} alt="avatar" style={{ ...base, objectFit: "cover" }} onClick={onClick} />;
  }
  const found = AVATAR_ICONS.find(a => a.id === avatar);
  return (
    <div style={{ ...base, background: "linear-gradient(135deg, var(--primary), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClick}>
      {found
        ? <found.icon size={size * 0.45} color="white" />
        : <span style={{ fontWeight: 700, fontSize: size * 0.38, color: "white" }}>{displayName?.[0]?.toUpperCase() || "?"}</span>}
    </div>
  );
}

function ForumProfileModal({ email, token, onClose }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}/api/students/by-email?email=${encodeURIComponent(email)}`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setStudent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [email]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--bg)", borderRadius: 16, padding: "24px 22px", width: 360, maxWidth: "calc(100vw - 32px)", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>Loading…</div>}
        {!loading && !student && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>Profile not found.</div>}
        {!loading && student && <StudentProfileView student={student} onBack={onClose} />}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ title, message, onConfirm, onCancel }) {
  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      <div
        style={{ background: "var(--bg)", borderRadius: 16, padding: "28px 24px", width: 360, maxWidth: "calc(100vw - 32px)", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", fontFamily: "'DM Sans', sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: "var(--primary)", marginBottom: 10 }}>{title}</div>
        <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, margin: "0 0 24px" }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{ padding: "9px 20px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "var(--text2)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "9px 20px", background: "#c0392b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const timeAgo = ts => {
  const s = Math.floor((Date.now() - new Date(ts + "Z").getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

//fuzzy search algo
const stem = word => word
  .replace(/(ing|tion|ations|ation|ed|ly|er|est|ess|ness|ies|es|s)$/, "")
  .toLowerCase();

const fuzzyMatch = (a, b) => {
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  // Only allow 1 edit difference, and only for words longer than 5 chars
  if (a.length < 5 || b.length < 5) return false;
  if (Math.abs(a.length - b.length) > 2) return false;
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i-1] === b[j-1] ? row[j-1] : 1 + Math.min(row[j-1], row[j], prev);
      row[j-1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length] <= 1;
};

const fuzzySearch = (text, query) => {
  if (!text || !query) return false;
  const textWords  = text.toLowerCase().split(/\s+/).map(stem);
  const queryWords = query.toLowerCase().trim().split(/\s+/).map(stem);
  return queryWords.every(qw =>
    qw.length >= 2 && textWords.some(tw => fuzzyMatch(tw, qw))
  );
};

const CATEGORIES = [
  { id: "ALL",       label: "All Posts",  icon: LayoutGrid    },
  { id: "COURSE",    label: "Courses",    icon: BookOpen      },
  { id: "PROFESSOR", label: "Professors", icon: GraduationCap },
  { id: "GENERAL",   label: "General",    icon: MessageSquare },
];

const REPORT_REASONS = [
  "Offensive or inappropriate language",
  "Misleading or false information",
  "Spam or repeated content",
  "Not relevant to academic discussion",
  "Other",
];

//Course search
function CourseTagSearch({ onSelect, initialValue }) {
  const [query,   setQuery]   = useState(initialValue || "");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/api/courses/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); if (!e.target.value) onSelect(""); }}
        placeholder="Search course code (e.g. CMPS 271)…"
        style={f.input}
      />
      {results.length > 0 && (
        <div style={f.dropdown}>
          {results.map(c => (
            <div key={c.id}
              onClick={() => { onSelect(c.courseCode); setQuery(c.courseCode); setResults([]); }}
              style={f.dropdownItem}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <strong style={{ color: "var(--primary)" }}>{c.courseCode}</strong>
              <span style={{ color: "var(--text2)", fontSize: 12 }}> — {c.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//Professor search
function ProfTagSearch({ onSelect, initialValue }) {
  const [query,   setQuery]   = useState(initialValue || "");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/api/courses/professors?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); if (!e.target.value) onSelect(""); }}
        placeholder="Search professor name…"
        style={f.input}
      />
      {results.length > 0 && (
        <div style={f.dropdown}>
          {results.map(name => (
            <div key={name}
              onClick={() => { onSelect(name); setQuery(name); setResults([]); }}
              style={f.dropdownItem}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <strong style={{ color: "var(--primary)" }}>{name}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//Report button
function ReportButton({ targetId, type, token, userEmail }) {
  const [open,       setOpen]       = useState(false);
  const [reason,     setReason]     = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err,        setErr]        = useState("");

  const submit = async () => {
    if (!reason) { setErr("Please select a reason."); return; }
    setSubmitting(true);
    const endpoint = type === "post"
      ? `${API}/api/reports/forum-post/${targetId}`
      : `${API}/api/reports/forum-comment/${targetId}`;
    try {
      const res = await fetch(
        `${endpoint}?userId=${encodeURIComponent(userEmail)}&reason=${encodeURIComponent(reason)}`,
        { method: "POST", headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) { setSubmitted(true); setOpen(false); }
      else { const msg = await res.text(); setErr(msg || "Failed to report."); }
    } catch { setErr("Network error."); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <span style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
      <Check size={11} /> Reported
    </span>
  );

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => { setOpen(o => !o); setErr(""); setReason(""); }}
        style={{ ...f.ghostBtn, color: open ? "var(--danger, #c0392b)" : "var(--text3)" }}>
        <Flag size={12} /> {open ? "Cancel" : "Report"}
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 14, zIndex: 9999, minWidth: 240,
          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10 }}>
            Why are you reporting this?
          </div>
          {REPORT_REASONS.map(r => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text)", marginBottom: 6, cursor: "pointer" }}>
              <input type="radio" name={`report-${type}-${targetId}`} value={r}
                checked={reason === r} onChange={() => { setReason(r); setErr(""); }}
                style={{ accentColor: "var(--accent)" }} />
              {r}
            </label>
          ))}
          {err && <div style={{ fontSize: 11, color: "var(--danger, #c0392b)", marginBottom: 6 }}>{err}</div>}
          <button onClick={submit} disabled={submitting}
            style={{ marginTop: 4, padding: "6px 16px", background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      )}
    </div>
  );
}

//Single post view
function PostView({ post, token, userEmail, userId, displayName, onBack, onDelete, onViewProfile }) {
  const [comments,    setComments]    = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [err,         setErr]         = useState("");
  const [relateCount, setRelateCount] = useState(post.relateCount || 0);
  const [related,     setRelated]     = useState(false);
  const [relating,    setRelating]    = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { type: "post"|"comment", id }

  useEffect(() => {
    if (!token || !userEmail) return;
    fetch(`${API}/api/forum/posts/${post.id}/related?userId=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(data => { if (data.related) setRelated(true); })
      .catch(() => {});
  }, [post.id]);
  useEffect(() => { loadComments(); }, [post.id]);

  const loadComments = async () => {
    try {
      const res  = await fetch(`${API}/api/forum/posts/${post.id}/comments`, { headers: token ? { "Authorization": `Bearer ${token}` } : {} });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { setComments([]); }
  };

  const submitComment = async () => {
    if (commentText.trim().length < 5) { setErr("Comment must be at least 5 characters."); return; }
    setSubmitting(true); setErr("");
    try {
      const res = await fetch(
        `${API}/api/forum/posts/${post.id}/comments?displayName=${encodeURIComponent(displayName)}&body=${encodeURIComponent(commentText)}`,
        { method: "POST", headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "PENDING") {
          setErr("Your comment is under review and will appear once approved.");
        } else {
          setCommentText("");
          loadComments();
        }
      } else {
        const msg = await res.text();
        setErr(msg || "Failed to post comment.");
      }
    } catch { setErr("Network error."); }
    finally { setSubmitting(false); }
  };

  const deleteComment = async (commentId) => {
    try {
      await fetch(`${API}/api/forum/comments/${commentId}`,
        { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      setComments(c => c.filter(x => x.id !== commentId));
    } catch {}
  };

  const handleRelate = async () => {
      if (!token || relating) return;
      setRelating(true);
      try {
        const res = await fetch(
            `${API}/api/forum/posts/${post.id}/relate`,
            { method: "POST", headers: { "Authorization": `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setRelateCount(data.relateCount ?? 0);
          setRelated(r => !r);
        }
      } catch {}
      finally { setRelating(false); }
    };

  const categoryColor = { COURSE: "var(--primary)", PROFESSOR: "var(--accent2)", GENERAL: "var(--accent)" };
  const CatIcon = CATEGORIES.find(c => c.id === post.category)?.icon || MessageSquare;

  return (
    <>
    {pendingDelete && (
      <ConfirmDeleteModal
        title={pendingDelete.type === "post" ? "Delete post?" : "Delete comment?"}
        message={pendingDelete.type === "post"
          ? "This will permanently remove your post and all its comments."
          : "This will permanently remove your comment."}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete.type === "post") {
            await onDelete(pendingDelete.id);
          } else {
            await deleteComment(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
      />
    )}
    <div style={{ padding: "28px 28px 60px", fontFamily: "'DM Sans', sans-serif" }}>
      <button onClick={onBack} style={f.backBtn}>
        <ArrowLeft size={14} /> Back to Forum
      </button>

      <div style={f.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ ...f.chip, background: "var(--surface2)", color: categoryColor[post.category] || "var(--text2)" }}>
            <CatIcon size={11} /> {post.category}
          </span>
          {post.courseTag    && <span style={{ ...f.chip, background: "var(--blue-light-bg, #eef2fb)", color: "var(--primary)" }}>{post.courseTag}</span>}
          {post.professorTag && <span style={{ ...f.chip, background: "var(--surface3)", color: "var(--accent2)" }}>{post.professorTag}</span>}
        </div>

        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: "var(--primary)", marginBottom: 10, lineHeight: 1.3 }}>
          {post.title}
        </div>

        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7, margin: "0 0 18px" }}>{post.body}</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ForumAvatar avatar={post.avatar} displayName={post.displayName} size={30} onClick={() => onViewProfile?.(post.userId)} />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }} onClick={() => onViewProfile?.(post.userId)}>{post.displayName}</span>
              <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 8 }}>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={handleRelate} disabled={!token || relating}
              title={!token ? "Log in to relate" : related ? "Click to unlike" : "Relate"}
              style={{ ...f.ghostBtn, color: related ? "var(--accent2)" : "var(--text3)", fontWeight: related ? 700 : 400, opacity: !token ? 0.5 : 1 }}>
              <ChevronUp size={14} /> {relateCount} Relate{relateCount !== 1 ? "s" : ""}
            </button>
            {token && <ReportButton targetId={post.id} type="post" token={token} userEmail={userEmail} />}
            {userId === post.userId && (
              <button onClick={() => setPendingDelete({ type: "post", id: post.id })} style={{ ...f.ghostBtn, color: "var(--danger, #c0392b)" }}>
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          {comments.length} Comment{comments.length !== 1 ? "s" : ""}
        </div>

        {comments.map(c => (
          <div key={c.id} style={{ ...f.card, marginBottom: 10, padding: "14px 18px" }}>
            <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.65, margin: "0 0 10px" }}>{c.body}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ForumAvatar avatar={c.avatar} displayName={c.displayName} size={24} onClick={() => onViewProfile?.(c.userId)} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }} onClick={() => onViewProfile?.(c.userId)}>{c.displayName}</span>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>{timeAgo(c.createdAt)}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {token && <ReportButton targetId={c.id} type="comment" token={token} userEmail={userEmail} />}
                {userId === c.userId && (
                  <button onClick={() => setPendingDelete({ type: "comment", id: c.id })} style={{ ...f.ghostBtn, color: "var(--danger, #c0392b)" }}>
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text3)", fontSize: 13 }}>
            No comments yet — be the first to reply!
          </div>
        )}

        {/* FIX 1: Comment form — proper spacing so button doesn't overlap textarea */}
        {token ? (
          <div style={{ ...f.card, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10 }}>
              Reply as <span style={{ color: "var(--primary)" }}>{displayName}</span>
            </div>
            <textarea
              value={commentText}
              onChange={e => { setCommentText(e.target.value); setErr(""); }}
              placeholder="Write a comment…"
              rows={4}
              style={{ ...f.input, resize: "vertical", lineHeight: 1.6, marginBottom: 12 }}
            />
            {err && (
              <div style={{ fontSize: 12, color: err.includes("review") ? "var(--accent2)" : "var(--danger, #c0392b)", marginBottom: 10 }}>
                {err}
              </div>
            )}
            <button onClick={submitComment} disabled={submitting} style={f.primaryBtn}>
              {submitting ? "Posting…" : "Post Comment"}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: "var(--text3)" }}>
            Log in to leave a comment.
          </div>
        )}
      </div>
    </div>
    </>
  );
}

//Create post form
function CreatePost({ token, userEmail, userId, displayName, onDone, initialCategory, initialCourseTag, initialProfTag }) {
  const [title,      setTitle]      = useState("");
  const [body,       setBody]       = useState("");
  const [category,   setCategory]   = useState(initialCategory || "GENERAL");
  //courseTag and profTag only count if selected from autocomplete
  const [courseTag,  setCourseTag]  = useState("");
  const [profTag,    setProfTag]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err,        setErr]        = useState("");

  const submit = async () => {
    if (!title.trim())                        { setErr("Please add a title."); return; }
    if (body.trim().length < 20)              { setErr("Post body must be at least 20 characters."); return; }
    if (category === "COURSE" && !courseTag)  { setErr("Please select a course from the search results."); return; }
    if (category === "PROFESSOR" && !profTag) { setErr("Please select a professor from the search results."); return; }

    setSubmitting(true); setErr("");
    const params = new URLSearchParams({
      displayName, title, body, category,
      ...(courseTag && { courseTag }),
      ...(profTag   && { professorTag: profTag }),
    });
    try {
      const res = await fetch(`${API}/api/forum/posts?${params}`,
        { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "PENDING") {
          setErr("Your post is under review and will appear once approved by a moderator.");
          setTimeout(onDone, 3000);
        } else {
          onDone();
        }
      } else {
        const msg = await res.text();
        setErr(msg || "Failed to create post.");
      }
    } catch { setErr("Network error."); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ ...f.card, marginBottom: 24 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: "var(--primary)", marginBottom: 18 }}>
        New Post
      </div>

      {err && (
        <div style={{
          background: err.includes("review") ? "var(--surface2)" : "color-mix(in srgb, var(--danger, #c0392b) 10%, var(--surface))",
          border: `1px solid ${err.includes("review") ? "var(--border)" : "color-mix(in srgb, var(--danger, #c0392b) 30%, var(--border))"}`,
          borderRadius: 10, padding: "9px 14px", fontSize: 13,
          color: err.includes("review") ? "var(--accent2)" : "var(--danger, #c0392b)",
          marginBottom: 14,
        }}>
          {err}
        </div>
      )}

      {/* Category */}
      <label style={f.label}>Category</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {CATEGORIES.filter(c => c.id !== "ALL").map(c => {
          const Icon = c.icon;
          const isActive = category === c.id;
          return (
            <button key={c.id}
              onClick={() => { setCategory(c.id); setCourseTag(""); setProfTag(""); }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "color-mix(in srgb, var(--primary) 8%, var(--surface))"; e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 30%, var(--border))"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.borderColor = "var(--border)"; }}}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 10, border: "1px solid var(--border)",
                background: isActive ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "var(--surface)",
                color: isActive ? "var(--primary)" : "var(--text2)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all .15s",
              }}>
              <Icon size={13} /> {c.label}
            </button>
          );
        })}
      </div>

      {/* Mandatory course tag, only shown when COURSE selected */}
      {category === "COURSE" && (
        <>
          <label style={f.label}>
            Tag a Course <span style={{ color: "var(--danger, #c0392b)" }}>*</span>
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text3)", marginLeft: 6 }}>Select from the list below</span>
          </label>
          <div style={{ marginBottom: 16 }}>
            <CourseTagSearch onSelect={setCourseTag} initialValue="" />
            {courseTag
              ? <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 6, fontWeight: 600 }}>Tagged: {courseTag}</div>
              : <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>No course selected yet</div>
            }
          </div>
        </>
      )}

      {/* Mandatory professor tag, only shown when PROFESSOR selected */}
      {category === "PROFESSOR" && (
        <>
          <label style={f.label}>
            Tag a Professor <span style={{ color: "var(--danger, #c0392b)" }}>*</span>
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text3)", marginLeft: 6 }}>Select from the list below</span>
          </label>
          <div style={{ marginBottom: 16 }}>
            <ProfTagSearch onSelect={setProfTag} initialValue="" />
            {profTag
              ? <div style={{ fontSize: 11, color: "var(--accent2)", marginTop: 6, fontWeight: 600 }}>Tagged: {profTag}</div>
              : <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>No professor selected yet</div>
            }
          </div>
        </>
      )}

      {/* Title */}
      <label style={f.label}>Title</label>
      <input value={title} onChange={e => { setTitle(e.target.value); setErr(""); }}
        placeholder="What's your post about?" style={{ ...f.input, marginBottom: 16 }} />

      {/* Body */}
      <label style={f.label}>Body</label>
      <textarea value={body} onChange={e => { setBody(e.target.value); setErr(""); }}
        placeholder="Share your thoughts, questions, or experiences…"
        rows={5} style={{ ...f.input, resize: "vertical", lineHeight: 1.6, marginBottom: 6 }} />
      <div style={{ fontSize: 11, color: body.length > 0 && body.length < 20 ? "var(--error)" : "var(--text3)", marginBottom: 16 }}>{body.length} chars · minimum 20</div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={submit} disabled={submitting} style={f.primaryBtn}
          onMouseEnter={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--primary) 25%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 50%, transparent)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--primary) 15%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 30%, transparent)"; }}>
          {submitting ? "Posting…" : "Post"}
        </button>
        <button onClick={onDone} style={f.cancelBtn}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--surface3, var(--border))"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--surface2)"; }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

//Post card in the feed
function PostCard({ post, onOpenComments, token, userEmail, onViewProfile }) {
  const categoryColor = { COURSE: "var(--primary)", PROFESSOR: "var(--accent2)", GENERAL: "var(--accent)" };
  const CatIcon = CATEGORIES.find(c => c.id === post.category)?.icon || MessageSquare;

  const [relateCount, setRelateCount] = useState(post.relateCount ?? 0);
  const [related,     setRelated]     = useState(false);
  const [relating,    setRelating]    = useState(false);

  // Check on mount if this user has already liked this post
  useEffect(() => {
    if (!token || !userEmail) return;
    fetch(`${API}/api/forum/posts/${post.id}/related`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.related) setRelated(true); })
      .catch(() => {});
  }, [post.id]);

  const handleRelate = async (e) => {
    e.stopPropagation();
    if (!token || relating) return;
    setRelating(true);
    try {
      const res = await fetch(
          `${API}/api/forum/posts/${post.id}/relate`,
          { method: "POST", headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setRelateCount(data.relateCount ?? 0);
        setRelated(r => !r);
      }
    } catch {}
    finally { setRelating(false); }
  };

  return (
    <div style={{ ...f.card, transition: "box-shadow 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(49,72,122,0.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 14px rgba(49,72,122,0.07)"; }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ ...f.chip, color: categoryColor[post.category] || "var(--text2)", background: "var(--surface2)" }}>
          <CatIcon size={11} /> {post.category}
        </span>
        {post.courseTag    && <span style={{ ...f.chip, background: "var(--blue-light-bg, #eef2fb)", color: "var(--primary)" }}>{post.courseTag}</span>}
        {post.professorTag && <span style={{ ...f.chip, background: "var(--surface3)", color: "var(--accent2)" }}>{post.professorTag}</span>}
      </div>

      <div onClick={onOpenComments} style={{ cursor: "pointer" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--primary)", marginBottom: 6, lineHeight: 1.3 }}>
          {post.title}
        </div>
        <p style={{
          fontSize: 13, color: "var(--text2)", lineHeight: 1.6, margin: "0 0 14px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {post.body}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ForumAvatar avatar={post.avatar} displayName={post.displayName} size={30} onClick={e => { e.stopPropagation(); onViewProfile?.(post.userId); }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }} onClick={e => { e.stopPropagation(); onViewProfile?.(post.userId); }}>{post.displayName}</span>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>· {timeAgo(post.createdAt)}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={handleRelate}
            disabled={!token || relating}
            title={!token ? "Log in to relate" : related ? "Click to unlike" : "Relate"}
            style={{
              ...f.ghostBtn,
              color: related ? "var(--accent2)" : "var(--text3)",
              fontWeight: related ? 700 : 400,
              opacity: !token ? 0.5 : 1,
              gap: 5,
            }}
          >
            <ChevronUp size={14} /> {relateCount}
          </button>

          <button onClick={onOpenComments} style={{ ...f.ghostBtn, color: "var(--text3)", gap: 5 }}>
            <MessageSquare size={13} /> {post.commentCount ?? 0} comment{(post.commentCount ?? 0) !== 1 ? "s" : ""}
          </button>

          {token && (
            <div onClick={e => e.stopPropagation()}>
              <ReportButton targetId={post.id} type="post" token={token} userEmail={userEmail} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MyPostsPanel({ token, userEmail, onOpenPost }) {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/api/forum/my-posts`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPosts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const STATUS_STYLE = {
    APPROVED: { bg:"var(--surface2)",                                                          color:"var(--text2)",            label:"Approved"           },
    PENDING:  { bg:"color-mix(in srgb, #b7680a 12%, var(--surface))",                         color:"#b7680a",                 label:"Pending moderation" },
    FLAGGED:  { bg:"color-mix(in srgb, var(--danger, #c0392b) 12%, var(--surface))",          color:"var(--danger, #c0392b)",  label:"Flagged"            },
  };

  const categoryColor = { COURSE: "var(--primary)", PROFESSOR: "var(--accent2)", GENERAL: "var(--accent)" };

  if (loading) return <div style={{ textAlign:"center", padding:60, color:"var(--text3)" }}>Loading your posts…</div>;

  if (posts.length === 0) return (
    <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
      <MessageSquare size={40} color="var(--border)" style={{ marginBottom:12 }} />
      <div style={{ fontFamily:"'Fraunces', serif", fontSize:18, color:"var(--primary)", marginBottom:6 }}>
        No posts yet
      </div>
      <div style={{ fontSize:13 }}>Your forum posts will appear here.</div>
    </div>
  );

  const sorted = [...posts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {sorted.map((post, i) => {
        const s = STATUS_STYLE[post.status] || STATUS_STYLE.PENDING;
        const CatIcon = CATEGORIES.find(c => c.id === post.category)?.icon || MessageSquare;
        return (
          <div key={post.id} className="post-anim" style={{ animationDelay: `${i * 0.04}s`, ...f.card,
            opacity: post.status === "FLAGGED" ? 0.7 : 1,
            cursor: post.status === "APPROVED" ? "pointer" : "default",
          }}
            onClick={() => post.status === "APPROVED" && onOpenPost(post)}
            onMouseEnter={e => { if (post.status === "APPROVED") e.currentTarget.style.boxShadow = "0 6px 24px rgba(49,72,122,0.13)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(49,72,122,0.06)"; }}
          >
            {/* Header row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:10 }}>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ ...f.chip, color: categoryColor[post.category] || "var(--text2)", background:"var(--surface2)" }}>
                  <CatIcon size={11} /> {post.category}
                </span>
                {post.courseTag    && <span style={{ ...f.chip, background:"var(--blue-light-bg, #eef2fb)", color:"var(--primary)" }}>{post.courseTag}</span>}
                {post.professorTag && <span style={{ ...f.chip, background:"var(--surface3)", color:"var(--accent2)" }}>{post.professorTag}</span>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:11, color:"var(--text3)" }}>{timeAgo(post.createdAt)}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:6, background:s.bg, color:s.color }}>
                  {s.label}
                </span>
              </div>
            </div>

            {/* Title + body */}
            <div style={{ fontWeight:700, fontSize:14, color:"var(--primary)", marginBottom:4 }}>{post.title}</div>
            <p style={{
              fontSize:13, color:"var(--text2)", lineHeight:1.55, margin:"0 0 10px",
              display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
            }}>{post.body}</p>

            {/* Stats + status message */}
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:12, color:"var(--text3)", display:"flex", alignItems:"center", gap:4 }}>
                <ChevronUp size={13} /> {post.relateCount ?? 0}
              </span>
              <span style={{ fontSize:12, color:"var(--text3)", display:"flex", alignItems:"center", gap:4 }}>
                <MessageSquare size={13} /> {post.commentCount ?? 0} comment{(post.commentCount ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>

            {post.status === "PENDING" && (
              <div style={{ fontSize:12, color:"#b7680a", marginTop:10 }}>
                Your post is awaiting moderator approval and is not yet visible to others.
              </div>
            )}
            {post.status === "FLAGGED" && (
              <div style={{ fontSize:12, color:"var(--danger, #c0392b)", marginTop:10 }}>
                Your post has been flagged and is under review by an admin.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

//Main Forum page
export default function Forum({ initialCourseTag, initialProfTag, onClearFilter }) {
  const token     = localStorage.getItem("kk_token");
  const userEmail = localStorage.getItem("kk_email") || "";
  const userId    = userEmail;

  const [displayName, setDisplayName] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem("kk_profile") || "{}");
      return (p.firstName || p.lastName)
        ? `${p.firstName || ""} ${p.lastName || ""}`.trim()
        : (userEmail.split("@")[0] || "Student");
    } catch { return userEmail.split("@")[0] || "Student"; }
  });

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/profile`, { headers: { "Authorization": "Bearer " + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const name = (data.firstName || data.lastName)
            ? `${data.firstName || ""} ${data.lastName || ""}`.trim()
            : userEmail.split("@")[0];
          setDisplayName(name);
        }
      }).catch(() => {});
  }, []);

  const initCat = initialCourseTag ? "COURSE" : initialProfTag ? "PROFESSOR"
    : (() => { try { return sessionStorage.getItem("kk_forum_category") || "ALL"; } catch { return "ALL"; } })();

  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState(initCat);
  const [sort,       setSort]       = useState(() => {
    try { return sessionStorage.getItem("kk_forum_sort") || "new"; } catch { return "new"; }
  });
  const [search,     setSearch]     = useState("");
  useEffect(() => { setVisibleCount(10); }, [search, sort]);
  const [composing,  setComposing]  = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [showMyPosts,  setShowMyPosts]  = useState(false);
  const [viewingProfileEmail, setViewingProfileEmail] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [activeTagFilter, setActiveTagFilter] = useState(initialCourseTag || null);
  const [activeProfTagFilter, setActiveProfTagFilter] = useState(initialProfTag || null);

  const loadPosts = useCallback(async (cat) => {
      setLoading(true);
      try {
        const resolvedCat = cat ?? category;
        let url;
        if (activeTagFilter && resolvedCat === "COURSE") {
          url = `${API}/api/forum/posts/course/${encodeURIComponent(activeTagFilter)}`;
        } else if (activeProfTagFilter && resolvedCat === "PROFESSOR") {
          url = `${API}/api/forum/posts/professor/${encodeURIComponent(activeProfTagFilter)}`;
        } else if (resolvedCat === "ALL") {
          url = `${API}/api/forum/posts`;
        } else {
          url = `${API}/api/forum/posts/category/${resolvedCat}`;
        }
      const res  = await fetch(url, { headers: token ? { "Authorization": `Bearer ${token}` } : {} });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, [category, activeTagFilter, activeProfTagFilter]);

  useEffect(() => { loadPosts(initCat); }, []);
  useEffect(() => { loadPosts(category); setVisibleCount(10); }, [category]);
  useEffect(() => { loadPosts(category); setVisibleCount(10); }, [activeTagFilter, activeProfTagFilter]);

  const deletePost = async (postId) => {
      try {
        const res = await fetch(`${API}/api/forum/posts/${postId}`,
          { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
          setActivePost(null);
          loadPosts(category);
        } else {
          const msg = await res.text();
          alert("Delete failed: " + msg);
        }
      } catch (e) { alert("Network error: " + e.message); }
  };

  let displayed = posts.filter(p =>
      !search ||
      fuzzySearch(p.title, search) ||
      fuzzySearch(p.body, search) ||
      fuzzySearch(p.courseTag, search) ||
      fuzzySearch(p.professorTag, search)
  );

  displayed = sort === "top"
    ? [...displayed].sort((a, b) => b.relateCount - a.relateCount)
    : [...displayed].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const hasMorePosts = displayed.length > visibleCount;
  const visiblePosts = displayed.slice(0, visibleCount);

  if (activePost) {
    return (
      <>
        {viewingProfileEmail && <ForumProfileModal email={viewingProfileEmail} token={token} onClose={() => setViewingProfileEmail(null)} />}
        <PostView
          post={activePost}
          token={token}
          userEmail={userEmail}
          userId={userId}
          displayName={displayName}
          onBack={() => { setActivePost(null); loadPosts(category); }}
          onDelete={async (id) => { await deletePost(id); }}
          onViewProfile={email => setViewingProfileEmail(email)}
        />
      </>
    );
  }

  return (
    <>
    {viewingProfileEmail && <ForumProfileModal email={viewingProfileEmail} token={token} onClose={() => setViewingProfileEmail(null)} />}
    <div style={{ padding: "28px 28px 60px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .post-anim { animation: fadeUp 0.3s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 26, color: "var(--primary)", marginBottom: 4 }}>
          Discussion Forum
        </div>
        {token && !showMyPosts && (
          <button className="f-primary-btn" onClick={() => setComposing(c => !c)}
            style={{ padding:"10px 20px", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", border:"1px solid color-mix(in srgb, var(--primary) 30%, transparent)", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
            {composing ? "Cancel" : <><Plus size={13} /> New Post</>}
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 6, width: "fit-content", marginBottom: 20, flexWrap: "wrap" }}>
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.id} className="kk-tab" data-active={category === c.id && !showMyPosts} onClick={() => { setCategory(c.id); sessionStorage.setItem("kk_forum_category", c.id); setComposing(false); setShowMyPosts(false); }} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 9,
              fontSize: 13, fontWeight: category === c.id && !showMyPosts ? 600 : 400, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
              background: category === c.id && !showMyPosts ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
              color:  category === c.id && !showMyPosts ? "var(--primary)" : "var(--text2)",
              border: category === c.id && !showMyPosts ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
            }}>
              <Icon size={14} /> {c.label}
            </button>
          );
        })}
        {token && (
          <button className="kk-tab" data-active={showMyPosts} onClick={() => { setShowMyPosts(p => !p); setComposing(false); }} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px", borderRadius: 9,
            fontSize: 13, fontWeight: showMyPosts ? 600 : 400, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
            background: showMyPosts ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
            color:      showMyPosts ? "var(--primary)" : "var(--text2)",
            border:     showMyPosts ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
          }}>
            <User size={14} /> My Posts
          </button>
        )}
      </div>

      {/* My Posts panel */}
      {showMyPosts && (
          <MyPostsPanel
            token={token}
            userEmail={userEmail}
            onOpenPost={post => { setActivePost(post); setShowMyPosts(false); }}
          />
      )}

      {/* Create post form */}
      {composing && (
        <CreatePost
          token={token} userEmail={userEmail} userId={userId} displayName={displayName}
          initialCategory={category !== "ALL" ? category : "GENERAL"}
          initialCourseTag={initialCourseTag || ""}
          initialProfTag={initialProfTag || ""}
          onDone={() => { setComposing(false); loadPosts(category); }}
        />
      )}
      {!showMyPosts && <>
      {/* Search + sort bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 14px", minWidth: 200 }}>
            <Search size={14} style={{ color: "var(--text3)", marginRight: 8, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search posts…"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text)", width: "100%", fontFamily: "'DM Sans', sans-serif" }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, paddingLeft: 2 }}>Searches post titles and content</div>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--surface2)", padding: 4, borderRadius: 10 }}>
          {[{ id: "new", label: "New" }, { id: "top", label: "Top" }].map(s => (
            <button key={s.id} className="kk-tab" data-active={sort===s.id} onClick={() => { setSort(s.id); sessionStorage.setItem("kk_forum_sort", s.id); }} style={{
              padding: "6px 14px", border: "none", borderRadius: 8,
              fontSize: 12, fontWeight: sort===s.id ? 600 : 400, cursor: "pointer", transition: "all .15s",
              background: sort === s.id ? "var(--surface)" : "transparent",
              color:      sort === s.id ? "var(--primary)" : "var(--text2)",
              boxShadow:  sort === s.id ? "0 1px 4px rgba(49,72,122,0.08)" : "none",
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Context header when deep-linked */}
        {activeTagFilter && category === "COURSE" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <button onClick={() => { setActiveTagFilter(null); onClearFilter?.(); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "var(--primary)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <ArrowLeft size={12} /> Back
            </button>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>
              Showing posts tagged with <strong style={{ color: "var(--primary)" }}>{activeTagFilter}</strong>
            </span>
            <button onClick={() => { setActiveTagFilter(null); setCategory("ALL"); onClearFilter?.(); }}
              style={{ fontSize: 12, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif" }}>
              View all posts
            </button>
          </div>
        )}
        {activeProfTagFilter && category === "PROFESSOR" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <button onClick={() => { setActiveProfTagFilter(null); onClearFilter?.(); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "var(--primary)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <ArrowLeft size={12} /> Back
            </button>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>
              Showing posts tagged with <strong style={{ color: "var(--accent2)" }}>{activeProfTagFilter}</strong>
            </span>
            <button onClick={() => { setActiveProfTagFilter(null); setCategory("ALL"); onClearFilter?.(); }}
              style={{ fontSize: 12, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif" }}>
              View all posts
            </button>
          </div>
      )}


      {/* Posts feed */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text3)", fontSize: 14 }}>
          Loading posts…
        </div>
      )}

      {!loading && displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)" }}>
          <MessageSquare size={40} color="var(--border)" style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: "var(--primary)", marginBottom: 6 }}>
            No posts yet
          </div>
          <div style={{ fontSize: 13 }}>Be the first to start a discussion!</div>
        </div>
      )}

      {!loading && visiblePosts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visiblePosts.map((p, i) => (
              <div key={p.id} className="post-anim" style={{ animationDelay: `${i * 0.04}s`, position: "relative", zIndex: visiblePosts.length - i }}>
                <PostCard
                  post={p}
                  onOpenComments={() => setActivePost(p)}
                  token={token}
                  userEmail={userEmail}
                  onViewProfile={email => setViewingProfileEmail(email)}
                />
              </div>
            ))}
          </div>
      )}
      {!loading && hasMorePosts && (
          <div style={{ textAlign:"center", marginTop:20 }}>
            <button onClick={() => setVisibleCount(c => c + 10)} style={{
              padding:"10px 32px", background:"var(--surface)", border:"1px solid var(--border)",
              borderRadius:10, fontSize:13, fontWeight:600, color:"var(--primary)",
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
            }}>
              Load More ({displayed.length - visibleCount} remaining)
            </button>
          </div>
      )}
      </>}
    </div>
    </>
  );
}

//Styles
const f = {
  card: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "20px 22px",
      boxShadow: "0 2px 14px rgba(49,72,122,0.07)",
      overflow: "visible",
      position: "relative",
  },
  chip: {
    fontSize: 11, fontWeight: 700,
    padding: "3px 10px", borderRadius: 6,
    display: "inline-flex", alignItems: "center", gap: 4,
  },
  avatar: {
    width: 30, height: 30, borderRadius: "50%",
    background: "linear-gradient(135deg, var(--primary), var(--accent))",
    color: "white", fontWeight: 700, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  label:  { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 },
  input: {
    width: "100%", padding: "10px 14px",
    border: "1px solid var(--border)", borderRadius: 10,
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    color: "var(--text)", background: "var(--surface2)",
    outline: "none", display: "block",
  },
  dropdown: {
    position: "absolute", top: "100%", left: 0, right: 0,
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    zIndex: 100, maxHeight: 200, overflowY: "auto", marginTop: 4,
  },
  dropdownItem: {
    padding: "10px 14px", cursor: "pointer",
    borderBottom: "1px solid var(--border)",
    fontSize: 13, transition: "background .1s",
  },
  primaryBtn: {
    padding: "10px 22px", background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)",
    border: "1.5px solid color-mix(in srgb, var(--primary) 30%, transparent)", borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
  },
  cancelBtn: {
    padding: "8px 16px", background: "var(--surface2)", color: "var(--text2)",
    border: "1px solid var(--border)", borderRadius: 10, fontSize: 13,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  ghostBtn: {
    display: "flex", alignItems: "center", gap: 4,
    background: "none", border: "none", fontSize: 12,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    padding: "4px 8px", borderRadius: 6,
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "8px 16px", cursor: "pointer",
    fontSize: 13, fontWeight: 600, color: "var(--primary)",
    fontFamily: "'DM Sans', sans-serif", marginBottom: 24,
  },
};
