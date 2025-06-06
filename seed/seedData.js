const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const csv = require("csv-parser");
const dotenv = require("dotenv");

const FoodSecurity = require("../models/FoodSecurity");
const User = require("../models/User");

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

// check and Create
const createAdminUser = async () => {
  try {
    const existing = await User.findOne({ username: "adminuser" });
    if (existing) {
      console.log("Admin user already exists:", existing.username);
      return;
    }

    const newUser = new User({
      username: "adminuser",
      password: "adminpassword123",
      role: "admin"
    });

    await newUser.save();
    console.log("Admin user created:", newUser.username);
  } catch (error) {
    console.error("Error creating admin user:", error.message);
  }
};

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
      group = group.replace(/\s+/g, " ");
      group = group.replace(/(\d{2})\s*\+\s*years/, "$1+ years");

      const type = data.insecurity_type?.trim();

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

        await createAdminUser();
      } catch (err) {
        console.error("Seeding error:", err.message);
      } finally {
        mongoose.connection.close();
      }
    });
};

seedData();
