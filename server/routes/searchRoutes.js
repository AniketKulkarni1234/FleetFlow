// server/routes/searchRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { globalSearch } = require("../controllers/searchController");

router.get("/", verifyToken, globalSearch);

module.exports = router;
