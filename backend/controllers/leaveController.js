const LeaveApplication = require("../models/LeaveApplication");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");

// ✅ SMART MATCHER: Forces "Casual Leave" -> "casual"
// This handles the mismatch if Frontend sends "Casual" but DB needs "casual"
const getBalanceKey = (leaveType) => {
  if (!leaveType) return null;
  const lower = leaveType.toLowerCase();
  
  if (lower.includes("casual")) return "casual";
  if (lower.includes("sick")) return "sick";
  if (lower.includes("earned") || lower.includes("privilege")) return "earned";
  
  return null; 
};

/* ============================================================
   1. APPLY LEAVE (Fixed 500 Error & Date Validation)
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

    // ✅ VALIDATION: Check if dates are real
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end)
      return res.status(400).json({ message: "End date must be after start date" });

    // Calculate Days
    const days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

    // ✅ SAFETY CHECK: Ensure 'days' is a valid number before saving
    if (isNaN(days) || days < 0) {
        return res.status(400).json({ message: "Invalid day calculation" });
    }

    // Determine Role
    const isManager = req.user.role === 'manager';
    const initialStatus = isManager ? "Approved" : "Pending";
    const managerComment = isManager ? "Self Approved" : "";

    // ✅ MANAGER AUTO-DEDUCT (Wrapped in Safety Logic)
    if (isManager) {
       try {
         const balance = await LeaveBalance.findOne({ userId: req.user.userId });
         const key = getBalanceKey(leaveType); // Smart Match

         if (balance && key && balance[key] !== undefined) {
           console.log(`[Auto-Deduct] Manager taking ${days} days of ${key}`);
           balance[key] = Math.max(0, balance[key] - days);
           await balance.save();
         }
       } catch (balanceErr) {
         console.error("Warning: Manager balance update failed (ignoring)", balanceErr);
         // We do NOT stop the leave creation if balance fails
       }
    }

    // Create Leave Application
    const leave = await LeaveApplication.create({
      userId: req.user.userId,
      startDate,
      endDate,
      leaveType,
      reason,
      days,
      status: initialStatus,
      managerComments: managerComment
    });

    res.json({ message: `Leave applied successfully (${initialStatus})`, leave });

  } catch (err) {
    console.error("Apply Leave Error:", err);
    res.status(500).json({ message: "Server error processing application" });
  }
};

/* ============================================================
   2. GET MY LEAVES
============================================================ */
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   3. CANCEL LEAVE
============================================================ */
exports.cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveApplication.findOne({ _id: id, userId: req.user.userId });

    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "Pending") return res.status(400).json({ message: "Only pending leaves can be cancelled" });

    leave.status = "Cancelled";
    await leave.save();
    res.json({ message: "Leave cancelled", leave });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4. GET TEAM LEAVES
============================================================ */
exports.getTeamLeaves = async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.userId });
    const ids = employees.map((e) => e._id);
    const leaves = await LeaveApplication.find({ userId: { $in: ids } })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5. GET MY TEAM
============================================================ */
exports.getMyTeam = async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.userId }).select("name email role managerCode");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   6. APPROVE LEAVE (Manager)
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

    // Deduct Balance Logic
    const balance = await LeaveBalance.findOne({ userId: leave.userId._id });
    if (balance) {
      const key = getBalanceKey(leave.leaveType); 
      
      console.log(`Approving: ${leave.leaveType} -> Key: ${key}`);

      if (key && balance[key] !== undefined) {
        balance[key] = Math.max(0, balance[key] - leave.days);
        await balance.save();
      }
    }

    res.json({ message: "Approved", leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   7. REJECT LEAVE
============================================================ */
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
   8. CALENDAR (Approved Only)
============================================================ */
exports.calendar = async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.userId });
    const ids = employees.map((e) => e._id);
    ids.push(req.user.userId);

    const leaves = await LeaveApplication.find({
      userId: { $in: ids },
      status: { $regex: /^approved$/i }, // Case insensitive check
    }).populate("userId", "name");

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.teamHistory = exports.getTeamLeaves;

/* ============================================================
   9. GET BALANCE
============================================================ */
exports.getBalance = async (req, res) => {
  try {
    const balance = await LeaveBalance.findOne({ userId: req.user.userId });
    res.json(balance || {});
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
