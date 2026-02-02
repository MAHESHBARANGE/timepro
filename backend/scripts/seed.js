require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Timesheet = require("../models/Timesheet");

const users = [
  {
    name: "Admin User",
    email: "admin@company.com",
    password: "admin123",
    role: "admin",
    department: "Management",
  },
  {
    name: "John Manager",
    email: "manager@company.com",
    password: "manager123",
    role: "manager",
    department: "Engineering",
  },
  {
    name: "Sarah Employee",
    email: "employee@company.com",
    password: "employee123",
    role: "employee",
    department: "Engineering",
  },
  {
    name: "Mike Developer",
    email: "mike@company.com",
    password: "mike123",
    role: "employee",
    department: "Engineering",
  },
  {
    name: "Emma Designer",
    email: "emma@company.com",
    password: "emma123",
    role: "employee",
    department: "Design",
  },
];

const generateTimesheets = (userId, weeks) => {
  const timesheets = [];
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const entries = [];
    const baseHours = 7 + Math.random() * 3; // 7-10 hours base

    for (let d = 0; d < 5; d++) {
      // Monday to Friday
      const entryDate = new Date(weekStart);
      entryDate.setDate(weekStart.getDate() + d);

      const hours =
        Math.round((baseHours + (Math.random() - 0.5) * 2) * 10) / 10;

      entries.push({
        date: entryDate,
        hours: hours,
        projectName: ["Project Alpha", "Project Beta", "Project Gamma"][
          Math.floor(Math.random() * 3)
        ],
        taskDescription: [
          "Development",
          "Testing",
          "Code Review",
          "Documentation",
        ][Math.floor(Math.random() * 4)],
        status: ["completed", "in-progress"][Math.floor(Math.random() * 2)],
      });
    }

    const status = i === 0 ? "draft" : i === 1 ? "submitted" : "approved";

    timesheets.push({
      userId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      entries,
      status,
      submittedAt: status !== "draft" ? weekStart : undefined,
      reviewedAt: status === "approved" ? weekStart : undefined,
    });
  }

  return timesheets;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Timesheet.deleteMany({});
    console.log("Cleared existing data");

    // Create users
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);

    // Set manager for employees
    const manager = createdUsers.find((u) => u.role === "manager");
    const employees = createdUsers.filter((u) => u.role === "employee");

    for (const emp of employees) {
      emp.managerId = manager._id;
      await emp.save();
    }

    // Create timesheets for employees (including one overworked)
    let allTimesheets = [];

    // Normal employees: 8 weeks of data
    for (const emp of employees.slice(0, 2)) {
      const timesheets = generateTimesheets(emp._id, 8);
      allTimesheets = allTimesheets.concat(timesheets);
    }

    // Overworked employee: create excessive hours
    const overworkedEmp = employees[2];
    if (overworkedEmp) {
      const overworkedTimesheets = [];
      const now = new Date();

      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const entries = [];
        const excessiveHours = 10 + Math.random() * 4; // 10-14 hours per day

        for (let d = 0; d < 5; d++) {
          const entryDate = new Date(weekStart);
          entryDate.setDate(weekStart.getDate() + d);

          entries.push({
            date: entryDate,
            hours: Math.round(excessiveHours * 10) / 10,
            projectName: "Critical Project",
            taskDescription: "Urgent deadline work",
            status: "completed",
          });
        }

        // Add weekend work
        for (let d = 5; d < 7; d++) {
          const entryDate = new Date(weekStart);
          entryDate.setDate(weekStart.getDate() + d);

          entries.push({
            date: entryDate,
            hours: 5 + Math.random() * 3,
            projectName: "Critical Project",
            taskDescription: "Weekend overtime",
            status: "completed",
          });
        }

        overworkedTimesheets.push({
          userId: overworkedEmp._id,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          entries,
          status: "approved",
          submittedAt: weekStart,
          reviewedAt: weekStart,
        });
      }

      allTimesheets = allTimesheets.concat(overworkedTimesheets);
    }

    await Timesheet.create(allTimesheets);
    console.log(`Created ${allTimesheets.length} timesheets`);

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📋 Demo Credentials:");
    console.log("Admin: admin@company.com / admin123");
    console.log("Manager: manager@company.com / manager123");
    console.log("Employee: employee@company.com / employee123");
    console.log("\n🔥 AI Analytics will detect the overworked employee!");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedDatabase();
