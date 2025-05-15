const express = require("express");
const router = express.Router();
const { getInsightTrends } = require("../controllers/insightController");

// GET /api/insight?category=...&group=...
router.get("/", getInsightTrends);

module.exports = router;
