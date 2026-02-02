// routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  detectOverworkedEmployees,
  getWeeklyTrend,
} = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");

router.get("/dashboard", protect, getDashboardStats);
router.get(
  "/overworked",
  protect,
  authorize("admin", "manager"),
  detectOverworkedEmployees
);
router.get("/trend", protect, getWeeklyTrend);

module.exports = router;
