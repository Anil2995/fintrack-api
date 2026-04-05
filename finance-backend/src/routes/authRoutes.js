const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../services/authService");
const { protect } = require("../middleware/auth");
const {
  registerRules,
  loginRules,
  validate,
} = require("../middleware/validate");

// POST /api/auth/register
router.post("/register", registerRules, validate, register);

// POST /api/auth/login
router.post("/login", loginRules, validate, login);

// GET /api/auth/me  — requires valid JWT
router.get("/me", protect, getMe);

module.exports = router;
