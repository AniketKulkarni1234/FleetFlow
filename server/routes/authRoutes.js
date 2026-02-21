// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { loginUser, registerUser, getProfile, changePassword } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, changePassword);

module.exports = router;