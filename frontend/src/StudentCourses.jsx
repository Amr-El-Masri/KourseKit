import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const API = "http://localhost:8080";

function fmtTime(t) {
  if (!t) return "";
  if (t.includes(":")) return t.slice(0, 5);
  if (t.length === 4) return `${t.slice(0, 2)}:${t.slice(2)}`;
  return t;
}

function calcDropPos(inputEl, minWidth = 340) {
  const r = inputEl.getBoundingClientRect();
  return { top: r.bottom + 4, left: r.left, width: Math.max(r.width, minWidth) };
}

function deriveLinkedType(sectionNumber) {
  const sec = (sectionNumber || "").toUpperCase();
  if (sec.startsWith("BL")) return "Lab Lecture";
  if (sec.startsWith("B")) return "Lab";
  return "Recitation";
}

export default function StudentCourses({ value, onSelect, inputStyle = {}, filterPrefix = null, lockedCourse = null, autoOpen = false }) {
  const hasSection = !!value?.sectioncrn;

  const [query, setQuery] = useState(value?.code || "");
  const [courseResults, setCourseResults] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCourses, setShowCourses] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [showSections, setShowSections] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  // Linked section step
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [linkedSections, setLinkedSections] = useState([]);
  const [showLinked, setShowLinked] = useState(false);

  const [dropPos, setDropPos] = useState(null);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);

  const openDrop = () => {
    requestAnimationFrame(() => {
      if (inputRef.current) setDropPos(calcDropPos(inputRef.current));
    });
  };

  // Keep dropdown aligned when window scrolls or resizes
  useEffect(() => {
    if (!dropPos) return;
    const update = () => {
      if (inputRef.current) setDropPos(calcDropPos(inputRef.current));
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [!!dropPos]);

  useEffect(() => {
    if (!autoOpen || !lockedCourse || hasSection) return;
    const load = async () => {
      setSelectedCourse(lockedCourse);
      setShowSections(true);
      setLoadingSections(true);
      openDrop();
      const secs = await fetch(`${API}/api/courses/${lockedCourse.id}/sections`)
        .then(r => r.json())
        .catch(() => []);
      setSections(secs);
      setLoadingSections(false);
      openDrop();
    };
    const t = setTimeout(load, 50);
    return () => clearTimeout(t);
  }, [autoOpen, lockedCourse?.id]);

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setShowSections(false);
    setShowLinked(false);
    setSections([]);
    setSelectedCourse(null);
    setSelectedLecture(null);
    setLinkedSections([]);

    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) { setCourseResults([]); setShowCourses(false); return; }

    setLoadingCourses(true);
    setShowCourses(true);
    openDrop();
    searchTimeout.current = setTimeout(() => {
      fetch(`${API}/api/courses/search?query=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => { setCourseResults(data); setLoadingCourses(false); openDrop(); })
        .catch(() => { setCourseResults([]); setLoadingCourses(false); });
    }, 300);
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setQuery(course.courseCode);
    setCourseResults([]);
    setShowCourses(false);
    setShowSections(true);
    setLoadingSections(true);
    openDrop();

    const secs = await fetch(`${API}/api/courses/${course.id}/sections`)
      .then(r => r.json())
      .catch(() => []);
    setSections(secs);
    setLoadingSections(false);
    openDrop();
  };

  const handleLockedClick = async () => {
    if (hasSection || showSections || !lockedCourse) return;
    setSelectedCourse(lockedCourse);
    setShowSections(true);
    setLoadingSections(true);
    openDrop();

    const secs = await fetch(`${API}/api/courses/${lockedCourse.id}/sections`)
      .then(r => r.json())
      .catch(() => []);
    setSections(secs);
    setLoadingSections(false);
    openDrop();
  };

  const handleSectionSelect = (section) => {
    const linkedCrnList = (section.linkedCrns || "").match(/\d+/g) || [];
    const matched = linkedCrnList.length > 0
      ? sections.filter(s => linkedCrnList.includes(s.crn))
      : sections.filter(s => {
          const sec = (s.sectionNumber || "").toUpperCase();
          return sec.startsWith("E") || (sec.startsWith("B") && !sec.startsWith("BL"));
        });

    if (matched.length > 0) {
      // Show linked section picker as next step
      setSelectedLecture(section);
      setLinkedSections(matched);
      setShowSections(false);
      setShowLinked(true);
      openDrop();
    } else {
      // No linked sections — done
      setShowSections(false);
      setDropPos(null);
      onSelect({
        code: selectedCourse.courseCode,
        courseId: selectedCourse.id,
        credits: section.creditHours || 0,
        sectioncrn: section.crn,
        sectionNumber: section.sectionNumber,
        profname: section.professorName,
      });
    }
  };

  const handleLinkedSelect = (linked) => {
    setShowLinked(false);
    setDropPos(null);
    onSelect({
      code: selectedCourse.courseCode,
      courseId: selectedCourse.id,
      credits: selectedLecture.creditHours || 0,
      sectioncrn: selectedLecture.crn,
      sectionNumber: selectedLecture.sectionNumber,
      profname: selectedLecture.professorName,
      linkedSectionCrn: linked.crn,
      linkedSectionNumber: linked.sectionNumber,
      linkedSectionType: deriveLinkedType(linked.sectionNumber),
    });
  };

  const handleClear = () => {
    setQuery("");
    setCourseResults([]);
    setShowCourses(false);
    setSelectedCourse(null);
    setSections([]);
    setShowSections(false);
    setShowLinked(false);
    setSelectedLecture(null);
    setLinkedSections([]);
    setDropPos(null);
    onSelect({ code: lockedCourse?.courseCode || "", credits: 0, sectioncrn: null, sectionNumber: null, profname: null });
  };

  const displaySections = filterPrefix
    ? sections.filter(s => {
        const sec = s.sectionNumber?.toUpperCase() || "";
        if (sec.startsWith("BL")) return false;
        return filterPrefix.some(p => sec.startsWith(p.toUpperCase()));
      })
    : sections.filter(s => {
        const sec = s.sectionNumber?.toUpperCase() || "";
        if (sec.startsWith("E")) return false;
        if (sec.startsWith("B") && !sec.startsWith("BL")) return false;
        return true;
      });

  const sectionDisplay = value?.sectionNumber || value?.sectioncrn || "";
  const linkedDisplay = value?.linkedSectionNumber ? ` + ${value.linkedSectionNumber}` : "";
  const displayValue = lockedCourse
    ? hasSection ? `${sectionDisplay}` : lockedCourse.courseCode
    : hasSection ? `${value.code}  ·  ${sectionDisplay}${linkedDisplay}` : query;

  const base = {
    width: "100%",
    padding: "10px 14px",
    paddingRight: hasSection ? 30 : 14,
    border: `1px solid ${showSections || showLinked ? "var(--accent)" : "var(--border)"}`,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'DM Sans',sans-serif",
    color: "var(--text)",
    background: hasSection ? "var(--surface3,#eef2fb)" : "var(--surface2)",
    outline: "none",
    cursor: lockedCourse && !hasSection ? "pointer" : hasSection ? "default" : "text",
    ...inputStyle,
  };

  const dropStyle = {
    position: "fixed",
    top: dropPos?.top,
    left: dropPos?.left,
    width: dropPos?.width,
    background: "var(--surface)",
    border: "1px solid var(--accent)",
    borderRadius: 10,
    boxShadow: "0 4px 20px rgba(49,72,122,0.16)",
    zIndex: 99999,
    maxHeight: 300,
    overflowY: "auto",
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={displayValue}
        onChange={hasSection || lockedCourse ? undefined : handleQueryChange}
        onClick={lockedCourse && !hasSection ? handleLockedClick : undefined}
        readOnly={hasSection || !!lockedCourse}
        placeholder={lockedCourse ? "Click to pick section" : "Search course"}
        style={base}
        onFocus={() => {
          if (!lockedCourse && !hasSection && query.trim().length >= 2 && courseResults.length > 0) {
            setShowCourses(true); openDrop();
          }
        }}
        onBlur={() => setTimeout(() => {
          setShowCourses(false);
          setShowSections(false);
          setShowLinked(false);
          setDropPos(null);
        }, 200)}
      />

      {hasSection && (
        <button onClick={handleClear} style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text3)", fontSize: 15, lineHeight: 1, padding: "0 2px",
        }}>✕</button>
      )}

      {/* Course search results */}
      {showCourses && dropPos && createPortal(
        <div style={{ ...dropStyle, border: "1px solid var(--border)" }}>
          {loadingCourses && <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--text2)" }}>Searching…</div>}
          {!loadingCourses && courseResults.length === 0 && query.length >= 2 && (
            <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--text2)" }}>No courses found.</div>
          )}
          {courseResults.map(c => (
            <div key={c.id}
              onMouseDown={e => { e.preventDefault(); handleCourseSelect(c); }}
              style={{ padding: "9px 14px", fontSize: 13, color: "var(--text)", cursor: "pointer", borderBottom: "1px solid var(--divider)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontWeight: 600 }}>{c.courseCode}</span>
              {c.title && <span style={{ color: "var(--text2)", marginLeft: 8, fontSize: 12 }}>{c.title}</span>}
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Lecture section picker */}
      {showSections && dropPos && createPortal(
        <div style={dropStyle}>
          <div style={{ padding: "8px 14px 6px", fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--divider)" }}>
            Pick a section for {selectedCourse?.courseCode}
          </div>
          {loadingSections && <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--text2)" }}>Loading sections…</div>}
          {!loadingSections && displaySections.length === 0 && <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--text2)" }}>No sections available.</div>}
          {displaySections.map(s => (
            <div key={s.id}
              onMouseDown={e => { e.preventDefault(); handleSectionSelect(s); }}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--divider)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--primary)" }}>
                  Sec {s.sectionNumber} — {s.professorName}
                </span>
                <span style={{ fontSize: 11, color: "var(--text3)", flexShrink: 0, marginLeft: 8 }}>
                  {s.creditHours} cr · {s.seatsAvailable} seats
                </span>
              </div>
              {s.days1 && (
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 3 }}>
                  {s.days1}  {fmtTime(s.beginTime1)}–{fmtTime(s.endTime1)}
                  {s.building1 ? `  ·  ${s.building1} ${s.room1 || ""}` : ""}
                </div>
              )}
              {s.days2 && (
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  {s.days2}  {fmtTime(s.beginTime2)}–{fmtTime(s.endTime2)}
                  {s.building2 ? `  ·  ${s.building2} ${s.room2 || ""}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Linked section picker (lab / recitation) */}
      {showLinked && dropPos && createPortal(
        <div style={dropStyle}>
          <div style={{ padding: "8px 14px 6px", fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--divider)" }}>
            Pick linked section for {selectedCourse?.courseCode}
          </div>
          {linkedSections.map(s => (
            <div key={s.id}
              onMouseDown={e => { e.preventDefault(); handleLinkedSelect(s); }}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--divider)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--primary)" }}>
                  Sec {s.sectionNumber} — {s.professorName}
                </span>
                <span style={{ fontSize: 11, color: "var(--text3)", flexShrink: 0, marginLeft: 8 }}>
                  {s.seatsAvailable} seats
                </span>
              </div>
              {s.days1 && (
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 3 }}>
                  {s.days1}  {fmtTime(s.beginTime1)}–{fmtTime(s.endTime1)}
                  {s.building1 ? `  ·  ${s.building1} ${s.room1 || ""}` : ""}
                </div>
              )}
              {s.days2 && (
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  {s.days2}  {fmtTime(s.beginTime2)}–{fmtTime(s.endTime2)}
                  {s.building2 ? `  ·  ${s.building2} ${s.room2 || ""}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}