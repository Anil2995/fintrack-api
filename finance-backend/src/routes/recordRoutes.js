const express = require("express");
const router = express.Router();

const {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} = require("../services/recordService");
const { protect, restrictTo } = require("../middleware/auth");
const { recordRules, validate } = require("../middleware/validate");

// All record routes require a valid JWT
router.use(protect);

// GET /api/records          — all roles can view
// GET /api/records/:id      — all roles can view
router.get("/", getAllRecords);
router.get("/:id", getRecordById);

// POST /api/records         — analyst + admin only
router.post("/", restrictTo("analyst", "admin"), recordRules, validate, createRecord);

// PUT  /api/records/:id     — analyst + admin only
router.put("/:id", restrictTo("analyst", "admin"), recordRules, validate, updateRecord);

// DELETE /api/records/:id   — admin only
router.delete("/:id", restrictTo("admin"), deleteRecord);

module.exports = router;
