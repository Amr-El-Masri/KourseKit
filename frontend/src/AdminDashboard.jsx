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
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [userSubTab,   setUserSubTab]   = useState("all");
  const [flaggedUsers,        setFlaggedUsers]        = useState([]);
  const [flaggedUsersLoading, setFlaggedUsersLoading] = useState(false);
  const [selectedUserIds,  setSelectedUserIds]  = useState(new Set());
  const [selectMode,        setSelectMode]        = useState(false);
  const [massActionConfirm, setMassActionConfirm] = useState(null);
  const [roleDropOpen,      setRoleDropOpen]      = useState(false);
  const [statusDropOpen,    setStatusDropOpen]    = useState(false);

  // reviews
  const [reviewStatus, setReviewStatus] = useState("all");
  const [reviewType,   setReviewType]   = useState("course");
  const [courseReviews,        setCourseReviews]        = useState([]);
  const [courseLoading,        setCourseLoading]        = useState(false);
  const [flaggedCourse,        setFlaggedCourse]        = useState([]);
  const [flaggedCourseLoading, setFlaggedCourseLoading] = useState(false);
  const [reportedCourse,       setReportedCourse]       = useState([]);
  const [reportedCourseLoading,setReportedCourseLoading]= useState(false);
  const [profReviews,          setProfReviews]          = useState([]);
  const [profLoading,          setProfLoading]          = useState(false);
  const [flaggedProf,          setFlaggedProf]          = useState([]);
  const [flaggedProfLoading,   setFlaggedProfLoading]   = useState(false);
  const [reportedProf,         setReportedProf]         = useState([]);
  const [reportedProfLoading,  setReportedProfLoading]  = useState(false);
  const [expandedId,    setExpandedId]   = useState(null);
  const [confirmAction, setConfirmAction]= useState(null); // { id, action: "delete"|"approve"|"warn" }
  const [confirmActiveId, setConfirmActiveId] = useState(null);
  const [confirmAdminId,  setConfirmAdminId]  = useState(null);
  const [selectedUser,    setSelectedUser]    = useState(null);
  const [userReviews,     setUserReviews]     = useState([]);
  const [userProfReviews, setUserProfReviews] = useState([]);
  const [userRevLoading,  setUserRevLoading]  = useState(false);
  const [err, setErr] = useState("");

  const loadUsers = useCallback(async (q = "") => {
    setLoading(true); setErr("");
    try {
      const url = q.trim() ? `${API}/api/admin/users?search=${encodeURIComponent(q)}` : `${API}/api/admin/users`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setErr("Failed to load users."); return; }
      setUsers(await res.json());
    } catch { setErr("Network error."); }
    finally { setLoading(false); }
  }, [token]);

  const loadFlaggedUsers = useCallback(async () => {
    setFlaggedUsersLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users/flagged`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFlaggedUsers(await res.json());
    } catch {} finally { setFlaggedUsersLoading(false); }
  }, [token]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { const t = setTimeout(() => loadUsers(search), 300); return () => clearTimeout(t); }, [search, loadUsers]);
  useEffect(() => { if (tab === "users" && userSubTab === "flagged") loadFlaggedUsers(); }, [tab, userSubTab, loadFlaggedUsers]);

  const setRole = async (userId, role) => {
    const action = role === "ADMIN" ? "promote" : "demote";
    try {
      await fetch(`${API}/api/admin/users/${userId}/${action}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch { setErr("Action failed. Try again."); }
  };

  const setActive = async (userId, active) => {
    const action = active ? "activate" : "deactivate";
    try {
      await fetch(`${API}/api/admin/users/${userId}/${action}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active } : u));
    } catch { setErr("Action failed. Try again."); }
  };

  const clearFlag = async (userId) => {
    try {
      await fetch(`${API}/api/admin/users/${userId}/clear-flag`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setFlaggedUsers(prev => prev.filter(u => u.id !== userId));
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, flagged: false, reportcount: 0, flagreason: null } : u));
    } catch { setErr("Action failed. Try again."); }
  };

  const massUpdate = async () => {
    const active = massActionConfirm === "activate";
    try {
      await fetch(`${API}/api/admin/users/mass-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [...selectedUserIds], active }),
      });
      setUsers(prev => prev.map(u => selectedUserIds.has(u.id) ? { ...u, active } : u));
      setSelectedUserIds(new Set()); setMassActionConfirm(null); setSelectMode(false);
    } catch { setErr("Mass update failed."); }
  };

  const openUser = async (u) => {
    if (selectedUser?.id === u.id) { setSelectedUser(null); setUserReviews([]); setUserProfReviews([]); return; }
    setSelectedUser(u); setUserRevLoading(true);
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

  const displayed = users.filter(u => {
    const matchesStatus = statusFilter === "active" ? u.active : statusFilter === "deactivated" ? !u.active : true;
    const matchesRole   = roleFilter === "ADMIN" ? u.role === "ADMIN" : roleFilter === "STUDENT" ? u.role === "STUDENT" : true;
    return matchesStatus && matchesRole;
  });

  const loadCourseReviews = useCallback(async () => {
    setCourseLoading(true);
    try { const res = await fetch(`${API}/api/admin/reviews`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setCourseReviews(await res.json()); }
    catch {} finally { setCourseLoading(false); }
  }, [token]);

  const loadFlaggedCourse = useCallback(async () => {
    setFlaggedCourseLoading(true);
    try { const res = await fetch(`${API}/api/admin/reviews/flagged`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setFlaggedCourse(await res.json()); }
    catch {} finally { setFlaggedCourseLoading(false); }
  }, [token]);

  const loadReportedCourse = useCallback(async () => {
    setReportedCourseLoading(true);
    try { const res = await fetch(`${API}/api/admin/reviews/reported`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setReportedCourse(await res.json()); }
    catch {} finally { setReportedCourseLoading(false); }
  }, [token]);

  const loadProfReviews = useCallback(async () => {
    setProfLoading(true);
    try { const res = await fetch(`${API}/api/admin/professor-reviews`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setProfReviews(await res.json()); }
    catch {} finally { setProfLoading(false); }
  }, [token]);

  const loadFlaggedProf = useCallback(async () => {
    setFlaggedProfLoading(true);
    try { const res = await fetch(`${API}/api/admin/professor-reviews/flagged`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setFlaggedProf(await res.json()); }
    catch {} finally { setFlaggedProfLoading(false); }
  }, [token]);

  const loadReportedProf = useCallback(async () => {
    setReportedProfLoading(true);
    try { const res = await fetch(`${API}/api/admin/professor-reviews/reported`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setReportedProf(await res.json()); }
    catch {} finally { setReportedProfLoading(false); }
  }, [token]);

  useEffect(() => {
    if (tab === "reviews") {
      loadCourseReviews(); loadFlaggedCourse(); loadReportedCourse();
      loadProfReviews(); loadFlaggedProf(); loadReportedProf();
    }
  }, [tab, loadCourseReviews, loadFlaggedCourse, loadReportedCourse, loadProfReviews, loadFlaggedProf, loadReportedProf]);

  const deleteCourseReview = async (reviewId) => {
    try {
      const res = await fetch(`${API}/api/admin/reviews/${reviewId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setErr("Failed to delete review."); return; }
      setCourseReviews(prev => prev.filter(r => r.id !== reviewId));
      setFlaggedCourse(prev => prev.filter(r => r.id !== reviewId));
      setReportedCourse(prev => prev.filter(r => r.id !== reviewId));
    } catch { setErr("Action failed. Try again."); }
  };

  const deleteProfReview = async (reviewId) => {
    try {
      const res = await fetch(`${API}/api/admin/professor-reviews/${reviewId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setErr("Failed to delete review."); return; }
      setProfReviews(prev => prev.filter(r => r.id !== reviewId));
      setFlaggedProf(prev => prev.filter(r => r.id !== reviewId));
      setReportedProf(prev => prev.filter(r => r.id !== reviewId));
    } catch { setErr("Action failed. Try again."); }
  };

  const removeFromAllLists = (reviewId, type) => {
    if (type === "course") {
      setCourseReviews(prev => prev.filter(r => r.id !== reviewId));
      setFlaggedCourse(prev => prev.filter(r => r.id !== reviewId));
      setReportedCourse(prev => prev.filter(r => r.id !== reviewId));
    } else {
      setProfReviews(prev => prev.filter(r => r.id !== reviewId));
      setFlaggedProf(prev => prev.filter(r => r.id !== reviewId));
      setReportedProf(prev => prev.filter(r => r.id !== reviewId));
    }
  };

  const approveReview = async (reviewId, type) => {
    const base = type === "course" ? "reviews" : "professor-reviews";
    try {
      const res = await fetch(`${API}/api/admin/${base}/${reviewId}/approve`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) removeFromAllLists(reviewId, type);
      else setErr("Action failed. Try again.");
    } catch { setErr("Action failed. Try again."); }
  };

  const warnReview = async (reviewId, type) => {
    const base = type === "course" ? "reviews" : "professor-reviews";
    try {
      const res = await fetch(`${API}/api/admin/${base}/${reviewId}/warn`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) removeFromAllLists(reviewId, type);
      else setErr("Action failed. Try again.");
    } catch { setErr("Action failed. Try again."); }
  };

  const formatDate = ts => ts
    ? new Date(ts).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })
    : "—";

  const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

  const StyledCheckbox = ({ checked, onChange, onClick }) => (
    <button onClick={e => { if (onClick) onClick(e); onChange && onChange({ target: { checked: !checked } }); }}
      style={{ width:16, height:16, borderRadius:4, border:`2px solid ${checked ? "var(--success)" : "var(--border)"}`,
        background: checked ? "var(--success)" : "var(--surface)", cursor:"pointer", flexShrink:0, padding:0,
        display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
      {checked && <span style={{ color:"white", fontSize:9, lineHeight:1 }}>✓</span>}
    </button>
  );

  const reviewTable = (list, isLoading, emptyMsg, onDelete, expandKey, reviewTypeStr, isReported = false, showApprove = false) => {
    const cols = (isReported || showApprove) ? "1.5fr 1fr 90px 50px 1fr 210px" : "1.5fr 1fr 90px 50px 1fr 110px";
    return (
      <>
        {isLoading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
        {!isLoading && list.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>{emptyMsg}</div>
          </div>
        )}
        {!isLoading && list.length > 0 && (
          <div style={ad.table}>
            <div style={{ ...ad.tableHeader, gridTemplateColumns: cols }}>
              <span>User</span>
              <span>{reviewTypeStr === "course" ? "Course" : "Professor"}</span>
              <span>Rating</span>
              <span>Reports</span>
              <span style={{ paddingLeft:16 }}>Reasons</span>
              <span>Action</span>
            </div>
            {list.map((r, i) => {
              const expanded = expandedId === `${expandKey}-${r.id}`;
              const isConfirming = confirmAction?.id === `${expandKey}-${r.id}`;
              return (
                <div key={r.id}
                  onClick={() => setExpandedId(expanded ? null : `${expandKey}-${r.id}`)}
                  style={{ padding:"10px 20px 12px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderBottom: i < list.length - 1 ? "1px solid var(--divider)" : "none", cursor:"pointer" }}
                >
                  <div style={{ display:"grid", gridTemplateColumns: cols, alignItems:"center", marginBottom:8 }}>
                    <span style={{ fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{r.userid || "—"}</span>
                    <span style={{ fontSize:12, color:"var(--primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>
                      {reviewTypeStr === "course" ? (r.coursecode || "—") : (r.profname || "—")}
                    </span>
                    <span style={{ fontSize:13, color:"var(--star)", letterSpacing:1 }}>{stars(r.rating)}</span>
                    <span style={{ fontSize:12, color: r.reportcount > 0 ? "var(--error)" : "var(--text3)", fontWeight: r.reportcount > 0 ? 700 : 400 }}>
                      {r.reportcount ?? 0}
                    </span>
                    <span style={{ fontSize:11, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8, paddingLeft:16 }}>
                      {(r.reportreasons || []).length > 0 ? [...new Set(r.reportreasons)].join(", ") : "—"}
                    </span>
                    {isConfirming ? (
                      <div style={{ display:"flex", alignItems:"center", gap:4 }} onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize:11, fontWeight:600, color: confirmAction.action === "approve" ? "var(--success)" : confirmAction.action === "warn" ? "var(--accent)" : "var(--error)" }}>Sure?</span>
                        <button onClick={() => {
                          const a = confirmAction.action;
                          if (a === "delete") onDelete(r.id);
                          else if (a === "approve") approveReview(r.id, reviewTypeStr);
                          else if (a === "warn") warnReview(r.id, reviewTypeStr);
                          setConfirmAction(null);
                        }} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
                          background: confirmAction.action === "approve" ? "rgba(0,180,100,0.12)" : confirmAction.action === "warn" ? "var(--divider)" : "var(--error-bg)",
                          color: confirmAction.action === "approve" ? "var(--success)" : confirmAction.action === "warn" ? "var(--accent)" : "var(--error)" }}>Yes</button>
                        <button onClick={e => { e.stopPropagation(); setConfirmAction(null); }} style={{ padding:"4px 8px", border:"1px solid var(--border)", borderRadius:6, fontSize:11, cursor:"pointer", background:"var(--surface)", color:"var(--text2)" }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display:"flex", gap:4 }} onClick={e => e.stopPropagation()}>
                        {(isReported || showApprove) && (
                          <button className="action-btn" onClick={() => setConfirmAction({ id: `${expandKey}-${r.id}`, action:"approve" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"rgba(0,180,100,0.12)", color:"var(--success)" }}>Approve</button>
                        )}
                        {(isReported || showApprove) && (
                          <button className="action-btn" onClick={() => setConfirmAction({ id: `${expandKey}-${r.id}`, action:"warn" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--divider)", color:"var(--accent)" }}>Warn</button>
                        )}
                        {!isReported && !showApprove && (
                          <button className="action-btn" onClick={() => setConfirmAction({ id: `${expandKey}-${r.id}`, action:"delete" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--error-bg)", color:"var(--error)" }}>Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* comment — always visible, expands on click */}
                  <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, paddingLeft:2, ...(expanded ? { whiteSpace:"pre-wrap" } : { overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }) }}>
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:.5, marginRight:6 }}>Review</span>
                    {r.comment || "—"}
                  </div>
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
  };

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
      <div style={{ display:"flex", gap:4, background:"var(--surface)", padding:5, borderRadius:14, marginBottom:24, width:"fit-content", alignItems:"center", border:"1px solid var(--border)" }}>
        <button onClick={() => { setErr(""); setTab("users"); setReviewDropdownOpen(false); }} style={{
          padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
          background: tab === "users" ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
          color:      tab === "users" ? "var(--primary)" : "var(--text2)",
        }}>Users</button>

        <div style={{ position:"relative" }}>
          <button onClick={() => { setErr(""); setReviewDropdownOpen(o => !o); if (tab !== "reviews") setTab("reviews"); }} style={{
            padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6,
            background: tab === "reviews" ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
            color:      tab === "reviews" ? "var(--primary)" : "var(--text2)",
          }}>
            Reviews <span style={{ fontSize:10, opacity:0.7 }}>▼</span>
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
          <div style={{ display:"flex", gap:4, background:"var(--surface)", padding:5, borderRadius:14, marginBottom:20, width:"fit-content", border:"1px solid var(--border)" }}>
            {[{id:"all",label:"All"},{id:"flagged",label:"Flagged"}].map(t => (
              <button key={t.id} onClick={() => setUserSubTab(t.id)} style={{
                padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
                background: userSubTab === t.id ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
                color:      userSubTab === t.id ? "var(--primary)" : "var(--text2)",
              }}>{t.label}</button>
            ))}
          </div>

          {userSubTab === "all" && (
            <>
              <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px" }}>
                  <Search size={14} color="var(--text3)" style={{ marginRight:8, flexShrink:0 }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email…"
                    style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
                </div>
                <div style={{ position:"relative" }}>
                  <button onClick={() => { setRoleDropOpen(o => !o); setStatusDropOpen(false); }} style={{
                    padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                    background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)",
                  }}>
                    {{ all:"Role", STUDENT:"Student", ADMIN:"Admin" }[roleFilter]}
                    <span style={{ fontSize:10, opacity:0.7 }}>▼</span>
                  </button>
                  {roleDropOpen && (
                    <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:130 }}>
                      {[{id:"all",label:"Role"},{id:"STUDENT",label:"Student"},{id:"ADMIN",label:"Admin"}].map(opt => (
                        <div key={opt.id} onClick={() => { setRoleFilter(opt.id); setSelectedUserIds(new Set()); setRoleDropOpen(false); }}
                          style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                            background: roleFilter === opt.id ? "var(--divider)" : "transparent",
                            color:      roleFilter === opt.id ? "var(--accent)"  : "var(--primary)" }}>
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position:"relative" }}>
                  <button onClick={() => { setStatusDropOpen(o => !o); setRoleDropOpen(false); }} style={{
                    padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                    background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)",
                  }}>
                    {{ all:"Status", active:"Active", deactivated:"Deactivated" }[statusFilter]}
                    <span style={{ fontSize:10, opacity:0.7 }}>▼</span>
                  </button>
                  {statusDropOpen && (
                    <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:150 }}>
                      {[{id:"all",label:"Status"},{id:"active",label:"Active"},{id:"deactivated",label:"Deactivated"}].map(opt => (
                        <div key={opt.id} onClick={() => { setStatusFilter(opt.id); setSelectedUserIds(new Set()); setStatusDropOpen(false); }}
                          style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                            background: statusFilter === opt.id ? "var(--divider)" : "transparent",
                            color:      statusFilter === opt.id ? "var(--accent)"  : "var(--primary)" }}>
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => { setSelectMode(s => !s); setSelectedUserIds(new Set()); setMassActionConfirm(null); }}
                  style={{ padding:"8px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", background: selectMode ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "var(--surface)", color: selectMode ? "var(--primary)" : "var(--text2)" }}>
                  {selectMode ? "Cancel" : "Select"}
                </button>
              </div>

              {selectMode && (
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:16, padding:"10px 16px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 }}>
                  <span style={{ fontSize:13, color:"var(--text2)", fontWeight:600 }}>{selectedUserIds.size} selected</span>
                  {massActionConfirm ? (
                    <>
                      <span style={{ fontSize:12, color: massActionConfirm === "deactivate" ? "var(--error)" : "var(--success)", fontWeight:600 }}>
                        {massActionConfirm === "deactivate" ? "Deactivate" : "Activate"} {selectedUserIds.size} user{selectedUserIds.size !== 1 ? "s" : ""}?
                      </span>
                      <button onClick={massUpdate} style={{ padding:"5px 12px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background: massActionConfirm === "deactivate" ? "var(--error-bg)" : "rgba(0,180,100,0.12)", color: massActionConfirm === "deactivate" ? "var(--error)" : "var(--success)" }}>Yes</button>
                      <button onClick={() => setMassActionConfirm(null)} style={{ padding:"5px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:12, cursor:"pointer", background:"var(--surface)", color:"var(--text2)" }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setMassActionConfirm("deactivate")} disabled={selectedUserIds.size === 0} style={{ padding:"5px 12px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor: selectedUserIds.size === 0 ? "not-allowed" : "pointer", opacity: selectedUserIds.size === 0 ? 0.4 : 1, background:"var(--error-bg)", color:"var(--error)" }}>Deactivate</button>
                      <button onClick={() => setMassActionConfirm("activate")}   disabled={selectedUserIds.size === 0} style={{ padding:"5px 12px", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor: selectedUserIds.size === 0 ? "not-allowed" : "pointer", opacity: selectedUserIds.size === 0 ? 0.4 : 1, background:"rgba(0,180,100,0.12)", color:"var(--success)" }}>Activate</button>
                      <button onClick={() => setSelectedUserIds(new Set(displayed.map(u => u.id)))} style={{ padding:"5px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:12, cursor:"pointer", background:"var(--surface)", color:"var(--text2)" }}>Select All</button>
                      <button onClick={() => setSelectedUserIds(new Set())} style={{ padding:"5px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:12, cursor:"pointer", background:"var(--surface)", color:"var(--text2)" }}>Clear</button>
                    </>
                  )}
                </div>
              )}

              {loading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
              {!loading && displayed.length === 0 && (
                <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No users found</div>
                </div>
              )}
              {!loading && displayed.length > 0 && (
                <div style={ad.table}>
                  <div style={{ ...ad.tableHeader, gridTemplateColumns: "1fr 90px 110px 120px 150px 140px" }}>
                      <span>Email</span><span>Role</span><span>Status</span><span>Joined</span><span>Admin</span><span>Account</span>
                  </div>
                  {displayed.map((u, i) => (
                    <div key={u.id} style={{ borderBottom: i < displayed.length - 1 ? "1px solid var(--divider)" : "none" }}>
                      <div onClick={() => { if (!selectMode) openUser(u); }} style={{ ...ad.row, gridTemplateColumns: selectMode ? "32px 1fr 90px 110px 120px 150px 140px" : "1fr 90px 110px 120px 150px 140px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", cursor: selectMode ? "default" : "pointer" }}>
                        {selectMode && (
                          <StyledCheckbox checked={selectedUserIds.has(u.id)}
                            onClick={e => e.stopPropagation()}
                            onChange={() => setSelectedUserIds(prev => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n; })} />
                        )}
                        <span style={{ fontSize:13, color:"var(--primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:12, display:"flex", alignItems:"center", gap:6 }}>
                          {u.email}
                          {u.flagged && <span style={{ fontSize:10, background:"var(--error-bg)", color:"var(--error)", borderRadius:4, padding:"1px 5px", fontWeight:700, flexShrink:0 }}>FLAGGED</span>}
                        </span>
                        <span style={{ fontSize:12, background: u.role === "ADMIN" ? "var(--divider)" : "var(--blue-light-bg)", color: u.role === "ADMIN" ? "var(--accent)" : "var(--primary)", padding:"3px 6px", borderRadius:6, fontWeight:600, display:"inline-block", whiteSpace:"nowrap", justifySelf:"start" }}>{u.role}</span>
                        <span style={{ fontSize:12, fontWeight:600, color: u.active ? "var(--success)" : "var(--error)" }}>{u.active ? "Active" : "Deactivated"}</span>
                        <span style={{ fontSize:12, color:"var(--text2)" }}>{formatDate(u.createdat)}</span>

                        {(!u.active && u.role !== "ADMIN") ? (
                          <button disabled style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, width:"fit-content", cursor:"not-allowed", opacity:0.4, background:"var(--border)", color:"var(--text2)" }}>Not Permitted</button>
                        ) : confirmAdminId === u.id ? (
                          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ fontSize:11, color:"var(--accent)", fontWeight:600 }}>Sure?</span>
                            <button onClick={e => { setRole(u.id, u.role === "ADMIN" ? "STUDENT" : "ADMIN"); e.stopPropagation(); setConfirmAdminId(null); }} style={{ padding:"3px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, background:"var(--divider)", color:"var(--accent)", cursor:"pointer" }}>Yes</button>
                            <button onClick={e => { e.stopPropagation(); setConfirmAdminId(null); }} style={{ padding:"3px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, background:"var(--surface2)", color:"var(--text2)", cursor:"pointer" }}>No</button>
                          </div>
                        ) : (
                          <button className="action-btn" onClick={e => { e.stopPropagation(); setConfirmAdminId(u.id); }}
                            disabled={String(u.id) === myId && u.role === "ADMIN"}
                            style={{ padding:"4px 10px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, width:"fit-content",
                              cursor: String(u.id) === myId && u.role === "ADMIN" ? "not-allowed" : "pointer",
                              opacity: String(u.id) === myId && u.role === "ADMIN" ? 0.4 : 1,
                              background:"var(--divider)", color:"var(--accent)" }}>
                            {u.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                          </button>
                        )}

                        {confirmActiveId === u.id ? (
                          <div style={{ display:"flex", alignItems:"center", gap:4 }} onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize:11, color: u.active ? "var(--error)" : "var(--success)", fontWeight:600 }}>Sure?</span>
                            <button onClick={() => { setActive(u.id, !u.active); setConfirmActiveId(null); }} style={{ padding:"3px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, background: u.active ? "var(--error-bg)" : "rgba(0,180,100,0.12)", color: u.active ? "var(--error)" : "var(--success)", cursor:"pointer" }}>Yes</button>
                            <button onClick={() => setConfirmActiveId(null)} style={{ padding:"3px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, background:"var(--surface2)", color:"var(--text2)", cursor:"pointer" }}>No</button>
                          </div>
                        ) : (
                          <button className="action-btn"
                            disabled={String(u.id) === myId}
                            onClick={e => { e.stopPropagation(); setConfirmActiveId(u.id); }} style={{
                            padding:"4px 10px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, width:"fit-content",
                            cursor: String(u.id) === myId ? "not-allowed" : "pointer",
                            opacity: String(u.id) === myId ? 0.4 : 1,
                            background: u.active ? "var(--error-bg)" : "rgba(0,180,100,0.12)",
                            color: u.active ? "var(--error)" : "var(--success)" }}>
                            {u.active ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </div>

                      {selectedUser?.id === u.id && !selectMode && (
                        <div style={{ padding:"16px 20px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderTop:"1px solid var(--border)" }}>
                          <div style={{ fontSize:11, fontWeight:600, color:"var(--text2)", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>Reviews by {u.email}</div>
                          {userRevLoading && <div style={{ fontSize:13, color:"var(--text3)" }}>Loading…</div>}
                          {!userRevLoading && userReviews.length === 0 && userProfReviews.length === 0 && <div style={{ fontSize:13, color:"var(--text3)" }}>No reviews yet.</div>}
                          {!userRevLoading && userReviews.map(r => (
                            <div key={`c-${r.id}`} style={{ background:"var(--surface)", borderRadius:10, border:"1px solid var(--border)", padding:"10px 14px", marginBottom:8 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                <span style={{ fontSize:12, fontWeight:600, color:"var(--primary)" }}>{r.coursecode ? `${r.coursecode} — ${r.coursetitle}` : "—"}</span>
                                <span style={{ fontSize:11, color:"var(--text2)" }}>{formatDate(r.createdat)}</span>
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

          {userSubTab === "flagged" && (
            <>
              <div style={{ marginBottom:16, fontSize:13, color:"var(--text2)" }}>Users flagged after accumulating 3+ reports on their reviews.</div>
              {flaggedUsersLoading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
              {!flaggedUsersLoading && flaggedUsers.length === 0 && (
                <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No flagged users</div>
                </div>
              )}
              {!flaggedUsersLoading && flaggedUsers.length > 0 && (
                <div style={ad.table}>
                  <div style={{ ...ad.tableHeader, gridTemplateColumns:"1.5fr 80px 80px 1.5fr 200px" }}>
                    <span>Email</span><span>Reports</span><span>Strikes</span><span>Reason</span><span>Actions</span>
                  </div>
                  {flaggedUsers.map((u, i) => (
                    <div key={u.id} style={{ ...ad.row, gridTemplateColumns:"1.5fr 80px 80px 1.5fr 200px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderBottom: i < flaggedUsers.length - 1 ? "1px solid var(--divider)" : "none" }}>
                      <span style={{ fontSize:13, color:"var(--primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</span>
                      <span style={{ fontSize:13, color:"var(--error)", fontWeight:700 }}>{u.reportcount}</span>
                      <span style={{ fontSize:13, color:"var(--warn,#e65100)", fontWeight:700 }}>{u.strikecount || 0}</span>
                      <span style={{ fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.flagreason || "—"}</span>
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="action-btn" onClick={() => setActive(u.id, false)} style={{ padding:"4px 10px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--error-bg)", color:"var(--error)" }}>Deactivate</button>
                        <button className="action-btn" onClick={() => clearFlag(u.id)} style={{ padding:"4px 10px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--divider)", color:"var(--accent)" }}>Clear Flag</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* reviews tab */}
      {tab === "reviews" && (
        <>
          <div style={{ display:"flex", gap:4, background:"var(--surface)", padding:5, borderRadius:14, marginBottom:20, width:"fit-content", border:"1px solid var(--border)" }}>
            {[{id:"all",label:"All"},{id:"flagged",label:"Flagged"},{id:"reported",label:"Reported"}].map(t => (
              <button key={t.id} onClick={() => { setReviewStatus(t.id); setExpandedId(null); setConfirmAction(null); }} style={{
                padding:"6px 20px", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
                background: reviewStatus === t.id ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
                color:      reviewStatus === t.id ? "var(--primary)" : "var(--text2)",
              }}>{t.label}</button>
            ))}
          </div>

          {reviewStatus === "all"      && reviewType === "course"    && reviewTable(courseReviews,    courseLoading,         "No course reviews yet",         deleteCourseReview, "ac", "course",    false)}
          {reviewStatus === "all"      && reviewType === "professor" && reviewTable(profReviews,      profLoading,           "No professor reviews yet",      deleteProfReview,   "ap", "professor", false)}
          {reviewStatus === "flagged"  && reviewType === "course"    && reviewTable(flaggedCourse,    flaggedCourseLoading,  "No flagged course reviews",     deleteCourseReview, "fc", "course",    false, true)}
          {reviewStatus === "flagged"  && reviewType === "professor" && reviewTable(flaggedProf,      flaggedProfLoading,    "No flagged professor reviews",  deleteProfReview,   "fp", "professor", false, true)}
          {reviewStatus === "reported" && reviewType === "course"    && reviewTable(reportedCourse,   reportedCourseLoading, "No reported course reviews",    deleteCourseReview, "rc", "course",    true)}
          {reviewStatus === "reported" && reviewType === "professor" && reviewTable(reportedProf,     reportedProfLoading,   "No reported professor reviews", deleteProfReview,   "rp", "professor", true)}
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
