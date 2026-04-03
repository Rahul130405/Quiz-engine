import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { DIFFICULTY_COLORS, formatTime } from "../utils/algorithms";

export default function ResultsPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();

  if (!state?.result) {
    return (
      <div className="container center" style={{ marginTop: "10rem" }}>
        <p>No results found.</p>
        <Link to="/topics" className="btn btn-primary" style={{ marginTop: "1rem" }}>Back to Topics</Link>
      </div>
    );
  }

  const { result, topic, questions, totalTimeTaken } = state;
  const {
    score, maxPossibleScore, percentage, passed,
    correctCount, wrongCount, maxStreak, totalStreakBonus, history,
    isNewBest
  } = result;

  const questionMap = new Map((questions || []).map((q) => [q._id, q]));

  const gradeColor = percentage >= 80 ? "var(--success)" : percentage >= 60 ? "var(--warning)" : "var(--error)";
  const gradeLabel = percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good job!" : "Keep practicing";

  return (
    <div className="container main-content fade-in" style={{ maxWidth: 700 }}>
      {/* Result hero */}
      <div className="card" style={{ textAlign: "center", marginBottom: "1.5rem", padding: "2.5rem", position: "relative" }}>
        
        {isNewBest && (
          <div className="points-pop" style={{ 
            position: "absolute", top: -15, right: -15, 
            background: "var(--warning)", color: "#000", fontWeight: 800,
            padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)",
            transform: "rotate(12deg)", boxShadow: "var(--shadow-lg)",
            fontSize: "0.9rem", zIndex: 10
          }}>
            🏆 NEW BEST!
          </div>
        )}

        <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>
          {passed ? "🎉" : "💪"}
        </div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem", color: gradeColor }}>{gradeLabel}</h1>
        <p style={{ color: "var(--text-2)", marginBottom: "2rem" }}>{topic?.name || "Quiz"} complete</p>

        {/* Score ring */}
        <div style={{
          width:        140, height: 140, borderRadius: "50%",
          border:       `10px solid var(--bg-3)`,
          display:      "flex", flexDirection: "column",
          alignItems:   "center", justifyContent: "center",
          margin:       "0 auto 2.5rem",
          position:     "relative",
          background:   `conic-gradient(${gradeColor} ${percentage * 3.6}deg, var(--bg-3) 0deg)`,
          boxShadow:    `0 0 40px ${gradeColor}22`,
        }}>
          <div style={{
            width: 110, height: 110, borderRadius: "50%",
            background: "var(--bg-2)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "absolute",
          }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: gradeColor }}>
              {percentage}%
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>
              {correctCount} / {questions?.length || 0} Correct
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[
            { label: "Points Earned", value: `+${score}`, color: "var(--accent)" },
            { label: "Time Taken",    value: formatTime(totalTimeTaken || 0), color: "var(--text)" },
            { label: "Max Streak",    value: `${maxStreak}×`, color: "var(--warning)" },
            { label: "Correct",       value: correctCount, color: "var(--success)" },
            { label: "Wrong",         value: wrongCount,   color: "var(--error)" },
            { label: "Streak Bonus",  value: `+${totalStreakBonus}`, color: "var(--accent-2)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "var(--bg-3)", borderRadius: "var(--radius-sm)", padding: "1rem",
              border: "1px solid var(--border)",
            }}>
              <div style={{ color, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem" }}>{value}</div>
              <div style={{ color: "var(--text-3)", fontSize: "0.75rem", marginTop: "0.2rem", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            style={{ padding: "0.8rem 2rem" }}
            onClick={() => navigate(`/quiz/${topic?._id || topic?.id || ""}`, { state: { topic } })}
          >
            🔄 Try Again
          </button>
          <Link to="/topics" className="btn btn-ghost" style={{ padding: "0.8rem 2rem" }}>📚 Back to Topics</Link>
          <Link to="/leaderboard" className="btn btn-ghost" style={{ padding: "0.8rem 2rem" }}>🏆 Leaderboard</Link>
        </div>
      </div>

      {/* Per-question breakdown */}
      {history && history.length > 0 && (
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1.5rem", fontSize: "1.25rem" }}>
            Review Answers
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {history.map((h, i) => {
              const q = questionMap.get(h.questionId) || {};
              const isCorrect = h.isCorrect || h.result === "correct";
              const isTimeout = h.timedOut || h.result === "timeout";
              
              const statusColor = isCorrect ? "var(--success)" : isTimeout ? "var(--warning)" : "var(--error)";

              return (
                <div
                  key={i}
                  style={{
                    background:   "var(--bg-3)", borderRadius: "var(--radius-sm)",
                    padding:      "1.25rem", border: "1px solid var(--border)",
                    borderLeft:   `4px solid ${statusColor}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 700 }}>Q{i + 1}</span>
                        <span className={`badge badge-${(q.difficulty || "medium").toLowerCase()}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <div style={{ fontSize: "1rem", color: "var(--text)", lineHeight: 1.5, marginBottom: "0.75rem", fontWeight: 500 }}>
                        {h.questionText || q.text || "(question)"}
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ fontSize: "0.85rem", color: isCorrect ? "var(--success)" : "var(--error)" }}>
                          <strong>Your Answer:</strong> {h.selectedOption !== -1 ? q.options?.[h.selectedOption] : "No Answer"} 
                          {isCorrect ? " ✓" : " ✗"}
                        </div>
                        {!isCorrect && (
                          <div style={{ fontSize: "0.85rem", color: "var(--success)" }}>
                            <strong>Correct Answer:</strong> {q.options?.[h.correctAnswer ?? q.correctAnswer]}
                          </div>
                        )}
                      </div>

                      {(h.explanation || q.explanation) && (
                        <div style={{ 
                          fontSize: "0.85rem", color: "var(--text-2)", marginTop: "1rem", 
                          padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px",
                          borderLeft: "2px solid var(--accent-glow)"
                        }}>
                          💡 {h.explanation || q.explanation}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
                        {isCorrect ? "✅" : isTimeout ? "⏰" : "❌"}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem",
                        color: h.scoreChange > 0 ? "var(--success)" : h.scoreChange < 0 ? "var(--error)" : "var(--text-3)",
                      }}>
                        {h.scoreChange > 0 ? "+" : ""}{h.scoreChange} pts
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
