const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../services/userService");
const { protect, restrictTo } = require("../middleware/auth");
const { updateUserRules, validate } = require("../middleware/validate");

// All user management routes require login + admin role
router.use(protect, restrictTo("admin"));

// GET  /api/users          — list all users
// GET  /api/users/:id      — get one user
// PUT  /api/users/:id      — update role or active status
// DELETE /api/users/:id    — permanently delete a user

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUserRules, validate, updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
