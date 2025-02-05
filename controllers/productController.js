const User = require("../models/User");
const BusinessInfo = require("../models/businessInfo");
const ContentPlan = require("../models/ContentPlan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.saveBusinessInfo = async (req, res) => {
  const {
    userId,
    businessType,
    targetAudience,
    goals,
    specialEvents,
    postingDays,
    preferredContentFormats, // New field
    targetGeographicArea, // New field
  } = req.body;

  console.log("Received Business Info:", {
    userId,
    businessType,
    targetAudience,
    goals,
    specialEvents,
    postingDays,
    preferredContentFormats,
    targetGeographicArea,
  });

  try {
    // Find the user by their ID (decoded from JWT)
    const user = await User.findById(userId);
    console.log("user", user);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    // Check if business info exists for this user

    let businessInfo = await BusinessInfo.findOne({ user: user._id });

    if (!businessInfo) {
      // If no business info exists, create a new one
      businessInfo = new BusinessInfo({
        user: user._id, // Save the user _id to link the business info to the user
        businessType,
        targetAudience,
        goals,
        specialEvents,
        postingDays,
        preferredContentFormats, // Include the new field
        targetGeographicArea, // Include the new field
      });
      await businessInfo.save();
    } else {
      // If business info exists, update it
      businessInfo.businessType = businessType;
      businessInfo.targetAudience = targetAudience;
      businessInfo.goals = goals;
      businessInfo.specialEvents = specialEvents;
      businessInfo.postingDays = postingDays;
      businessInfo.preferredContentFormats =
        preferredContentFormats || businessInfo.preferredContentFormats; // Update if provided
      businessInfo.targetGeographicArea =
        targetGeographicArea || businessInfo.targetGeographicArea; // Update if provided
      await businessInfo.save();
    }

    res.status(200).json({ message: "Business info saved successfully!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error saving business info", error: err.message });
  }
};

exports.saveContentPlan = async (req, res) => {
  try {
    const { posts } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!Array.isArray(posts)) {
      return res.status(400).json({ message: "Invalid posts format" });
    }

    // Save all posts
    const savedPosts = await Promise.all(
      posts.map(async (post) => {
        const newPost = new ContentPlan({
          user: userId,
          date: new Date(post.date),
          content: post.content,
        });
        return await newPost.save();
      })
    );

    res.status(201).json({
      message: "Content plan saved successfully",
      posts: savedPosts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving content plan",
      error: error.message,
    });
  }
};

exports.getContentPlans = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;

    let query = { user: userId };

    if (month && year) {
      const startDate = new Date(year, month - 1);
      const endDate = new Date(year, month);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const contentPlans = await ContentPlan.find(query).sort({ date: 1 });

    res.status(200).json(contentPlans);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching content plans",
      error: error.message,
    });
  }
};
