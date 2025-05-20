const User = require("../models/User");

async function saveChartFilters(req, res) {
  const { chart, filters } = req.body;

  if (!chart || !filters) {
    console.log("Missing chart or filters in request");
    return res.status(400).json({ message: "Chart and filters are required." });
  }

  // Safely resolve userId
  const userId = req.user?._id || req.session?.passport?.user;
  console.log("Resolved userId:", userId);

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    console.log("Before:", user.lastFilters);
    user.lastFilters[chart] = filters;
    user.markModified('lastFilters');
    user.lastActivity = { chart, timestamp: new Date() };

    await user.save();
    console.log("Saved filters for:", user.username);
    console.log("After save:", user.lastFilters);

    res.status(200).json({ message: "Filters saved." });
  } catch (err) {
    console.error("Error saving filters:", err);
    res.status(500).json({ message: "Server error." });
  }
}

async function getChartFilters(req, res) {
  const { chart } = req.query;

  if (!chart) {
    return res.status(400).json({ message: "Chart query param is required." });
  }

  // Safely resolve userId
  const userId = req.user?._id || req.session?.passport?.user;

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found during getChartFilters:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    const filters = user.lastFilters?.[chart] || {};
    res.status(200).json({ filters });
  } catch (err) {
    console.error("Error getting filters:", err);
    res.status(500).json({ message: "Server error." });
  }
}

module.exports = {
  saveChartFilters,
  getChartFilters,
};
