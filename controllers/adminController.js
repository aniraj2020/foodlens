const User = require("../models/User");
const UsageLog = require("../models/UsageLog");
createCsvWriter = require("csv-writer").createObjectCsvStringifier;

// Show all users to admin
const showAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1 } = req.query;
    const limit = 6;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) query.username = { $regex: new RegExp(search, "i") };
    if (role) query.role = role;

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query, "username role lastActivity lastFilters")
      .sort({ role: 1 })
      .skip(skip)
      .limit(limit);

    const toast = req.session.toastMessage || null;
    delete req.session.toastMessage;

    //Fetch usage stats
    const usageStats = await UsageLog.aggregate([
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    //Fetch latest 5 logs
    const recentLogs = await UsageLog.find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    res.render("admin_users", {
      title: "Admin Panel – User Management",
      user: req.user,
      users,
      role,
      search,
      page: parseInt(page),
      totalPages,
      toast,
      usageStats,
      recentLogs,
      // layout: false
    });

  } catch (err) {
    console.error("Error fetching users or usage stats:", err);
    res.status(500).send("Server Error");
  }
};

// Helper to rebuild admin-panel redirect with query
const buildRedirectURL = (base, query) => {
  const params = new URLSearchParams();
  if (query.search) params.append("search", query.search);
  if (query.role) params.append("role", query.role);
  if (query.page) params.append("page", query.page);
  return `${base}?${params.toString()}`;
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

    const hasActivity = user.lastActivity !== null;
    const hasFilters = user.lastFilters && Object.keys(user.lastFilters).length > 0;

    if (!hasActivity && !hasFilters) {
      req.session.toastMessage = "History already empty";
    } else {
      user.lastFilters = {};
      user.lastActivity = null;
      await user.save();
      req.session.toastMessage = "History cleared for user!";
    }

    res.redirect(buildRedirectURL('/admin-panel', req.body));

  } catch (err) {
    console.error("Error clearing user history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//promote/demote
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

    // If API request (Postman), return JSON
    if (req.headers.accept?.includes("application/json")) {
      return res.status(200).json({ message: "Role Updated", newRole: user.role });
    }
    
    req.session.toastMessage = "Role Updated!!!";
    //res.redirect(buildRedirectURL('/admin-panel', req.query));

    res.redirect(buildRedirectURL('/admin-panel', req.body));

  } catch (err) {
    console.error("Error toggling user role:", err);
    res.status(500).send("Failed to update user role");
  }
};

// Delete
const deleteUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    if (user.username === 'adminuser') {
      return res.status(403).send("You cannot delete the super admin.");
    }

    await User.findByIdAndDelete(userId);
    
    req.session.toastMessage = "User Deleted!";
    //res.redirect(buildRedirectURL('/admin-panel', req.query));

    res.redirect(buildRedirectURL('/admin-panel', req.body));

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

    const { search, role } = req.query;
    const query = {};
    if (search) {
      query.username = { $regex: new RegExp(search, "i") }; // case-insensitive search
    }
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query, "username role lastActivity lastFilters createdAt").lean(); 

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

// POST /admin/clear-analytics
const clearAnalytics = async (req, res) => {
  try {
    await UsageLog.deleteMany({ page: { $ne: 'admin-panel' } });
    res.redirect('/admin-panel');
  } catch (err) {
    console.error("Error clearing analytics:", err);
    res.status(500).send("Failed to clear analytics.");
  }
};

module.exports = {
  showAllUsers,
  clearUserHistory,
  toggleUserRole,
  deleteUser,
  exportUserCSV,
  clearAnalytics
};
