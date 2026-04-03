import React, { useRef, useState, useEffect } from "react";

/**
 * TopicGraph — SVG-based interactive directed graph.
 * Nodes = topics, Edges = prerequisite relationships (directed arrows).
 * Uses topics' position.x / position.y from the DB for layout.
 */
export default function TopicGraph({ topics, onTopicClick }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [pan,     setPan]     = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Build a map from id → topic for quick lookup
  const topicMap = new Map(topics.map((t) => [t._id, t]));

  // Collect all directed edges: { from: topic, to: topic }
  const edges = [];
  topics.forEach((topic) => {
    (topic.prerequisites || []).forEach((prereq) => {
      const fromTopic = topicMap.get(prereq._id || prereq);
      if (fromTopic) edges.push({ from: fromTopic, to: topic });
    });
  });

  // ── Pan handlers ─────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (e.target.closest(".topic-node")) return; // don't pan when clicking node
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  const NODE_W = 140;
  const NODE_H = 64;
  const ARROW_SIZE = 8;

  // Compute arrow endpoint that stops at node border
  const getEdgePoints = (from, to) => {
    const fx = from.position.x + NODE_W / 2;
    const fy = from.position.y + NODE_H / 2;
    const tx = to.position.x   + NODE_W / 2;
    const ty = to.position.y   + NODE_H / 2;

    const dx = tx - fx;
    const dy = ty - fy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    // End point pulled back to touch the node border
    const ex = tx - (dx / len) * (NODE_W / 2 + 6);
    const ey = ty - (dy / len) * (NODE_H / 2 + 6);

    return { x1: fx, y1: fy, x2: ex, y2: ey };
  };

  // Compute SVG viewBox to fit all nodes
  const minX = Math.min(...topics.map((t) => t.position.x)) - 40;
  const minY = Math.min(...topics.map((t) => t.position.y)) - 40;
  const maxX = Math.max(...topics.map((t) => t.position.x)) + NODE_W + 40;
  const maxY = Math.max(...topics.map((t) => t.position.y)) + NODE_H + 40;
  const viewW = maxX - minX;
  const viewH = maxY - minY;

  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      <p style={{ color: "var(--text-3)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
        Drag to pan • Click a node to start quiz
      </p>

      <svg
        ref={svgRef}
        width="100%"
        style={{
          height:     Math.max(400, viewH),
          cursor:     dragging ? "grabbing" : "grab",
          display:    "block",
          borderRadius: "var(--radius-sm)",
        }}
        viewBox={`${minX} ${minY} ${viewW} ${viewH}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <defs>
          {/* Arrowhead marker */}
          <marker
            id="arrow"
            markerWidth={ARROW_SIZE}
            markerHeight={ARROW_SIZE}
            refX={ARROW_SIZE - 1}
            refY={ARROW_SIZE / 2}
            orient="auto"
          >
            <path
              d={`M0,0 L0,${ARROW_SIZE} L${ARROW_SIZE},${ARROW_SIZE / 2} z`}
              fill="var(--border-2)"
            />
          </marker>
          <marker id="arrow-accent" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE}
            refX={ARROW_SIZE - 1} refY={ARROW_SIZE / 2} orient="auto">
            <path d={`M0,0 L0,${ARROW_SIZE} L${ARROW_SIZE},${ARROW_SIZE / 2} z`} fill="var(--accent)" />
          </marker>
        </defs>

        {/* Pan group */}
        <g transform={`translate(${pan.x}, ${pan.y})`}>
          {/* Draw edges first (behind nodes) */}
          {edges.map(({ from, to }, i) => {
            const { x1, y1, x2, y2 } = getEdgePoints(from, to);
            const isActive = from.completed;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? "var(--accent)" : "var(--border-2)"}
                strokeWidth={isActive ? 2 : 1.5}
                strokeDasharray={isActive ? "none" : "6 4"}
                markerEnd={isActive ? "url(#arrow-accent)" : "url(#arrow)"}
                opacity={0.8}
              />
            );
          })}

          {/* Draw nodes */}
          {topics.map((topic) => {
            const { _id, name, icon, color, unlocked, completed, position } = topic;
            const x = position.x;
            const y = position.y;

            const fill    = completed ? `${color}22` : unlocked ? "var(--bg-2)" : "var(--bg-3)";
            const stroke  = completed ? color : unlocked ? "var(--border-2)" : "var(--border)";
            const opacity = unlocked ? 1 : 0.5;

            return (
              <g
                key={_id}
                className="topic-node"
                transform={`translate(${x}, ${y})`}
                style={{ cursor: unlocked ? "pointer" : "not-allowed" }}
                opacity={opacity}
                onClick={() => onTopicClick(topic)}
                onMouseEnter={() => setTooltip({ topic, x: x + NODE_W / 2, y: y - 12 })}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Node body */}
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  ry={10}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={completed ? 2 : 1}
                />
                {/* Completed glow */}
                {completed && (
                  <rect width={NODE_W} height={NODE_H} rx={10} ry={10}
                    fill="none" stroke={color} strokeWidth={1} opacity={0.3}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                  />
                )}
                {/* Icon */}
                <text x={16} y={38} fontSize={20} dominantBaseline="middle">{icon}</text>
                {/* Name */}
                <text
                  x={44} y={32}
                  fontSize={12}
                  fontWeight={600}
                  fill={unlocked ? "var(--text)" : "var(--text-3)"}
                  fontFamily="var(--font-display)"
                >
                  {name.length > 14 ? name.slice(0, 14) + "…" : name}
                </text>
                {/* Status label */}
                <text x={44} y={48} fontSize={10} fill={completed ? color : "var(--text-3)"}>
                  {completed ? "✓ Completed" : unlocked ? "Click to start" : "🔒 Locked"}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && (
            <g transform={`translate(${tooltip.x - 80}, ${tooltip.topic.position.y - 60})`}>
              <rect width={160} height={48} rx={8} fill="var(--bg)" stroke="var(--border-2)" />
              <text x={80} y={18} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">
                {tooltip.topic.name}
              </text>
              <text x={80} y={34} textAnchor="middle" fontSize={10} fill="var(--text-2)">
                {tooltip.topic.completed ? `Best: ${tooltip.topic.bestScore} pts` : tooltip.topic.unlocked ? "Ready to start!" : "Complete prerequisites"}
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.75rem", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--text-2)" }}>
        {[
          { color: "var(--success)",  label: "Completed" },
          { color: "var(--accent)",   label: "Available" },
          { color: "var(--border-2)", label: "Dependency edge" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
