const express = require("express");

const { getAllUsers, getUserById, updateUser, deleteUser } = require("../services/userService");
const { protect, restrictTo }                             = require("../middleware/auth");
const { updateUserRules, validate }                       = require("../middleware/validate");

const router = express.Router();

// All user management is admin-only — apply guards at the router level
router.use(protect, restrictTo("admin"));

router.get("/",       getAllUsers);
router.get("/:id",    getUserById);
router.put("/:id",    updateUserRules, validate, updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
