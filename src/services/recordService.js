const Record = require("../models/Record");
const { AppError } = require("../utils/errorHandler");

// Pulls filter params off the query string and builds a Mongo filter object.
// Separated out so it's easy to unit test and extend later.
const buildFilter = (query) => {
  const filter = {};

  if (query.type)     filter.type     = query.type;
  if (query.category) filter.category = new RegExp(query.category, "i"); // case-insensitive match

  // Date range filtering — one or both sides can be provided
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate)   filter.date.$lte = new Date(query.endDate);
  }

  return filter;
};

const getAllRecords = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    // Run count and data fetch together — saves one round-trip vs sequential awaits
    const [records, total] = await Promise.all([
      Record.find(filter)
        .populate("createdBy", "name email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Record.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      records,
    });
  } catch (err) {
    next(err);
  }
};

const getRecordById = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id).populate("createdBy", "name email");
    if (!record) return next(new AppError("Record not found.", 404));
    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body;
    const record = await Record.create({
      amount,
      type,
      category,
      date,
      notes,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body;
    const record = await Record.findByIdAndUpdate(
      req.params.id,
      { amount, type, category, date, notes },
      { new: true, runValidators: true }
    );
    if (!record) return next(new AppError("Record not found.", 404));
    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

// Soft delete — flips isDeleted instead of removing the document.
// The pre-find hook in Record.js hides these from all future queries automatically.
const deleteRecord = async (req, res, next) => {
  try {
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!record) return next(new AppError("Record not found.", 404));
    res.json({ success: true, message: "Record deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRecords, getRecordById, createRecord, updateRecord, deleteRecord };
