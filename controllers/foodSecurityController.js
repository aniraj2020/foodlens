const FoodSecurity = require("../models/FoodSecurity");

// Pie Chart Data: Total count grouped by insecurity_type
const getInsecurityTypeDistribution = async (req, res) => {
  try {
    const results = await FoodSecurity.aggregate([
      {
        $group: {
          _id: "$insecurity_type",
          total: { $sum: "$count" }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Transform for frontend (labels + values)
    const labels = results.map((item) => item._id);
    const values = results.map((item) => item.total);

    res.json({ labels, values });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
  getInsecurityTypeDistribution
};
