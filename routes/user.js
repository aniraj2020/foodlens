const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const {
  saveChartFilters,
  getChartFilters, 
  clearHistory
} = require("../controllers/userController");

router.post("/filters", ensureAuthenticated, saveChartFilters);
router.get("/filters", ensureAuthenticated, getChartFilters);
router.post("/clear-history", ensureAuthenticated, clearHistory);

module.exports = router;
