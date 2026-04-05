const express = require("express");
const { errorHandler } = require("./utils/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const recordRoutes = require("./routes/recordRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Parse incoming JSON bodies
app.use(express.json());

// Health check — useful for deployment/testing
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running." });
});

// Mount route groups
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Central error handler — must be last middleware
app.use(errorHandler);

module.exports = app;
