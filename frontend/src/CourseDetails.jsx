import { useState, useEffect } from "react";
import { ArrowLeft, Clock, MapPin, Users, BookOpen, Building2, Calendar } from "lucide-react";

const API = "http://localhost:8080";

const formatTime = (t) => {
  if (!t || t === "0000" || t.trim() === "") return null;
  const padded = t.padStart(4, "0");
  const h = parseInt(padded.slice(0, 2), 10);
  const m = padded.slice(2);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
};

const formatDays = (days) => {
  if (!days || days.trim() === "") return null;
  const map = { M: "Mon", T: "Tue", W: "Wed", R: "Thu", F: "Fri", S: "Sat", U: "Sun" };
  return days.split(" ").map(d => map[d] || d).join(" · ");
};

const COLLEGE_COLORS = {
  "Arts & Sciences": { bg: "#eef2fb", accent: "#31487A" },
  "Engineering": { bg: "#fff8ec", accent: "#b7680a" },
  "Medicine": { bg: "#eef7f0", accent: "#2d7a4a" },
  "Business": { bg: "#F0EEF7", accent: "#5A3B7B" },
  "Architecture": { bg: "#fef0f7", accent: "#7a2d5a" },
  "Health Sciences": { bg: "#edfaf6", accent: "#1a7a6a" },
  "default": { bg: "#F4F4F8", accent: "#31487A" },
};

const getCollegeStyle = (college) => {
  if (!college) return COLLEGE_COLORS.default;
  for (const key of Object.keys(COLLEGE_COLORS)) {
    if (college.toLowerCase().includes(key.toLowerCase())) return COLLEGE_COLORS[key];
  }
  return COLLEGE_COLORS.default;
};

const EnrollmentBar = ({ seats, enrolled }) => {
  if (!seats && !enrolled) return null;
  const total = (seats || 0) + (enrolled || 0);
  const pct = total > 0 ? Math.min((enrolled / total) * 100, 100) : 0;
  const color = pct >= 90 ? "#c0392b" : pct >= 70 ? "#b7680a" : "#2d7a4a";
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#A59AC9", marginBottom: 4 }}>
        <span>{enrolled} enrolled</span>
        <span>{seats} seats left</span>
      </div>
      <div style={{ height: 5, background: "#E8E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
};

function SlotBlock({ beginTime, endTime, building, room, days, label }) {
  const t1 = formatTime(beginTime);
  const t2 = formatTime(endTime);
  const d  = formatDays(days);
  if (!t1 && !d) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 700, color: "#A59AC9", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>}
      {d && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={12} color="#8FB3E2" />
          <span style={{ fontSize: 13, color: "#2a2050", fontWeight: 600 }}>{d}</span>
        </div>
      )}
      {t1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} color="#8FB3E2" />
          <span style={{ fontSize: 13, color: "#2a2050" }}>{t1} — {t2}</span>
        </div>
      )}
      {(building || room) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={12} color="#8FB3E2" />
          <span style={{ fontSize: 13, color: "#2a2050" }}>
            {[building, room].filter(Boolean).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, index }) {
  const [expanded, setExpanded] = useState(false);
  const colStyle = getCollegeStyle(section.college);
  const hasSlot2 = section.beginTime2 &&
      section.beginTime2.trim() !== "" &&
      section.beginTime2.trim() !== "." &&
      section.beginTime2 !== "0000" &&
      section.days2 &&
      section.days2.trim() !== "" &&
      section.days2.trim() !== ".";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E0E0EC",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(49,72,122,0.06)",
        transition: "box-shadow 0.2s",
        animationDelay: `${index * 0.06}s`,
      }}
      className="section-card"
    >
      {/* Card Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", cursor: "pointer",
          background: expanded ? "#FAFAFE" : "#fff",
          borderBottom: expanded ? "1px solid #E8E8F4" : "none",
          transition: "background 0.15s",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          {/* Section badge */}
          <div style={{
            minWidth: 44, height: 44, borderRadius: 10,
            background: colStyle.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 13, color: colStyle.accent }}>
              {section.sectionNumber || "?"}
            </span>
          </div>

          {/* Professor + CRN */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#31487A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {section.professorName || "Staff"}
            </div>
            <div style={{ fontSize: 11, color: "#A59AC9", marginTop: 2 }}>CRN {section.crn}</div>
          </div>
        </div>

        {/* Quick info chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {section.creditHours > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: "#F0EEF7", color: "#5A3B7B", padding: "3px 9px", borderRadius: 6 }}>
              {section.creditHours} cr
            </span>
          )}
          {section.days1 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: "#eef2fb", color: "#31487A", padding: "3px 9px", borderRadius: 6 }}>
              {formatDays(section.days1)}
            </span>
          )}
          <span style={{
            fontSize: 12, color: "#A59AC9", transition: "transform 0.2s",
            display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
          }}>▾</span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Schedule */}
          <div style={{ display: "grid", gridTemplateColumns: hasSlot2 ? "1fr 1fr" : "1fr", gap: 16 }}>
            <SlotBlock
              beginTime={section.beginTime1} endTime={section.endTime1}
              building={section.building1} room={section.room1}
              days={section.days1}
              label={hasSlot2 ? "Slot 1" : null}
            />
            {hasSlot2 && (
              <SlotBlock
                beginTime={section.beginTime2} endTime={section.endTime2}
                building={section.building2} room={section.room2}
                days={section.days2}
                label="Slot 2"
              />
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#F0EEF7" }} />

          {/* Meta row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
            {section.college && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={13} color="#8FB3E2" />
                <span style={{ fontSize: 12, color: "#4a3a6a" }}>{section.college}</span>
              </div>
            )}
            {section.creditHours > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen size={13} color="#8FB3E2" />
                <span style={{ fontSize: 12, color: "#4a3a6a" }}>{section.creditHours} credit hours</span>
              </div>
            )}
            {(section.seatsAvailable != null || section.actualEnrolment != null) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={13} color="#8FB3E2" />
                <span style={{ fontSize: 12, color: "#4a3a6a" }}>
                  {section.actualEnrolment ?? "?"} enrolled · {section.seatsAvailable ?? "?"} seats left
                </span>
              </div>
            )}
          </div>

          {/* Enrollment bar */}
          <EnrollmentBar seats={section.seatsAvailable} enrolled={section.actualEnrolment} />
        </div>
      )}
    </div>
  );
}

