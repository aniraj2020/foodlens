const express = require("express");
const router = express.Router();
const {
  getDistinctValues,
  getTrendData
} = require("../controllers/trendsController");

// Endpoint 1: Get distinct values for checkboxes
router.get("/values", getDistinctValues);

// Endpoint 2: Get trend data for selected demographic values
router.get("/", getTrendData);

module.exports = router;
