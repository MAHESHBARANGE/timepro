// controllers/exportController.js
const Timesheet = require("../models/Timesheet");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// Export to Excel
exports.exportToExcel = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.weekStartDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (userId && (req.user.role === "admin" || req.user.role === "manager")) {
      query.userId = userId;
    } else {
      query.userId = req.user.id;
    }

    const timesheets = await Timesheet.find(query)
      .populate("userId", "name email department")
      .sort({ weekStartDate: 1 });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timesheets");

    // Define columns
    worksheet.columns = [
      { header: "Employee", key: "employee", width: 20 },
      { header: "Department", key: "department", width: 15 },
      { header: "Week Start", key: "weekStart", width: 12 },
      { header: "Week End", key: "weekEnd", width: 12 },
      { header: "Date", key: "date", width: 12 },
      { header: "Project", key: "project", width: 20 },
      { header: "Task", key: "task", width: 30 },
      { header: "Hours", key: "hours", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Total Hours", key: "totalHours", width: 12 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };

    // Add data
    timesheets.forEach((timesheet) => {
      timesheet.entries.forEach((entry, index) => {
        worksheet.addRow({
          employee: timesheet.userId.name,
          department: timesheet.userId.department,
          weekStart: timesheet.weekStartDate.toLocaleDateString(),
          weekEnd: timesheet.weekEndDate.toLocaleDateString(),
          date: new Date(entry.date).toLocaleDateString(),
          project: entry.projectName,
          task: entry.taskDescription,
          hours: entry.hours,
          status: entry.status,
          totalHours: index === 0 ? timesheet.totalHours : "",
        });
      });
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=timesheets_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export to PDF
exports.exportToPDF = async (req, res) => {
  try {
    const { timesheetId } = req.params;

    const timesheet = await Timesheet.findById(timesheetId)
      .populate("userId", "name email department")
      .populate("reviewedBy", "name");

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Check access
    if (
      req.user.role === "employee" &&
      timesheet.userId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=timesheet_${timesheetId}.pdf`
    );

    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Timesheet Report", { align: "center" });
    doc.moveDown();

    // Employee info
    doc.fontSize(12);
    doc.text(`Employee: ${timesheet.userId.name}`);
    doc.text(`Email: ${timesheet.userId.email}`);
    doc.text(`Department: ${timesheet.userId.department}`);
    doc.text(
      `Week: ${timesheet.weekStartDate.toLocaleDateString()} - ${timesheet.weekEndDate.toLocaleDateString()}`
    );
    doc.text(`Status: ${timesheet.status.toUpperCase()}`);
    doc.text(`Total Hours: ${timesheet.totalHours}`);
    doc.moveDown();

    // Entries table
    doc.fontSize(14).text("Time Entries", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    timesheet.entries.forEach((entry, index) => {
      doc.text(`${index + 1}. ${new Date(entry.date).toLocaleDateString()}`);
      doc.text(`   Project: ${entry.projectName}`);
      doc.text(`   Task: ${entry.taskDescription}`);
      doc.text(`   Hours: ${entry.hours} | Status: ${entry.status}`);
      doc.moveDown(0.5);
    });

    // Footer
    if (timesheet.reviewedBy) {
      doc.moveDown();
      doc.text(`Reviewed by: ${timesheet.reviewedBy.name}`);
      doc.text(`Reviewed on: ${timesheet.reviewedAt.toLocaleDateString()}`);
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
