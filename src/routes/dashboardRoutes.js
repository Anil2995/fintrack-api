const express = require("express");

const { getSummary, getMonthlyTrends, getWeeklyTrends } = require("../services/dashboardService");
const { protect, restrictTo }                           = require("../middleware/auth");

const router = express.Router();

// All dashboard routes need a valid login
router.use(protect);

// The assignment says viewers should be able to "view dashboard data",
// so the summary (income/expense/balance) is open to all roles.
// Deeper analytics like trends are analyst+ only since those are "insights".
router.get("/summary",        getSummary);
router.get("/trends/monthly", restrictTo("analyst", "admin"), getMonthlyTrends);
router.get("/trends/weekly",  restrictTo("analyst", "admin"), getWeeklyTrends);

module.exports = router;
