const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const csv = require("csv-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const FoodSecurity = require("../models/FoodSecurity");
const User = require("../models/User");

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

// Create or replace admin user using .save() to trigger password hashing
const createAdminUser = async () => {
  try {
    await User.deleteOne({ username: "adminuser" });

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
      let group = data.respondent_group?.trim() || "";

      group = group.replace(/\s+/g, " ");
      group = group.replace(/(\d{2})\s*\+\s*years/, "$1+ years");

      const type = data.insecurity_type?.trim();
      if (!isNaN(year) && !isNaN(sampleSize) && !isNaN(resultPercent) && type && group) {
        const affected = Math.round((sampleSize * resultPercent) / 100);
        const categoryObj = categorizeGroup(group);

        const doc = {
          year,
          insecurity_type: data.insecurity_type,
          count,
          demographic_group: group
        };
        if (categoryObj.gender) doc.gender = categoryObj.gender;
        if (categoryObj.age_group) doc.age_group = categoryObj.age_group;
        if (categoryObj.suburb_group) doc.suburb_group = categoryObj.suburb_group;
        
        results.push(doc);
      }
    })
    .on("end", async () => {
      try {
        await FoodSecurity.deleteMany({});
        await FoodSecurity.insertMany(results);
        console.log("FoodSecurity data seeded:", results.length);

        await createAdminUser();
      } catch (err) {
        console.error("Seeding error:", err.message);
      } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
      }
    });
};

seedData();
