// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { loginUser, registerUser, getProfile, changePassword, getUsers, deleteUser } = require("../controllers/authController");
const { requireRole } = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, changePassword);
router.get("/users", verifyToken, requireRole("Manager"), getUsers);
router.delete("/users/:id", verifyToken, requireRole("Manager"), deleteUser);

module.exports = router;