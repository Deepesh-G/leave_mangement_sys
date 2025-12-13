const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/leaveController"); // ✅ Import your controller
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");

// ==========================================
// ✅ PART 1: Approval & Team Routes (Moved here)
//URL: /api/manager/leave/approve/:id
// ==========================================

// Get pending team leaves
router.get("/team", protect, requireRole("manager"), ctrl.getTeamLeaves);

// Approve leave
router.patch("/approve/:id", protect, requireRole("manager"), ctrl.approveLeave);

// Reject leave
router.patch("/reject/:id", protect, requireRole("manager"), ctrl.rejectLeave);

// Approved leaves calendar
router.get("/calendar", protect, requireRole("manager"), ctrl.calendar);

// Full team leave history
router.get("/team-history", protect, requireRole("manager"), ctrl.teamHistory);


// ==========================================
// ✅ PART 2: Balance Management (Inline Logic)
//URL: /api/manager/leave/edit-balance/:employeeId
// ==========================================

// Manager updates employee leave balance manually
router.patch("/edit-balance/:employeeId", protect, requireRole("manager"), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { casual, sick, earned } = req.body;

    const employee = await User.findOne({ _id: employeeId, managerId: req.user.userId });
    if (!employee) {
      return res.status(403).json({ message: "You do not manage this employee." });
    }

    const balance = await LeaveBalance.findOneAndUpdate(
      { userId: employeeId },
      { $set: { casual, sick, earned } },
      { new: true }
    );

    res.json({ message: "Leave balance updated.", balance });
  } catch (err) {
    console.error("Leave edit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch specific employee leave balance
router.get("/balance/:employeeId", protect, requireRole("manager"), async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findOne({ _id: employeeId, managerId: req.user.userId });
    if (!employee) return res.status(403).json({ message: "Not your employee." });

    const balance = await LeaveBalance.findOne({ userId: employeeId });
    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
