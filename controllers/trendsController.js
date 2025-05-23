const FoodSecurity = require("../models/FoodSecurity");

//Color map for consistency in chart
const colorMap = {
  "Male": "#42a5f5",
  "Female": "#ef5350",
  "18-24 years": "#ffca28",
  "25-34 years": "#66bb6a",
  "35-44 years": "#ab47bc",
  "45-54 years": "#ffa726",
  "55-64 years": "#26c6da",
  "65+ years": "#8d6e63",
  "City of Melbourne": "#5c6bc0",
  "Carlton 3053": "#29b6f6",
  "Docklands 3008": "#d4e157",
  "Parkville 3052": "#ec407a",
  "East Melbourne 3002": "#7e57c2",
  "North Melbourne 3051 / West Melbourne 3003": "#26a69a",
  "South Wharf / Southbank 3006": "#ffa000",
  "South Yarra 3141 / Melbourne/St Kilda Road 3004": "#8e24aa",
  "Kensington / Flemington 3031": "#78909c"
};

//Endpoint 1: Get distinct demographic values
const getDistinctValues = async (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ message: "Missing category" });
  }

  try {
    let values = await FoodSecurity.distinct(category);
    values = values.filter(v => v !== null && v !== "null" && v !== undefined);
    console.log(`Distinct values for "${category}" →`, values.length);
    res.json({ values: values.sort() });
  } catch (err) {
    console.error("Error fetching distinct values:", err.message);
    res.status(500).json({ message: "Error fetching values", error: err.message });
  }
};

//Endpoint 2: Get trend data over years for selected values
const getTrendData = async (req, res) => {
  const { category, values } = req.query;

  if (!category || !values) {
    return res.status(400).json({ message: "Missing category or values" });
  }

  let selectedValues;
  try {
    selectedValues = JSON.parse(values);
    if (!Array.isArray(selectedValues) || selectedValues.length === 0) {
      return res.status(400).json({ message: "No values selected" });
    }
  } catch (e) {
    return res.status(400).json({ message: "Invalid JSON in values" });
  }

  try {
    const pipeline = [
      {
        $match: {
          [category]: { $in: selectedValues }
        }
      },
      {
        $group: {
          _id: {
            year: "$year",
            value: `$${category}`
          },
          total: { $sum: "$affected" }
        }
      },
      {
        $sort: { "_id.year": 1 }
      }
    ];

    const results = await FoodSecurity.aggregate(pipeline);
    const allYears = [...new Set(results.map(r => r._id.year))].sort();

    const datasets = selectedValues.map(val => {
      const yearlyData = allYears.map(year => {
        const match = results.find(r => r._id.year === year && r._id.value === val);
        return match ? match.total : 0;
      });

      return {
        label: val,
        data: yearlyData,
        backgroundColor: colorMap[val] || getFallbackColor(val)
      };
    });

    res.json({ years: allYears, datasets });

  } catch (err) {
    console.error("Aggregation failed:", err.message);
    res.status(500).json({ message: "Aggregation failed", error: err.message });
  }
};

//Helper: fallback color for unmapped values
function getFallbackColor(label) {
  const defaultColors = [
    "#7986cb", "#4db6ac", "#ba68c8", "#ff8a65", "#81c784",
    "#ffd54f", "#90caf9", "#a1887f", "#ce93d8", "#ffb74d"
  ];
  const hash = [...label].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultColors[hash % defaultColors.length];
}

module.exports = {
  getDistinctValues,
  getTrendData
};
