const User = require("../models/User");
const { AppError } = require("../utils/errorHandler");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return next(new AppError("User not found.", 404));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    // Prevent self-modification through this endpoint — avoids accidental self-lockout scenarios
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError("Use /api/auth/me to update your own profile.", 400));
    }

    const { role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return next(new AppError("User not found.", 404));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError("You can't delete your own account.", 400));
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    res.json({ success: true, message: "User removed." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
