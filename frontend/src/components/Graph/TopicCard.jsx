import React from "react";

export default function TopicCard({ topic, onStart, style }) {
  const { name, description, icon, color, unlocked, completed, bestScore, attempts, prerequisites } = topic;

  const statusLabel = completed ? "✅ Completed" : unlocked ? "🔓 Unlocked" : "🔒 Locked";
  const statusColor = completed ? "var(--success)" : unlocked ? "var(--accent)" : "var(--text-3)";

  return (
    <div
      className="card fade-in"
      style={{
        ...style,
        opacity:   unlocked ? 1 : 0.6,
        cursor:    unlocked ? "pointer" : "not-allowed",
        position:  "relative",
        overflow:  "hidden",
        transition: "all 0.2s ease",
        borderColor: completed ? "rgba(34,197,94,0.3)" : undefined,
      }}
      onClick={() => onStart(topic)}
      onMouseEnter={(e) => {
        if (unlocked) {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = `0 8px 32px ${color}33`;
          e.currentTarget.style.borderColor = color;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = "";
      }}
    >
      {/* Colour accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "14px 14px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "2.2rem" }}>{icon}</span>
        <span style={{ color: statusColor, fontSize: "0.8rem", fontWeight: 600 }}>{statusLabel}</span>
      </div>

      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "0.4rem" }}>{name}</h3>
      <p style={{ color: "var(--text-2)", fontSize: "0.87rem", lineHeight: 1.5, marginBottom: "1rem" }}>{description}</p>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "1rem", fontSize: "0.82rem", color: "var(--text-3)" }}>
        {attempts > 0 && (
          <>
            <span>🏆 Best: <strong style={{ color: "var(--text)" }}>{bestScore}</strong></span>
            <span>📝 Tries: <strong style={{ color: "var(--text)" }}>{attempts}</strong></span>
          </>
        )}
      </div>

      {/* Prerequisites */}
      {!unlocked && prerequisites?.length > 0 && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--text-3)" }}>
          Requires: {prerequisites.map((p) => p.name || "prerequisite").join(", ")}
        </div>
      )}

      {unlocked && (
        <div style={{
          marginTop:     "1rem",
          padding:       "0.55rem 1rem",
          background:    `${color}18`,
          border:        `1px solid ${color}33`,
          borderRadius:  "var(--radius-sm)",
          color:         color,
          fontSize:      "0.88rem",
          fontWeight:    600,
          textAlign:     "center",
        }}>
          {completed ? "Retake Quiz →" : "Start Quiz →"}
        </div>
      )}
    </div>
  );
}
