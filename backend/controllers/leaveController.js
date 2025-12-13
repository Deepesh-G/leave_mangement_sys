const LeaveApplication = require("../models/LeaveApplication");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");

/* ============================================================
   HELPER — Normalize leave type
============================================================ */
const getBalanceKey = (leaveType) => {
  if (!leaveType) return null;
  const lower = leaveType.toLowerCase().trim();

  if (lower.includes("casual")) return "casual";
  if (lower.includes("sick")) return "sick";
  if (lower.includes("earned")) return "earned";

  return null;
};

/* ============================================================
   1. APPLY LEAVE
============================================================ */
exports.applyLeave = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { startDate, endDate, leaveType, reason } = req.body;

    if (!startDate || !endDate || !leaveType) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const normalizedType = getBalanceKey(leaveType);
    if (!normalizedType) {
      return res.status(400).json({ message: "Invalid leave type" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const days =
      Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      return res.status(400).json({ message: "Invalid leave duration" });
    }

    const isManager = req.user.role === "manager";
    const status = isManager ? "Approved" : "Pending";

    // Manager self-approval deduction
    if (isManager) {
      try {
        const balance = await LeaveBalance.findOne({ userId: req.user.userId });
        if (balance && balance[normalizedType] !== undefined) {
          balance[normalizedType] = Math.max(
            0,
            balance[normalizedType] - days
          );
          await balance.save();
        }
      } catch (err) {
        console.error("Manager auto-deduction failed:", err);
      }
    }

    const leave = await LeaveApplication.create({
      userId: req.user.userId,
      startDate,
      endDate,
      leaveType: normalizedType, // ✅ ALWAYS normalized
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
  } catch {
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

    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending leaves can be cancelled" });
    }

    leave.status = "Cancelled";
    await leave.save();

    res.json({ message: "Leave cancelled", leave });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4. TEAM LEAVES
============================================================ */
exports.getTeamLeaves = async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.userId });
    const ids = employees.map((e) => e._id);

    const leaves = await LeaveApplication.find({
      userId: { $in: ids },
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5. APPROVE LEAVE
============================================================ */
exports.approveLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id).populate(
      "userId"
    );

    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "Pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    leave.status = "Approved";
    leave.managerComments = req.body.managerComments || "Approved";
    await leave.save();

    const balance = await LeaveBalance.findOne({
      userId: leave.userId._id,
    });

    if (balance && balance[leave.leaveType] !== undefined) {
      balance[leave.leaveType] = Math.max(
        0,
        balance[leave.leaveType] - leave.days
      );
      await balance.save();
    }

    res.json({ message: "Approved", leave });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   6. REJECT LEAVE
============================================================ */
exports.rejectLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.status = "Rejected";
    leave.managerComments = req.body.managerComments || "Rejected";
    await leave.save();

    res.json({ message: "Rejected", leave });
  } catch {
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
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   8. GET BALANCE
============================================================ */
exports.getBalance = async (req, res) => {
  try {
    const balance = await LeaveBalance.findOne({
      userId: req.user.userId,
    });
    res.json(balance || {});
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
