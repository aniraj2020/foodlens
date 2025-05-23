const mongoose = require("mongoose");

const foodSecuritySchema = new mongoose.Schema({
  year: Number,
  insecurity_type: String,
  count: Number,
  demographic_group: String,
  gender: String,
  age_group: String,
  sample_size: Number,
  suburb_group: String,
  result: Number,       
  affected: Number      // calculated: (sample_size * result) / 100

});

module.exports = mongoose.model("FoodSecurity", foodSecuritySchema);
