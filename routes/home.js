const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const { showHomePage } = require("../controllers/homeController");

router.get("/", ensureAuthenticated, showHomePage);

module.exports = router;
