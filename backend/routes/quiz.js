const express = require("express");
const router = express.Router();
const { startQuiz, submitQuiz, recordAttempt, getHistory } = require("../controllers/quizController");
const { protect } = require("../middleware/auth");

router.post("/start",          protect, startQuiz);
router.post("/submit",         protect, submitQuiz);
router.post("/record-attempt", protect, recordAttempt);
router.get("/history",         protect, getHistory);

module.exports = router;
