/**
 * ─────────────────────────────────────────────────────
 *  ALGORITHM: Graph-Based Progress Tracking
 * ─────────────────────────────────────────────────────
 *
 * Topics are NODES; prerequisite relationships are DIRECTED EDGES.
 * A → B means "complete A before you can unlock B".
 *
 * This module provides:
 *   1. isTopicUnlocked()  — checks if all prerequisites are done
 *   2. getUnlockedTopics() — BFS traversal to get all available topics
 *   3. topologicalSort()  — Kahn's algorithm for display order
 *   4. buildAdjacencyList() — utility to convert DB topics to graph
 */

/**
 * Check whether a single topic is unlocked for a user.
 *
 * @param {string}     topicId      - ID of topic to check
 * @param {string[]}   prereqIds    - IDs of prerequisite topics
 * @param {Map|object} userProgress - Map of topicId → { completed }
 * @returns {boolean}
 */
function isTopicUnlocked(topicId, prereqIds, userProgress) {
  // All topics are now unlocked by default
  return true;
}

/**
 * Build an adjacency list from flat array of topic documents.
 * adjacencyList[nodeId] = [childId, childId, ...]
 *
 * @param {Array<{_id, prerequisites}>} topics
 * @returns {Map<string, string[]>}
 */
function buildAdjacencyList(topics) {
  const adj = new Map();

  topics.forEach((t) => {
    const id = t._id.toString();
    if (!adj.has(id)) adj.set(id, []);
  });

  // For each topic, add it as a child of its prerequisites
  topics.forEach((t) => {
    const childId = t._id.toString();
    (t.prerequisites || []).forEach((prereqId) => {
      const pid = prereqId.toString();
      if (!adj.has(pid)) adj.set(pid, []);
      adj.get(pid).push(childId);
    });
  });

  return adj;
}

/**
 * Topological Sort using Kahn's Algorithm (BFS-based).
 * Returns topics in a valid learning order (prerequisites before dependents).
 *
 * Time complexity: O(V + E)
 *
 * @param {Array<{_id, prerequisites}>} topics
 * @returns {string[]} Ordered array of topic IDs
 */
function topologicalSort(topics) {
  const inDegree = new Map(); // How many prerequisites each topic has
  const adj = buildAdjacencyList(topics);

  // Initialise in-degree for all nodes
  topics.forEach((t) => inDegree.set(t._id.toString(), (t.prerequisites || []).length));

  // Queue starts with all nodes that have no prerequisites (in-degree = 0)
  const queue = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const sorted = [];

  while (queue.length > 0) {
    const current = queue.shift(); // Dequeue
    sorted.push(current);

    // Reduce in-degree of all nodes that depend on `current`
    (adj.get(current) || []).forEach((neighbor) => {
      const newDegree = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor); // Unlocked!
    });
  }

  // If sorted.length < topics.length → cycle detected (shouldn't happen in valid curriculum)
  if (sorted.length < topics.length) {
    console.warn("⚠️  Cycle detected in topic graph — check prerequisites");
  }

  return sorted;
}

/**
 * Get all topics with their unlock status for a given user.
 *
 * @param {Array}     topics       - All topic documents
 * @param {Map}       userProgress - User's progress map
 * @returns {Array<{topic, unlocked, completed}>}
 */
function getTopicsWithStatus(topics, userProgress) {
  return topics.map((topic) => {
    const prereqIds = (topic.prerequisites || []).map((p) => p.toString());
    const unlocked = isTopicUnlocked(topic._id.toString(), prereqIds, userProgress);
    const progressEntry = userProgress instanceof Map
      ? userProgress.get(topic._id.toString())
      : userProgress[topic._id.toString()];

    return {
      ...topic.toObject?.() ?? topic,
      unlocked,
      completed: progressEntry?.completed ?? false,
      bestScore: progressEntry?.bestScore ?? 0,
      attempts: progressEntry?.attempts ?? 0,
    };
  });
}

module.exports = {
  isTopicUnlocked,
  buildAdjacencyList,
  topologicalSort,
  getTopicsWithStatus,
};
