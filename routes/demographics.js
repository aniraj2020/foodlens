const express = require('express');
const router = express.Router();
const { getDemographicsData } = require('../controllers/demographicsController');

// Route: GET /api/demographics
router.get('/', getDemographicsData);

module.exports = router;