export default function CourseDetails({ course, onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/courses/${course.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Could not load course details."); setLoading(false); });
  }, [course.id]);

  const sections = data?.sections || [];
  const totalEnrolled = sections.reduce((s, sec) => s + (sec.actualEnrolment || 0), 0);
  const totalSeats    = sections.reduce((s, sec) => s + (sec.seatsAvailable  || 0), 0);
  const creditHours   = sections[0]?.creditHours || 0;
  const college       = sections[0]?.college || "";

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 860, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .section-card { animation: fadeUp 0.35s ease both; }
        .section-card:hover { box-shadow: 0 6px 24px rgba(49,72,122,0.13) !important; }
        .back-btn:hover { background: #E8EEF8 !important; }
      `}</style>

      {/* Back button */}
      <button
        className="back-btn"
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#F4F4F8", border: "1px solid #D4D4DC",
          borderRadius: 10, padding: "8px 16px", cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "#31487A",
          fontFamily: "'DM Sans', sans-serif", marginBottom: 24,
          transition: "background 0.15s",
        }}
      >
        <ArrowLeft size={15} /> Back to Reviews
      </button>

      {/* Course header */}
      <div style={{
        background: "#fff", borderRadius: 18, padding: "24px 28px",
        border: "1px solid #D4D4DC", boxShadow: "0 2px 14px rgba(49,72,122,0.07)",
        marginBottom: 24,
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 28, color: "#31487A", marginBottom: 4 }}>
          {data?.courseCode || course.courseCode}
        </div>
        <div style={{ fontSize: 16, color: "#5A3B7B", marginBottom: 20 }}>
          {data?.title || course.title}
        </div>

        {/* Summary chips */}
        {!loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {creditHours > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#F0EEF7", borderRadius: 10, padding: "8px 14px" }}>
                <BookOpen size={14} color="#5A3B7B" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5A3B7B" }}>{creditHours} Credit Hours</span>
              </div>
            )}
            {college && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#eef2fb", borderRadius: 10, padding: "8px 14px" }}>
                <Building2 size={14} color="#31487A" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#31487A" }}>{college}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#eef7f0", borderRadius: 10, padding: "8px 14px" }}>
              <Users size={14} color="#2d7a4a" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2d7a4a" }}>{sections.length} section{sections.length !== 1 ? "s" : ""}</span>
            </div>
            {totalEnrolled > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff8ec", borderRadius: 10, padding: "8px 14px" }}>
                <Users size={14} color="#b7680a" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#b7680a" }}>{totalEnrolled} enrolled · {totalSeats} seats left</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sections */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#B8A9C9", fontSize: 14 }}>Loading sections…</div>
      )}
      {error && (
        <div style={{ textAlign: "center", padding: 40, color: "#c0392b", fontSize: 14 }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#A59AC9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Sections — click to expand
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sections.map((sec, i) => (
              <SectionCard key={sec.id} section={sec} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
