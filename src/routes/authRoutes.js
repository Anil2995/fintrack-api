const express = require("express");

const { register, login, getMe } = require("../services/authService");
const { protect }                = require("../middleware/auth");
const { registerRules, loginRules, validate } = require("../middleware/validate");

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login",    loginRules,    validate, login);
router.get("/me",        protect,                 getMe);  // protected — must be logged in

module.exports = router;
