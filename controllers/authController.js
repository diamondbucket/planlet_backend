const User = require("../models/User");
const BusinessInfo = require("../models/businessInfo");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "0162e8f8445215",
    pass: "4684477d12c24d"
  }
});

// Register a new user
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already exists" });

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully!" });
    console.log("User registered:", user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body; // Extract email and password
  console.log("Login attempt:", req.body);

  try {
    // Check if email exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Respond with the token and user info
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Login Error:", err); // Log the error for debugging
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Forgot Password - Send reset link
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User with this email does not exist." });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Optionally, hash the reset token before saving to the database
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiration on user
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Email options
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
Please click on the following link, or paste this into your browser to complete the process:\n\n
${resetUrl}\n\n
If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    // Send email
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.status(500).json({ message: "Error sending email.", error: err.message });
      }
      res.status(200).json({ message: "Password reset link sent to email." });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  // Add validation logs
  console.log("Reset request body:", req.body);
  
  const { email, token, newPassword } = req.body;
  
  if (!email || !token || !newPassword) {
    console.log("Missing fields:", { email, token, newPassword });
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log("User not found or token expired");
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Compare raw token with stored hash
    const isValid = await bcrypt.compare(token, user.resetPasswordToken);
    
    if (!isValid) {
      console.log("Token mismatch");
      return res.status(400).json({ message: "Invalid token" });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get authenticated user's profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
