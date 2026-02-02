// routes/timesheetRoutes.js
const express = require("express");
const router = express.Router();
const {
  createOrUpdateTimesheet,
  getMyTimesheets,
  getTimesheetById,
  submitTimesheet,
  reviewTimesheet,
  getPendingTimesheets,
} = require("../controllers/timesheetController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, createOrUpdateTimesheet);
router.get("/my", protect, getMyTimesheets);
router.get(
  "/pending",
  protect,
  authorize("admin", "manager"),
  getPendingTimesheets
);
router.get("/:id", protect, getTimesheetById);
router.patch("/:id/submit", protect, submitTimesheet);
router.patch(
  "/:id/review",
  protect,
  authorize("admin", "manager"),
  reviewTimesheet
);

module.exports = router;
