const Record = require("../models/Record");

// Main dashboard summary — totals, balance, category breakdown, recent entries
const getSummary = async (req, res, next) => {
  try {
    // Total income and expense using MongoDB aggregation
    const totals = await Record.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const income = totals.find((t) => t._id === "income")?.total || 0;
    const expense = totals.find((t) => t._id === "expense")?.total || 0;

    // Category-wise totals
    const byCategory = await Record.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // 5 most recent records
    const recentActivity = await Record.find()
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      summary: {
        totalIncome: income,
        totalExpense: expense,
        netBalance: income - expense,
      },
      categoryBreakdown: byCategory.map((item) => ({
        type: item._id.type,
        category: item._id.category,
        total: item.total,
        count: item.count,
      })),
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

// Monthly trend — grouped by year + month for the past 12 months
const getMonthlyTrends = async (req, res, next) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const trends = await Record.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Reshape into a clean format per month
    const monthMap = {};
    trends.forEach(({ _id, total, count }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
      if (!monthMap[key]) {
        monthMap[key] = { month: key, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
      }
      monthMap[key][_id.type] = total;
      monthMap[key][`${_id.type}Count`] = count;
    });

    res.status(200).json({
      success: true,
      trends: Object.values(monthMap),
    });
  } catch (error) {
    next(error);
  }
};

// Weekly trend — last 8 weeks grouped by ISO week
const getWeeklyTrends = async (req, res, next) => {
  try {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const trends = await Record.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: eightWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$date" },
            week: { $isoWeek: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const weekMap = {};
    trends.forEach(({ _id, total }) => {
      const key = `${_id.year}-W${String(_id.week).padStart(2, "0")}`;
      if (!weekMap[key]) weekMap[key] = { week: key, income: 0, expense: 0 };
      weekMap[key][_id.type] = total;
    });

    res.status(200).json({
      success: true,
      trends: Object.values(weekMap),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getMonthlyTrends, getWeeklyTrends };
