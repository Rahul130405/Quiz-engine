const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

/** GET /api/users/me/progress — full progress map */
router.get("/me/progress", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const progressObj = {};
    user.progress.forEach((val, key) => { progressObj[key] = val; });
    res.json({ progress: progressObj, totalScore: user.totalScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/users/me — update profile */
router.put("/me", protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
