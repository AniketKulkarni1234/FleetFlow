// server/controllers/authController.js
const authService = require("../services/authService");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const VALID_ROLES = ["Manager", "Dispatcher", "Driver", "SafetyOfficer", "FinancialAnalyst"];

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ msg: "Name must be at least 2 characters" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: "Please provide a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ msg: "Invalid role specified" });
    }

    const newUser = await authService.register({ name, email, password, role });
    res.status(201).json(newUser);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "An account with this email already exists" });
    }
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const data = await authService.login({ email, password });
    res.json(data);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "New password must be at least 6 characters" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ msg: "New password must be different from current password" });
    }

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await authService.deleteUser(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};