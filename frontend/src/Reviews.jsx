import { useState, useEffect, useCallback } from "react";
import { Pen, Search, Inbox, CheckCircle, Hourglass } from "lucide-react";
import CourseDetails from "./CourseDetails";

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

const ANON_NAMES = [
  "Apple","Blueberry","Cherry","Elderberry","Fig","Grape","Honeydew","Kiwi",
  "Lemon","Mango","Nectarine","Papaya","Pineapple","Raspberry","Strawberry",
  "Starfruit","Tangerine","Watermelon","Bazella","Koussa","Batata 7arra",
  "Kafta","Tawouk","Shawarma","Falafel","Hummus","Tabbouleh","Fattoush",
  "Labneh","Man2oushe","Knefeh","Baklewa","Maamoul","Qatayef","Matte",
  "Sa7lab","Shish Barak","Loubyeh","Mloukhiyye","Wara2 3enab","Mjaddara",
  "Kibbeh","Sambousek","Fatteh","Zaatar","Sfee7a","Jibneh","Bemye","Makloubeh",
];
const randomAnon = () => ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];

function RatingStats({ reviews }) {
  if (!reviews || reviews.length === 0) return null;
  const avg = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const counts = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:24, flexWrap:"wrap",
      background:"var(--surface2)", borderRadius:14, padding:"16px 20px",
      marginBottom:20, border:"1px solid var(--border)",
    }}>
      {/* Average + stars */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:60 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>
          Avg. Rating
        </div>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:36, color:"var(--primary)", lineHeight:1 }}>
          {avg}
        </div>
        <div style={{ display:"inline-flex", gap:2 }}>
          {[1,2,3,4,5].map(i => (
            <span key={i} style={{ color: i <= Math.round(avg) ? "#f5a623" : "var(--border)", fontSize:14 }}>★</span>
          ))}
        </div>
        <div style={{ fontSize:11, color:"var(--text3)" }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Bar breakdown */}
      <div style={{ flex:1, minWidth:160, display:"flex", flexDirection:"column", gap:5 }}>
        {counts.map(({ star, count }) => {
          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          return (
            <div key={star} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:"var(--text3)", width:10, textAlign:"right" }}>{star}</span>
              <span style={{ color:"#f5a623", fontSize:11 }}>★</span>
              <div style={{ flex:1, height:6, background:"var(--border)", borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:"#f5a623", borderRadius:4, transition:"width 0.4s ease" }} />
              </div>
              <span style={{ fontSize:11, color:"var(--text3)", width:18, textAlign:"right" }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
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

function Stars({ count, interactive, onSet }) {
  const [hoverCount, setHoverCount] = useState(0);
  const active = hoverCount || count;
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onClick={() => interactive && onSet(i)}
          onMouseEnter={() => interactive && setHoverCount(i)}
          onMouseLeave={() => interactive && setHoverCount(0)}
          style={{
            color: i<=active ? (hoverCount ? "var(--accent2)" : "var(--star)") : "var(--border)",
            fontSize:16,
            cursor: interactive ? "pointer" : "default",
            transition:"color .1s",
            transform: interactive && i<=hoverCount ? "scale(1.2)" : "scale(1)",
            display:"inline-block",
          }}
        >★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review, token, userEmail, reviewType = "course", animDelay = 0 }) {
  const [reporting,  setReporting]  = useState(false);
  const [reason,     setReason]     = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [err,        setErr]        = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sectionInfo = review.section
    ? `${review.section.sectionNumber || ""} — ${review.section.professorName || ""}`.trim()
    : "";

  const REASONS = [
    "Offensive or inappropriate language",
    "Not a serious / troll review",
    "Spam or repeated content",
    "False or misleading information",
    "Other",
  ];

  const submitReport = async () => {
    if (!reason) { setErr("Please select a reason."); return; }
    if (!token)  { setErr("You must be logged in to report."); return; }
    setSubmitting(true); setErr("");
    const endpoint = reviewType === "professor"
      ? `${API}/api/reports/professor-review/${review.id}`
      : `${API}/api/reports/review/${review.id}`;
    try {
      const res = await fetch(
        `${endpoint}?userId=${encodeURIComponent(userEmail)}&reason=${encodeURIComponent(reason)}`,
        { method: "POST", headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) { setSubmitted(true); setReporting(false); }
      else { const msg = await res.text(); setErr(msg || "Failed to submit report."); }
    } catch { setErr("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="rv-anim" style={{ ...rv.card, animationDelay: `${animDelay}s` }}>
      <div style={{ flex: 1 }}>
        {/* Header row */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:8 }}>
          <div style={rv.avatar}>{randomAnon()[0]}</div>
          <span style={{ fontSize:13, fontWeight:600, color:"var(--primary)" }}>Anonymous</span>
          <span style={{ fontSize:11, color:"var(--text3)" }}>·</span>
          <span style={{ fontSize:11, color:"var(--text3)" }}>{timeAgo(review.createdAt)}</span>
          {sectionInfo && (
            <>
              <span style={{ fontSize:11, color:"var(--text3)" }}>·</span>
              <span style={{ fontSize:11, background:"var(--divider)", color:"var(--accent)", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>
                {sectionInfo}
              </span>
            </>
          )}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <Stars count={review.rating} />
            {/* Report button — only show if logged in and not already reported */}
            {token && !submitted && (
              <button
                onClick={() => { setReporting(r => !r); setErr(""); setReason(""); }}
                title="Report this review"
                style={{
                  background: reporting ? "var(--error-bg)" : "none",
                  border: reporting ? "1px solid var(--error-border)" : "none",
                  borderRadius: 6, padding:"2px 8px", cursor:"pointer",
                  fontSize:11, color: reporting ? "var(--error)" : "var(--text3)",
                  fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                }}
              >
                {reporting ? "✕ Cancel" : "⚑ Report"}
              </button>
            )}
            {submitted && (
              <span style={{ fontSize:11, color:"var(--warn)", fontWeight:600 }}> Reported</span>
            )}
          </div>
        </div>

        {/* Review text */}
        <p style={{ fontSize:14, color:"var(--text-body)", lineHeight:1.65, margin:0 }}>{review.comment}</p>

        {/* Report panel */}
        {reporting && (
          <div style={{
            marginTop:14, background:"var(--warn-bg)", border:"1px solid #f5dfa6",
            borderRadius:10, padding:"14px 16px",
          }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--warn)", marginBottom:10 }}>
              Why are you reporting this review?
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
              {REASONS.map(r => (
                <label key={r} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"var(--text-body)" }}>
                  <input
                    type="radio" name={`report-${review.id}`} value={r}
                    checked={reason === r}
                    onChange={() => { setReason(r); setErr(""); }}
                    style={{ accentColor:"var(--warn)" }}
                  />
                  {r}
                </label>
              ))}
            </div>
            {err && <div style={{ fontSize:12, color:"var(--error)", marginBottom:8 }}>{err}</div>}
            <button
              onClick={submitReport} disabled={submitting}
              style={{
                padding:"7px 20px", background:"color-mix(in srgb, var(--warn) 15%, transparent)", color:"var(--warn)",
                border:"1px solid color-mix(in srgb, var(--warn) 30%, transparent)", borderRadius:8, fontSize:12, fontWeight:600,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              }}
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseSearch({ onSelect }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/courses/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div style={{ position:"relative", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px" }}>
        <Search size={15} style={{ color:"var(--text3)", marginRight:8, flexShrink:0 }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by course code or title (e.g. CMPS 200)…"
          style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }}
        />
        {loading && <span style={{ fontSize:11, color:"var(--text3)" }}>searching…</span>}
      </div>
      <div style={{ fontSize:11, color:"var(--text3)", marginTop:4, paddingLeft:2 }}>Type at least 2 characters to search</div>

      {results.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, boxShadow:"0 4px 20px rgba(0,0,0,0.1)", zIndex:100, maxHeight:240, overflowY:"auto", marginTop:4 }}>
          {results.map(course => (
            <div key={course.id} onClick={() => { onSelect(course); setQuery(""); setResults([]); }}
              style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid var(--divider)", transition:"background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontWeight:700, color:"var(--primary)", fontSize:13 }}>{course.courseCode}</span>
              <span style={{ color:"var(--text2)", fontSize:13 }}> — {course.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmitReview({ token, userEmail, onDone, preselectedCourse }) {
  const [selectedCourse,  setSelectedCourse]  = useState(preselectedCourse || null);
  const [sections,        setSections]        = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [rating,          setRating]          = useState(0);
  const [comment,         setComment]         = useState("");
  const [err,             setErr]             = useState("");
  const [submitting,      setSubmitting]       = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [sectionDropOpen, setSectionDropOpen] = useState(false);

  useEffect(() => {
    if (preselectedCourse) {
      fetch(`${API}/api/courses/${preselectedCourse.id}/sections`)
        .then(r => r.json())
        .then(data => setSections(data))
        .catch(() => setSections([]));
    }
  }, [preselectedCourse]);

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setSelectedSection("");
    try {
      const res = await fetch(`${API}/api/courses/${course.id}/sections`);
      const data = await res.json();
      setSections(data);
    } catch { setSections([]); }
  };

  const submit = async () => {
    if (!selectedSection) { setErr("Please select a section."); return; }
    if (rating === 0)     { setErr("Please select a rating."); return; }
    if (comment.trim().length < 20) { setErr("Review must be at least 20 characters."); return; }
    if (!token)           { setErr("You must be logged in to submit a review."); return; }

    setSubmitting(true);
    setErr("");
    try {
      const res = await fetch(
        `${API}/api/reviews/submit?sectionId=${selectedSection}&comment=${encodeURIComponent(comment)}&rating=${rating}&userId=${encodeURIComponent(userEmail)}`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const status = data?.status || "APPROVED";
        setSuccess(status);
        setTimeout(() => { setSuccess(false); onDone(); }, 6000);
      } else {
        const msg = await res.text();
        setErr(msg || "Failed to submit review.");
      }
    } catch { setErr("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (success) return (
   <div style={{ ...rv.composeCard, textAlign:"center", padding:40 }}>
    {success === "PENDING" ? (
    <>
      <div style={{ marginBottom:12 }}><Hourglass size={40} color="var(--primary)" /></div>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>
        Review submitted for moderation
      </div>
      <div style={{ fontSize:13, color:"var(--text2)", marginTop:8 }}>
        Your review will be visible once approved by a moderator.
      </div>
    </>
  ) : (
    <>
      <div style={{ marginBottom:12 }}>
        <CheckCircle size={40} color="var(--success)" />
      </div>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>
        Review submitted!
      </div>
    </>
  )}
</div>
  );

  return (
    <div style={rv.composeCard}>
      <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)", marginBottom:16 }}>
        Write a Course Review
      </div>

      {err && <div style={{ background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:10, padding:"9px 14px", fontSize:13, color:"var(--error)", marginBottom:14 }}>{err}</div>}

      {!preselectedCourse && (
        <>
          <label style={rv.label}>Select a Course</label>
          <CourseSearch onSelect={selectCourse} />
        </>
      )}

      {selectedCourse && (
        <>
          <div style={{ background:"color-mix(in srgb, var(--accent) 10%, transparent)", border:"1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"var(--text2)" }}>
            Selected: <strong style={{ color:"var(--accent)" }}>{selectedCourse.courseCode}</strong> — {selectedCourse.title}
          </div>

          <label style={rv.label}>Select a Section</label>
          <div style={{ position:"relative", marginBottom:16 }}>
            <button type="button" onClick={() => setSectionDropOpen(o => !o)} style={{
              width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10,
              background:"var(--surface2)", color: selectedSection ? "var(--text)" : "var(--text3)",
              fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
              textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              {selectedSection
                ? (() => { const s = sections.find(s => String(s.id) === String(selectedSection)); return s ? `Section ${s.sectionNumber} — ${s.professorName}` : "Select a section…"; })()
                : "Select a section…"}
              <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: sectionDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
            </button>
            {sectionDropOpen && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, maxHeight:220, overflowY:"auto" }}>
                <div onClick={() => { setSelectedSection(""); setSectionDropOpen(false); }}
                  className="kk-option"
                  style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                    transition:"background .15s",
                    background: !selectedSection ? "var(--divider)" : "transparent",
                    color: !selectedSection ? "var(--accent)" : "var(--primary)" }}>
                  Select a section…
                </div>
                {sections.map(s => (
                  <div key={s.id} onClick={() => { setSelectedSection(s.id); setSectionDropOpen(false); }}
                    className="kk-option"
                    style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                      transition:"background .15s",
                      background: String(selectedSection) === String(s.id) ? "var(--divider)" : "transparent",
                      color: String(selectedSection) === String(s.id) ? "var(--accent)" : "var(--primary)" }}>
                    Section {s.sectionNumber} — {s.professorName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <label style={rv.label}>Rating</label>
          <div style={{ marginBottom:16 }}>
            <Stars count={rating} interactive onSet={r => { setRating(r); setErr(""); }} />
          </div>

          <label style={rv.label}>Your Review</label>
          <textarea
            value={comment} onChange={e => { setComment(e.target.value); setErr(""); }}
            placeholder="Share your honest experience…"
            rows={4}
            style={{ ...rv.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
          />
          <div style={{ fontSize:11, color: comment.length > 0 && comment.length < 20 ? "var(--error)" : "var(--text3)", marginTop:-10, marginBottom:16 }}>{comment.length} chars · minimum 20</div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={submit} disabled={submitting} style={rv.submitBtn}>
              {submitting ? "Submitting…" : "Post Review"}
            </button>
            <button onClick={onDone} style={rv.cancelBtn}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Reviews({ onNavigateToForum }) {
  const token = localStorage.getItem("kk_token");
  const userEmail = localStorage.getItem("kk_email");
  const [detailsCourse, setDetailsCourse] = useState(null);
  const [tab, setTab] = useState(() => {
    try { return sessionStorage.getItem("kk_reviews_tab") || "course"; } catch { return "course"; }
  });
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [sort,      setSort]      = useState("new");
  const [search,    setSearch]    = useState("");
  const [composing, setComposing] = useState(false);
  const [activeCourse, setActiveCourse] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("kk_reviews_course") || "null"); } catch { return null; }
  });
  const [selectedProfessor, setSelectedProfessor] = useState(() => {
    try { return sessionStorage.getItem("kk_reviews_prof") || null; } catch { return null; }
  });
  const [visibleCount,   setVisibleCount]   = useState(10);
  const [recentReviews,  setRecentReviews]  = useState([]);
  const [recentLoading,  setRecentLoading]  = useState(false);
  const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

  useEffect(() => {
    setRecentLoading(true);
    fetch(`${API}/api/reviews/recent?limit=8`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentReviews(data); })
      .catch(() => {})
      .finally(() => setRecentLoading(false));
  }, []);

  const loadReviews = useCallback(async (courseId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reviews/course/${courseId}`, { headers: authHeaders });
      const data = await res.json();
      setReviews(data);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  }, []);


  useEffect(() => {
    if (activeCourse) loadReviews(activeCourse.id);
  }, []);

  const selectCourse = (course) => {
    setActiveCourse(course);
    loadReviews(course.id);
    setComposing(false);
    setVisibleCount(10);
    sessionStorage.setItem("kk_reviews_course", JSON.stringify(course));
  };

  const clearCourse = () => {
    setActiveCourse(null);
    setReviews([]);
    setComposing(false);
    sessionStorage.removeItem("kk_reviews_course");
  };

  let displayed = reviews
    .filter(r => !search || fuzzySearch(r.comment, search));
  displayed = sort === "top"
    ? [...displayed].sort((a,b) => b.rating - a.rating)
    : [...displayed].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const hasMoreCourse = displayed.length > visibleCount;
  const visibleReviews = displayed.slice(0, visibleCount);

  if (detailsCourse) {
    return <CourseDetails course={detailsCourse} onBack={() => setDetailsCourse(null)} />;
  }
  return (
    <div style={{ padding:"28px 28px 60px", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .rv-anim { animation: fadeUp 0.3s ease both; }
      `}</style>

      <div>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"var(--primary)", marginBottom:8}}>Reviews</div>
      </div>
      <div style={{ display:"flex", gap:6, width:"fit-content", marginBottom:24 }}>
        {[
          { id:"course",    label:"Course Reviews"    },
          { id:"professor", label:"Professor Reviews" },
          ...(token ? [{ id:"mine", label:"My Reviews" }] : []),
        ].map(t => (
          <button key={t.id} className="kk-tab" data-active={tab===t.id} onClick={() => { setTab(t.id); sessionStorage.setItem("kk_reviews_tab", t.id); }} style={{
            padding:"8px 18px", borderRadius:9, fontSize:13,
            fontWeight: tab===t.id ? 600 : 400,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
            background: tab===t.id ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
            color:  tab===t.id ? "var(--primary)" : "var(--text2)",
            border: tab===t.id ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "professor" && <ProfessorReviewsTab token={token} userEmail={userEmail} onNavigateToForum={onNavigateToForum} selectedProfessor={selectedProfessor} onSelectProfessor={name => { setSelectedProfessor(name); try { if (name) sessionStorage.setItem("kk_reviews_prof", name); else sessionStorage.removeItem("kk_reviews_prof"); } catch {} }} />}
      {tab === "mine" && <MyReviewsTab token={token} userEmail={userEmail} />}

      {tab === "course" && <>
      {/* Course search or back button */}
      {!activeCourse ? (
        <div style={{ marginBottom:20 }}>
          <label style={{ ...rv.label, fontSize:13, fontWeight:400, color:"var(--text2)" }}>Browse reviews by course</label>
          <CourseSearch onSelect={selectCourse} />
          <p style={{ fontSize:12, color:"var(--text3)", marginTop:6 }}>Search for any course to read and write student reviews.</p>
        </div>
      ) : (
        <button onClick={clearCourse} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"var(--text2)", fontSize:13, fontWeight:600, cursor:"pointer", padding:"0 0 20px", fontFamily:"'DM Sans',sans-serif" }}>
          ← Back to search
        </button>
      )}

      {activeCourse && (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>
                  {activeCourse.courseCode} — {activeCourse.title}
                </div>
                <button className="kk-pill"
                  onClick={() => setDetailsCourse(activeCourse)}
                  style={{
                    padding:"7px 16px", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)",
                    border:"1px solid color-mix(in srgb, var(--primary) 30%, transparent)", borderRadius:10, fontSize:12,
                    fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                  }}
                >
                  View Course Details
                </button>

                {onNavigateToForum && (
                  <button
                    onClick={() => onNavigateToForum(activeCourse.courseCode, "")}
                    style={{
                      padding:"7px 16px", background:"var(--accent2)", color:"white",
                      border:"none", borderRadius:10, fontSize:12,
                      fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                    }}
                  >
                    Discuss this Course
                  </button>
                )}
              </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ 
                display:"flex", 
                gap:4, 
                background:"var(--surface2)",
                padding:4,
                borderRadius:10
              }}>
                {[{id:"top",label:"Top"},{id:"new",label:"New"}].map(s => (
                  <button key={s.id} className="kk-tab" data-active={sort===s.id} onClick={() => setSort(s.id)} style={{
                    padding:"6px 14px", border:"none", borderRadius:8, fontSize:12,
                    fontWeight: sort===s.id ? 600 : 400, cursor:"pointer", transition:"all .15s",
                    background: sort===s.id ? "var(--surface)" : "transparent",
                    color:      sort===s.id ? "var(--primary)" : "var(--text2)",
                    boxShadow:  sort===s.id ? "0 1px 4px rgba(49,72,122,0.08)" : "none",
                }}>{s.label}</button>
              ))}
            </div>
              {token && (
                <button onClick={() => setComposing(c => !c)} style={{
                  padding:"9px 20px 9px 12px", background:"color-mix(in srgb, var(--accent) 15%, transparent)", color:"var(--accent)",
                  border:"1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
                }}><Pen size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Write a Review</button>
              )}
            </div>
          </div>

          {/* search within reviews */}
          <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px", marginBottom:18 }}>
            <Search size={15} style={{ color:"var(--text3)", marginRight:8, flexShrink:0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search within reviews…"
              style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
          </div>
        </>
      )}

      {composing && (
        <SubmitReview
          token={token}
          userEmail={userEmail}
          preselectedCourse={activeCourse}
          onDone={() => { setComposing(false); activeCourse && loadReviews(activeCourse.id); }}
        />
      )}

      {loading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading reviews…</div>}
      {!loading && activeCourse && reviews.length > 0 && <RatingStats reviews={reviews} />}

      {!loading && activeCourse && displayed.length === 0 && !composing && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
          <div style={{ marginBottom:12 }}><Inbox size={40} color="var(--text3)" /></div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No reviews yet for this course</div>
          <div style={{ fontSize:13, marginTop:6 }}>Be the first to write one!</div>
        </div>
      )}

      {!activeCourse && (
        <>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>
            Recent Course Reviews
          </div>
          {recentLoading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
          {!recentLoading && recentReviews.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No reviews yet</div>
              <div style={{ fontSize:13, marginTop:6 }}>Search for a course above to be the first!</div>
            </div>
          )}
          {!recentLoading && recentReviews.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {recentReviews.map(r => (
                <div key={r.id}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
                    {r.section?.course?.courseCode
                      ? `${r.section.course.courseCode} — ${r.section.course.title}`
                      : "Unknown Course"}
                  </div>
                  <ReviewCard review={r} token={token} userEmail={userEmail} reviewType="course" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && activeCourse && visibleReviews.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {visibleReviews.map((r, i) => <ReviewCard key={r.id} review={r} token={token} userEmail={userEmail} reviewType="course" animDelay={i * 0.05} />)}
          </div>
      )}
      {!loading && activeCourse && hasMoreCourse && (
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
  );
}

function ProfessorSearch({ onSelect }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/courses/professors?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ position:"relative", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px" }}>
        <Search size={15} style={{ color:"var(--text3)", marginRight:8, flexShrink:0 }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by professor name (e.g. Dr. Sakr)…"
          style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
        {loading && <span style={{ fontSize:11, color:"var(--text3)" }}>searching…</span>}
      </div>
      {results.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, boxShadow:"0 4px 20px rgba(0,0,0,0.1)", zIndex:100, maxHeight:240, overflowY:"auto", marginTop:4 }}>
          {results.map(name => (
            <div key={name} onClick={() => { onSelect(name); setQuery(""); setResults([]); }}
              style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid var(--divider)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontWeight:700, color:"var(--primary)", fontSize:13 }}> {name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmitProfessorReview({ token, userEmail, professorName, onDone }) {
  const [rating,     setRating]     = useState(0);
  const [comment,    setComment]    = useState("");
  const [err,        setErr]        = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);

  const submit = async () => {
    if (rating === 0)               { setErr("Please select a rating."); return; }
    if (comment.trim().length < 20) { setErr("Review must be at least 20 characters."); return; }
    if (!token)                     { setErr("You must be logged in."); return; }
    setSubmitting(true); setErr("");
    try {
      const res = await fetch(
        `${API}/api/professor-reviews/submit?professorName=${encodeURIComponent(professorName)}&comment=${encodeURIComponent(comment)}&rating=${rating}&userId=${encodeURIComponent(userEmail)}`,
        { method:"POST", headers:{ "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const status = data?.status || "APPROVED";
        setSuccess(status);
        setTimeout(() => { setSuccess(false); onDone(); }, 6000);
      }
      else { const msg = await res.text(); setErr(msg || "Failed to submit."); }
    } catch { setErr("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div style={{ ...rv.composeCard, textAlign:"center", padding:40 }}>
      {success === "PENDING" ? (
        <>
        <div style={{ marginBottom:12 }}>
          <Hourglass size={40} color="var(--primary)" />
        </div>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>
        Review submitted for moderation
      </div>
      <div style={{ fontSize:13, color:"var(--text2)", marginTop:8 }}>
        Your review will be visible once approved by a moderator.
      </div>
    </>
  ) : (
    <>
      <CheckCircle size={40} color="var(--success)" style={{ marginBottom:12 }} />
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>
        Review submitted!
      </div>
    </>
  )}
</div>
  );

  return (
    <div style={rv.composeCard}>
      <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"var(--primary)", marginBottom:16 }}>
        Write a Review for {professorName}
      </div>
      {err && <div style={{ background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:10, padding:"9px 14px", fontSize:13, color:"var(--error)", marginBottom:14 }}>{err}</div>}
      <label style={rv.label}>Rating</label>
      <div style={{ marginBottom:16 }}>
        <Stars count={rating} interactive onSet={r => { setRating(r); setErr(""); }} />
      </div>
      <label style={rv.label}>Your Review</label>
      <textarea value={comment} onChange={e => { setComment(e.target.value); setErr(""); }}
        placeholder="Share your honest experience with this professor…"
        rows={4}
        style={{ ...rv.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
      />
      <div style={{ fontSize:11, color: comment.length > 0 && comment.length < 20 ? "var(--error)" : "var(--text3)", marginTop:-10, marginBottom:16 }}>{comment.length} chars · minimum 20</div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={submit} disabled={submitting} style={rv.submitBtn}>
          {submitting ? "Submitting…" : "Post Review"}
        </button>
        <button onClick={onDone} style={rv.cancelBtn}>Cancel</button>
      </div>
    </div>
  );
}

function MyReviewsTab({ token, userEmail }) {
  const [courseReviews,    setCourseReviews]    = useState([]);
  const [profReviews,      setProfReviews]      = useState([]);
  const [loading,          setLoading]          = useState(false);

  useEffect(() => {
    if (!token || !userEmail) return;
    setLoading(true);
    const headers = { "Authorization": `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/reviews/my?userId=${encodeURIComponent(userEmail)}`, { headers }).then(r => r.json()),
      fetch(`${API}/api/professor-reviews/my?userId=${encodeURIComponent(userEmail)}`, { headers }).then(r => r.json()),
    ])
      .then(([cr, pr]) => {
        const visible = s => s !== "FLAGGED";
        setCourseReviews(Array.isArray(cr) ? cr.filter(r => visible(r.status)) : []);
        setProfReviews(Array.isArray(pr) ? pr.filter(r => visible(r.status)) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, userEmail]);

  const STATUS_STYLE = {
      APPROVED: { bg:"var(--surface2)",  color:"var(--text2)",   label:"Approved"            },
      PENDING:  { bg:"#fff8ec",          color:"#b7680a",        label:"Pending moderation" },
      FLAGGED:  { bg:"#fef0f0",          color:"#c0392b",        label:"Flagged"            },
  };

  const StatusBadge = ({ status }) => {
    const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
    return (
      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:6, background:s.bg, color:s.color }}>
        {s.label}
      </span>
    );
  };

  const ReviewRow = ({ review, type }) => {
      return (
        <div style={{
          background:"var(--surface)", border:"1px solid var(--border)",
          borderRadius:14, padding:"16px 20px",
          boxShadow:"0 2px 8px rgba(49,72,122,0.06)",
          opacity: review.status === "FLAGGED" ? 0.7 : 1,
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              {type === "course" ? (
                <>
                  {review.section?.course?.courseCode && (
                    <span style={{ fontSize:12, fontWeight:700, color:"var(--primary)" }}>
                      {review.section.course.courseCode}
                    </span>
                  )}
                  {(review.section?.sectionNumber || review.section?.professorName) && (
                    <span style={{ fontSize:11, fontWeight:600, background:"var(--surface3)", color:"var(--accent2)", padding:"2px 8px", borderRadius:6 }}>
                      {[
                        review.section?.sectionNumber ? `Section ${review.section.sectionNumber}` : null,
                        review.section?.professorName || null,
                      ].filter(Boolean).join(", ")}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontSize:12, fontWeight:700, color:"var(--primary)" }}>
                  {review.professorName || ""}
                </span>
              )}
              <span style={{ fontSize:11, color:"var(--text3)" }}>· {timeAgo(review.createdAt)}</span>
            </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ display:"inline-flex", gap:2 }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ color: i <= review.rating ? "#f5a623" : "var(--border)", fontSize:14 }}>★</span>
              ))}
            </span>
            <StatusBadge status={review.status} />
          </div>
        </div>
        <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.65, margin:0 }}>{review.comment}</p>
        {review.status === "PENDING" && (
          <div style={{ fontSize:12, color:"#b7680a", marginTop:10 }}>
            Your review is awaiting moderator approval and is not yet visible to others.
          </div>
        )}
        {review.status === "FLAGGED" && (
          <div style={{ fontSize:12, color:"#c0392b", marginTop:10 }}>
            Your review has been flagged and is under review by an admin.
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={{ textAlign:"center", padding:60, color:"var(--text3)" }}>Loading your reviews…</div>;

  const total = courseReviews.length + profReviews.length;

  if (total === 0) return (
    <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
      <Inbox size={40} color="var(--text3)" style={{ marginBottom:12 }} />
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)", marginBottom:6 }}>
        No reviews yet
      </div>
      <div style={{ fontSize:13 }}>Your submitted reviews will appear here.</div>
    </div>
  );

  return (
    <div>
      {courseReviews.length > 0 && (
        <>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>
            Course Reviews ({courseReviews.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
            {[...courseReviews].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(r => <ReviewRow key={r.id} review={r} type="course" />)}
          </div>
        </>
      )}
      {profReviews.length > 0 && (
        <>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>
            Professor Reviews ({profReviews.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[...profReviews].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(r => <ReviewRow key={r.id} review={r} type="professor" />)}
          </div>
        </>
      )}
    </div>
  );
}

function ProfessorReviewsTab({ token, userEmail, onNavigateToForum, selectedProfessor, onSelectProfessor }) {
  const selected = selectedProfessor;
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [composing, setComposing] = useState(false);
  const [sort,      setSort]      = useState("new");
  const [search,    setSearch]    = useState("");
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [visibleCount,   setVisibleCount]   = useState(10);

  const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

  useEffect(() => {
      setRecentLoading(true);
      fetch(`${API}/api/professor-reviews/recent?limit=8`, { headers: authHeaders })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setRecentReviews(data); })
        .catch(() => {})
        .finally(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`${API}/api/professor-reviews?professorName=${encodeURIComponent(selected)}`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => { setReviews(Array.isArray(data) ? data : []); })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [selected]);

  const selectProfessor = async (name) => {
    onSelectProfessor(name);
    setComposing(false);
    setVisibleCount(10);
  };

  let displayed = reviews
    .filter(r => !search || fuzzySearch(r.comment, search));
  displayed = sort === "top"
    ? [...displayed].sort((a,b) => b.rating - a.rating)
    : [...displayed].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const hasMoreProf = displayed.length > visibleCount;
  const visibleProfReviews = displayed.slice(0, visibleCount);

  return (
    <div>
      {!selected && (
        <div style={{ marginBottom:20 }}>
          <label style={{ ...rv.label, fontSize:13, fontWeight:400, color:"var(--text2)" }}>Browse reviews by professor</label>
          <ProfessorSearch onSelect={selectProfessor} />
          <p style={{ fontSize:12, color:"var(--text3)", marginTop:6 }}>Search for any professor to read and write student reviews.</p>
        </div>
      )}

      {selected && (
        <>
          <button onClick={() => onSelectProfessor(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"var(--text2)", fontSize:13, fontWeight:600, cursor:"pointer", padding:"0 0 20px", fontFamily:"'DM Sans',sans-serif" }}>
            ← Back to search
          </button>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>{selected}</div>
              {onNavigateToForum && (
                <button
                  onClick={() => onNavigateToForum("", selected)}
                  style={{
                    padding:"7px 16px", background:"var(--accent2)", color:"white",
                    border:"none", borderRadius:10, fontSize:12,
                    fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                  }}
                >
                  Discuss this Professor
                </button>
              )}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ display:"flex", gap:4, background:"var(--surface2)", padding:4, borderRadius:10 }}>
                {[{id:"top",label:"Top"},{id:"new",label:"New"}].map(s => (
                  <button key={s.id} className="kk-tab" data-active={sort===s.id} onClick={() => setSort(s.id)} style={{
                    padding:"6px 14px", border:"none", borderRadius:8, fontSize:12,
                    fontWeight: sort===s.id ? 600 : 400, cursor:"pointer", transition:"all .15s",
                    background: sort===s.id ? "var(--surface)" : "transparent",
                    color:      sort===s.id ? "var(--primary)" : "var(--text2)",
                    boxShadow:  sort===s.id ? "0 1px 4px rgba(49,72,122,0.08)" : "none",
                  }}>{s.label}</button>
                ))}
              </div>
              {token && (
                <button onClick={() => setComposing(c => !c)} style={{
                  padding:"9px 20px 9px 12px", background:"color-mix(in srgb, var(--accent) 15%, transparent)", color:"var(--accent)",
                  border:"1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
                }}><Pen size={14} style={{ marginRight:6, verticalAlign:"middle" }} />Write a Review</button>
              )}
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px", marginBottom:18 }}>
            <Search size={15} style={{ color:"var(--text3)", marginRight:8, flexShrink:0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search within reviews…"
              style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
          </div>

          {composing && (
            <SubmitProfessorReview
              token={token} userEmail={userEmail} professorName={selected}
              onDone={() => { setComposing(false); selectProfessor(selected); }}
            />
          )}

          {loading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading reviews…</div>}
          {!loading && reviews.length > 0 && <RatingStats reviews={reviews} />}

          {!loading && displayed.length === 0 && !composing && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
              <div style={{ marginBottom:12 }}><Inbox size={40} color="var(--text3)" /></div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No reviews yet for this professor</div>
              <div style={{ fontSize:13, marginTop:6 }}>Be the first to write one!</div>
            </div>
          )}

          {!loading && visibleProfReviews.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {visibleProfReviews.map((r, i) => <ReviewCard key={r.id} review={r} token={token} userEmail={userEmail} reviewType="professor" animDelay={i * 0.05} />)}
              </div>
          )}
          {!loading && hasMoreProf && (
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
        </>
      )}

      {!selected && (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>
              Recent Professor Reviews
            </div>
            {recentLoading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
            {!recentLoading && recentReviews.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No reviews yet</div>
                <div style={{ fontSize:13, marginTop:6 }}>Search for a professor above to be the first!</div>
              </div>
            )}
            {!recentLoading && recentReviews.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {recentReviews.map(r => (
                  <div key={r.id}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
                      {r.professorName}
                    </div>
                    <ReviewCard review={r} token={token} userEmail={userEmail} reviewType="professor" />
                  </div>
                ))}
              </div>
            )}
          </>
      )}
    </div>
  );
}

const rv = {
  card: {
    display:"flex", gap:14, background:"var(--surface)", borderRadius:16, padding:"18px 20px",
    border:"1px solid var(--border)", boxShadow:"0 2px 14px rgba(49,72,122,0.07)",
  },
  composeCard: {
    background:"var(--surface)", borderRadius:18, padding:"24px 26px",
    border:"1px solid var(--border)", boxShadow:"0 4px 20px rgba(49,72,122,0.10)", marginBottom:20,
  },
  avatar: {
    width:28, height:28, borderRadius:"50%",
    background:"linear-gradient(135deg,#8FB3E2,#A59AC9)",
    color:"white", fontWeight:700, fontSize:12,
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
  },
  label:     { display:"block", fontSize:12, fontWeight:600, color:"var(--text)", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", marginBottom:16, display:"block" },
  submitBtn: { padding:"10px 22px", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", border:"1.5px solid color-mix(in srgb, var(--primary) 30%, transparent)", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"8px 16px", background:"var(--bg)", color:"var(--text2)", border:"1px solid var(--border)", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};