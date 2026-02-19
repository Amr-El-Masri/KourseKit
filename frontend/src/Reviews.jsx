import { useState } from "react";

// ── Anon names (same pool as dashboard) ──────────────────────────────────────
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
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)          return "just now";
  if (s < 3600)        return `${Math.floor(s/60)}m ago`;
  if (s < 86400)       return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_PROF_REVIEWS = [
  { id:1, target:"Dr. Mohammad Sakr", course:"CMPS 271", stars:4, author:randomAnon(), text:"Honestly lectures were genuinely interesting, but the workload was intense and exams were hard. 3al 2aleele you learn a lot — if he's giving it I recommend, cuz he teaches better than the others that give this course.", upvotes:14, downvotes:2, ts:Date.now()-3*3600000, tags:["Helpful","Heavy Workload"] },
  { id:2, target:"Dr. Mohammad Sakr", course:"CMPS 271", stars:5, author:randomAnon(), text:"He really knows his stuff and makes complex topics click. Office hours are super useful. Exams are fair if you study the slides properly.", upvotes:9, downvotes:0, ts:Date.now()-8*3600000, tags:["Clear Explanations","Exams Are Fair"] },
  { id:3, target:"Mr. Mahmoud El Hassanieh", course:"PHIL 210", stars:3, author:randomAnon(), text:"He rushes too much and erases before everyone finishes writing, but he explains really well — you just have to keep up (w the course aslan ktir sa3eb).", upvotes:21, downvotes:3, ts:Date.now()-86400000, tags:["Rushes","Hard Course"] },
  { id:4, target:"Dr. Arne Dietrich", course:"PSYC 222", stars:5, author:randomAnon(), text:"One of the best professors at AUB. He's written actual books on the topics he teaches and it shows. The lectures feel like TED talks. Take anything he gives.", upvotes:38, downvotes:1, ts:Date.now()-2*86400000, tags:["Brilliant","Engaging","Must Take"] },
  { id:5, target:"Dr. Sarine Hagopian", course:"PSYC 284", stars:4, author:randomAnon(), text:"Very approachable and genuinely cares. Grading is fair, participation matters. Sometimes goes off on tangents but they're usually interesting ones lol.", upvotes:11, downvotes:2, ts:Date.now()-3*86400000, tags:["Approachable","Fair Grading"] },
  { id:6, target:"Dr. Mohammad A. Kobeissi", course:"CMPS 215", stars:3, author:randomAnon(), text:"Decent professor but the course structure is a bit all over the place. If you study past exams you'll be fine. He does reply to emails quickly which is nice.", upvotes:6, downvotes:4, ts:Date.now()-5*86400000, tags:["Disorganized","Responsive"] },
];

const SEED_COURSE_REVIEWS = [
  { id:1, target:"PSYC 222", dept:"PSYC", stars:5, author:randomAnon(), text:"Super interesting course, genuinely highly recommend — and it's only given annually fa traw7ou 3alaykon.", upvotes:32, downvotes:0, ts:Date.now()-2*3600000, tags:["Interesting","Annual Only"] },
  { id:2, target:"PHIL 210", dept:"PHIL", stars:3, author:randomAnon(), text:"I found it interesting bas ken lezem ykoon elective, and it had heavier workload than it should've had for the credits.", upvotes:17, downvotes:5, ts:Date.now()-6*3600000, tags:["Heavy Workload","Interesting"] },
  { id:3, target:"CMPS 271", dept:"CMPS", stars:4, author:randomAnon(), text:"Core CMPS requirement and for good reason. Concepts build on each other so don't fall behind. Labs are actually useful for understanding the theory.", upvotes:25, downvotes:2, ts:Date.now()-86400000, tags:["Important","Builds Up"] },
  { id:4, target:"CMPS 215", dept:"CMPS", stars:2, author:randomAnon(), text:"The content is important but the delivery is all over the place. The exams test things not covered in class sometimes. Would not take again if I had the choice.", upvotes:8, downvotes:6, ts:Date.now()-2*86400000, tags:["Disorganized","Important Content"] },
  { id:5, target:"PSYC 284", dept:"PSYC", stars:4, author:randomAnon(), text:"Really practical course. Lots of case studies and real-world examples. The group project is actually fun if you get a good team. Attendance matters.", upvotes:13, downvotes:1, ts:Date.now()-4*86400000, tags:["Practical","Group Work"] },
  { id:6, target:"CMPS 300", dept:"CMPS", stars:3, author:randomAnon(), text:"Hard but fair. Lots of theory but the professor ties it to practical applications well. Exam questions can be tricky though — read them carefully.", upvotes:7, downvotes:3, ts:Date.now()-6*86400000, tags:["Challenging","Fair"] },
];

