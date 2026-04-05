const express = require("express");

const {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} = require("../services/recordService");
const { protect, restrictTo }   = require("../middleware/auth");
const { recordRules, validate } = require("../middleware/validate");

const router = express.Router();

// Every record route needs a logged-in user
router.use(protect);

// Viewers can read. Analysts+ can write. Only admins can delete.
router.get("/",       getAllRecords);
router.get("/:id",    getRecordById);
router.post("/",      restrictTo("analyst", "admin"), recordRules, validate, createRecord);
router.put("/:id",    restrictTo("analyst", "admin"), recordRules, validate, updateRecord);
router.delete("/:id", restrictTo("admin"),                                   deleteRecord);

module.exports = router;
