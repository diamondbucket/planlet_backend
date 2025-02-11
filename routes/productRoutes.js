const express = require("express");
const {
  saveBusinessInfo,
  getCalendar,
  saveContentPlan,
  getContentPlans,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Route to save business info
router.post("/save-business-info", saveBusinessInfo);
router.put("/content-plans", protect, saveContentPlan);
router.get("/content-plans", protect, getContentPlans);

// Route to get calendar
//router.get("/calendar", protect, getCalendar);

module.exports = router;
