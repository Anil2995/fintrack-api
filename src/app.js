const express = require("express");

const { errorHandler } = require("./utils/errorHandler");
const authRoutes       = require("./routes/authRoutes");
const userRoutes       = require("./routes/userRoutes");
const recordRoutes     = require("./routes/recordRoutes");
const dashboardRoutes  = require("./routes/dashboardRoutes");

const app = express();

app.use(express.json());

// Super handy during deployment — curl /health and you know the app is alive
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/records",   recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Catch-all for routes we haven't defined
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Error handler must be the very last middleware — the 4-arg signature is how Express knows it's an error handler
app.use(errorHandler);

module.exports = app;
