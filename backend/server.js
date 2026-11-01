/**
 * QuizEngine - Main Server Entry Point
 * Configures Express app, middleware, routes, and DB connection
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

// Validate critical security environment variables on startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "") {
  console.error("FATAL: JWT_SECRET environment variable is missing. Node.js backend cannot start without an authoritative JWT secret.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET === "change_this_in_production_please") {
  console.error("FATAL: Insecure fallback JWT_SECRET detected in production environment.");
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5001",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logger (dev only)
if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/users",     require("./routes/users"));
app.use("/api/questions", require("./routes/questions"));
app.use("/api/topics",    require("./routes/topics"));
app.use("/api/quiz",      require("./routes/quiz"));
app.use("/api/leaderboard", require("./routes/leaderboard"));

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 QuizEngine server running on http://localhost:${PORT}`);
});
