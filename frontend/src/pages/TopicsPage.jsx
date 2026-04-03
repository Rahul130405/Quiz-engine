import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import TopicGraph from "../components/Graph/TopicGraph";
import TopicCard from "../components/Graph/TopicCard";

export default function TopicsPage() {
  const [topics,  setTopics]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState("cards"); // 'cards' | 'graph'
  const navigate = useNavigate();

  const fetchTopics = useCallback(async () => {
    try {
      const { data } = await api.get("/topics");
      setTopics(data.topics);
    } catch (err) {
      console.error("Failed to load topics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const handleStart = (topic) => {
    if (!topic.unlocked) return;
    navigate(`/quiz/${topic._id}`, { state: { topic } });
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Learning Topics</h1>
          <p style={{ color: "var(--text-2)" }}>Complete prerequisites to unlock advanced topics</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className={`btn ${view === "cards" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("cards")}>
            🃏 Cards
          </button>
          <button className={`btn ${view === "graph" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("graph")}>
            🌐 Graph
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Topics",    value: topics.length },
          { label: "Unlocked",        value: topics.filter((t) => t.unlocked).length },
          { label: "Completed",       value: topics.filter((t) => t.completed).length },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ flex: "1", minWidth: 120, textAlign: "center", padding: "1rem" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: "var(--accent)" }}>{value}</div>
            <div style={{ color: "var(--text-2)", fontSize: "0.82rem", marginTop: "0.2rem" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* View: Cards */}
      {view === "cards" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}>
          {topics.map((topic, i) => (
            <TopicCard
              key={topic._id}
              topic={topic}
              onStart={handleStart}
              style={{ animationDelay: `${i * 0.06}s` }}
            />
          ))}
        </div>
      )}

      {/* View: Graph */}
      {view === "graph" && (
        <div className="card" style={{ padding: "1rem", minHeight: 480 }}>
          <TopicGraph topics={topics} onTopicClick={handleStart} />
        </div>
      )}
    </div>
  );
}
