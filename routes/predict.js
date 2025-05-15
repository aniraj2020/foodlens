const express = require("express");
const router = express.Router();
const { getPredictionData } = require("../controllers/predictController");

// Route should pass a *function*
router.get("/", getPredictionData);

module.exports = router;
