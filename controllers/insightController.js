const FoodSecurity = require("../models/FoodSecurity");

// Color palette for known insecurity types
const colorMap = {
  "Accessed food relief services": "#42a5f5",
  "Insecurity (multiple concerns + relief)": "#66bb6a",
  "Insecurity (multiple concerns)": "#ef5350",
  "Ran out of food": "#ffa726",
  "Skipped meals": "#ab47bc",
  "Worried food would run out": "#000000"
};

// Fallback color generator
function getRandomColor() {
  const fallbackColors = [
    "#8d6e63", "#ffd54f", "#4db6ac",
    "#ba68c8", "#81c784", "#7986cb"
  ];
  return fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
}

// Controller for /api/insight
const getInsightTrends = async (req, res) => {
  const { category, group } = req.query;
  if (!category || !group) {
    return res.status(400).json({ message: "Missing category or group" });
  }

  try {
    const pipeline = [
      { $match: { [category]: group } },
      {
        $group: {
          _id: { year: "$year", insecurity_type: "$insecurity_type" },
          total: { $sum: "$count" }
        }
      },
      { $sort: { "_id.year": 1 } }
    ];

    const results = await FoodSecurity.aggregate(pipeline);

    const allYears = [...new Set(results.map(r => r._id.year))].sort();
    const insecurityTypes = [...new Set(results.map(r => r._id.insecurity_type))].sort();

    const datasets = insecurityTypes.map(type => {
      const yearlyData = allYears.map(year => {
        const match = results.find(r => r._id.year === year && r._id.insecurity_type === type);
        return match ? match.total : 0;
      });

      return {
        label: type,
        data: yearlyData,
        borderColor: colorMap[type] || getRandomColor(),
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        borderWidth: 2
      };
    });

    res.json({ years: allYears, datasets });
  } catch (err) {
    console.error("Insight aggregation error:", err.message);
    res.status(500).json({ message: "Aggregation failed", error: err.message });
  }
};

module.exports = { getInsightTrends };
