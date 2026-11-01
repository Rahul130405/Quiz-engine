import React, { useState } from "react";

export default function TopicCard({ topic, onStart, style }) {
  const {
    name,
    description,
    icon,
    color,
    passingScore,
  } = topic;

  const [isHovered, setIsHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <div
      className="card fade-in"
      style={{
        ...style,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        opacity: 1,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        background: "var(--bg-2)",
        border: isHovered ? "1px solid rgba(59, 130, 246, 0.5)" : "1px solid var(--border)",
        transform: isHovered ? "translateY(-4px)" : "none",
        boxShadow: isHovered
          ? "0 12px 32px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(0, 0, 0, 0.3)"
          : "var(--shadow)",
      }}
      onClick={() => onStart(topic)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color || "var(--accent)",
          borderRadius: "14px 14px 0 0",
        }}
      />

      {/* 1. Topic Icon */}
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.85rem",
          marginBottom: "1.25rem",
        }}
      >
        {icon || "📚"}
      </div>

      {/* 2. Topic Title */}
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "0.5rem",
          letterSpacing: "-0.01em",
        }}
      >
        {name}
      </h3>

      {/* 3. Short Description */}
      <p
        style={{
          color: "var(--text-2)",
          fontSize: "0.875rem",
          lineHeight: 1.55,
          marginBottom: "1.25rem",
          flex: "1 0 auto",
        }}
      >
        {description}
      </p>

      {/* 4. Pass Percentage */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          padding: "0.35rem 0.75rem",
          borderRadius: "8px",
          background: "var(--bg-3)",
          border: "1px solid var(--border)",
          fontSize: "0.85rem",
          color: "var(--text-2)",
          marginBottom: "1.5rem",
          width: "fit-content",
        }}
      >
        <span style={{ color: "var(--text-3)" }}>Pass Percentage:</span>
        <strong style={{ color: "var(--text)", fontWeight: 700 }}>
          {passingScore || 60}%
        </strong>
      </div>

      {/* 5. Prominent Electric-Blue Start Quiz Button */}
      <div style={{ marginTop: "auto", width: "100%" }}>
        <button
          type="button"
          className="start-quiz-btn"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            padding: "0.85rem 1.25rem",
            background: btnHovered || isHovered
              ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
              : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            fontSize: "0.95rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            cursor: "pointer",
            boxShadow: btnHovered || isHovered
              ? "0 0 20px rgba(59, 130, 246, 0.55), 0 4px 12px rgba(0, 0, 0, 0.3)"
              : "0 4px 14px rgba(37, 99, 235, 0.35)",
            transform: btnHovered ? "translateY(-1px) scale(1.01)" : "none",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onStart(topic);
          }}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
        >
          <span>▶ Start Quiz</span>
          <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>→</span>
        </button>
      </div>
    </div>
  );
}
