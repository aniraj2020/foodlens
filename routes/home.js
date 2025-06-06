const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const { showHomePage } = require("../controllers/homeController");

router.get("/dashboard", ensureAuthenticated, showHomePage);

module.exports = router;
