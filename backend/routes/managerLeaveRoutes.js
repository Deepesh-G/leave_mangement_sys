const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middleware/authMiddleware");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");
// ASSUMPTION: You have a LeaveRequest model. If it's named "Leave", change this line.
const LeaveRequest = require("../models/LeaveRequest"); 

// ==========================================
// ✅ NEW: Approve Leave Request
// ==========================================
router.patch("/approve/:id", protect, requireRole("manager"), async (req, res) => {
  try {
    const { managerComments } = req.body;
    const leaveId = req.params.id;

    // 1. Find the leave request
    const leaveRequest = await LeaveRequest.findById(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // 2. Check if already processed
    if (leaveRequest.status !== "Pending") {
      return res.status(400).json({ message: "Leave request already processed" });
    }

    // 3. Update status and comments
    leaveRequest.status = "Approved";
    leaveRequest.managerComments = managerComments || "Approved by manager";
    
    // 4. (Optional but Recommended) Deduct from Leave Balance here if needed
    // logic would go here to find LeaveBalance and subtract days
    
    await leaveRequest.save();

    res.json({ message: "Leave Approved Successfully", leaveRequest });
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ message: "Server error during approval" });
  }
});

// ==========================================
// ✅ NEW: Reject Leave Request
// ==========================================
router.patch("/reject/:id", protect, requireRole("manager"), async (req, res) => {
  try {
    const { managerComments } = req.body;
    const leaveId = req.params.id;

    const leaveRequest = await LeaveRequest.findById(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "Pending") {
      return res.status(400).json({ message: "Leave request already processed" });
    }

    leaveRequest.status = "Rejected";
    leaveRequest.managerComments = managerComments || "Rejected by manager";
    
    await leaveRequest.save();

    res.json({ message: "Leave Rejected", leaveRequest });
  } catch (err) {
    console.error("Rejection error:", err);
    res.status(500).json({ message: "Server error during rejection" });
  }
});

// ==========================================
// EXISTING: Edit Balance (Kept this same)
// ==========================================
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

// ==========================================
// EXISTING: Get Balance (Kept this same)
// ==========================================
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
