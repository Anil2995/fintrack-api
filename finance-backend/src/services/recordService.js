const Record = require("../models/Record");
const { AppError } = require("../utils/errorHandler");

// Build a MongoDB filter object from query params
const buildFilter = (query) => {
  const filter = {};

  if (query.type) filter.type = query.type;
  if (query.category) filter.category = new RegExp(query.category, "i");

  // Date range filtering
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) filter.date.$lte = new Date(query.endDate);
  }

  return filter;
};

// Get all records with optional filters + pagination
const getAllRecords = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Record.find(filter)
        .populate("createdBy", "name email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Record.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      records,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single record by ID
const getRecordById = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!record) return next(new AppError("Record not found.", 404));

    res.status(200).json({ success: true, record });
  } catch (error) {
    next(error);
  }
};

// Create a new financial record — analyst and admin only
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
  } catch (error) {
    next(error);
  }
};

// Update a record — analyst and admin only
const updateRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const record = await Record.findByIdAndUpdate(
      req.params.id,
      { amount, type, category, date, notes },
      { new: true, runValidators: true }
    );

    if (!record) return next(new AppError("Record not found.", 404));

    res.status(200).json({ success: true, record });
  } catch (error) {
    next(error);
  }
};

// Soft delete — marks isDeleted=true instead of removing from DB
const deleteRecord = async (req, res, next) => {
  try {
    // Bypass the default soft-delete filter to find the record first
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!record) return next(new AppError("Record not found.", 404));

    res.status(200).json({ success: true, message: "Record deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
};