const PROF_TAGS  = ["Helpful","Heavy Workload","Clear Explanations","Exams Are Fair","Rushes","Hard Course","Brilliant","Engaging","Must Take","Approachable","Fair Grading","Disorganized","Responsive","Boring","Funny"];
const COURSE_TAGS= ["Interesting","Heavy Workload","Annual Only","Important","Builds Up","Practical","Group Work","Challenging","Fair","Disorganized","Easy A","Lab Intensive","Writing Heavy"];
const DEPTS      = ["CMPS","MATH","ENGL","PSYC","PHIL","ECON","BIOL","CHEM","MECH","ELEC","MGMT","MCOM"];

// ── Sub-components ────────────────────────────────────────────────────────────
function Stars({ count, interactive, onSet }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onClick={() => interactive && onSet(i)}
          style={{ color: i<=count?"#f5a623":"#D4D4DC", fontSize:16, cursor:interactive?"pointer":"default", transition:"color .1s" }}
        >★</span>
      ))}
    </span>
  );
}

function TagPill({ tag, active, onClick }) {
  return (
    <span onClick={onClick} style={{
      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
      cursor: onClick ? "pointer" : "default",
      background: active ? "#31487A" : "#F0EEF7",
      color:       active ? "#ffffff" : "#7B5EA7",
      border: "1px solid",
      borderColor: active ? "#31487A" : "#D4D4DC",
      transition:"all .15s", userSelect:"none",
    }}>{tag}</span>
  );
}

