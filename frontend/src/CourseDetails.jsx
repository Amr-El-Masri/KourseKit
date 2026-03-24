import { useState, useEffect } from "react";
import { ArrowLeft, Clock, MapPin, Users, BookOpen, Building2, Calendar, MessageSquare } from "lucide-react";

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
  "Arts & Sciences": { accent: "#31487A" },
  "Engineering": { accent: "#b7680a" },
  "Medicine": { accent: "#2d7a4a" },
  "Business": { accent: "#5A3B7B" },
  "Architecture": { accent: "#7a2d5a" },
  "Health Sciences": { accent: "#1a7a6a" },
  "default": { accent: "#31487A" },
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
  const color = pct >= 90 ? "var(--error)" : pct >= 70 ? "var(--warn)" : "var(--success)";
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>
        <span>{enrolled} enrolled</span>
        <span>{seats} seats left</span>
      </div>
      <div style={{ height: 5, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
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
      {label && <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>}
      {d && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={12} color="var(--border2)" />
          <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{d}</span>
        </div>
      )}
      {t1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} color="var(--border2)" />
          <span style={{ fontSize: 13, color: "var(--text)" }}>{t1} — {t2}</span>
        </div>
      )}
      {(building || room) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={12} color="var(--border2)" />
          <span style={{ fontSize: 13, color: "var(--text)" }}>
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
        background: "var(--surface)",
        border: "1px solid var(--border)",
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
          background: expanded ? "var(--surface2)" : "var(--surface)",
          borderBottom: expanded ? "1px solid var(--border)" : "none",
          transition: "background 0.15s",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          {/* Section badge */}
          <div style={{
            minWidth: 44, height: 44, borderRadius: 10,
            background: `color-mix(in srgb, ${colStyle.accent} 15%, transparent)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 13, color: colStyle.accent }}>
              {section.sectionNumber || "?"}
            </span>
          </div>

          {/* Professor + CRN */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {section.professorName || "Staff"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>CRN {section.crn}</div>
          </div>
        </div>

        {/* Quick info chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {section.creditHours > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: "var(--surface3)", color: "var(--accent2)", padding: "3px 9px", borderRadius: 6 }}>
              {section.creditHours} cr
            </span>
          )}
          {section.days1 && (
            <span style={{ fontSize: 11, fontWeight: 600, background: "var(--blue-light-bg)", color: "var(--primary)", padding: "3px 9px", borderRadius: 6 }}>
              {formatDays(section.days1)}
            </span>
          )}
          <span style={{
            fontSize: 9, opacity: 0.55, transition: "transform 0.2s",
            display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
          }}>▼</span>
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
          <div style={{ height: 1, background: "var(--divider)" }} />

          {/* Meta row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
            {section.college && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={13} color="var(--border2)" />
                <span style={{ fontSize: 12, color: "var(--text-body)" }}>{section.college}</span>
              </div>
            )}
            {section.creditHours > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen size={13} color="var(--border2)" />
                <span style={{ fontSize: 12, color: "var(--text-body)" }}>{section.creditHours} credit hours</span>
              </div>
            )}
            {(section.seatsAvailable != null || section.actualEnrolment != null) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={13} color="var(--border2)" />
                <span style={{ fontSize: 12, color: "var(--text-body)" }}>
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

export default function CourseDetails({ course, onBack, onNavigateToForum }) {
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
        .back-btn:hover { background: var(--surface3) !important; }
      `}</style>

      {/* Back button */}
      <button
        className="back-btn"
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "8px 16px", cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "var(--primary)",
          fontFamily: "'DM Sans', sans-serif", marginBottom: 24,
          transition: "background 0.15s",
        }}
      >
        <ArrowLeft size={15} /> Back to Reviews
      </button>

      {/* Course header */}
      <div style={{
        background: "var(--surface)", borderRadius: 18, padding: "24px 28px",
        border: "1px solid var(--border)", boxShadow: "0 2px 14px rgba(49,72,122,0.07)",
        marginBottom: 24,
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 28, color: "var(--primary)", marginBottom: 4 }}>
          {data?.courseCode || course.courseCode}
        </div>
        <div style={{ fontSize: 16, color: "var(--accent2)", marginBottom: 20 }}>
          {data?.title || course.title}
        </div>

        {/* Summary chips */}
        {!loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {creditHours > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--surface3)", borderRadius: 10, padding: "8px 14px" }}>
                <BookOpen size={14} color="var(--accent2)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent2)" }}>{creditHours} Credit Hours</span>
              </div>
            )}
            {college && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--blue-light-bg)", borderRadius: 10, padding: "8px 14px" }}>
                <Building2 size={14} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{college}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--success-bg)", borderRadius: 10, padding: "8px 14px" }}>
              <Users size={14} color="var(--success)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}>{sections.length} section{sections.length !== 1 ? "s" : ""}</span>
            </div>
            {totalEnrolled > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--warn-bg)", borderRadius: 10, padding: "8px 14px" }}>
                <Users size={14} color="var(--warn)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--warn)" }}>{totalEnrolled} enrolled · {totalSeats} seats left</span>
              </div>
            )}
          </div>
        )}

        <button
                    onClick={() => onNavigateToForum(data?.courseCode || course.courseCode, "")}
                    style={{
                      marginTop: 14, display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 18px",
                      background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                      color: "var(--primary)",
                      border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                      borderRadius: 10, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background .15s",
                    }}
                  >
                    <MessageSquare size={14} /> Discuss this Course
                  </button>
      </div>

      {/* Sections */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text3)", fontSize: 14 }}>Loading sections…</div>
      )}
      {error && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--error)", fontSize: 14 }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
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
