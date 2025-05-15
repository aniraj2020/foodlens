const express = require("express");
const router = express.Router();
const { getInsecurityTypeDistribution } = require("../controllers/foodSecurityController");

// ✅ Route: GET /api/type → fetch food insecurity type distribution
router.get("/", getInsecurityTypeDistribution);

module.exports = router;
