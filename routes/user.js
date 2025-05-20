const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const {
  saveChartFilters,
  getChartFilters
} = require("../controllers/userController");

router.post("/filters", ensureAuthenticated, saveChartFilters);
router.get("/filters", ensureAuthenticated, getChartFilters);

module.exports = router;
