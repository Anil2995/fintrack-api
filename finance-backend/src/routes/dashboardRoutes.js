const express = require("express");
const router = express.Router();

const {
  getSummary,
  getMonthlyTrends,
  getWeeklyTrends,
} = require("../services/dashboardService");
const { protect, restrictTo } = require("../middleware/auth");

// All dashboard routes require login — viewer is blocked
router.use(protect, restrictTo("analyst", "admin"));

// GET /api/dashboard/summary        — totals, balance, category breakdown, recent
// GET /api/dashboard/trends/monthly — last 12 months grouped by month
// GET /api/dashboard/trends/weekly  — last 8 weeks grouped by ISO week

router.get("/summary", getSummary);
router.get("/trends/monthly", getMonthlyTrends);
router.get("/trends/weekly", getWeeklyTrends);

module.exports = router;
