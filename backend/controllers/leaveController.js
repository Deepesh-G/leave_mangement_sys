const LeaveApplication = require("../models/LeaveApplication");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");

/* ============================================================
   1. APPLY LEAVE (Employee)
============================================================ */
exports.applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;

    if (!startDate || !endDate || !leaveType)
      return res.status(400).json({ message: "Missing fields" });

    // Normalize dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (start > end)
      return res.status(400).json({ message: "End date must be after start" });

    const days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

    const balance = await LeaveBalance.findOne({ userId: req.user.userId });
    if (!balance) return res.status(404).json({ message: "Leave balance not found" });

    // Create leave
    const leave = await LeaveApplication.create({
      userId: req.user.userId,
      startDate,
      endDate,
      leaveType,
      reason,
      days,
    });

    res.json({ message: "Leave applied successfully", leave });
  } catch (err) {
    console.error("Apply error", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   2. GET MY LEAVES (Employee)
============================================================ */
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   3. GET TEAM LEAVES (Manager - Pending & History)
   ✅ This fixes the "Manager not getting applied leave" issue
============================================================ */
exports.getTeamLeaves = async (req, res) => {
  try {
    // 1. Find all employees belonging to this manager
    const employees = await User.find({ managerId: req.user.userId });
    const ids = employees.map((e) => e._id);

    // 2. Find all leaves for these employees
    // We sort by 'createdAt' descending so newest requests appear top
    const leaves = await LeaveApplication.find({ userId: { $in: ids } })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4. GET MY TEAM MEMBERS (Manager Dashboard List)
   ✅ NEW: This allows you to see "Total Employees" and their names
============================================================ */
exports.getMyTeam = async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.userId })
      .select("name email role managerCode"); // Only get necessary fields
    
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5. APPROVE / REJECT (Manager)
============================================================ */
exports.approveLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id).populate("userId");
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (leave.status !== "Pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    leave.status = "Approved";
    leave.managerComments = req.body.managerComments || "Approved";
    await leave.save();

    // Deduct Balance
    const balance = await LeaveBalance.findOne({ userId: leave.userId._id });
    if (balance) {
      const type = leave.leaveType.toLowerCase(); // casual, sick, earned
      if (balance[type] !== undefined) {
        balance[type] = Math.max(0, balance[type] - leave.days);
        await balance.save();
      }
    }

    res.json({ message: "Approved", leave });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (leave.status !== "Pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    leave.status = "Rejected";
    leave.managerComments = req.body.managerComments || "Rejected";
    await leave.save();

    res.json({ message: "Rejected", leave });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   6. CALENDAR & HISTORY
============================================================ */
exports.calendar = async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.userId });
    const ids = employees.map((e) => e._id);
    const leaves = await LeaveApplication.find({
      userId: { $in: ids },
      status: "Approved",
    }).populate("userId", "name");
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Reuse getTeamLeaves logic for history if needed, or specific history logic
exports.teamHistory = exports.getTeamLeaves;

// Basic Balance Check
exports.getBalance = async (req, res) => {
  try {
    const balance = await LeaveBalance.findOne({ userId: req.user.userId });
    res.json(balance || {});
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
