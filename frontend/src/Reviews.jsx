import { useState, useEffect, useCallback } from "react";
import { Pen, Search, Inbox } from "lucide-react";

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

function Stars({ count, interactive, onSet }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => interactive && onSet(i)} style={{
          color: i<=count ? "#f5a623" : "#D4D4DC", fontSize:16,
          cursor: interactive ? "pointer" : "default", transition:"color .1s"
        }}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review }) {
  // section info might be nested in the response
  const sectionInfo = review.section
    ? `${review.section.sectionNumber || ""} — ${review.section.professorName || ""}`.trim()
    : "";

  return (
    <div style={rv.card}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:8 }}>
          <div style={rv.avatar}>{randomAnon()[0]}</div>
          <span style={{ fontSize:13, fontWeight:600, color:"#31487A" }}>Anonymous</span>
          <span style={{ fontSize:11, color:"#B8A9C9" }}>·</span>
          <span style={{ fontSize:11, color:"#B8A9C9" }}>{timeAgo(review.createdAt)}</span>
          {sectionInfo && (
            <>
              <span style={{ fontSize:11, color:"#B8A9C9" }}>·</span>
              <span style={{ fontSize:11, background:"#F0EEF7", color:"#7B5EA7", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>
                {sectionInfo}
              </span>
            </>
          )}
          <div style={{ marginLeft:"auto" }}><Stars count={review.rating} /></div>
        </div>
        <p style={{ fontSize:14, color:"#4a3a6a", lineHeight:1.65, margin:0 }}>{review.comment}</p>
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
      <div style={{ display:"flex", alignItems:"center", background:"#fff", border:"1px solid #D4D4DC", borderRadius:12, padding:"8px 14px" }}>
        <Search size={15} style={{ color:"#B8A9C9", marginRight:8, flexShrink:0 }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by course code or title (e.g. CMPS 200)…"
          style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" }}
        />
        {loading && <span style={{ fontSize:11, color:"#B8A9C9" }}>searching…</span>}
      </div>

      {results.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #D4D4DC", borderRadius:12, boxShadow:"0 4px 20px rgba(0,0,0,0.1)", zIndex:100, maxHeight:240, overflowY:"auto", marginTop:4 }}>
          {results.map(course => (
            <div key={course.id} onClick={() => { onSelect(course); setQuery(""); setResults([]); }}
              style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #F0EEF7", transition:"background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F7F5FB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontWeight:700, color:"#31487A", fontSize:13 }}>{course.courseCode}</span>
              <span style={{ color:"#A59AC9", fontSize:13 }}> — {course.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmitReview({ token, userEmail, onDone }) {
  const [selectedCourse,  setSelectedCourse]  = useState(null);
  const [sections,        setSections]        = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [rating,          setRating]          = useState(0);
  const [comment,         setComment]         = useState("");
  const [err,             setErr]             = useState("");
  const [submitting,      setSubmitting]       = useState(false);
  const [success,         setSuccess]         = useState(false);

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
        setSuccess(true);
        setTimeout(() => { setSuccess(false); onDone(); }, 2000);
      } else {
        const msg = await res.text();
        setErr(msg || "Failed to submit review.");
      }
    } catch { setErr("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div style={{ ...rv.composeCard, textAlign:"center", padding:40 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"#31487A" }}>Review submitted!</div>
    </div>
  );

  return (
    <div style={rv.composeCard}>
      <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"#31487A", marginBottom:16 }}>
        Write a Course Review
      </div>

      {err && <div style={{ background:"#fef0f0", border:"1px solid #f5c6c6", borderRadius:10, padding:"9px 14px", fontSize:13, color:"#c0392b", marginBottom:14 }}>{err}</div>}

      <label style={rv.label}>Search for a Course</label>
      <CourseSearch onSelect={selectCourse} />

      {selectedCourse && (
        <>
          <div style={{ background:"#F7F5FB", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13 }}>
            Selected: <strong style={{ color:"#31487A" }}>{selectedCourse.courseCode}</strong> — {selectedCourse.title}
          </div>

          <label style={rv.label}>Select Section</label>
          <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
            style={{ ...rv.input, cursor:"pointer" }}>
            <option value="">— pick a section —</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                Section {s.sectionNumber} — {s.professorName}
              </option>
            ))}
          </select>

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
          <div style={{ fontSize:11, color:"#B8A9C9", marginTop:-10, marginBottom:16 }}>{comment.length} chars</div>

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

export default function Reviews() {
  const token = localStorage.getItem("kk_token");
  const userEmail = localStorage.getItem("kk_email");
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
    .filter(r => !search || r.comment?.toLowerCase().includes(search.toLowerCase()));
  displayed = sort === "top"
    ? [...displayed].sort((a,b) => b.rating - a.rating)
    : [...displayed].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div style={{ padding:"28px 28px 60px", maxWidth:860, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
      `}</style>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"#31487A", marginBottom:4 }}>Course Reviews</div>
        <div style={{ fontSize:13, color:"#A59AC9" }}>Anonymous reviews from AUB students — honest and helpful.</div>
      </div>

      {/* Course search to browse reviews */}
      <div style={{ marginBottom:20 }}>
        <label style={rv.label}>Browse reviews by course</label>
        <CourseSearch onSelect={selectCourse} />
      </div>

      {activeCourse && (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:18 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"#31487A" }}>
              {activeCourse.courseCode} — {activeCourse.title}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ display:"flex", gap:4, background:"#F4F4F8", padding:4, borderRadius:10 }}>
                {[{id:"top",label:"Top"},{id:"new",label:"New"}].map(s => (
                  <button key={s.id} onClick={() => setSort(s.id)} style={{
                    padding:"6px 14px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                    background: sort===s.id ? "#31487A" : "transparent",
                    color:      sort===s.id ? "#ffffff" : "#A59AC9",
                  }}>{s.label}</button>
                ))}
              </div>
              {token && (
                <button onClick={() => setComposing(c => !c)} style={{
                  padding:"9px 20px 9px 12px", background:"#7B5EA7", color:"white",
                  border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
                }}><Pen size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Write a Review</button>
              )}
            </div>
          </div>

          {/* search within reviews */}
          <div style={{ display:"flex", alignItems:"center", background:"#fff", border:"1px solid #D4D4DC", borderRadius:12, padding:"8px 14px", marginBottom:18 }}>
            <Search size={15} style={{ color:"#B8A9C9", marginRight:8, flexShrink:0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search within reviews…"
              style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
          </div>
        </>
      )}

      {composing && (
        <SubmitReview
          token={token}
          userEmail={userEmail}
          onDone={() => { setComposing(false); activeCourse && loadReviews(activeCourse.id); }}
        />
      )}

      {loading && <div style={{ textAlign:"center", padding:40, color:"#B8A9C9" }}>Loading reviews…</div>}

      {!loading && activeCourse && displayed.length === 0 && !composing && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#B8A9C9" }}>
          <div style={{ marginBottom:12 }}><Inbox size={40} color="#B8A9C9" /></div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"#31487A" }}>No reviews yet for this course</div>
          <div style={{ fontSize:13, marginTop:6 }}>Be the first to write one!</div>
        </div>
      )}

      {!loading && !activeCourse && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#B8A9C9" }}>
          <div style={{ fontSize:40, marginBottom:12 }}></div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"#31487A" }}>Search for a course above</div>
          <div style={{ fontSize:13, marginTop:6 }}>to view or submit reviews</div>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {displayed.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </div>
  );
}

const rv = {
  card: {
    display:"flex", gap:14, background:"#ffffff", borderRadius:16, padding:"18px 20px",
    border:"1px solid #D4D4DC", boxShadow:"0 2px 10px rgba(49,72,122,0.06)",
  },
  composeCard: {
    background:"#ffffff", borderRadius:18, padding:"24px 26px",
    border:"1px solid #D4D4DC", boxShadow:"0 4px 20px rgba(49,72,122,0.10)", marginBottom:20,
  },
  avatar: {
    width:28, height:28, borderRadius:"50%",
    background:"linear-gradient(135deg,#8FB3E2,#A59AC9)",
    color:"white", fontWeight:700, fontSize:12,
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
  },
  label:     { display:"block", fontSize:12, fontWeight:600, color:"#2a2050", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#F7F5FB", marginBottom:16, display:"block" },
  submitBtn: { padding:"10px 24px", background:"#31487A", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"10px 18px", background:"#F4F4F8", color:"#A59AC9", border:"1px solid #D4D4DC", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};