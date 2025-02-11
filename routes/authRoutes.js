const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected route to get user profile
router.get("/profile", protect, getProfile);

module.exports = router;
