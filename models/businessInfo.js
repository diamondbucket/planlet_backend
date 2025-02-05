const mongoose = require("mongoose");

const businessInfoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to User collection by ObjectId
  businessType: String,
  targetAudience: String,
  goals: String,
  specialEvents: String,
  postingDays: Number,
  preferredContentFormats: { type: String, default: "" }, // Optional field for preferred content formats
  targetGeographicArea: { type: String, default: "" }, // Optional field for target geographic area
});

module.exports = mongoose.model("BusinessInfo", businessInfoSchema);
