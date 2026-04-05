const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("../utils/errorHandler");

// Middleware that checks the Bearer token, verifies it,
// then attaches the user doc to req.user so handlers downstream don't have to query again
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Please log in to access this resource.", 401));
    }

    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      // Token was valid but the account got deleted — edge case worth handling
      return next(new AppError("Account no longer exists.", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Your account has been deactivated.", 403));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Returns a middleware that checks whether req.user.role is in the allowed list.
// Letting it accept spread args means you can do restrictTo("analyst", "admin") cleanly.
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You don't have permission to do that.", 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
