const express = require("express");
const router = express.Router();
const { ensureAdmin } = require("../middleware/auth");
const { showAllUsers, 
    clearUserHistory,
    toggleUserRole,
    deleteUser,
    exportUserCSV
} = require("../controllers/adminController");

// Route: /admin-panel
router.get("/admin-panel", ensureAdmin, showAllUsers);

// POST: Clear a specific user's history
router.post("/admin/clear-user-history", ensureAdmin, clearUserHistory);

// POST: Promote/Demote a user
router.post("/admin/toggle-role", ensureAdmin, toggleUserRole);
router.post("/admin/delete-user", ensureAdmin, deleteUser);

// Export User Activity Logs as CSV
router.get("/admin/export-csv", ensureAdmin, exportUserCSV);

module.exports = router;
