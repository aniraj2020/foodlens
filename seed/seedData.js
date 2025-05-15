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
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
};

// Helper to categorize
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
      const count = parseInt(data.sample_size);
      const group = data.respondent_group;

      if (!isNaN(year) && !isNaN(count) && data.insecurity_type && group) {
        const categoryObj = categorizeGroup(group);

        const doc = {
          year,
          insecurity_type: data.insecurity_type,
          count,
          demographic_group: group
        };
        
        // Only add the detected category key (avoid storing null)
        if (categoryObj.gender) doc.gender = categoryObj.gender;
        if (categoryObj.age_group) doc.age_group = categoryObj.age_group;
        if (categoryObj.suburb_group) doc.suburb_group = categoryObj.suburb_group;
        
        results.push(doc);
      }
    })
    .on("end", async () => {
      console.log("Parsed records:", results.length);
      console.log("Example record:", results[0]); // 

      try {
        await FoodSecurity.deleteMany({});
        await FoodSecurity.insertMany(results);
        console.log("Seeded successfully!");
        mongoose.connection.close();
      } catch (err) {
        console.error("Seeding error:", err.message);
      }
    });
};

seedData();
