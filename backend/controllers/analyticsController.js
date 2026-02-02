// controllers/analyticsController.js
const Timesheet = require("../models/Timesheet");
const User = require("../models/User");
const { getMonthBounds } = require("../utils/dateUtils");

// Dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    const { monthStart, monthEnd } = getMonthBounds(currentYear, currentMonth);

    let userFilter = {};
    if (req.user.role === "employee") {
      userFilter = { userId: req.user.id };
    } else if (req.user.role === "manager") {
      const teamMembers = await User.find({ managerId: req.user.id }).select(
        "_id"
      );
      const teamIds = teamMembers.map((m) => m._id);
      userFilter = { userId: { $in: teamIds } };
    }

    // Get timesheets for the period
    const timesheets = await Timesheet.find({
      ...userFilter,
      weekStartDate: { $gte: monthStart, $lte: monthEnd },
    }).populate("userId", "name email department");

    // Calculate statistics
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
    const avgHoursPerWeek =
      timesheets.length > 0 ? totalHours / timesheets.length : 0;

    const statusCounts = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };

    timesheets.forEach((ts) => {
      statusCounts[ts.status]++;
    });

    // Department-wise hours
    const departmentHours = {};
    timesheets.forEach((ts) => {
      const dept = ts.userId.department;
      departmentHours[dept] = (departmentHours[dept] || 0) + ts.totalHours;
    });

    res.json({
      success: true,
      stats: {
        totalTimesheets: timesheets.length,
        totalHours: Math.round(totalHours * 100) / 100,
        avgHoursPerWeek: Math.round(avgHoursPerWeek * 100) / 100,
        statusCounts,
        departmentHours,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 AI: Detect overworked employees
exports.detectOverworkedEmployees = async (req, res) => {
  try {
    const { weeks = 4 } = req.query; // Default: last 4 weeks

    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - weeks * 7);

    let userFilter = {};
    if (req.user.role === "manager") {
      const teamMembers = await User.find({ managerId: req.user.id }).select(
        "_id"
      );
      const teamIds = teamMembers.map((m) => m._id);
      userFilter = { userId: { $in: teamIds } };
    }

    // Aggregate hours by user
    const timesheets = await Timesheet.find({
      ...userFilter,
      weekStartDate: { $gte: weeksAgo },
      status: { $in: ["submitted", "approved"] },
    }).populate("userId", "name email department");

    // Group by user
    const userHours = {};
    timesheets.forEach((ts) => {
      const userId = ts.userId._id.toString();
      if (!userHours[userId]) {
        userHours[userId] = {
          user: ts.userId,
          totalHours: 0,
          weekCount: 0,
          weeks: [],
        };
      }
      userHours[userId].totalHours += ts.totalHours;
      userHours[userId].weekCount++;
      userHours[userId].weeks.push({
        weekStart: ts.weekStartDate,
        hours: ts.totalHours,
      });
    });

    // AI Detection Logic
    const overworkedEmployees = [];
    const STANDARD_HOURS = 40; // Standard work week
    const OVERTIME_THRESHOLD = 50; // Hours per week
    const BURNOUT_THRESHOLD = 55; // Critical threshold

    Object.values(userHours).forEach((data) => {
      const avgHoursPerWeek = data.totalHours / data.weekCount;
      const maxWeekHours = Math.max(...data.weeks.map((w) => w.hours));

      let risk = "normal";
      let suggestions = [];

      if (avgHoursPerWeek > BURNOUT_THRESHOLD) {
        risk = "critical";
        suggestions.push("Immediate intervention required");
        suggestions.push("Consider redistributing workload");
        suggestions.push("Schedule mandatory time off");
      } else if (avgHoursPerWeek > OVERTIME_THRESHOLD) {
        risk = "high";
        suggestions.push("Monitor closely for burnout signs");
        suggestions.push("Review project assignments");
        suggestions.push("Encourage work-life balance");
      } else if (avgHoursPerWeek > STANDARD_HOURS + 5) {
        risk = "moderate";
        suggestions.push("Slight overtime detected");
        suggestions.push("Check if additional resources needed");
      }

      if (risk !== "normal") {
        overworkedEmployees.push({
          user: data.user,
          avgHoursPerWeek: Math.round(avgHoursPerWeek * 100) / 100,
          totalHours: data.totalHours,
          weekCount: data.weekCount,
          maxWeekHours,
          risk,
          suggestions,
          weeksAnalyzed: data.weeks,
        });
      }
    });

    // Sort by risk level and hours
    const riskOrder = { critical: 0, high: 1, moderate: 2 };
    overworkedEmployees.sort((a, b) => {
      if (riskOrder[a.risk] !== riskOrder[b.risk]) {
        return riskOrder[a.risk] - riskOrder[b.risk];
      }
      return b.avgHoursPerWeek - a.avgHoursPerWeek;
    });

    res.json({
      success: true,
      analyzed: Object.keys(userHours).length,
      overworked: overworkedEmployees.length,
      employees: overworkedEmployees,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get weekly trend
exports.getWeeklyTrend = async (req, res) => {
  try {
    const { weeks = 12 } = req.query;

    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - weeks * 7);

    let userFilter = {};
    if (req.user.role === "employee") {
      userFilter = { userId: req.user.id };
    } else if (req.user.role === "manager") {
      const teamMembers = await User.find({ managerId: req.user.id }).select(
        "_id"
      );
      const teamIds = teamMembers.map((m) => m._id);
      userFilter = { userId: { $in: teamIds } };
    }

    const timesheets = await Timesheet.find({
      ...userFilter,
      weekStartDate: { $gte: weeksAgo },
    }).sort({ weekStartDate: 1 });

    // Group by week
    const weeklyData = {};
    timesheets.forEach((ts) => {
      const weekKey = ts.weekStartDate.toISOString().split("T")[0];
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          totalHours: 0,
          timesheetCount: 0,
        };
      }
      weeklyData[weekKey].totalHours += ts.totalHours;
      weeklyData[weekKey].timesheetCount++;
    });

    const trend = Object.values(weeklyData);

    res.json({
      success: true,
      trend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
