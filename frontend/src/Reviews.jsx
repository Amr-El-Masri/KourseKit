import { useState, useEffect, useCallback } from "react";
import { Pen, Search, Inbox, CheckCircle, Hourglass } from "lucide-react";
import CourseDetails from "./CourseDetails";

const API = "http://localhost:8080";

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

const timeAgo = ts => {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
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
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => interactive && onSet(i)} style={{
          color: i<=count ? "var(--star)" : "var(--border)", fontSize:16,
          cursor: interactive ? "pointer" : "default", transition:"color .1s"
        }}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review, token, userEmail, reviewType = "course" }) {
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
    <div style={rv.card}>
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
          <label style={rv.label}>Search for a Course</label>
          <CourseSearch onSelect={selectCourse} />
        </>
      )}

      {selectedCourse && (
        <>
          <div style={{ background:"color-mix(in srgb, var(--accent) 10%, transparent)", border:"1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"var(--text2)" }}>
            Selected: <strong style={{ color:"var(--accent)" }}>{selectedCourse.courseCode}</strong> — {selectedCourse.title}
          </div>

          <label style={rv.label}>Select Section</label>
          <div style={{ position:"relative", marginBottom:16 }}>
            <button type="button" onClick={() => setSectionDropOpen(o => !o)} style={{
              width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10,
              background:"var(--surface2)", color: selectedSection ? "var(--text)" : "var(--text3)",
              fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
              textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              {selectedSection
                ? (() => { const s = sections.find(s => String(s.id) === String(selectedSection)); return s ? `Section ${s.sectionNumber} — ${s.professorName}` : "— pick a section —"; })()
                : "— pick a section —"}
              <span style={{ fontSize:10, opacity:0.7 }}>▼</span>
            </button>
            {sectionDropOpen && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, maxHeight:220, overflowY:"auto" }}>
                <div onClick={() => { setSelectedSection(""); setSectionDropOpen(false); }}
                  style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                    background: !selectedSection ? "var(--divider)" : "transparent",
                    color: !selectedSection ? "var(--accent)" : "var(--primary)" }}>
                  — pick a section —
                </div>
                {sections.map(s => (
                  <div key={s.id} onClick={() => { setSelectedSection(s.id); setSectionDropOpen(false); }}
                    style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
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
            placeholder="Share your honest experience..."
            rows={4}
            style={{ ...rv.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
          />
          <div style={{ fontSize:11, color:"var(--text3)", marginTop:-10, marginBottom:16 }}>{comment.length} chars</div>

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

export default function Reviews({ initialCourse, onNavigateToForum }) {
  const token = localStorage.getItem("kk_token");
  const userEmail = localStorage.getItem("kk_email");
  const [detailsCourse, setDetailsCourse] = useState(null);
  const [tab, setTab] = useState("course");
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [sort,      setSort]      = useState("new");
  const [search,    setSearch]    = useState("");
  const [composing, setComposing] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);

  const loadReviews = useCallback(async (courseId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reviews/course/${courseId}`);
      const data = await res.json();
      setReviews(data);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  }, []);

  const selectCourse = (course) => {
    setActiveCourse(course);
    loadReviews(course.id);
    setComposing(false);
  };

  let displayed = reviews
    .filter(r => !search || fuzzySearch(r.comment, search));
  displayed = sort === "top"
    ? [...displayed].sort((a,b) => b.rating - a.rating)
    : [...displayed].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (detailsCourse) {
    return <CourseDetails course={detailsCourse} onBack={() => setDetailsCourse(null)} />;
  }
  return (
    <div style={{ padding:"28px 28px 60px", maxWidth:860, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
      `}</style>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"var(--primary)", marginBottom:12 }}>Reviews</div>
        <div style={{ display:"flex", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:5, width:"fit-content", gap:4 }}>
          {[
            { id:"course",    icon:"", label:"Course Reviews"    },
            { id:"professor", icon:"", label:"Professor Reviews" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:"9px 22px", border:"none", borderRadius:10, fontSize:13, fontWeight:600,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
              background: tab===t.id ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
              color:       tab===t.id ? "var(--primary)" : "var(--text2)",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "professor" && <ProfessorReviewsTab token={token} userEmail={userEmail} onNavigateToForum={onNavigateToForum} />}

      {tab === "course" && <>
      {/* Course search to browse reviews */}
      <div style={{ marginBottom:20 }}>
        <label style={{ ...rv.label, fontSize:13, fontWeight:400, color:"var(--text2)" }}>Browse reviews by course</label>
        <CourseSearch onSelect={selectCourse} />
      </div>

      {activeCourse && (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>
                  {activeCourse.courseCode} — {activeCourse.title}
                </div>
                <button
                  onClick={() => setDetailsCourse(activeCourse)}
                  style={{
                    padding:"7px 16px", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)",
                    border:"none", borderRadius:10, fontSize:12,
                    fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
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
                background:"var(--surface)", 
                border:"1px solid var(--border)",
                padding:4, 
                borderRadius:10 
              }}>
                {[{id:"top",label:"Top"},{id:"new",label:"New"}].map(s => (
                  <button key={s.id} onClick={() => setSort(s.id)} style={{
                    padding:"6px 14px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                    background: sort===s.id ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
                    color:      sort===s.id ? "var(--primary)" : "var(--text2)",
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

      {!loading && activeCourse && displayed.length === 0 && !composing && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
          <div style={{ marginBottom:12 }}><Inbox size={40} color="var(--text3)" /></div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No reviews yet for this course</div>
          <div style={{ fontSize:13, marginTop:6 }}>Be the first to write one!</div>
        </div>
      )}

      {!loading && !activeCourse && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}></div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>Search for a course above</div>
          <div style={{ fontSize:13, marginTop:6 }}>to view or submit reviews</div>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {displayed.map(r => <ReviewCard key={r.id} review={r} token={token} userEmail={userEmail} reviewType="course" />)}
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
        placeholder="Share your honest experience with this professor..."
        rows={4}
        style={{ ...rv.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
      />
      <div style={{ fontSize:11, color:"var(--text3)", marginTop:-10, marginBottom:16 }}>{comment.length} chars</div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={submit} disabled={submitting} style={rv.submitBtn}>
          {submitting ? "Submitting…" : "Post Review"}
        </button>
        <button onClick={onDone} style={rv.cancelBtn}>Cancel</button>
      </div>
    </div>
  );
}

function ProfessorReviewsTab({ token, userEmail, onNavigateToForum }) {
  const [selected,  setSelected]  = useState(null);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [composing, setComposing] = useState(false);
  const [sort,      setSort]      = useState("new");
  const [search,    setSearch]    = useState("");

  const selectProfessor = async (name) => {
    setSelected(name);
    setComposing(false);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/professor-reviews?professorName=${encodeURIComponent(name)}`);
      const data = await res.json();
      setReviews(data);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  };

  let displayed = reviews
    .filter(r => !search || fuzzySearch(r.comment, search));
  displayed = sort === "top"
    ? [...displayed].sort((a,b) => b.rating - a.rating)
    : [...displayed].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <label style={{ ...rv.label, fontSize:13, fontWeight:400, color:"var(--text2)" }}>Browse reviews by professor</label>
        <ProfessorSearch onSelect={selectProfessor} />
      </div>

      {selected && (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:18 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}> {selected}</div>
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
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ display:"flex", gap:4, background:"var(--bg)", padding:4, borderRadius:10 }}>
                {[{id:"top",label:"Top"},{id:"new",label:"New"}].map(s => (
                  <button key={s.id} onClick={() => setSort(s.id)} style={{
                    padding:"6px 14px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                    background: sort===s.id ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
                    color:      sort===s.id ? "var(--primary)" : "var(--text2)",
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

          {!loading && displayed.length === 0 && !composing && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
              <div style={{ marginBottom:12 }}><Inbox size={40} color="var(--text3)" /></div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No reviews yet for this professor</div>
              <div style={{ fontSize:13, marginTop:6 }}>Be the first to write one!</div>
            </div>
          )}

          {!loading && displayed.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {displayed.map(r => <ReviewCard key={r.id} review={r} token={token} userEmail={userEmail} reviewType="professor" />)}
            </div>
          )}
        </>
      )}

      {!selected && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}></div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>Search for a professor above</div>
          <div style={{ fontSize:13, marginTop:6 }}>to view or submit reviews</div>
        </div>
      )}
    </div>
  );
}

const rv = {
  card: {
    display:"flex", gap:14, background:"var(--surface)", borderRadius:16, padding:"18px 20px",
    border:"1px solid var(--border)", boxShadow:"0 2px 10px rgba(49,72,122,0.06)",
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
  submitBtn: { padding:"10px 24px", background:"color-mix(in srgb, var(--primary) 15%, transparent)", color:"var(--primary)", border:"1px solid color-mix(in srgb, var(--primary) 30%, transparent)", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"10px 18px", background:"var(--bg)", color:"var(--text2)", border:"1px solid var(--border)", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};