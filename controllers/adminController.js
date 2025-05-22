const User = require("../models/User");
createCsvWriter = require("csv-writer").createObjectCsvStringifier;

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

// CSV export route
const exportUserCSV = async (req, res) => {
  try {
    //for timestamping in extported files
    const now = new Date();
    const stamptime = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    const users = await User.find({}, "username role lastActivity lastFilters createdAt").lean(); 

    const csvWriter = createCsvWriter({
      header: [
        { id: "username", title: "Username" },
        { id: "role", title: "Role" },
        { id: "chart", title: "Last Chart" },
        { id: "filters", title: "Filters" },
        { id: "timestamp", title: "Last Active At" },
        { id: "createdAt", title: "Created At" }
      ]
    });

    const records = users.map(u => ({
      username: u.username,
      role: u.role,
      chart: u.lastActivity?.chart || "",
      filters: JSON.stringify(u.lastFilters?.[u.lastActivity?.chart] || {}),
      timestamp: u.lastActivity?.timestamp
        ? new Date(u.lastActivity.timestamp).toLocaleString()
        : "",
      createdAt: u.createdAt
        ? new Date(u.createdAt).toLocaleString()
        : ""
    }));

    const csvContent = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=user_activity_logs_${stamptime}.csv`);
    res.send(csvContent);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    res.status(500).send("Failed to generate CSV");
  }
};

module.exports = {
  showAllUsers,
  clearUserHistory,
  toggleUserRole,
  deleteUser,
  exportUserCSV
};
