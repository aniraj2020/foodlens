const User = require("../models/User");

async function showHomePage(req, res) {
  try {
    const user = await User.findById(req.user._id);
    const toast = req.session.toastMessage || null;
    delete req.session.toastMessage;
    res.render("home", { user, welcomeMessage: toast });
  } catch (err) {
    console.error("Error loading home:", err);
    res.redirect("/login");
  }
}

module.exports = { showHomePage };
