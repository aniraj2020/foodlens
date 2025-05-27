const mongoose = require("mongoose");

const UsageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  username: String,
  page: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("UsageLog", UsageLogSchema);
