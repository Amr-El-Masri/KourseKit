import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

const getMyId = token => { try { return JSON.parse(atob(token.split(".")[1])).sub; } catch { return null; } };

export default function AdminDashboard({ token }) {
  const myId = getMyId(token);
  const [tab,     setTab]     = useState("users");
  const [reviewDropdownOpen, setReviewDropdownOpen] = useState(false);
  const [forumTypeDropOpen,  setForumTypeDropOpen]  = useState(false);

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
  const [confirmActiveId,  setConfirmActiveId]  = useState(null);
  const [confirmAdminId,   setConfirmAdminId]   = useState(null);
  const [selectedUser,    setSelectedUser]    = useState(null);
  const [userReviews,     setUserReviews]     = useState([]);
  const [userProfReviews, setUserProfReviews] = useState([]);
  const [userRevLoading,  setUserRevLoading]  = useState(false);
  const [err, setErr] = useState("");

  // forum posts
  const [forumPostStatus,      setForumPostStatus]      = useState("flagged");
  const [forumType,            setForumType]            = useState("posts");
  const [flaggedForumPosts,    setFlaggedForumPosts]    = useState([]);
  const [flaggedForumLoading,  setFlaggedForumLoading]  = useState(false);
  const [reportedForumPosts,   setReportedForumPosts]   = useState([]);
  const [reportedForumLoading, setReportedForumLoading] = useState(false);
  const [confirmForumAction,   setConfirmForumAction]   = useState(null);

  // forum comments
  const [flaggedForumComments,    setFlaggedForumComments]    = useState([]);
  const [flaggedCommentLoading,   setFlaggedCommentLoading]   = useState(false);
  const [reportedForumComments,   setReportedForumComments]   = useState([]);
  const [reportedCommentLoading,  setReportedCommentLoading]  = useState(false);
  const [confirmCommentAction,    setConfirmCommentAction]    = useState(null);
  const [commentFlaggedPage,      setCommentFlaggedPage]      = useState(0);
  const [commentFlaggedTotal,     setCommentFlaggedTotal]     = useState(1);
  const [commentReportedPage,     setCommentReportedPage]     = useState(0);
  const [commentReportedTotal,    setCommentReportedTotal]    = useState(1);

  // group reports
  const [groupReports,        setGroupReports]        = useState([]);
  const [groupReportsLoading, setGroupReportsLoading] = useState(false);
  const [confirmGroupAction,  setConfirmGroupAction]  = useState(null);

  // search filters
  const [reviewSearch,      setReviewSearch]      = useState("");
  const [forumSearch,       setForumSearch]       = useState("");
  const [groupReportSearch, setGroupReportSearch] = useState("");

  // pagination
  const [userPage,              setUserPage]              = useState(0);
  const [userTotalPages,        setUserTotalPages]        = useState(1);
  const [courseReviewPage,      setCourseReviewPage]      = useState(0);
  const [courseReviewTotalPages,setCourseReviewTotalPages]= useState(1);
  const [profReviewPage,        setProfReviewPage]        = useState(0);
  const [profReviewTotalPages,  setProfReviewTotalPages]  = useState(1);
  const [forumFlaggedPage,       setForumFlaggedPage]       = useState(0);
  const [forumFlaggedTotalPages, setForumFlaggedTotalPages] = useState(1);
  const [forumReportedPage,      setForumReportedPage]      = useState(0);
  const [forumReportedTotalPages,setForumReportedTotalPages]= useState(1);
  const [groupReportPage,        setGroupReportPage]        = useState(0);
  const [groupReportTotalPages,  setGroupReportTotalPages]  = useState(1);

  const loadUsers = useCallback(async (q = "", pg = 0) => {
    setLoading(true); setErr("");
    try {
      let url = `${API}/api/admin/users?page=${pg}&size=20`;
      if (q.trim()) url += `&search=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setErr("Failed to load users."); return; }
      const data = await res.json();
      setUsers(data.content);
      setUserTotalPages(data.totalpages);
      setUserPage(data.number);
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

  useEffect(() => { loadUsers("", 0); }, [loadUsers]);
  useEffect(() => { const t = setTimeout(() => loadUsers(search, 0), 300); return () => clearTimeout(t); }, [search, loadUsers]);
  useEffect(() => { if (tab === "users" && userSubTab === "flagged") loadFlaggedUsers(); }, [tab, userSubTab, loadFlaggedUsers]);
  useEffect(() => {
    const onFocus = () => { loadUsers(search, userPage); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [search, userPage, loadUsers]);

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

  const loadCourseReviews = useCallback(async (pg = 0) => {
    setCourseLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/reviews?page=${pg}&size=15`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setCourseReviews(data.content);
        setCourseReviewTotalPages(data.totalpages);
        setCourseReviewPage(data.number);
      }
    } catch {} finally { setCourseLoading(false); }
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

  const loadProfReviews = useCallback(async (pg = 0) => {
    setProfLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/professor-reviews?page=${pg}&size=15`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfReviews(data.content);
        setProfReviewTotalPages(data.totalpages);
        setProfReviewPage(data.number);
      }
    } catch {} finally { setProfLoading(false); }
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

  const loadFlaggedForumPosts = useCallback(async (pg = 0) => {
    setFlaggedForumLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/forum-posts/flagged?page=${pg}&size=15`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setFlaggedForumPosts(data.content); setForumFlaggedTotalPages(data.totalpages); setForumFlaggedPage(data.number); }
    } catch {} finally { setFlaggedForumLoading(false); }
  }, [token]);

  const loadReportedForumPosts = useCallback(async (pg = 0) => {
    setReportedForumLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/forum-posts/reported?page=${pg}&size=15`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setReportedForumPosts(data.content); setForumReportedTotalPages(data.totalpages); setForumReportedPage(data.number); }
    } catch {} finally { setReportedForumLoading(false); }
  }, [token]);

  const loadFlaggedForumComments = useCallback(async (pg = 0) => {
    setFlaggedCommentLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/forum-comments/flagged?page=${pg}&size=15`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setFlaggedForumComments(data.content); setCommentFlaggedTotal(data.totalpages); setCommentFlaggedPage(data.number); }
    } catch {} finally { setFlaggedCommentLoading(false); }
  }, [token]);

  const loadReportedForumComments = useCallback(async (pg = 0) => {
    setReportedCommentLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/forum-comments/reported?page=${pg}&size=15`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setReportedForumComments(data.content); setCommentReportedTotal(data.totalpages); setCommentReportedPage(data.number); }
    } catch {} finally { setReportedCommentLoading(false); }
  }, [token]);

  const loadGroupReports = useCallback(async (pg = 0) => {
    setGroupReportsLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/group-reports?page=${pg}&size=20`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setGroupReports(data.content); setGroupReportTotalPages(data.totalpages); setGroupReportPage(data.number); }
    } catch {} finally { setGroupReportsLoading(false); }
  }, [token]);

  useEffect(() => {
    if (tab === "forum") { loadFlaggedForumPosts(0); loadReportedForumPosts(0); loadFlaggedForumComments(0); loadReportedForumComments(0); }
  }, [tab, loadFlaggedForumPosts, loadReportedForumPosts, loadFlaggedForumComments, loadReportedForumComments]);

  useEffect(() => {
    if (tab === "studygroups") loadGroupReports(0);
  }, [tab, loadGroupReports]);

  useEffect(() => {
    if (tab === "reviews") {
      loadCourseReviews(0); loadFlaggedCourse(); loadReportedCourse();
      loadProfReviews(0); loadFlaggedProf(); loadReportedProf();
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

  const removeForumPost = (postId) => {
    setFlaggedForumPosts(prev => prev.filter(p => p.id !== postId));
    setReportedForumPosts(prev => prev.filter(p => p.id !== postId));
  };

  const approveForumPost = async (postId) => {
    try {
      const res = await fetch(`${API}/api/admin/forum-posts/${postId}/approve`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) removeForumPost(postId); else setErr("Action failed.");
    } catch { setErr("Action failed."); }
  };

  const warnForumPost = async (postId) => {
    try {
      const res = await fetch(`${API}/api/admin/forum-posts/${postId}/warn`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) removeForumPost(postId); else setErr("Action failed.");
    } catch { setErr("Action failed."); }
  };

  const removeForumComment = (id) => {
    setFlaggedForumComments(prev => prev.filter(c => c.id !== id));
    setReportedForumComments(prev => prev.filter(c => c.id !== id));
  };

  const approveForumComment = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/forum-comments/${id}/approve`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) removeForumComment(id); else setErr("Action failed.");
    } catch { setErr("Action failed."); }
  };

  const warnForumComment = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/forum-comments/${id}/warn`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) removeForumComment(id); else setErr("Action failed.");
    } catch { setErr("Action failed."); }
  };

  const warnGroupMember = async (reportId) => {
    try {
      const res = await fetch(`${API}/api/admin/group-reports/${reportId}/warn`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGroupReports(prev => prev.filter(r => r.id !== reportId)); else setErr("Action failed.");
    } catch { setErr("Action failed."); }
  };

  const dismissGroupReport = async (reportId) => {
    try {
      const res = await fetch(`${API}/api/admin/group-reports/${reportId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGroupReports(prev => prev.filter(r => r.id !== reportId)); else setErr("Action failed.");
    } catch { setErr("Action failed."); }
  };

  const matchSearch = (q, ...fields) => {
    if (!q.trim()) return true;
    const lq = q.toLowerCase();
    return fields.some(f => f && String(f).toLowerCase().includes(lq));
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
          <div className="ad-anim" style={ad.table}>
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
                <div key={r.id} className="ad-anim"
                  onClick={() => setExpandedId(expanded ? null : `${expandKey}-${r.id}`)}
                  style={{ animationDelay:`${i*0.04}s`, padding:"10px 20px 12px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderBottom: i < list.length - 1 ? "1px solid var(--divider)" : "none", cursor:"pointer" }}
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

  const Pagination = ({ page, totalPages, onPrev, onNext }) => totalPages <= 1 ? null : (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14 }}>
      <button onClick={onPrev} disabled={page === 0}
        style={{ padding:"5px 14px", border:"1.5px solid var(--border)", borderRadius:8, fontSize:12, fontWeight:600,
          cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1,
          background:"var(--surface)", color:"var(--text2)" }}>← Prev</button>
      <span style={{ fontSize:12, color:"var(--text2)" }}>Page {page + 1} of {totalPages}</span>
      <button onClick={onNext} disabled={page >= totalPages - 1}
        style={{ padding:"5px 14px", border:"1.5px solid var(--border)", borderRadius:8, fontSize:12, fontWeight:600,
          cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1,
          background:"var(--surface)", color:"var(--text2)" }}>Next →</button>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing:border-box; }
        .action-btn { transition:opacity .15s; }
        .action-btn:hover { opacity:0.8; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .ad-anim { animation: fadeUp 0.3s ease both; }
      `}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:26, color:"var(--primary)", marginBottom:4 }}>Admin Dashboard</div>
        <div style={{ fontSize:13, color:"var(--text2)" }}>Manage users and moderate reviews.</div>
      </div>

      {/* tab bar */}
      <div style={{ display:"flex", gap:6, marginBottom:24, width:"fit-content", alignItems:"center" }}>
        <button className="kk-tab" data-active={tab === "users"} onClick={() => { setErr(""); setTab("users"); setReviewDropdownOpen(false); }} style={{
          padding:"8px 18px", borderRadius:9, fontSize:13, fontWeight: tab === "users" ? 600 : 400, cursor:"pointer",
          border: tab === "users" ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
          background: tab === "users" ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
          color:      tab === "users" ? "var(--primary)" : "var(--text2)",
          transition:"all .15s",
        }}>Users</button>

        <button className="kk-tab" data-active={tab === "forum"} onClick={() => { setErr(""); setTab("forum"); setReviewDropdownOpen(false); }} style={{
          padding:"8px 18px", borderRadius:9, fontSize:13, fontWeight: tab === "forum" ? 600 : 400, cursor:"pointer",
          border: tab === "forum" ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
          background: tab === "forum" ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
          color:      tab === "forum" ? "var(--primary)" : "var(--text2)",
          transition:"all .15s",
        }}>Forum</button>

        <button className="kk-tab" data-active={tab === "studygroups"} onClick={() => { setErr(""); setTab("studygroups"); setReviewDropdownOpen(false); }} style={{
          padding:"8px 18px", borderRadius:9, fontSize:13, fontWeight: tab === "studygroups" ? 600 : 400, cursor:"pointer",
          border: tab === "studygroups" ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
          background: tab === "studygroups" ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
          color:      tab === "studygroups" ? "var(--primary)" : "var(--text2)",
          transition:"all .15s",
        }}>Study Groups</button>

        <div style={{ position:"relative" }}>
          <button className="kk-tab" data-active={tab === "reviews"} onClick={() => { setErr(""); setReviewDropdownOpen(o => !o); if (tab !== "reviews") setTab("reviews"); }} style={{
            padding:"8px 18px", borderRadius:9, fontSize:13, fontWeight: tab === "reviews" ? 600 : 400, cursor:"pointer", display:"flex", alignItems:"center", gap:6,
            border: tab === "reviews" ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
            background: tab === "reviews" ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
            color:      tab === "reviews" ? "var(--primary)" : "var(--text2)",
            transition:"all .15s",
          }}>
            Reviews <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: reviewDropdownOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
          </button>
          {reviewDropdownOpen && (
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:140 }}>
              {[{id:"course",label:"Course"},{id:"professor",label:"Professor"}].map(opt => (
                <div key={opt.id} onClick={() => { setReviewType(opt.id); setReviewDropdownOpen(false); setExpandedId(null); }}
                  className="kk-option"
                  style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                    transition:"background .15s",
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
          <div style={{ display:"flex", gap:6, marginBottom:20, width:"fit-content" }}>
            {[{id:"all",label:"All"},{id:"flagged",label:"Flagged"}].map(t => (
              <button key={t.id} className="kk-tab" data-active={userSubTab === t.id} onClick={() => setUserSubTab(t.id)} style={{
                padding:"8px 18px", borderRadius:9, fontSize:13,
                fontWeight: userSubTab === t.id ? 600 : 400, cursor:"pointer", transition:"all .15s",
                border: userSubTab === t.id ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                background: userSubTab === t.id ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
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
                    padding:"9px 22px", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                    background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)",
                  }}>
                    {{ all:"Role", STUDENT:"Student", ADMIN:"Admin" }[roleFilter]}
                    <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: roleDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                  </button>
                  {roleDropOpen && (
                    <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:130 }}>
                      {[{id:"all",label:"Role"},{id:"STUDENT",label:"Student"},{id:"ADMIN",label:"Admin"}].map(opt => (
                        <div key={opt.id} onClick={() => { setRoleFilter(opt.id); setSelectedUserIds(new Set()); setRoleDropOpen(false); }}
                          className="kk-option"
                          style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                            transition:"background .15s",
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
                    padding:"9px 22px", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                    background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)",
                  }}>
                    {{ all:"Status", active:"Active", deactivated:"Deactivated" }[statusFilter]}
                    <span style={{ fontSize:7, opacity:0.6, display:"inline-block", transform: statusDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
                  </button>
                  {statusDropOpen && (
                    <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:150 }}>
                      {[{id:"all",label:"Status"},{id:"active",label:"Active"},{id:"deactivated",label:"Deactivated"}].map(opt => (
                        <div key={opt.id} onClick={() => { setStatusFilter(opt.id); setSelectedUserIds(new Set()); setStatusDropOpen(false); }}
                          className="kk-option"
                          style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                            transition:"background .15s",
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
                <div className="ad-anim" style={ad.table}>
                  <div style={{ ...ad.tableHeader, gridTemplateColumns: "1fr 90px 110px 120px 150px 140px" }}>
                      <span>Email</span><span>Role</span><span>Status</span><span>Joined</span><span>Admin</span><span>Account</span>
                  </div>
                  {displayed.map((u, i) => (
                    <div key={u.id} className="ad-anim" style={{ animationDelay:`${i*0.04}s`, borderBottom: i < displayed.length - 1 ? "1px solid var(--divider)" : "none" }}>
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
              <Pagination
                page={userPage}
                totalPages={userTotalPages}
                onPrev={() => loadUsers(search, userPage - 1)}
                onNext={() => loadUsers(search, userPage + 1)}
              />
              <div style={{ marginTop:8, fontSize:12, color:"var(--text3)" }}>
                {displayed.length} user{displayed.length !== 1 ? "s" : ""} shown on this page
              </div>
            </>
          )}

          {userSubTab === "flagged" && (
            <>
              <div style={{ marginBottom:16, fontSize:13, color:"var(--text2)" }}>Users flagged after receiving a strike.</div>
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

      {/* forum tab */}
      {tab === "forum" && (
        <>
          <div style={{ position:"relative", display:"inline-block", marginBottom:12 }}>
            <button onClick={() => setForumTypeDropOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:"var(--primary)", boxShadow:"0 1px 4px rgba(49,72,122,0.06)" }}>
              {forumType === "posts" ? "Posts" : "Comments"}
              <span style={{ fontSize:8, opacity:0.6, display:"inline-block", transform: forumTypeDropOpen ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform 0.15s" }}>▼</span>
            </button>
            {forumTypeDropOpen && (
              <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"var(--surface)", borderRadius:12, boxShadow:"0 8px 32px rgba(49,72,122,0.15)", border:"1px solid var(--border)", zIndex:200, padding:6, minWidth:140 }}>
                {[{id:"posts",label:"Posts"},{id:"comments",label:"Comments"}].map(opt => (
                  <div key={opt.id} onClick={() => { setForumType(opt.id); setForumTypeDropOpen(false); setConfirmForumAction(null); setConfirmCommentAction(null); }}
                    className="kk-option"
                    style={{ padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, transition:"background .15s",
                      background: forumType === opt.id ? "var(--divider)" : "transparent",
                      color:      forumType === opt.id ? "var(--accent)"  : "var(--primary)" }}>
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:6, marginBottom:16, width:"fit-content" }}>
            {[{id:"flagged",label:"Flagged"},{id:"reported",label:"Reported"}].map(t => (
              <button key={t.id} className="kk-tab" data-active={forumPostStatus === t.id} onClick={() => { setForumPostStatus(t.id); setConfirmForumAction(null); setConfirmCommentAction(null); }} style={{
                padding:"8px 18px", borderRadius:9, fontSize:13,
                fontWeight: forumPostStatus === t.id ? 600 : 400, cursor:"pointer", transition:"all .15s",
                border: forumPostStatus === t.id ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                background: forumPostStatus === t.id ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
                color:      forumPostStatus === t.id ? "var(--primary)" : "var(--text2)",
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px", marginBottom:16, maxWidth:400 }}>
            <Search size={14} color="var(--text3)" style={{ marginRight:8, flexShrink:0 }} />
            <input value={forumSearch} onChange={e => setForumSearch(e.target.value)}
              placeholder="Search by email, title, category, post text…"
              style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
            {forumSearch && <button onClick={() => setForumSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", fontSize:14, padding:0, marginLeft:6 }}>✕</button>}
          </div>

          {forumType === "posts" && (() => {
            const list    = (forumPostStatus === "flagged" ? flaggedForumPosts : reportedForumPosts).filter(p => matchSearch(forumSearch, p.userid, p.title, p.body, p.category, p.coursetag, p.professortag));
            const loading = forumPostStatus === "flagged" ? flaggedForumLoading : reportedForumLoading;
            const page       = forumPostStatus === "flagged" ? forumFlaggedPage       : forumReportedPage;
            const totalPages = forumPostStatus === "flagged" ? forumFlaggedTotalPages : forumReportedTotalPages;
            const loadPage   = forumPostStatus === "flagged" ? loadFlaggedForumPosts  : loadReportedForumPosts;
            const cols = "1.5fr 2fr 90px 50px 1fr 200px";
            return (
              <>
                {loading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
                {!loading && list.length === 0 && (
                  <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>
                      No {forumPostStatus} forum posts
                    </div>
                  </div>
                )}
                {!loading && list.length > 0 && (
                  <div className="ad-anim" style={ad.table}>
                    <div style={{ ...ad.tableHeader, gridTemplateColumns: cols }}>
                      <span>User</span><span>Title</span><span>Category</span><span>Reports</span><span style={{ paddingLeft:16 }}>Reasons</span><span>Actions</span>
                    </div>
                    {list.map((p, i) => {
                      const isConfirming = confirmForumAction?.id === p.id;
                      return (
                        <div key={p.id} className="ad-anim" style={{ animationDelay:`${i*0.04}s`, padding:"10px 20px 12px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderBottom: i < list.length - 1 ? "1px solid var(--divider)" : "none" }}>
                          <div style={{ display:"grid", gridTemplateColumns: cols, alignItems:"center", marginBottom:8 }}>
                            <span style={{ fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{p.userid || "—"}</span>
                            <span style={{ fontSize:12, color:"var(--primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{p.title || "—"}</span>
                            <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6, width:"fit-content",
                              background: p.category === "COURSE" ? "color-mix(in srgb, var(--primary) 12%, var(--surface))" : p.category === "PROFESSOR" ? "color-mix(in srgb, var(--accent2) 12%, var(--surface))" : "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                              color: p.category === "COURSE" ? "var(--primary)" : p.category === "PROFESSOR" ? "var(--accent2)" : "var(--accent)" }}>
                              {p.category || "—"}
                            </span>
                            <span style={{ fontSize:12, color: p.reportcount > 0 ? "var(--error)" : "var(--text3)", fontWeight: p.reportcount > 0 ? 700 : 400 }}>{p.reportcount ?? 0}</span>
                            <span style={{ fontSize:11, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8, paddingLeft:16 }}>
                              {(p.reportreasons || []).length > 0 ? [...new Set(p.reportreasons)].join(", ") : "—"}
                            </span>
                            {isConfirming ? (
                              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                <span style={{ fontSize:11, fontWeight:600, color: confirmForumAction.action === "approve" ? "var(--success)" : "var(--accent)" }}>Sure?</span>
                                <button onClick={() => {
                                  if (confirmForumAction.action === "approve") approveForumPost(p.id);
                                  else warnForumPost(p.id);
                                  setConfirmForumAction(null);
                                }} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
                                  background: confirmForumAction.action === "approve" ? "rgba(0,180,100,0.12)" : "var(--divider)",
                                  color: confirmForumAction.action === "approve" ? "var(--success)" : "var(--accent)" }}>Yes</button>
                                <button onClick={() => setConfirmForumAction(null)} style={{ padding:"4px 8px", border:"1px solid var(--border)", borderRadius:6, fontSize:11, cursor:"pointer", background:"var(--surface)", color:"var(--text2)" }}>No</button>
                              </div>
                            ) : (
                              <div style={{ display:"flex", gap:4 }}>
                                <button className="action-btn" onClick={() => setConfirmForumAction({ id: p.id, action:"approve" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"rgba(0,180,100,0.12)", color:"var(--success)" }}>Approve</button>
                                <button className="action-btn" onClick={() => setConfirmForumAction({ id: p.id, action:"warn" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--divider)", color:"var(--accent)" }}>Warn</button>
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, paddingLeft:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:.5, marginRight:6 }}>Post</span>
                            {p.body || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Pagination page={page} totalPages={totalPages} onPrev={() => loadPage(page - 1)} onNext={() => loadPage(page + 1)} />
                <div style={{ marginTop:14, fontSize:12, color:"var(--text3)" }}>{list.length} post{list.length !== 1 ? "s" : ""} shown{forumSearch && ` (filtered)`}</div>
              </>
            );
          })()}

          {forumType === "comments" && (() => {
            const list    = (forumPostStatus === "flagged" ? flaggedForumComments : reportedForumComments).filter(c => matchSearch(forumSearch, c.userid, c.body, c.posttitle));
            const loading = forumPostStatus === "flagged" ? flaggedCommentLoading : reportedCommentLoading;
            const page       = forumPostStatus === "flagged" ? commentFlaggedPage  : commentReportedPage;
            const totalPages = forumPostStatus === "flagged" ? commentFlaggedTotal : commentReportedTotal;
            const loadPage   = forumPostStatus === "flagged" ? loadFlaggedForumComments : loadReportedForumComments;
            const cols = "1.5fr 2fr 50px 1fr 200px";
            return (
              <>
                {loading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
                {!loading && list.length === 0 && (
                  <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>No {forumPostStatus} comments</div>
                  </div>
                )}
                {!loading && list.length > 0 && (
                  <div className="ad-anim" style={ad.table}>
                    <div style={{ ...ad.tableHeader, gridTemplateColumns: cols }}>
                      <span>User</span><span>Post</span><span>Reports</span><span style={{ paddingLeft:16 }}>Reasons</span><span>Actions</span>
                    </div>
                    {list.map((c, i) => {
                      const isConfirming = confirmCommentAction?.id === c.id;
                      return (
                        <div key={c.id} className="ad-anim" style={{ animationDelay:`${i*0.04}s`, padding:"10px 20px 12px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderBottom: i < list.length - 1 ? "1px solid var(--divider)" : "none" }}>
                          <div style={{ display:"grid", gridTemplateColumns: cols, alignItems:"center", marginBottom:8 }}>
                            <span style={{ fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.userid || "—"}</span>
                            <span style={{ fontSize:12, color:"var(--primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.posttitle || "—"}</span>
                            <span style={{ fontSize:12, color: c.reportcount > 0 ? "var(--error)" : "var(--text3)", fontWeight: c.reportcount > 0 ? 700 : 400 }}>{c.reportcount ?? 0}</span>
                            <span style={{ fontSize:11, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8, paddingLeft:16 }}>
                              {(c.reportreasons || []).length > 0 ? [...new Set(c.reportreasons)].join(", ") : "—"}
                            </span>
                            {isConfirming ? (
                              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                <span style={{ fontSize:11, fontWeight:600, color: confirmCommentAction.action === "approve" ? "var(--success)" : "var(--accent)" }}>Sure?</span>
                                <button onClick={() => { if (confirmCommentAction.action === "approve") approveForumComment(c.id); else warnForumComment(c.id); setConfirmCommentAction(null); }}
                                  style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background: confirmCommentAction.action === "approve" ? "rgba(0,180,100,0.12)" : "var(--divider)", color: confirmCommentAction.action === "approve" ? "var(--success)" : "var(--accent)" }}>Yes</button>
                                <button onClick={() => setConfirmCommentAction(null)} style={{ padding:"4px 8px", border:"1px solid var(--border)", borderRadius:6, fontSize:11, cursor:"pointer", background:"var(--surface)", color:"var(--text2)" }}>No</button>
                              </div>
                            ) : (
                              <div style={{ display:"flex", gap:4 }}>
                                <button className="action-btn" onClick={() => setConfirmCommentAction({ id: c.id, action:"approve" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"rgba(0,180,100,0.12)", color:"var(--success)" }}>Approve</button>
                                <button className="action-btn" onClick={() => setConfirmCommentAction({ id: c.id, action:"warn" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--divider)", color:"var(--accent)" }}>Warn</button>
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, paddingLeft:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:.5, marginRight:6 }}>Comment</span>
                            {c.body || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Pagination page={page} totalPages={totalPages} onPrev={() => loadPage(page - 1)} onNext={() => loadPage(page + 1)} />
                <div style={{ marginTop:14, fontSize:12, color:"var(--text3)" }}>{list.length} comment{list.length !== 1 ? "s" : ""} shown{forumSearch && ` (filtered)`}</div>
              </>
            );
          })()}
        </>
      )}

      {/* study group tab */}
      {tab === "studygroups" && (() => {
        const filtered = groupReports.filter(r => matchSearch(groupReportSearch, r.reporteduseremail, r.reportedbyemail, r.groupname, r.reason, r.messagecontent));
        return (
          <>
            <div style={{ marginBottom:12, fontSize:13, color:"var(--text2)" }}>Pending reports from study group members.</div>
            <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px", marginBottom:16, maxWidth:400 }}>
              <Search size={14} color="var(--text3)" style={{ marginRight:8, flexShrink:0 }} />
              <input value={groupReportSearch} onChange={e => { setGroupReportSearch(e.target.value); setGroupReportPage(0); }}
                placeholder="Search by email, group name, reason…"
                style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
              {groupReportSearch && <button onClick={() => { setGroupReportSearch(""); loadGroupReports(0); }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", fontSize:14, padding:0, marginLeft:6 }}>✕</button>}
            </div>
            {groupReportsLoading && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>Loading…</div>}
            {!groupReportsLoading && filtered.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text3)" }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"var(--primary)" }}>{groupReports.length === 0 ? "No pending group reports" : "No results"}</div>
              </div>
            )}
            {!groupReportsLoading && filtered.length > 0 && (
              <div className="ad-anim" style={ad.table}>
                <div style={{ ...ad.tableHeader, gridTemplateColumns:"1.5fr 1.5fr 1fr 2fr 180px" }}>
                  <span>Reported User</span><span>Reported By</span><span>Group</span><span>Reason</span><span>Actions</span>
                </div>
                {filtered.map((r, i) => {
                  const isConfirming = confirmGroupAction?.id === r.id;
                  return (
                    <div key={r.id} className="ad-anim" style={{ animationDelay:`${i*0.04}s`, padding:"12px 20px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", borderBottom: i < filtered.length - 1 ? "1px solid var(--divider)" : "none" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 2fr 180px", alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"var(--primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{r.reporteduseremail || "—"}</span>
                        <span style={{ fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{r.reportedbyemail || "—"}</span>
                        <span style={{ fontSize:12, color:"var(--accent2)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{r.groupname || "—"}</span>
                        <span style={{ fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{r.reason || "—"}</span>
                        {isConfirming ? (
                          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ fontSize:11, fontWeight:600, color: confirmGroupAction.action === "warn" ? "var(--accent)" : "var(--text3)" }}>Sure?</span>
                            <button onClick={() => { if (confirmGroupAction.action === "warn") warnGroupMember(r.id); else dismissGroupReport(r.id); setConfirmGroupAction(null); }}
                              style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background: confirmGroupAction.action === "warn" ? "var(--divider)" : "var(--error-bg)", color: confirmGroupAction.action === "warn" ? "var(--accent)" : "var(--error)" }}>Yes</button>
                            <button onClick={() => setConfirmGroupAction(null)} style={{ padding:"4px 8px", border:"1px solid var(--border)", borderRadius:6, fontSize:11, cursor:"pointer", background:"var(--surface)", color:"var(--text2)" }}>No</button>
                          </div>
                        ) : (
                          <div style={{ display:"flex", gap:4 }}>
                            <button className="action-btn" onClick={() => setConfirmGroupAction({ id: r.id, action:"warn" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--divider)", color:"var(--accent)" }}>Warn</button>
                            <button className="action-btn" onClick={() => setConfirmGroupAction({ id: r.id, action:"dismiss" })} style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", background:"var(--error-bg)", color:"var(--error)" }}>Dismiss</button>
                          </div>
                        )}
                      </div>
                      {r.messagecontent && (
                        <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, paddingLeft:2, marginTop:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:.5, marginRight:6 }}>Message</span>
                          {r.messagecontent}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination page={groupReportPage} totalPages={groupReportTotalPages} onPrev={() => loadGroupReports(groupReportPage - 1)} onNext={() => loadGroupReports(groupReportPage + 1)} />
            <div style={{ marginTop:14, fontSize:12, color:"var(--text3)" }}>{filtered.length} report{filtered.length !== 1 ? "s" : ""} shown{groupReportSearch && " (filtered)"}</div>
          </>
        );
      })()}

      {/* reviews tab */}
      {tab === "reviews" && (
        <>
          <div style={{ display:"flex", gap:6, marginBottom:16, width:"fit-content" }}>
            {[{id:"all",label:"All"},{id:"flagged",label:"Flagged"},{id:"reported",label:"Reported"}].map(t => (
              <button key={t.id} className="kk-tab" data-active={reviewStatus === t.id} onClick={() => { setReviewStatus(t.id); setExpandedId(null); setConfirmAction(null); }} style={{
                padding:"8px 18px", borderRadius:9, fontSize:13,
                fontWeight: reviewStatus === t.id ? 600 : 400, cursor:"pointer", transition:"all .15s",
                border: reviewStatus === t.id ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                background: reviewStatus === t.id ? "color-mix(in srgb, var(--primary) 14%, var(--surface))" : "var(--surface)",
                color:      reviewStatus === t.id ? "var(--primary)" : "var(--text2)",
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 14px", marginBottom:16, maxWidth:400 }}>
            <Search size={14} color="var(--text3)" style={{ marginRight:8, flexShrink:0 }} />
            <input value={reviewSearch} onChange={e => setReviewSearch(e.target.value)}
              placeholder="Search by email, course, professor, review text…"
              style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", width:"100%", fontFamily:"'DM Sans',sans-serif" }} />
            {reviewSearch && <button onClick={() => setReviewSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", fontSize:14, padding:0, marginLeft:6 }}>✕</button>}
          </div>

          {reviewStatus === "all" && reviewType === "course" && (<>
            {reviewTable(courseReviews.filter(r => matchSearch(reviewSearch, r.userid, r.coursecode, r.coursetitle, r.comment)), courseLoading, "No course reviews yet", deleteCourseReview, "ac", "course", false)}
            <Pagination page={courseReviewPage} totalPages={courseReviewTotalPages} onPrev={() => loadCourseReviews(courseReviewPage - 1)} onNext={() => loadCourseReviews(courseReviewPage + 1)} />
          </>)}
          {reviewStatus === "all" && reviewType === "professor" && (<>
            {reviewTable(profReviews.filter(r => matchSearch(reviewSearch, r.userid, r.profname, r.comment)), profLoading, "No professor reviews yet", deleteProfReview, "ap", "professor", false)}
            <Pagination page={profReviewPage} totalPages={profReviewTotalPages} onPrev={() => loadProfReviews(profReviewPage - 1)} onNext={() => loadProfReviews(profReviewPage + 1)} />
          </>)}
          {reviewStatus === "flagged"  && reviewType === "course"    && reviewTable(flaggedCourse.filter(r    => matchSearch(reviewSearch, r.userid, r.coursecode, r.coursetitle, r.comment)),    flaggedCourseLoading,  "No flagged course reviews",     deleteCourseReview, "fc", "course",    false, true)}
          {reviewStatus === "flagged"  && reviewType === "professor" && reviewTable(flaggedProf.filter(r      => matchSearch(reviewSearch, r.userid, r.profname, r.comment)),                     flaggedProfLoading,    "No flagged professor reviews",  deleteProfReview,   "fp", "professor", false, true)}
          {reviewStatus === "reported" && reviewType === "course"    && reviewTable(reportedCourse.filter(r   => matchSearch(reviewSearch, r.userid, r.coursecode, r.coursetitle, r.comment)),   reportedCourseLoading, "No reported course reviews",    deleteCourseReview, "rc", "course",    true)}
          {reviewStatus === "reported" && reviewType === "professor" && reviewTable(reportedProf.filter(r     => matchSearch(reviewSearch, r.userid, r.profname, r.comment)),                    reportedProfLoading,   "No reported professor reviews", deleteProfReview,   "rp", "professor", true)}
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
