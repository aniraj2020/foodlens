const express = require("express");
const router = express.Router();
const { ensureAdmin } = require("../middleware/auth");
const { showAllUsers } = require("../controllers/adminController");

// Route: /admin-panel
router.get("/admin-panel", ensureAdmin, showAllUsers);

module.exports = router;
