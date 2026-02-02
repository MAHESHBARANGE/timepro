// routes/exportRoutes.js
const express = require("express");
const router = express.Router();
const {
  exportToExcel,
  exportToPDF,
} = require("../controllers/exportController");
const { protect } = require("../middleware/auth");

router.get("/excel", protect, exportToExcel);
router.get("/pdf/:timesheetId", protect, exportToPDF);

module.exports = router;
