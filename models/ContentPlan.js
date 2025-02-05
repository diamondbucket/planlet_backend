const mongoose = require("mongoose");

const contentPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    default: "General",
  },
  status: {
    type: String,
    enum: ["Draft", "Scheduled", "Published"],
    default: "Draft",
  },
});

module.exports = mongoose.model("ContentPlan", contentPlanSchema);
