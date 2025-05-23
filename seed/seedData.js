const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const csv = require("csv-parser");
const dotenv = require("dotenv");
const FoodSecurity = require("../models/FoodSecurity");

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};

// Helper to categorize groups
function categorizeGroup(group) {
  const genderValues = ["Male", "Female"];
  const agePattern = /^\d{2}-\d{2} years$|^\d{2}\+ years$/;

  if (genderValues.includes(group)) return { gender: group };
  if (agePattern.test(group)) return { age_group: group };
  return { suburb_group: group };
}

const seedData = async () => {
  await connectDB();

  const results = [];
  const filePath = path.join(__dirname, "../data/cleaned_food_security.csv");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      const year = parseInt(data.year);
      const sampleSize = parseInt(data.sample_size);
      const resultPercent = parseFloat(data.result);
      
      let group = data.respondent_group?.trim();
      // Fix common encoding or accidental whitespace issues
      group = group.replace(/\s+/g, " "); // Collapse multiple spaces
      group = group.replace(/(\d{2})\s*\+\s*years/, "$1+ years"); // Normalize "65 + years" → "65+ years"

      const type = data.insecurity_type?.trim();

      // Calculate affected count
      if (!isNaN(year) && !isNaN(sampleSize) && !isNaN(resultPercent) && type && group) {
        const affected = Math.round((sampleSize * resultPercent) / 100);

        const categoryObj = categorizeGroup(group);
        const doc = {
          year,
          sample_size: sampleSize,
          result: resultPercent,
          affected,
          insecurity_type: type,
          demographic_group: group,
        };

        // Add demographic key (gender, age_group, suburb_group)
        if (categoryObj.gender) doc.gender = categoryObj.gender;
        if (categoryObj.age_group) doc.age_group = categoryObj.age_group;
        if (categoryObj.suburb_group) doc.suburb_group = categoryObj.suburb_group;

        results.push(doc);
      }
    })
    .on("end", async () => {
      console.log("Parsed records:", results.length);
      console.log("Sample record:", results[0]);

      try {
        await FoodSecurity.deleteMany({});
        await FoodSecurity.insertMany(results);
        console.log("Seeding completed successfully!");
        mongoose.connection.close();
      } catch (err) {
        console.error("Seeding error:", err.message);
      }
    });
};

seedData();
