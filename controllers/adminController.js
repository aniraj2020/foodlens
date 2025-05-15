// controllers/adminController.js
const User = require("../models/User");

// Show all users to admin
const showAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "username role").sort({ role: 1 });
    res.render("admin_users", { user: req.user, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  showAllUsers
};
