const mongoose = require("mongoose");

const timesheetEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  projectName: {
    type: String,
    required: true,
  },
  taskDescription: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "in-progress", "blocked"],
    default: "completed",
  },
});

const timesheetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  weekStartDate: {
    type: Date,
    required: true,
  },
  weekEndDate: {
    type: Date,
    required: true,
  },
  entries: [timesheetEntrySchema],
  totalHours: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["draft", "submitted", "approved", "rejected"],
    default: "draft",
  },
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total hours before saving
timesheetSchema.pre("save", function (next) {
  this.totalHours = this.entries.reduce((sum, entry) => sum + entry.hours, 0);
  this.updatedAt = Date.now();
  // next();
});

// Index for quick queries
timesheetSchema.index({ userId: 1, weekStartDate: 1 });

module.exports = mongoose.model("Timesheet", timesheetSchema);
