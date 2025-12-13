const LeaveApplication = require("../models/LeaveApplication");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");

/* ============================================================
   HELPER — Normalize leave type
============================================================ */
const getBalanceKey = (leaveType) => {
  if (!leaveType) return null;

  const lower = leaveType.toLowerCase().trim();
  if (lower === "casual") return "casual";
  if (lower === "sick") return "sick";
  if (lower === "earned") return "earned";

  return null;
};

/* ============================================================
   1. APPLY LEAVE
============================================================ */
exports.applyLeave = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { startDate, endDate, leaveType, reason } = req.body;

    if (!startDate || !endDate || !leaveType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedType = getBalanceKey(leaveType);
    if (!normalizedType) {
      return res.status(400).json({ message: "Invalid leave type" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const days =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      return res.status(400).json({ message: "Invalid leave duration" });
    }

    // ✅ Ensure balance exists
    let balance = await LeaveBalance.findOne({ userId });
    if (!balance) {
      balance = await LeaveBalance.create({
        userId,
        casual: 10,
        sick: 10,
        earned: 10,
      });
    }

    if (balance[normalizedType] < days) {
      return res.status(400).json({
        message: `Insufficient ${normalizedType} leave balance`,
      });
    }

    const isManager = role === "manager";
    const status = isManager ? "Approved" : "Pending";

    // Manager self-approval deduction
    if (isManager) {
      balance[normalizedType] -= days;
      await balance.save();
    }

    const leave = await LeaveApplication.create({
      userId,
      startDate,
      endDate,
      leaveType: normalizedType,
      reason,
      days,
      status,
      managerComments: isManager ? "Self Approved" : "",
    });

    res.json({
      message: `Leave applied successfully (${status})`,
      leave,
    });
  } catch (err) {
    console.error("Apply Leave Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   2. GET MY LEAVES
============================================================ */
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   3. CANCEL LEAVE
============================================================ */
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending leaves can be cancelled",
      });
    }

    leave.status = "Cancelled";
    await leave.save();

    res.json({ message: "Leave cancelled", leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4. TEAM LEAVES (PENDING)
============================================================ */
exports.getTeamLeaves = async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.userId });
    const ids = employees.map((e) => e._id);

    const leaves = await LeaveApplication.find({
      userId: { $in: ids },
      status: "Pending",
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5. APPROVE LEAVE
============================================================ */
exports.approveLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id).populate("userId");

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    let balance = await LeaveBalance.findOne({ userId: leave.userId._id });
    if (!balance) {
      balance = await LeaveBalance.create({
        userId: leave.userId._id,
        casual: 10,
        sick: 10,
        earned: 10,
      });
    }

    if (balance[leave.leaveType] < leave.days) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    balance[leave.leaveType] -= leave.days;
    await balance.save();

    leave.status = "Approved";
    leave.managerComments = req.body.managerComments || "Approved";
    await leave.save();

    res.json({ message: "Approved", leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   6. REJECT LEAVE
============================================================ */
exports.rejectLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    leave.status = "Rejected";
    leave.managerComments = req.body.managerComments || "Rejected";
    await leave.save();

    res.json({ message: "Rejected", leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   7. CALENDAR
============================================================ */
exports.calendar = async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.userId });
    const ids = employees.map((e) => e._id);
    ids.push(req.user.userId);

    const leaves = await LeaveApplication.find({
      userId: { $in: ids },
      status: "Approved",
    }).populate("userId", "name");

    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   8. GET BALANCE
============================================================ */
exports.getBalance = async (req, res) => {
  try {
    let balance = await LeaveBalance.findOne({ userId: req.user.userId });

    if (!balance) {
      balance = await LeaveBalance.create({
        userId: req.user.userId,
        casual: 10,
        sick: 10,
        earned: 10,
      });
    }

    res.json(balance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
