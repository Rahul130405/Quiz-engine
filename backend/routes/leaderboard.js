const express = require("express");
const router = express.Router();
const { getGlobalLeaderboard, getTopicLeaderboard } = require("../controllers/leaderboardController");
const { protect } = require("../middleware/auth");

router.get("/",              protect, getGlobalLeaderboard);
router.get("/topic/:topicId", protect, getTopicLeaderboard);

module.exports = router;
