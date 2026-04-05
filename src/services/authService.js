const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("../utils/errorHandler");

// Kept this private — only the functions in this file should be minting tokens
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Both register and login return the exact same shape so the client
// doesn't need branching logic on its side
const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:       user._id,
      name:     user.name,
      email:    user.email,
      role:     user.role,
      isActive: user.isActive,
    },
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    sendAuthResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // password has select:false on the schema, so we must ask for it explicitly
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      // Deliberately vague message — don't tell attackers which field was wrong
      return next(new AppError("Invalid email or password.", 401));
    }

    if (!user.isActive) {
      return next(new AppError("This account has been deactivated.", 403));
    }

    sendAuthResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// Just reads off req.user — the protect middleware already fetched it
const getMe = (req, res) => {
  res.json({
    success: true,
    user: {
      id:       req.user._id,
      name:     req.user.name,
      email:    req.user.email,
      role:     req.user.role,
      isActive: req.user.isActive,
    },
  });
};

module.exports = { register, login, getMe };
