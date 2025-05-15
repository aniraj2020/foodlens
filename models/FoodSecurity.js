const mongoose = require("mongoose");

const foodSecuritySchema = new mongoose.Schema({
  year: Number,
  insecurity_type: String,
  count: Number,
  demographic_group: String,
  gender: String,
  age_group: String,
  suburb_group: String
});

module.exports = mongoose.model("FoodSecurity", foodSecuritySchema);
