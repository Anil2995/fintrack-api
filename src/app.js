const path      = require("path");
const express   = require("express");
const rateLimit = require("express-rate-limit");

const { errorHandler } = require("./utils/errorHandler");
const authRoutes       = require("./routes/authRoutes");
const userRoutes       = require("./routes/userRoutes");
const recordRoutes     = require("./routes/recordRoutes");
const dashboardRoutes  = require("./routes/dashboardRoutes");

const app = express();

app.use(express.json());

// Serve the interactive demo page at the root URL.
// express.static automatically serves index.html when someone hits "/"
app.use(express.static(path.join(__dirname, "public")));

// General rate limit — 100 requests per 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — please slow down and try again shortly." },
});

// Tighter limit for auth routes specifically (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please wait before trying again." },
});

app.use(generalLimiter);

// Health check — no auth needed, useful for uptime checks
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

app.use("/api/auth",      authLimiter, authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/records",   recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Catch-all for any API path not matched above
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// 4-arg signature is how Express identifies error-handling middleware
app.use(errorHandler);

module.exports = app;
