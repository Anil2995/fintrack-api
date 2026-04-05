const Record = require("../models/Record");

// Top-level summary: income vs expense totals + net balance + category breakdown + recent 5 entries
const getSummary = async (req, res, next) => {
  try {
    // Group by type in one aggregation pass — cheaper than two separate queries
    const typeTotals = await Record.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);

    const income  = typeTotals.find(t => t._id === "income")?.total  || 0;
    const expense = typeTotals.find(t => t._id === "expense")?.total || 0;

    const byCategory = await Record.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id:   { type: "$type", category: "$category" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const recent = await Record.find()
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name");

    res.json({
      success: true,
      summary: {
        totalIncome:  income,
        totalExpense: expense,
        netBalance:   income - expense,
      },
      categoryBreakdown: byCategory.map(b => ({
        type:     b._id.type,
        category: b._id.category,
        total:    b.total,
        count:    b.count,
      })),
      recentActivity: recent,
    });
  } catch (err) {
    next(err);
  }
};

// Monthly trends — last 12 full months
const getMonthlyTrends = async (req, res, next) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const rows = await Record.aggregate([
      { $match: { isDeleted: false, date: { $gte: since } } },
      {
        $group: {
          _id: {
            year:  { $year: "$date" },
            month: { $month: "$date" },
            type:  "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Merge income and expense rows that share the same year-month key
    const months = {};
    rows.forEach(({ _id, total, count }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
      if (!months[key]) {
        months[key] = { month: key, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
      }
      months[key][_id.type]           = total;
      months[key][`${_id.type}Count`] = count;
    });

    res.json({ success: true, trends: Object.values(months) });
  } catch (err) {
    next(err);
  }
};

// Weekly trends — last 8 weeks using ISO week numbers
const getWeeklyTrends = async (req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 56);

    const rows = await Record.aggregate([
      { $match: { isDeleted: false, date: { $gte: since } } },
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

    const weeks = {};
    rows.forEach(({ _id, total }) => {
      const key = `${_id.year}-W${String(_id.week).padStart(2, "0")}`;
      if (!weeks[key]) weeks[key] = { week: key, income: 0, expense: 0 };
      weeks[key][_id.type] = total;
    });

    res.json({ success: true, trends: Object.values(weeks) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getMonthlyTrends, getWeeklyTrends };
