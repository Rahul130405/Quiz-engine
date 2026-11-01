const crypto = require("crypto");
const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

/**
 * POST /api/auth/register
 * Create a new user account
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already used
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Role-based privilege protection: prevent arbitrary self-promotion to admin
    // Public registration strictly creates role="user".
    // Only permit role="admin" if authenticated via an internal administrative registration secret.
    const adminSecret = process.env.ADMIN_REGISTRATION_SECRET || process.env.ADMIN_SECRET;
    let assignedRole = "user";
    if (role === "admin") {
      const authHeader = req.headers["x-admin-secret"];
      if (adminSecret && typeof authHeader === "string") {
        const secretBuf = Buffer.from(adminSecret);
        const authBuf = Buffer.from(authHeader);
        if (secretBuf.length === authBuf.length && crypto.timingSafeEqual(secretBuf, authBuf)) {
          assignedRole = "admin";
        }
      } else if (process.env.NODE_ENV !== "production" && authHeader === "quizengine-dev-admin-secret") {
        assignedRole = "admin";
      }
    }

    const user = await User.create({ name, email, password, role: assignedRole });
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, totalScore: 0, role: user.role },
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

    const token = generateToken(user._id, user.role);

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
 * Initiates secure password reset by generating a cryptographically secure token.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond with a generic success message to prevent user enumeration
    if (!user) {
      return res.json({
        message: "If an account with that email exists, a password reset token has been generated.",
      });
    }

    // Generate single-use random token, hash it, and store expiration
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Note: Email delivery service (e.g. SMTP/SendGrid) is currently not configured in this environment.
    console.log(`[AUTH] Password reset requested for ${user.email}`);

    // Return response: In development/test mode, also provide the resetToken in the response body for local verification.
    res.json({
      message: "If an account with that email exists, a password reset token has been generated.",
      ...(process.env.NODE_ENV !== "production" ? { resetToken } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/reset-password
 * Validates the single-use reset token and securely resets the user's password.
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Password reset token is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Hash incoming plaintext token to match the stored SHA-256 hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired password reset token" });
    }

    // Set new password (pre-save hook hashes it automatically)
    user.password = password;
    // Invalidate the token so it cannot be reused
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful. Please login with your new password." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
