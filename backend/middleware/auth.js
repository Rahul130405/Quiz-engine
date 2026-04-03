const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect middleware — verifies JWT from Authorization header.
 * Attaches the decoded user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authorized — no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user (without password) to request
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ error: "User not found" });

    next();
  } catch (err) {
    return res.status(401).json({ error: "Not authorized — invalid token" });
  }
};

/**
 * Admin-only middleware — must be used after `protect`.
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

/**
 * Generate a signed JWT for a user.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = { protect, adminOnly, generateToken };
