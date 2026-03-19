import { useState, useEffect, useRef } from "react";
import { Banana, Cat, Dog, Eclipse, Telescope, Panda, Turtle, X, UserPlus, UserCheck } from "lucide-react";

const API = "http://localhost:8080";
const AVATAR_ICONS = [
  { id:"Banana", icon:Banana }, { id:"Telescope", icon:Telescope },
  { id:"Eclipse", icon:Eclipse }, { id:"Cat", icon:Cat },
  { id:"Dog", icon:Dog }, { id:"Panda", icon:Panda }, { id:"Turtle", icon:Turtle },
];

const STATUS_LABELS = {
  freshman:"Freshman", sophomore:"Sophomore", junior:"Junior", senior:"Senior",
  E1:"E1", E2:"E2", E3:"E3", E4:"E4", E5:"E5",
};

function AvatarIcon({ avatarId, size = 38 }) {
  const found = AVATAR_ICONS.find(a => a.id === avatarId);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#8FB3E2,#A59AC9)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {found ? <found.icon size={size*0.45} color="white" /> : <span style={{ fontWeight:700, fontSize:size*0.35, color:"white" }}>?</span>}
    </div>
  );
}

function StudentProfileView({ student, onBack, isFriend, onFriendToggle }) {
  const fullName = [student.firstName, student.lastName].filter(Boolean).join(" ") || "Student";
  return (
    <div>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--primary)", fontWeight:600, fontSize:13, fontFamily:"inherit", marginBottom:16, padding:0 }}>
        ← Back to directory
      </button>
      <div style={{ background:"linear-gradient(135deg,#31487A,#7B5EA7)", borderRadius:14, padding:"24px 22px 20px", display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
        <AvatarIcon avatarId={student.avatar} size={56} />
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:"white" }}>{fullName}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:3 }}>{STATUS_LABELS[student.status] || student.status || "Student"}</div>
          {student.email && <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{student.email}</div>}
        </div>
        <button onClick={() => onFriendToggle(student)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10, border:"none", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", background:isFriend?"rgba(255,255,255,0.2)":"white", color:isFriend?"white":"#31487A" }}>
          {isFriend ? <><UserCheck size={13}/> Following</> : <><UserPlus size={13}/> Follow</>}
        </button>
      </div>

      {student.bio && (
        <div style={{ marginBottom:14, padding:"12px 14px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>Bio</div>
          <div style={{ fontSize:13, color:"var(--text)", lineHeight:1.6 }}>{student.bio}</div>
        </div>
      )}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {[
          { label:"Faculty",    value:student.faculty },
          { label:"Major",      value:student.major },
          student.doubleMajor && { label:"2nd Major", value:student.secondMajor },
          student.minor       && { label:"Minor",     value:student.minorName },
        ].filter(Boolean).map(chip => chip.value ? (
          <div key={chip.label} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 14px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{chip.label}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--primary)", marginTop:2 }}>{chip.value}</div>
          </div>
        ) : null)}
      </div>
    </div>
  );
}

export default function StudentDirectoryPanel({ onClose, friends, onFriendToggle }) {
    const [query,   setQuery]   = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewing, setViewing] = useState(null);
    const debounceRef = useRef(null);
    const token = localStorage.getItem("kk_token");

    const search = async (query) => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/api/students/search?query=${encodeURIComponent(query)}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("Search status: ", r.status);
            const data = await r.json();
            console.log("Search data:", data);
            setResults(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Search error: ", e);
            setResults([]);
        }
        setLoading(false);
    }

    useEffect(() => { search(""); }, []);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(query), 300);
        return () => clearTimeout(debounceRef.current); }, [query]);

    return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", justifyContent:"flex-end" }}>
      <div style={{ width:420, height:"100%", background:"var(--bg)", display:"flex", flexDirection:"column", boxShadow:"-8px 0 32px rgba(0,0,0,0.15)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 22px", borderBottom:"1px solid var(--border)" }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:"var(--primary)" }}>
              {viewing ? "Student Profile" : "Student Directory"}
            </div>
            {!viewing && <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>Search and follow other students</div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text2)" }}>
            <X size={15}/>
          </button>
        </div> 
        
        <div style={{ flex:1, overflowY:"auto", padding:"18px 22px" }}>
          {viewing ? (
            <StudentProfileView
              student={viewing}
              onBack={() => setViewing(null)}
              isFriend={!!friends.find(f => f.id === viewing.id)}
              onFriendToggle={onFriendToggle}
            />
          ) : (
            <>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"var(--text)", background:"var(--surface2)", outline:"none", marginBottom:14 }}
              />
              {loading && <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"20px 0" }}>Searching…</div>}
              {!loading && results.length === 0 && (
                <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"32px 0" }}>
                  {query ? "No students found." : "No other students yet."}
                </div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {results.map(s => {
                  const isFriend = !!friends.find(f => f.id === s.id);
                  const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ") || "Student";
                  return (
                    <div key={s.id} onClick={() => setViewing(s)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--surface)", borderRadius:12, border:"1px solid var(--border)", cursor:"pointer" }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 14px rgba(49,72,122,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow=""}>
                      <AvatarIcon avatarId={s.avatar} size={38}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:"var(--primary)" }}>{fullName}</div>
                        <div style={{ fontSize:11, color:"var(--text2)", marginTop:1 }}>{s.major || "—"} · {STATUS_LABELS[s.status] || s.status || "—"}</div>
                        {s.email && <div style={{ fontSize:11, color:"var(--text3)", marginTop:1 }}>{s.email}</div>}
                      </div>
                       <button onClick={e => { e.stopPropagation(); onFriendToggle(s); }} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid var(--border)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0, background:isFriend?"var(--primary)":"var(--surface2)", color:isFriend?"white":"var(--text2)" }}>
                        {isFriend ? "✓ Following" : "+ Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}