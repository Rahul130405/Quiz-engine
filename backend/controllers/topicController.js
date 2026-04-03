const Topic = require("../models/Topic");
const User = require("../models/User");
const { getTopicsWithStatus } = require("../algorithms/graph");

/** GET /api/topics — All topics with user's unlock status */
const getTopics = async (req, res) => {
  try {
    // Sort by 'order' field directly from DB
    const topics = await Topic.find().sort({ order: 1 }).populate("prerequisites", "name").lean();

    // Attach unlock status if user is authenticated
    let result = topics;
    if (req.user) {
      const user = await User.findById(req.user._id);
      result = getTopicsWithStatus(
        topics.map((t) => ({
          toObject: () => t,
          ...t,
          prerequisites: t.prerequisites || [],
        })),
        user.progress
      );
    }

    res.json({ topics: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/topics/:id */
const getTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate("prerequisites");
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json({ topic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /api/topics (admin) */
const createTopic = async (req, res) => {
  try {
    const topic = await Topic.create(req.body);
    res.status(201).json({ topic });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** PUT /api/topics/:id (admin) */
const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json({ topic });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** DELETE /api/topics/:id (admin) */
const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json({ message: "Topic deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTopics, getTopic, createTopic, updateTopic, deleteTopic };
