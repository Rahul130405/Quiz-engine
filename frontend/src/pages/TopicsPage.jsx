import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import TopicCard from "../components/Graph/TopicCard";

export default function TopicsPage() {
  const [topics,  setTopics]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTopics = useCallback(async () => {
    try {
      const { data } = await api.get("/java/topics");
      setTopics(data.topics || data);
    } catch (err) {
      console.error("Failed to load topics from Java XML backend:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const handleStart = (topic) => {
    const tId = topic.id || topic._id;
    navigate(`/quiz/${tId}`, { state: { topic } });
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.35rem", letterSpacing: "-0.02em" }}>Learning Topics</h1>
        <p style={{ color: "var(--text-2)", fontSize: "0.95rem" }}>
          Select a topic below to begin your quiz and test your knowledge
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Topics",      value: topics.length },
          { label: "Available Quizzes", value: topics.length },
          { label: "Completed",         value: topics.filter((t) => t.completed).length },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ flex: "1", minWidth: 120, textAlign: "center", padding: "1.1rem" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 700, color: "var(--accent)" }}>{value}</div>
            <div style={{ color: "var(--text-2)", fontSize: "0.82rem", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Topics Grid: Responsive three-card layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem",
        width: "100%",
        alignItems: "stretch",
      }}>
        {topics.map((topic, i) => (
          <TopicCard
            key={topic.id || topic._id || i}
            topic={topic}
            onStart={handleStart}
            style={{ animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </div>
    </div>
  );
}
