require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/Question");
const Topic = require("./models/Topic");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

const questions = [
  { text: "What is the time complexity of Binary Search in the worst case?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctAnswer: 1, difficulty: "easy", explanation: "Binary search halves the search space each time → O(log n).", timeLimitSeconds: 20 },
  { text: "Which algorithm is used to find the minimum spanning tree?", options: ["Dijkstra", "Prim’s Algorithm", "Bellman-Ford", "Floyd-Warshall"], correctAnswer: 1, difficulty: "easy", explanation: "Prim’s is a greedy algorithm for MST.", timeLimitSeconds: 20 },
  { text: "What is the worst-case time complexity of Quick Sort?", options: ["O(n log n)", "O(n²)", "O(log n)", "O(n)"], correctAnswer: 1, difficulty: "medium", explanation: "Worst case occurs when pivot is poorly chosen.", timeLimitSeconds: 30 },
  { text: "Which data structure is used in BFS?", options: ["Stack", "Queue", "Heap", "Tree"], correctAnswer: 1, difficulty: "easy", explanation: "BFS uses a queue (FIFO).", timeLimitSeconds: 20 },
  { text: "Which algorithm solves the single-source shortest path problem?", options: ["Kruskal", "Prim", "Dijkstra", "DFS"], correctAnswer: 2, difficulty: "easy", explanation: "Dijkstra's algorithm finds the shortest path from a source to all other nodes.", timeLimitSeconds: 25 },
  { text: "Which method is used to solve recurrence relations?", options: ["Greedy method", "Master theorem", "Backtracking", "Branch and Bound"], correctAnswer: 1, difficulty: "medium", explanation: "Master theorem is a formulaic way to solve divide-and-conquer recurrences.", timeLimitSeconds: 30 },
  { text: "Which algorithm is used for string matching?", options: ["Kruskal", "Rabin-Karp", "Prim", "Dijkstra"], correctAnswer: 1, difficulty: "easy", explanation: "Rabin-Karp uses hashing to find a pattern in text.", timeLimitSeconds: 25 },
  { text: "What is the time complexity of Merge Sort?", options: ["O(n²)", "O(n log n)", "O(log n)", "O(n)"], correctAnswer: 1, difficulty: "easy", explanation: "Merge sort always takes O(n log n) because it always divides and merges.", timeLimitSeconds: 25 },
  { text: "Which algorithm uses dynamic programming?", options: ["Binary Search", "Fibonacci (DP approach)", "BFS", "DFS"], correctAnswer: 1, difficulty: "medium", explanation: "Fibonacci with memoization or tabulation is a classic DP example.", timeLimitSeconds: 25 },
  { text: "Which problem is solved using backtracking?", options: ["Dijkstra", "N-Queen Problem", "Prim", "Kruskal"], correctAnswer: 1, difficulty: "medium", explanation: "N-Queen explores all possible placements and backtracks on failure.", timeLimitSeconds: 30 },
  { text: "What is the best case complexity of Quick Sort?", options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"], correctAnswer: 1, difficulty: "medium", explanation: "Best case occurs when the pivot always divides the array into two equal halves.", timeLimitSeconds: 30 },
  { text: "Which algorithm is used for all-pairs shortest path?", options: ["Dijkstra", "Bellman-Ford", "Floyd-Warshall", "Prim"], correctAnswer: 2, difficulty: "medium", explanation: "Floyd-Warshall is a DP algorithm for all-pairs shortest path.", timeLimitSeconds: 30 },
  { text: "Which technique is used in Huffman Coding?", options: ["Divide and Conquer", "Greedy", "Backtracking", "Dynamic Programming"], correctAnswer: 1, difficulty: "easy", explanation: "Huffman coding uses a greedy strategy to build an optimal prefix tree.", timeLimitSeconds: 25 },
  { text: "Which sorting algorithm works in linear time?", options: ["Quick Sort", "Merge Sort", "Counting Sort", "Heap Sort"], correctAnswer: 2, difficulty: "easy", explanation: "Counting sort is a non-comparison sort that runs in O(n+k) time.", timeLimitSeconds: 25 },
  { text: "Which algorithm is used in Topological Sorting?", options: ["BFS", "DFS", "Both BFS and DFS", "None"], correctAnswer: 2, difficulty: "medium", explanation: "Topological sort can be implemented using both BFS (Kahn's) and DFS.", timeLimitSeconds: 25 },
  { text: "What is the time complexity of DFS?", options: ["O(V + E)", "O(V²)", "O(E²)", "O(log n)"], correctAnswer: 0, difficulty: "medium", explanation: "DFS visits every vertex and edge once.", timeLimitSeconds: 25 },
  { text: "Which problem is NP-Complete?", options: ["Binary Search", "Sorting", "Travelling Salesman Problem", "BFS"], correctAnswer: 2, difficulty: "hard", explanation: "TSP is a classic NP-Complete optimization problem.", timeLimitSeconds: 35 },
  { text: "Which algorithm is used for pattern matching efficiently?", options: ["KMP Algorithm", "Prim", "Kruskal", "Dijkstra"], correctAnswer: 0, difficulty: "medium", explanation: "KMP avoids redundant comparisons by using a prefix function.", timeLimitSeconds: 30 },
  { text: "Which technique is used in 0/1 Knapsack?", options: ["Greedy", "Dynamic Programming", "Divide and Conquer", "Backtracking"], correctAnswer: 1, difficulty: "medium", explanation: "0/1 Knapsack is typically solved using dynamic programming.", timeLimitSeconds: 30 },
  { text: "What is the purpose of hashing?", options: ["Sorting", "Searching efficiently", "Graph traversal", "Recursion"], correctAnswer: 1, difficulty: "easy", explanation: "Hashing provides O(1) average-case time for searching.", timeLimitSeconds: 20 },
];

async function addQuestions() {
  try {
    await mongoose.connect(MONGO_URI);
    const topic = await Topic.findOne({ name: /DAA/i });
    if (!topic) throw new Error("DAA topic not found");

    const questionsWithTopic = questions.map(q => ({ ...q, topicId: topic._id }));
    await Question.insertMany(questionsWithTopic);
    console.log("✅ Successfully added 20 DAA questions!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

addQuestions();
