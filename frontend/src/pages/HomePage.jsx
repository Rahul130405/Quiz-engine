import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    { icon: "🔀", title: "Smart Shuffle",       desc: "Fisher–Yates algorithm ensures perfectly random, non-repeating questions every session." },
    { icon: "📈", title: "Streak Scoring",       desc: "Greedy scoring rewards consistency: earn bonus points for consecutive correct answers." },
    { icon: "🌳", title: "Topic Graph",          desc: "Topics form a dependency graph. Complete prerequisites to unlock advanced topics." },
    { icon: "📊", title: "Live Leaderboard",     desc: "Compete with others. Real-time rankings sorted by score using efficient algorithms." },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "4rem 1rem 3rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem", animation: "bounce 2s ease infinite" }}>⚡</div>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", marginBottom: "1.25rem" }}>
          Learn Smarter with{" "}
          <span style={{ color: "var(--accent)" }}>QuizEngine</span>
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: "1.15rem", maxWidth: 560, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
          An algorithm-powered quiz platform with adaptive scoring, dependency-based topic unlocking, and real-time leaderboards.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {user ? (
            <Link to="/topics" className="btn btn-primary" style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}>
              Browse Topics →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}>
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-ghost" style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1.25rem",
        marginTop: "2rem",
      }}>
        {features.map(({ icon, title, desc }) => (
          <div key={title} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{icon}</div>
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "0.5rem", fontSize: "1.05rem" }}>{title}</h3>
            <p style={{ color: "var(--text-2)", fontSize: "0.88rem", lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Scoring explainer */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1.25rem", fontSize: "1.3rem" }}>
          🎯 How Scoring Works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {[
            { label: "Correct Answer",    value: "+5 pts",  color: "var(--success)" },
            { label: "Wrong Answer",      value: "−1 pt",   color: "var(--error)" },
            { label: "3-in-a-row Streak", value: "+2 bonus",color: "var(--warning)" },
            { label: "5-in-a-row Streak", value: "+5 bonus",color: "var(--accent)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "var(--bg-3)", borderRadius: "var(--radius-sm)",
              padding: "1rem", textAlign: "center", border: "1px solid var(--border)",
            }}>
              <div style={{ color, fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
              <div style={{ color: "var(--text-2)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
