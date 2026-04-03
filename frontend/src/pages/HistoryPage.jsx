import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

export default function HistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/quiz/history")
      .then(({ data }) => { setAttempts(data.attempts); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const totalAttempts = attempts.length;
  const passed        = attempts.filter((a) => a.passed).length;
  const avgScore      = totalAttempts
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / totalAttempts)
    : 0;

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>📋 Quiz History</h1>
      <p style={{ color: "var(--text-2)", marginBottom: "2rem" }}>Your last {totalAttempts} quiz attempts</p>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Attempts", value: totalAttempts },
          { label: "Passed",         value: passed, color: "var(--success)" },
          { label: "Avg Score",      value: avgScore, color: "var(--accent)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: color || "var(--text)" }}>{value}</div>
            <div style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>{label}</div>
          </div>
        ))}
      </div>

      {attempts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
          <h2 style={{ marginBottom: "0.5rem" }}>No attempts yet</h2>
          <p style={{ color: "var(--text-2)", marginBottom: "1.5rem" }}>Complete your first quiz to see your history here.</p>
          <Link to="/topics" className="btn btn-primary">Browse Topics</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {attempts.map((attempt, i) => {
            const topic   = attempt.topicId;
            const passColor = attempt.passed ? "var(--success)" : "var(--error)";
            const date    = new Date(attempt.createdAt).toLocaleDateString("en-US", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            });

            return (
              <div
                key={attempt._id}
                className="card fade-in"
                style={{ animationDelay: `${i * 0.05}s`, padding: "1rem 1.25rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  {/* Left: topic info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.75rem" }}>{topic?.icon || "📚"}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontFamily: "var(--font-display)" }}>
                        {topic?.name || "Unknown Topic"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>{date}</div>
                    </div>
                  </div>

                  {/* Right: score + pass/fail */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {/* Mini progress bar */}
                    <div style={{ width: 80 }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: "3px", textAlign: "right" }}>
                        {attempt.percentage}%
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${attempt.percentage}%`, background: passColor }}
                        />
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontFamily: "var(--font-display)", fontWeight: 700,
                        fontSize: "1.15rem", color: "var(--accent)",
                      }}>
                        {attempt.score} pts
                      </div>
                      <div style={{ fontSize: "0.78rem", color: passColor, fontWeight: 600 }}>
                        {attempt.passed ? "✅ Passed" : "❌ Failed"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra stats */}
                <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--text-3)", flexWrap: "wrap" }}>
                  <span>🔥 Max streak: <strong style={{ color: "var(--text)" }}>{attempt.answers?.reduce?.((max, a) => Math.max(max, 0), 0) || "—"}</strong></span>
                  <span>⚡ Streak bonus: <strong style={{ color: "var(--accent)" }}>+{attempt.streakBonus || 0}</strong></span>
                  <span>📝 Questions: <strong style={{ color: "var(--text)" }}>{attempt.answers?.length || 0}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
