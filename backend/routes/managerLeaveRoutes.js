const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/leaveController");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");

// =============================
// MANAGER DASHBOARD & ACTIONS
// Base URL: /api/manager/leave
// =============================

// ✅ NEW: Get list of employees (Names & Count)
// Frontend calls: /api/manager/leave/team-list
router.get("/team-list", protect, requireRole("manager"), ctrl.getMyTeam);

// Get pending team leaves (Inbox)
router.get("/team", protect, requireRole("manager"), ctrl.getTeamLeaves);

// Full team leave history
router.get("/team-history", protect, requireRole("manager"), ctrl.teamHistory);

// Calendar (Approved leaves only)
router.get("/calendar", protect, requireRole("manager"), ctrl.calendar);

// Approve leave
router.patch("/approve/:id", protect, requireRole("manager"), ctrl.approveLeave);

// Reject leave
router.patch("/reject/:id", protect, requireRole("manager"), ctrl.rejectLeave);

// =============================
// MANUAL BALANCE EDIT
// =============================
router.patch("/edit-balance/:employeeId", protect, requireRole("manager"), async (req, res) => {
  try {
    const { casual, sick, earned } = req.body;
    const balance = await LeaveBalance.findOneAndUpdate(
      { userId: req.params.employeeId },
      { $set: { casual, sick, earned } },
      { new: true }
    );
    res.json({ message: "Updated", balance });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get specific employee balance
router.get("/balance/:employeeId", protect, requireRole("manager"), async (req, res) => {
  try {
    const balance = await LeaveBalance.findOne({ userId: req.params.employeeId }).populate("userId", "name email");
    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
