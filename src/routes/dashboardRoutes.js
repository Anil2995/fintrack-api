const express = require("express");

const { getSummary, getMonthlyTrends, getWeeklyTrends } = require("../services/dashboardService");
const { protect, restrictTo }                           = require("../middleware/auth");

const router = express.Router();

// Dashboard analytics are analyst+ only — viewers just see the record list
router.use(protect, restrictTo("analyst", "admin"));

router.get("/summary",        getSummary);
router.get("/trends/monthly", getMonthlyTrends);
router.get("/trends/weekly",  getWeeklyTrends);

module.exports = router;
