// controllers/timesheetController.js
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const { getWeekBounds, getMonthBounds } = require('../utils/dateUtils');

// Create or update timesheet
exports.createOrUpdateTimesheet = async (req, res) => {
  try {
    const { weekStartDate, entries } = req.body;
    const userId = req.user.id;

    const { weekStart, weekEnd } = getWeekBounds(weekStartDate);

    // Check if timesheet exists
    let timesheet = await Timesheet.findOne({
      userId,
      weekStartDate: weekStart
    });

    if (timesheet) {
      // Update existing
      timesheet.entries = entries;
      timesheet.status = 'draft';
      await timesheet.save();
    } else {
      // Create new
      timesheet = await Timesheet.create({
        userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        entries,
        status: 'draft'
      });
    }

    res.status(201).json({
      success: true,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's timesheets
exports.getMyTimesheets = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    if (startDate && endDate) {
      query.weekStartDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const timesheets = await Timesheet.find(query)
      .sort({ weekStartDate: -1 })
      .populate('reviewedBy', 'name email');

    res.json({
      success: true,
      count: timesheets.length,
      timesheets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get timesheet by ID
exports.getTimesheetById = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id)
      .populate('userId', 'name email department')
      .populate('reviewedBy', 'name email');

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check access rights
    if (
      req.user.role === 'employee' && 
      timesheet.userId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit timesheet for approval
exports.submitTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (timesheet.status !== 'draft') {
      return res.status(400).json({ message: 'Timesheet already submitted' });
    }

    timesheet.status = 'submitted';
    timesheet.submittedAt = Date.now();
    await timesheet.save();

    res.json({
      success: true,
      message: 'Timesheet submitted successfully',
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Reject timesheet (Manager/Admin)
exports.reviewTimesheet = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.status !== 'submitted') {
      return res.status(400).json({ message: 'Timesheet not submitted for review' });
    }

    timesheet.status = status;
    timesheet.reviewedBy = req.user.id;
    timesheet.reviewedAt = Date.now();
    
    if (status === 'rejected' && rejectionReason) {
      timesheet.rejectionReason = rejectionReason;
    }

    await timesheet.save();

    res.json({
      success: true,
      message: `Timesheet ${status} successfully`,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending timesheets (Manager/Admin)
exports.getPendingTimesheets = async (req, res) => {
  try {
    let query = { status: 'submitted' };

    // If manager, only show their team's timesheets
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamIds = teamMembers.map(member => member._id);
      query.userId = { $in: teamIds };
    }

    const timesheets = await Timesheet.find(query)
      .populate('userId', 'name email department')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: timesheets.length,
      timesheets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};