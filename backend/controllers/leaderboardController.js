const User = require("../models/User");
const QuizAttempt = require("../models/QuizAttempt");
const { sortLeaderboard } = require("../algorithms/sorting");

/**
 * GET /api/leaderboard
 * Global leaderboard sorted by totalScore desc
 */
const getGlobalLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const users = await User.find({}, "name totalScore avatar createdAt").lean();

    // Use our sorting algorithm (not relying solely on DB sorting)
    const sorted = sortLeaderboard(
      users.map((u) => ({ ...u, score: u.totalScore }))
    ).slice(0, limit);

    // Add rank
    const ranked = sorted.map((u, i) => ({ ...u, rank: i + 1 }));

    res.json({ leaderboard: ranked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/leaderboard/topic/:topicId
 * Per-topic leaderboard — best score per user
 */
const getTopicLeaderboard = async (req, res) => {
  try {
    const { topicId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    // Aggregate best attempt per user for this topic
    const results = await QuizAttempt.aggregate([
      { $match: { topicId: require("mongoose").Types.ObjectId(topicId) } },
      { $sort: { score: -1 } },
      {
        $group: {
          _id: "$userId",
          bestScore: { $max: "$score" },
          attempts: { $sum: 1 },
          bestPercentage: { $max: "$percentage" },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          score: "$bestScore",
          percentage: "$bestPercentage",
          attempts: 1,
        },
      },
    ]);

    const ranked = results.map((r, i) => ({ ...r, rank: i + 1 }));
    res.json({ leaderboard: ranked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getGlobalLeaderboard, getTopicLeaderboard };
