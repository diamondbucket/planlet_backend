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
    
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ message: "Invalid posts data" });
    }

    // Find and update existing plan
    const existingPlan = await ContentPlan.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          posts: posts.map(post => ({
            date: new Date(post.date),
            content: post.content,
            contentType: post.contentType || 'text',
            theme: post.theme || 'general',
            goal: post.goal,
            platform: post.platform || 'General',
            status: post.status || 'Draft'
          })),
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true } // Create if doesn't exist
    );

    res.status(200).json({
      message: "Content plan updated successfully",
      contentPlan: existingPlan
    });
  } catch (error) {
    console.error("Save Content Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getContentPlans = async (req, res) => {
  try {
    console.log("Fetching content for user:", req.user._id);
    
    const contentPlans = await ContentPlan.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JS objects

    console.log("Found content plans:", contentPlans.length);
    
    // Transform to array of posts across all plans
    const allPosts = contentPlans.flatMap(plan => 
      plan.posts.map(post => ({
        ...post,
        planId: plan._id, // Include plan ID for reference
        userId: plan.user // Include user ID for verification
      }))
    );

    res.json(allPosts);
  } catch (error) {
    console.error("Get Content Error:", error);
    res.status(500).json({ message: error.message });
  }
};
