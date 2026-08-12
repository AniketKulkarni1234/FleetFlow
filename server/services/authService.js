// server/services/authService.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

class AuthService {
  async register({ name, email, password, role }) {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      const err = new Error("An account with this email already exists");
      err.statusCode = 409;
      throw err;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role,
    });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      token,
      role: user.role,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      const err = new Error("Current password is incorrect");
      err.statusCode = 400;
      throw err;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return { msg: "Password changed successfully" };
  }

  async getAllUsers() {
    return await User.find().select("-password").sort({ createdAt: -1 });
  }

  async deleteUser(targetUserId, requesterId) {
    const user = await User.findById(targetUserId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    if (user._id.toString() === requesterId) {
      const err = new Error("Cannot delete your own account");
      err.statusCode = 400;
      throw err;
    }

    await User.findByIdAndDelete(targetUserId);
    return { msg: "User removed successfully" };
  }
}

module.exports = new AuthService();
