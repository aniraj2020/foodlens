// controllers/adminController.js
const User = require("../models/User");

// Show all users to admin
const showAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "username role lastActivity lastFilters").sort({ role: 1 });
    res.render("admin_users", { user: req.user, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Server Error");
  }
};

// Clear a user's history (filters + activity)
const clearUserHistory = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ message: "User ID required" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (user.username === 'adminuser') {
      return res.status(403).send("You cannot modify the super admin.");
    }

    user.lastFilters = {};
    user.lastActivity = null;
    await user.save();

    res.redirect("/admin-panel");
  } catch (err) {
    console.error("Error clearing user history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleUserRole = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    if (user.username === 'adminuser') {
      return res.status(403).send("You cannot modify the super admin.");
    }

    user.role = user.role === "admin" ? "user" : "admin";
    await user.save();

    res.redirect("/admin-panel");
  } catch (err) {
    console.error("Error toggling user role:", err);
    res.status(500).send("Failed to update user role");
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    if (user.username === 'adminuser') {
      return res.status(403).send("You cannot delete the super admin.");
    }

    await User.findByIdAndDelete(userId);
    res.redirect("/admin-panel");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Failed to delete user");
  }
};

module.exports = {
  showAllUsers,
  clearUserHistory,
  toggleUserRole,
  deleteUser
};
