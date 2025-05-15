const FoodSecurity = require('../models/FoodSecurity');

const getDemographicsData = async (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ message: 'Missing year query param' });
  }

  const matchStage = year === "All" ? {} : { year: parseInt(year) };

  try {
    const results = await FoodSecurity.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$demographic_group",
          total: { $sum: "$count" }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      labels: results.map(r => r._id),
      values: results.map(r => r.total)
    });
  } catch (err) {
    res.status(500).json({ message: "Aggregation failed", error: err.message });
  }
};

module.exports = { getDemographicsData };
