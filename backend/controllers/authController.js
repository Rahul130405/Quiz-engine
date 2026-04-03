const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

/**
 * POST /api/auth/register
 * Create a new user account
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already used
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, totalScore: 0 },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * POST /api/auth/login
 * Authenticate with email + password, return JWT
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it has `select: false` in schema)
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        totalScore: user.totalScore,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/auth/me
 * Return current authenticated user
 */
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * POST /api/auth/forgot-password
 * Check if user exists for password reset
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist" });
    }
    // In a real app, send a reset token via email here.
    res.json({ message: "User verified. You can now reset your password." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/reset-password
 * Reset user password directly (simplified for demo)
 */
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.password = password;
    await user.save();
    res.json({ message: "Password reset successful. Please login with your new password." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
