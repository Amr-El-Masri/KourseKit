import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

const API = "http://localhost:8080";

const getMyId = token => { try { return JSON.parse(atob(token.split(".")[1])).sub; } catch { return null; } };

export default function AdminDashboard({ token }) {
  const myId = getMyId(token);
  const [tab,     setTab]     = useState("users");
  const [reviewDropdownOpen, setReviewDropdownOpen] = useState(false);
  // users
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  // reviews
  const [reviewStatus, setReviewStatus] = useState("all");    // "all" | "flagged"
  const [reviewType,   setReviewType]   = useState("course"); // "course" | "professor"
  const [courseReviews,        setCourseReviews]        = useState([]);
  const [courseLoading,        setCourseLoading]        = useState(false);
  const [flaggedCourse,        setFlaggedCourse]        = useState([]);
  const [flaggedCourseLoading, setFlaggedCourseLoading] = useState(false);
  const [profReviews,          setProfReviews]          = useState([]);
  const [profLoading,          setProfLoading]          = useState(false);
  const [flaggedProf,          setFlaggedProf]          = useState([]);
  const [flaggedProfLoading,   setFlaggedProfLoading]   = useState(false);
  const [expandedId,           setExpandedId]           = useState(null);
  const [deleteConfirmId,      setDeleteConfirmId]      = useState(null);
  const [confirmActiveId,      setConfirmActiveId]      = useState(null);
  const [confirmAdminId,       setConfirmAdminId]       = useState(null);
  const [selectedUser,         setSelectedUser]         = useState(null);
  const [userReviews,          setUserReviews]          = useState([]);
  const [userProfReviews,      setUserProfReviews]      = useState([]);
  const [userRevLoading,       setUserRevLoading]       = useState(false);
  const [err, setErr] = useState("");

  const loadUsers = useCallback(async (q = "") => {
    setLoading(true);
    setErr("");
    try {
      const url = q.trim()
        ? `${API}/api/admin/users?search=${encodeURIComponent(q)}`
        : `${API}/api/admin/users`;
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setErr("Failed to load users."); return; }
      setUsers(await res.json());
    } catch { setErr("Network error."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(search), 300);
    return () => clearTimeout(t);
  }, [search, loadUsers]);

  const setRole = async (userId, role) => {
    const action = role === "ADMIN" ? "promote" : "demote";
    try {
      await fetch(`${API}/api/admin/users/${userId}/${action}`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch { setErr("Action failed. Try again."); }
  };

  const setActive = async (userId, active) => {
    const action = active ? "activate" : "deactivate";
    try {
      await fetch(`${API}/api/admin/users/${userId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active } : u));
    } catch { setErr("Action failed. Try again."); }
  };

  const openUser = async (u) => {
    if (selectedUser?.id === u.id) { setSelectedUser(null); setUserReviews([]); setUserProfReviews([]); return; }
    setSelectedUser(u);
    setUserRevLoading(true);
    try {
      const [courseRes, profRes] = await Promise.all([
        fetch(`${API}/api/admin/users/${u.id}/reviews`,           { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/admin/users/${u.id}/professor-reviews`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUserReviews(courseRes.ok ? await courseRes.json() : []);
      setUserProfReviews(profRes.ok ? await profRes.json() : []);
    } catch { setUserReviews([]); setUserProfReviews([]); }
    finally { setUserRevLoading(false); }
  };

  const displayed = users.filter(u =>
    filter === "active"      ? u.active :
    filter === "deactivated" ? !u.active : true
  );

  const loadCourseReviews = useCallback(async () => {
    setCourseLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/reviews`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCourseReviews(await res.json());
    } catch {} finally { setCourseLoading(false); }
  }, [token]);

  const loadFlaggedCourse = useCallback(async () => {
    setFlaggedCourseLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/reviews/flagged`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFlaggedCourse(await res.json());
    } catch {} finally { setFlaggedCourseLoading(false); }
  }, [token]);

  const loadProfReviews = useCallback(async () => {
    setProfLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/professor-reviews`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProfReviews(await res.json());
    } catch {} finally { setProfLoading(false); }
  }, [token]);

  const loadFlaggedProf = useCallback(async () => {
    setFlaggedProfLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/professor-reviews/flagged`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFlaggedProf(await res.json());
    } catch {} finally { setFlaggedProfLoading(false); }
  }, [token]);

  useEffect(() => {
    if (tab === "reviews") {
      loadCourseReviews(); loadFlaggedCourse(); loadProfReviews(); loadFlaggedProf();
    }
  }, [tab, loadCourseReviews, loadFlaggedCourse, loadProfReviews, loadFlaggedProf]);

  const deleteCourseReview = async (reviewId) => {
    try {
      const res = await fetch(`${API}/api/admin/reviews/${reviewId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setErr("Failed to delete review."); return; }
      setCourseReviews(prev => prev.filter(r => r.id !== reviewId));
      setFlaggedCourse(prev => prev.filter(r => r.id !== reviewId));
    } catch { setErr("Action failed. Try again."); }
  };

  const deleteProfReview = async (reviewId) => {
    try {
      const res = await fetch(`${API}/api/admin/professor-reviews/${reviewId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setErr("Failed to delete review."); return; }
      setProfReviews(prev => prev.filter(r => r.id !== reviewId));
      setFlaggedProf(prev => prev.filter(r => r.id !== reviewId));
    } catch { setErr("Action failed. Try again."); }
  };

  const formatDate = ts => ts
    ? new Date(ts).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })
    : "—";

  const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

  const reviewTable = (list, isLoading, emptyMsg, onDelete, expandKey) => (
    <>
      {isLoading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
      {!isLoading && list.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>{emptyMsg}</div>
        </div>
      )}
      {!isLoading && list.length > 0 && (
        <div style={ad.table}>
          <div style={{ ...ad.tableHeader, gridTemplateColumns:"1fr 1fr 80px 120px 100px" }}>
            <span>Comment</span>
            <span>User</span>
            <span>Rating</span>
            <span>Date</span>
            <span>Action</span>
          </div>
          {list.map((r, i) => {
            const expanded = expandedId === `${expandKey}-${r.id}`;
            return (
              <div key={r.id} style={{ borderBottom: i < list.length - 1 ? "1px solid var(--divider)" : "none" }}>
                <div
                  onClick={() => setExpandedId(expanded ? null : `${expandKey}-${r.id}`)}
                  style={{ ...ad.row, gridTemplateColumns:"1fr 1fr 80px 120px 100px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", cursor:"pointer" }}
                >
                  <span style={{ fontSize:13, color:"var(--primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:12 }}>{r.comment || "—"}</span>
                  <span style={{ fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:12 }}>{r.userId || "—"}</span>
                  <span style={{ fontSize:13, color:"var(--star)", letterSpacing:1 }}>{stars(r.rating)}</span>
                  <span style={{ fontSize:12, color:"var(--text2)" }}>{formatDate(r.createdAt)}</span>
                  {deleteConfirmId === r.id ? (
                    <div style={{ display:"flex", gap:4 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { onDelete(r.id); setDeleteConfirmId(null); }} style={{ padding:"5px 10px", border:"none", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--error)", color:"#fff" }}>Confirm</button>
                      <button onClick={() => setDeleteConfirmId(null)} style={{ padding:"5px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:11, cursor:"pointer", background:"var(--surface)", color:"var(--text2)" }}>Cancel</button>
                    </div>
                  ) : (
                    <button className="action-btn" onClick={e => { e.stopPropagation(); setDeleteConfirmId(r.id); }} style={{
                      padding:"6px 14px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                      background:"var(--error-bg)", color:"var(--error)",
                    }}>Delete</button>
                  )}
                </div>
                {expanded && (
                  <div style={{ padding:"12px 20px 16px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderTop:"1px solid var(--border)" }}>
                    {r.courseCode && (
                      <div style={{ fontSize:12, fontWeight:600, color:"var(--primary)", marginBottom:6 }}>{r.courseCode} — {r.courseTitle}</div>
                    )}
                    {r.professorName && (
                      <div style={{ fontSize:12, fontWeight:600, color:"var(--primary)", marginBottom:6 }}>{r.professorName}</div>
                    )}
                    <div style={{ fontSize:11, fontWeight:600, color:"var(--text2)", marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Full comment</div>
                    <div style={{ fontSize:13, color:"var(--primary)", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{r.comment || "—"}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop:14, fontSize:12, color:"var(--text3)" }}>
        {list.length} review{list.length !== 1 ? "s" : ""} shown
      </div>
    </>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .action-btn { transition:opacity .15s; }
        .action-btn:hover { opacity:0.8; }
      `}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"var(--primary)", marginBottom:4 }}>Admin Dashboard</div>
        <div style={{ fontSize:13, color:"var(--text2)" }}>Manage users and moderate reviews.</div>
      </div>

      {/* tab bar */}
      <div style={{ 
        display:"flex", 
        gap:4, 
        background:"var(--surface)",  
        padding:5,                   
        borderRadius:14,             
        marginBottom:24, 
        width:"fit-content", 
        alignItems:"center",
        border:"1px solid var(--border)" 
      }}>
        <button onClick={() => { setErr(""); setTab("users"); setReviewDropdownOpen(false); }} style={{
          padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
          background: tab === "users" ? "var(--primary)" : "transparent",
          color:      tab === "users" ? "#fff"           : "var(--text2)",
        }}>Users</button>

        <div style={{ position:"relative" }}>
          <button onClick={() => { setErr(""); setReviewDropdownOpen(o => !o); if (tab !== "reviews") setTab("reviews"); }} style={{
            padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6,
            background: tab === "reviews" ? "var(--primary)" : "transparent",
            color:      tab === "reviews" ? "#fff"           : "var(--text2)",
          }}>
            Reviews
            <span style={{ fontSize:10, opacity:0.7 }}>▼</span>
          </button>
          {reviewDropdownOpen && (
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:140 }}>
              {[{id:"course",label:"Course"},{id:"professor",label:"Professor"}].map(opt => (
                <div key={opt.id} onClick={() => { setReviewType(opt.id); setReviewDropdownOpen(false); setExpandedId(null); }}
                  style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                    background: reviewType === opt.id ? "var(--divider)" : "transparent",
                    color:      reviewType === opt.id ? "var(--accent)"  : "var(--primary)" }}>
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {err && (
        <div style={{ background:"var(--error-bg)", border:"1px solid var(--error-border)", borderRadius:10, padding:"9px 14px", fontSize:13, color:"var(--error)", marginBottom:16 }}>
          {err}
        </div>
      )}

      {/* users tab */}
      {tab === "users" && (
        <>
          <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px" }}>
              <Search size={14} color="var(--text3)" style={{ marginRight:8, flexShrink:0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by email…"
                style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }}
              />
            </div>
            <div style={{ display:"flex", gap:4, background:"var(--bg)", padding:4, borderRadius:10 }}>
              {[{id:"all",label:"All"},{id:"active",label:"Active"},{id:"deactivated",label:"Deactivated"}].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding:"6px 14px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                  background: filter === f.id ? "var(--primary)" : "transparent",
                  color:      filter === f.id ? "#fff"           : "var(--text2)",
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {loading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}

          {!loading && displayed.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No users found</div>
            </div>
          )}

          {!loading && displayed.length > 0 && (
            <div style={ad.table}>
              <div style={{ ...ad.tableHeader, gridTemplateColumns:"1fr 90px 110px 120px 150px 140px" }}>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Joined</span>
                <span>Admin</span>
                <span>Account</span>
              </div>
              {displayed.map((u, i) => (
                <div key={u.id} style={{ borderBottom: i < displayed.length - 1 ? "1px solid var(--divider)" : "none" }}>
                  <div onClick={() => openUser(u)} style={{ ...ad.row, gridTemplateColumns:"1fr 90px 110px 120px 150px 140px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", cursor:"pointer" }}>
                  <span style={{ fontSize:13, color:"var(--primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:12 }}>{u.email}</span>
                  <span style={{ fontSize:12, background: u.role === "ADMIN" ? "var(--divider)" : "var(--blue-light-bg)", color: u.role === "ADMIN" ? "var(--accent)" : "var(--primary)", padding:"3px 6px", borderRadius:6, fontWeight:600, display:"inline-block", whiteSpace:"nowrap", justifySelf:"start" }}>{u.role}</span>
                  <span style={{ fontSize:12, fontWeight:600, color: u.active ? "var(--success)" : "var(--error)" }}>{u.active ? "Active" : "Deactivated"}</span>
                  <span style={{ fontSize:12, color:"var(--text2)" }}>{formatDate(u.createdat)}</span>

                  {/* Make/Remove Admin */}
                  {(!u.active && u.role !== "ADMIN") ? (
                    <button disabled style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, width:"fit-content", cursor:"not-allowed", opacity:0.4, background:"var(--border)", color:"var(--text2)" }}>Not Permitted</button>
                  ) : confirmAdminId === u.id ? (
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ fontSize:11, color:"var(--accent)", fontWeight:600 }}>Sure?</span>
                      <button onClick={() => { setRole(u.id, u.role === "ADMIN" ? "STUDENT" : "ADMIN"); setConfirmAdminId(null); }} style={{ padding:"3px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, background:"var(--accent)", color:"#fff", cursor:"pointer" }}>Yes</button>
                      <button onClick={() => setConfirmAdminId(null)} style={{ padding:"3px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, background:"var(--surface2)", color:"var(--text2)", cursor:"pointer" }}>No</button>
                    </div>
                  ) : (
                    <button className="action-btn" onClick={() => setConfirmAdminId(u.id)}
                      disabled={String(u.id) === myId && u.role === "ADMIN"}
                      style={{
                        padding:"4px 10px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, width:"fit-content",
                        cursor: String(u.id) === myId && u.role === "ADMIN" ? "not-allowed" : "pointer",
                        opacity: String(u.id) === myId && u.role === "ADMIN" ? 0.4 : 1,
                        background: u.role === "ADMIN" ? "var(--accent)" : "var(--primary)",
                        color: "#fff",
                      }}>
                      {u.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                    </button>
                  )}

                  {/* Activate/Deactivate */}
                  {confirmActiveId === u.id ? (
                    <div style={{ display:"flex", alignItems:"center", gap:4 }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize:11, color: u.active ? "var(--error)" : "var(--success)", fontWeight:600 }}>Sure?</span>
                      <button onClick={() => { setActive(u.id, !u.active); setConfirmActiveId(null); }} style={{ padding:"3px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, background: u.active ? "var(--error)" : "var(--success)", color:"#fff", cursor:"pointer" }}>Yes</button>
                      <button onClick={() => setConfirmActiveId(null)} style={{ padding:"3px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, background:"var(--surface2)", color:"var(--text2)", cursor:"pointer" }}>No</button>
                    </div>
                  ) : (
                    <button className="action-btn" onClick={e => { e.stopPropagation(); setConfirmActiveId(u.id); }} style={{
                      padding:"4px 10px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, width:"fit-content", cursor:"pointer",
                      background: u.active ? "var(--error)" : "var(--success)",
                      color: "#fff",
                    }}>
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                  )}
                  </div>

                  {selectedUser?.id === u.id && (
                    <div style={{ padding:"16px 20px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderTop:"1px solid var(--border)" }}>
                      <div style={{ fontSize:11, fontWeight:600, color:"var(--text2)", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>Reviews by {u.email}</div>
                      {userRevLoading && <div style={{ fontSize:13, color:"var(--text3)" }}>Loading…</div>}
                      {!userRevLoading && userReviews.length === 0 && userProfReviews.length === 0 && (
                        <div style={{ fontSize:13, color:"var(--text3)" }}>No reviews yet.</div>
                      )}
                      {!userRevLoading && userReviews.map(r => (
                        <div key={`c-${r.id}`} style={{ background:"var(--surface)", borderRadius:10, border:"1px solid var(--border)", padding:"10px 14px", marginBottom:8 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:12, fontWeight:600, color:"var(--primary)" }}>{r.courseCode ? `${r.courseCode} — ${r.courseTitle}` : "—"}</span>
                            <span style={{ fontSize:11, color:"var(--text2)" }}>{formatDate(r.createdAt)}</span>
                          </div>
                          <div style={{ marginBottom:4, color:"var(--star)", fontSize:13 }}>{stars(r.rating)}</div>
                          <div style={{ fontSize:13, color:"var(--primary)", lineHeight:1.6 }}>{r.comment || "—"}</div>
                        </div>
                      ))}
                      {!userRevLoading && userProfReviews.map(r => (
                        <div key={`p-${r.id}`} style={{ background:"var(--surface)", borderRadius:10, border:"1px solid var(--border)", padding:"10px 14px", marginBottom:8 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:12, fontWeight:600, color:"var(--primary)" }}>{r.professorName || "—"}</span>
                            <span style={{ fontSize:11, color:"var(--text2)" }}>{formatDate(r.createdAt)}</span>
                          </div>
                          <div style={{ marginBottom:4, color:"var(--star)", fontSize:13 }}>{stars(r.rating)}</div>
                          <div style={{ fontSize:13, color:"var(--primary)", lineHeight:1.6 }}>{r.comment || "—"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop:14, fontSize:12, color:"var(--text3)" }}>
            {displayed.length} user{displayed.length !== 1 ? "s" : ""} shown
          </div>
        </>
      )}

      {/* reviews tab */}
      {tab === "reviews" && (
        <>
          {/* all and flagged tabs */}
          <div style={{ 
            display:"flex", 
            gap:4, 
            background:"var(--surface)",  
            padding:5,                  
            borderRadius:14,           
            marginBottom:20, 
            width:"fit-content",
            border:"1px solid var(--border)" 
          }}>
            {[{id:"all",label:"All"},{id:"flagged",label:"Flagged"}].map(t => (
              <button key={t.id} onClick={() => { setReviewStatus(t.id); setExpandedId(null); }} style={{
                padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
                background: reviewStatus === t.id ? "var(--primary)" : "transparent",
                color:      reviewStatus === t.id ? "#fff"           : "var(--text2)",
              }}>{t.label}</button>
            ))}
          </div>

          {reviewStatus === "all"     && reviewType === "course"    && reviewTable(courseReviews,  courseLoading,        "No course reviews yet",       deleteCourseReview, "ac")}
          {reviewStatus === "all"     && reviewType === "professor" && reviewTable(profReviews,    profLoading,          "No professor reviews yet",    deleteProfReview,   "ap")}
          {reviewStatus === "flagged" && reviewType === "course"    && reviewTable(flaggedCourse,  flaggedCourseLoading, "No flagged course reviews",   deleteCourseReview, "fc")}
          {reviewStatus === "flagged" && reviewType === "professor" && reviewTable(flaggedProf,    flaggedProfLoading,   "No flagged professor reviews", deleteProfReview,  "fp")}
        </>
      )}
    </div>
  );
}

const ad = {
  table: {
    background:"var(--surface)", borderRadius:20, border:"1px solid var(--border)",
    overflow:"hidden", boxShadow:"0 2px 14px rgba(49,72,122,0.07)",
  },
  tableHeader: {
    display:"grid", gridTemplateColumns:"1fr 100px 120px 120px 130px",
    padding:"12px 20px", background:"var(--surface2)", borderBottom:"1px solid var(--border)",
    fontSize:12, fontWeight:600, color:"var(--accent)",
  },
  row: {
    display:"grid", gridTemplateColumns:"1fr 100px 120px 120px 130px",
    padding:"14px 20px", alignItems:"center",
  },
};
