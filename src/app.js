const express   = require("express");
const rateLimit = require("express-rate-limit");

const { errorHandler } = require("./utils/errorHandler");
const authRoutes       = require("./routes/authRoutes");
const userRoutes       = require("./routes/userRoutes");
const recordRoutes     = require("./routes/recordRoutes");
const dashboardRoutes  = require("./routes/dashboardRoutes");

const app = express();

app.use(express.json());

// General limiter — 100 requests per 15 minutes per IP.
// Helps prevent scrapers and accidental hammering in development too.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — please slow down and try again shortly." },
});

// Tighter limit for auth routes — brute force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please wait before trying again." },
});

app.use(generalLimiter);

// Health check — confirms the process is alive without needing auth
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

app.use("/api/auth",      authLimiter, authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/records",   recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Anything not matched above
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// 4-argument signature is how Express identifies error-handling middleware
app.use(errorHandler);

module.exports = app;
