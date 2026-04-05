const User = require("../models/User");
const { AppError } = require("../utils/errorHandler");

// Get all users — admin only
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID — admin only
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return next(new AppError("User not found.", 404));

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Update a user's role or active status — admin only
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    // Admins cannot deactivate or change their own role
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError("Admins cannot modify their own account.", 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return next(new AppError("User not found.", 404));

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Delete a user — admin only
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError("Admins cannot delete their own account.", 400));
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    res.status(200).json({ success: true, message: "User deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
