const Question = require("../models/Question");
const { sortQuestionsByDifficulty, dynamicSort } = require("../algorithms/sorting");

/** GET /api/questions?topicId=&difficulty=&sort= */
const getQuestions = async (req, res) => {
  try {
    const { topicId, difficulty, sort = "difficulty" } = req.query;
    const filter = {};
    if (topicId) filter.topicId = topicId;
    if (difficulty) filter.difficulty = difficulty;

    let questions = await Question.find(filter).lean();

    // Apply requested sort
    if (sort === "difficulty") {
      questions = sortQuestionsByDifficulty(questions);
    } else if (sort === "newest") {
      questions = dynamicSort(questions, [{ field: "createdAt", order: "desc" }]);
    }

    res.json({ questions, count: questions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/questions/:id */
const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: "Question not found" });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /api/questions (admin) */
const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ question });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** POST /api/questions/bulk (admin) — create many at once */
const bulkCreateQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) return res.status(400).json({ error: "questions must be an array" });
    const created = await Question.insertMany(questions);
    res.status(201).json({ created: created.length, questions: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** PUT /api/questions/:id (admin) */
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!question) return res.status(404).json({ error: "Question not found" });
    res.json({ question });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** DELETE /api/questions/:id (admin) */
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ error: "Question not found" });
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getQuestions, getQuestion, createQuestion,
  bulkCreateQuestions, updateQuestion, deleteQuestion,
};