function ReviewCard({ review, onVote }) {
  const score = review.upvotes - review.downvotes;
  return (
    <div style={rv.card}>
      {/* vote column */}
      <div style={rv.voteCol}>
        <button onClick={() => onVote(review.id,"up")} style={{ ...rv.voteBtn, color: review.myVote==="up" ? "#31487A" : "#B8A9C9" }}>▲</button>
        <span style={{ fontSize:13, fontWeight:700, color: score>0?"#31487A":score<0?"#c0392b":"#B8A9C9", lineHeight:1 }}>{score}</span>
        <button onClick={() => onVote(review.id,"down")} style={{ ...rv.voteBtn, color: review.myVote==="down" ? "#c0392b" : "#B8A9C9" }}>▼</button>
      </div>

      {/* content */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:8 }}>
          <div style={rv.avatar}>{review.author[0]}</div>
          <span style={{ fontSize:13, fontWeight:600, color:"#31487A" }}>Anonymous {review.author}</span>
          <span style={{ fontSize:11, color:"#B8A9C9" }}>·</span>
          <span style={{ fontSize:11, color:"#B8A9C9" }}>{timeAgo(review.ts)}</span>
          <span style={{ fontSize:11, color:"#B8A9C9" }}>·</span>
          <span style={{ fontSize:11, background:"#F0EEF7", color:"#7B5EA7", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>
            {review.course || review.dept}
          </span>
          <div style={{ marginLeft:"auto" }}><Stars count={review.stars} /></div>
        </div>

        {/* target label */}
        <div style={{ fontSize:14, fontWeight:700, color:"#2a2050", marginBottom:6 }}>{review.target}</div>

        {/* body */}
        <p style={{ fontSize:14, color:"#4a3a6a", lineHeight:1.65, margin:0, marginBottom:10 }}>{review.text}</p>

        {/* tags */}
        {review.tags?.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {review.tags.map(t => <TagPill key={t} tag={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Compose form ──────────────────────────────────────────────────────────────
function ComposeForm({ mode, onSubmit, onCancel }) {
  const [target,   setTarget]   = useState("");
  const [course,   setCourse]   = useState("");
  const [dept,     setDept]     = useState("CMPS");
  const [stars,    setStars]    = useState(0);
  const [text,     setText]     = useState("");
  const [selTags,  setSelTags]  = useState([]);
  const [err,      setErr]      = useState("");

  const tagPool = mode==="professor" ? PROF_TAGS : COURSE_TAGS;
  const toggleTag = t => setSelTags(p => p.includes(t) ? p.filter(x=>x!==t) : p.length<4 ? [...p,t] : p);

  const submit = () => {
    if (!target.trim())      { setErr("Please enter a "+(mode==="professor"?"professor name.":"course code.")); return; }
    if (stars===0)           { setErr("Please select a star rating."); return; }
    if (text.trim().length<20){ setErr("Review must be at least 20 characters."); return; }
    onSubmit({ target:target.trim(), course, dept, stars, text:text.trim(), tags:selTags });
  };

  return (
    <div style={rv.composeCard}>
      <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:"#31487A", marginBottom:16 }}>
        Write a {mode==="professor"?"Professor":"Course"} Review
      </div>

      {err && <div style={{ background:"#fef0f0", border:"1px solid #f5c6c6", borderRadius:10, padding:"9px 14px", fontSize:13, color:"#c0392b", marginBottom:14 }}>{err}</div>}

      <label style={rv.label}>{mode==="professor" ? "Professor Name" : "Course Code"}</label>
      <input
        value={target} onChange={e=>{setTarget(e.target.value);setErr("");}}
        placeholder={mode==="professor" ? "e.g. Dr. Mohammad Sakr" : "e.g. CMPS 271"}
        style={rv.input}
      />

      {mode==="professor" ? (
        <>
          <label style={rv.label}>Course Taken With Them</label>
          <input value={course} onChange={e=>setCourse(e.target.value)} placeholder="e.g. CMPS 271" style={rv.input} />
        </>
      ) : (
        <>
          <label style={rv.label}>Department</label>
          <select value={dept} onChange={e=>setDept(e.target.value)} style={{ ...rv.input, cursor:"pointer" }}>
            {DEPTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </>
      )}

      <label style={rv.label}>Rating</label>
      <div style={{ marginBottom:16 }}><Stars count={stars} interactive onSet={s=>{setStars(s);setErr("");}} /></div>

      <label style={rv.label}>Your Review</label>
      <textarea
        value={text} onChange={e=>{setText(e.target.value);setErr("");}}
        placeholder="Share your honest experience..."
        rows={4}
        style={{ ...rv.input, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
      />
      <div style={{ fontSize:11, color:"#B8A9C9", marginTop:-10, marginBottom:16 }}>{text.length} chars</div>

      <label style={rv.label}>Tags <span style={{ color:"#B8A9C9", fontWeight:400 }}>(pick up to 4)</span></label>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
        {tagPool.map(t => (
          <TagPill key={t} tag={t} active={selTags.includes(t)} onClick={() => toggleTag(t)} />
        ))}
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={submit} style={rv.submitBtn}>Post Review</button>
        <button onClick={onCancel} style={rv.cancelBtn}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main Reviews page ─────────────────────────────────────────────────────────
export default function Reviews() {
  const [mode,        setMode]        = useState("professor"); // "professor" | "course"
  const [profReviews, setProfReviews] = useState(SEED_PROF_REVIEWS.map(r => ({ ...r, myVote:null })));
  const [crsReviews,  setCrsReviews]  = useState(SEED_COURSE_REVIEWS.map(r => ({ ...r, myVote:null })));
  const [sort,        setSort]        = useState("top");    // "top" | "new"
  const [search,      setSearch]      = useState("");
  const [filterTag,   setFilterTag]   = useState(null);
  const [composing,   setComposing]   = useState(false);

  const reviews   = mode === "professor" ? profReviews : crsReviews;
  const setReviews= mode === "professor" ? setProfReviews : setCrsReviews;

  const vote = (id, dir) => {
    // TODO: replace with API call → POST /api/reviews/:id/vote  body: { direction: dir }
    // For now: just toggle the visual highlight so the button feels responsive
    setReviews(prev => prev.map(r => {
      if (r.id !== id) return r;
      const toggled = r.myVote === dir ? null : dir;
      return { ...r, myVote: toggled };
    }));
  };

  const addReview = (data) => {
    // TODO: replace with API call → POST /api/reviews  body: { ...data }
    // On success: refetch reviews list from backend instead of pushing locally
    // For now: append a placeholder card so the UI closes and shows feedback
    const newR = {
      id: Date.now(),
      target:    data.target,
      course:    data.course || "",
      dept:      data.dept   || "",
      stars:     data.stars,
      author:    randomAnon(),
      text:      data.text,
      tags:      data.tags,
      upvotes:   0,
      downvotes: 0,
      myVote:    null,
      ts:        Date.now(),
    };
    setReviews(p => [newR, ...p]);
    setComposing(false);
  };

  // filter + sort
  const uniqueTags = [...new Set(reviews.flatMap(r => r.tags || []))].sort();
  let displayed = reviews
    .filter(r => !search || r.target.toLowerCase().includes(search.toLowerCase()) || r.text.toLowerCase().includes(search.toLowerCase()))
    .filter(r => !filterTag || r.tags?.includes(filterTag));
  displayed = sort === "top"
    ? [...displayed].sort((a,b) => (b.upvotes-b.downvotes)-(a.upvotes-a.downvotes))
    : [...displayed].sort((a,b) => b.ts - a.ts);

  return (
    <div style={{ padding:"28px 28px 60px", maxWidth:860 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .rv-input:focus  { border-color:#8FB3E2 !important; outline:none; }
        .rv-vote-btn:hover { color:#31487A !important; }
        .rv-card:hover { box-shadow:0 4px 20px rgba(49,72,122,0.11) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"#31487A", marginBottom:4 }}>Reviews</div>
        <div style={{ fontSize:13, color:"#A59AC9" }}>Anonymous reviews from AUB students — honest, helpful, no filter.</div>
      </div>

      {/* Mode toggle — big pill tabs */}
      <div style={{ display:"flex", background:"#ffffff", border:"1px solid #D4D4DC", borderRadius:14, padding:5, width:"fit-content", gap:4, marginBottom:22 }}>
        {[
          { id:"professor", icon:"🎓", label:"Professor Reviews" },
          { id:"course",    icon:"📚", label:"Course Reviews"    },
        ].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setFilterTag(null); setSearch(""); }} style={{
            padding:"9px 22px", border:"none", borderRadius:10, fontSize:13, fontWeight:600,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s", display:"flex", alignItems:"center", gap:8,
            background: mode===m.id ? "#31487A" : "transparent",
            color:       mode===m.id ? "#ffffff" : "#A59AC9",
          }}>
            <span>{m.icon}</span>{m.label}
            <span style={{ background: mode===m.id?"rgba(255,255,255,0.2)":"#F0EEF7", color: mode===m.id?"#fff":"#7B5EA7", borderRadius:20, padding:"1px 8px", fontSize:11 }}>
              {mode===m.id ? displayed.length : (m.id==="professor" ? profReviews.length : crsReviews.length)}
            </span>
          </button>
        ))}
      </div>

      {/* Controls bar */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:18 }}>
        {/* search */}
        <div style={{ display:"flex", alignItems:"center", background:"#ffffff", border:"1px solid #D4D4DC", borderRadius:12, padding:"8px 14px", flex:"1 1 200px", maxWidth:300 }}>
          <span style={{ color:"#B8A9C9", marginRight:8, fontSize:14 }}>🔍</span>
          <input className="rv-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${mode==="professor"?"professors":"courses"}…`}
            style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
        </div>

        {/* sort */}
        <div style={{ display:"flex", gap:4, background:"#F4F4F8", padding:4, borderRadius:10 }}>
          {[{id:"top",label:"🔥 Top"},{id:"new",label:"✨ New"}].map(s => (
            <button key={s.id} onClick={()=>setSort(s.id)} style={{
              padding:"6px 14px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
              background: sort===s.id?"#31487A":"transparent",
              color: sort===s.id?"#ffffff":"#A59AC9",
            }}>{s.label}</button>
          ))}
        </div>

        {/* write review button */}
        <button onClick={() => setComposing(true)} style={{
          marginLeft:"auto", padding:"9px 20px", background:"#7B5EA7", color:"white",
          border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6,
        }}>✏️ Write a Review</button>
      </div>

      {/* Tag filter chips */}
      {uniqueTags.length > 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
          {uniqueTags.map(t => (
            <TagPill key={t} tag={t} active={filterTag===t} onClick={() => setFilterTag(p => p===t ? null : t)} />
          ))}
          {filterTag && (
            <span onClick={() => setFilterTag(null)} style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", background:"#f5f5f5", color:"#B8A9C9", border:"1px solid #D4D4DC" }}>✕ Clear</span>
          )}
        </div>
      )}

      {/* Compose form */}
      {composing && (
        <ComposeForm mode={mode} onSubmit={addReview} onCancel={() => setComposing(false)} />
      )}

      {/* Review list */}
      {displayed.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#B8A9C9" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"#31487A" }}>No reviews found</div>
          <div style={{ fontSize:13, marginTop:6 }}>Try adjusting your search or filters</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {displayed.map(r => (
            <ReviewCard key={r.id} review={r} onVote={vote} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const rv = {
  card: {
    display:"flex", gap:14, background:"#ffffff", borderRadius:16, padding:"18px 20px",
    border:"1px solid #D4D4DC", boxShadow:"0 2px 10px rgba(49,72,122,0.06)",
    transition:"box-shadow .2s",
  },
  voteCol: {
    display:"flex", flexDirection:"column", alignItems:"center", gap:4,
    minWidth:32, paddingTop:2,
  },
  voteBtn: {
    background:"none", border:"none", cursor:"pointer", fontSize:16, lineHeight:1,
    padding:"2px 4px", borderRadius:4, transition:"color .1s",
  },
  avatar: {
    width:28, height:28, borderRadius:"50%",
    background:"linear-gradient(135deg,#8FB3E2,#A59AC9)",
    color:"white", fontWeight:700, fontSize:12,
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
  },
  composeCard: {
    background:"#ffffff", borderRadius:18, padding:"24px 26px",
    border:"1px solid #D4D4DC", boxShadow:"0 4px 20px rgba(49,72,122,0.10)",
    marginBottom:20,
  },
  label:     { display:"block", fontSize:12, fontWeight:600, color:"#2a2050", marginBottom:6 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid #D4D4DC", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#2a2050", background:"#F7F5FB", marginBottom:16, display:"block", transition:"border-color .15s" },
  submitBtn: { padding:"10px 24px", background:"#31487A", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { padding:"10px 18px", background:"#F4F4F8", color:"#A59AC9", border:"1px solid #D4D4DC", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};
