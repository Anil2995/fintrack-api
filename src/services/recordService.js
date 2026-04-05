const Record = require("../models/Record");
const { AppError } = require("../utils/errorHandler");

// Builds a Mongo filter from query params. Kept separate so it's easy to
// add new filter types (e.g. amount range) without touching the handler logic.
const buildFilter = (query) => {
  const filter = {};

  if (query.type) filter.type = query.type;

  // If a specific category is given, do an exact-ish case-insensitive match.
  // If there's a search keyword instead, broaden it to check both category and notes.
  if (query.category) {
    filter.category = new RegExp(query.category, "i");
  } else if (query.search) {
    // $or lets us match the keyword in either field — helpful for a global search bar
    filter.$or = [
      { category: new RegExp(query.search, "i") },
      { notes:    new RegExp(query.search, "i") },
    ];
  }

  // Date range — both sides are optional, so we only add the fields that are present
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

    // Fetch records and total count in parallel — one less round-trip to Mongo
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

// Soft delete — sets the isDeleted flag rather than destroying the document.
// The pre-find hook in Record.js automatically hides these from every future query.
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
