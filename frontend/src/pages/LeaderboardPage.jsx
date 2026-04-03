import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { sortLeaderboard } from "../utils/algorithms";
import { useAuth } from "../context/AuthContext";

export default function LeaderboardPage() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sortDir, setSortDir]   = useState("desc"); // 'desc' | 'asc'
  const { user } = useAuth();

  useEffect(() => {
    api.get("/leaderboard?limit=50")
      .then(({ data }) => {
        setEntries(data.leaderboard);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sorted = sortDir === "desc"
    ? sortLeaderboard(entries)
    : [...entries].sort((a, b) => a.score - b.score);

  const medals = ["🥇", "🥈", "🥉"];

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🏆 Leaderboard</h1>
          <p style={{ color: "var(--text-2)" }}>Top performers ranked by total score</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
        >
          {sortDir === "desc" ? "↓ Highest first" : "↑ Lowest first"}
        </button>
      </div>

      {/* Top 3 podium */}
      {sorted.length >= 3 && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: "0.75rem", marginBottom: "2rem",
        }}>
          {[sorted[1], sorted[0], sorted[2]].map((entry, podiumIdx) => {
            const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
            const heights = [90, 120, 70];
            const height  = heights[podiumIdx];
            const isMe    = entry?.name === user?.name;
            return (
              <div
                key={entry?._id || podiumIdx}
                style={{
                  display:       "flex", flexDirection: "column",
                  alignItems:    "center", justifyContent: "flex-end",
                  textAlign:     "center",
                }}
              >
                <div style={{
                  background:    "var(--bg-2)", border: isMe ? "2px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius:  "var(--radius-sm) var(--radius-sm) 0 0",
                  width:         "100%", height, display: "flex", flexDirection: "column",
                  alignItems:    "center", justifyContent: "center", gap: "0.3rem",
                  padding:       "0.75rem",
                }}>
                  <div style={{ fontSize: "1.5rem" }}>{medals[rank - 1]}</div>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "var(--accent)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem",
                  }}>
                    {entry?.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: isMe ? "var(--accent)" : "var(--text)" }}>
                    {entry?.name?.split(" ")[0]}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--accent)", fontSize: "0.95rem" }}>
                    {entry?.score ?? entry?.totalScore}
                  </div>
                </div>
                <div style={{
                  width: "100%", background: "var(--bg-3)",
                  border: "1px solid var(--border)", borderTop: "none",
                  padding: "0.25rem", textAlign: "center",
                  fontSize: "0.75rem", color: "var(--text-2)",
                }}>
                  #{rank}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-3)", borderBottom: "1px solid var(--border)" }}>
              {["Rank", "Player", "Score", ""].map((h) => (
                <th key={h} style={{
                  padding: "0.75rem 1rem", textAlign: "left",
                  fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)",
                  letterSpacing: "0.05em", textTransform: "uppercase",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => {
              const isMe = entry?.name === user?.name;
              return (
                <tr
                  key={entry?._id || i}
                  style={{
                    borderBottom:  "1px solid var(--border)",
                    background:    isMe ? "var(--accent-glow)" : "transparent",
                    transition:    "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isMe) e.currentTarget.style.background = "var(--bg-3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isMe ? "var(--accent-glow)" : "transparent"; }}
                >
                  <td style={{ padding: "0.9rem 1rem", color: "var(--text-2)", fontWeight: 600, width: 60 }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </td>
                  <td style={{ padding: "0.9rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: isMe ? "var(--accent)" : "var(--bg-3)",
                        border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-display)", fontWeight: 700,
                        fontSize: "0.85rem", color: isMe ? "#fff" : "var(--text)",
                        flexShrink: 0,
                      }}>
                        {entry?.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: isMe ? 700 : 400, color: isMe ? "var(--accent)" : "var(--text)" }}>
                        {entry?.name} {isMe && <span style={{ fontSize: "0.75rem" }}>(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "0.9rem 1rem" }}>
                    <span style={{
                      fontFamily: "var(--font-display)", fontWeight: 700,
                      fontSize: "1.05rem", color: "var(--accent)",
                    }}>
                      {entry?.score ?? entry?.totalScore}
                    </span>
                    <span style={{ color: "var(--text-3)", fontSize: "0.8rem" }}> pts</span>
                  </td>
                  <td style={{ padding: "0.9rem 1rem", textAlign: "right" }}>
                    {i < 3 && (
                      <span style={{ fontSize: "0.75rem", background: "var(--bg-3)", padding: "0.2rem 0.5rem", borderRadius: "4px", color: "var(--text-2)" }}>
                        Top {Math.round(((i + 1) / sorted.length) * 100)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-2)" }}>
            No players yet. Be the first! 🚀
          </div>
        )}
      </div>
    </div>
  );
}
