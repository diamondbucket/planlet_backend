const mongoose = require("mongoose");

const contentPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  posts: [{
    date: Date,
    content: String,
    contentType: String,
    theme: String,
    goal: String,
    platform: String,
    status: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ContentPlan", contentPlanSchema);
