const FoodSecurity = require("../models/FoodSecurity");

// Helper: Simple Linear Regression
function linearRegression(points) {
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return x => slope * x + intercept;
}

// Controller: GET /api/predict
const getPredictionData = async (req, res) => {
  const { category, group } = req.query;

  if (!category || !group) {
    return res.status(400).json({ message: "Missing category or group" });
  }

  try {
    const results = await FoodSecurity.aggregate([
      { $match: { [category]: group } },
      {
        $group: {
          _id: "$year",
          total: { $sum: "$affected" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    if (!results.length) {
      return res.status(404).json({ message: `No data found for group "${group}"` });
    }

    const actualYears = results.map(r => r._id);
    const actualValues = results.map(r => r.total);

    const points = actualYears.map((year, i) => ({ x: year, y: actualValues[i] }));
    const predict = linearRegression(points);

    const predictedYears = [2024, 2025, 2026];

    //rounding to nearest person as model predicts how many individuals are expected to be food insecure
    const predictedValues = predictedYears.map(year => Math.round(predict(year)));  

    const allYears = [...actualYears, ...predictedYears];
    //const allValues = [...actualValues, ...predictedValues];

    res.json({
      years: allYears,
      actual: actualValues,
      predicted: predictedValues,
      splitIndex: actualYears.length
    });

  } catch (err) {
    console.error("Prediction error:", err.message);
    res.status(500).json({ message: "Prediction failed", error: err.message });
  }
};

module.exports = { getPredictionData };
