const LeaveApplication = require("../models/LeaveApplication");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");

// ✅ HELPER: Matches Frontend values ("casual") to Database fields ("casual")
const getBalanceKey = (leaveType) => {
  if (!leaveType) return null;
  const lower = leaveType.toLowerCase().trim();
  
  // 1. Direct match (Since you updated frontend to small case)
  if (lower === "casual") return "casual";
  if (lower === "sick") return "sick";
  if (lower === "earned") return "earned";
  
  // 2. Fallback (If frontend sends "Casual Leave")
  if (lower.includes("casual")) return "casual";
  if (lower.includes("sick")) return "sick";
  if (lower.includes("earned")) return "earned";
  
  return null; 
};

/* ============================================================
   1. APPLY LEAVE (Fixed 500 Error & Safe Deduction)
============================================================ */
exports.applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;

    // 1. Validate Fields
    if (!startDate || !endDate || !leaveType)
      return res.status(400).json({ message: "Missing fields" });

    // 2. Validate Dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end)
      return res.status(400).json({ message: "End date must be after start date" });

    const days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

    if (isNaN(days) || days < 0) {
        return res.status(400).json({ message: "Invalid day calculation" });
    }

    // 3. Determine Role (Safe Check)
    const userRole = req.user && req.user.role ? req.user.role : 'employee';
    const isManager = userRole === 'manager';
    
    const initialStatus = isManager ? "Approved" : "Pending";
    const managerComment = isManager ? "Self Approved" : "";

    // 4. MANAGER AUTO-DEDUCTION (Wrapped in try/catch to prevent 500 crash)
    if (isManager) {
       try {
         const balance = await LeaveBalance.findOne({ userId: req.user.userId });
         
         // Get the correct database key (casual/sick/earned)
         const key = getBalanceKey(leaveType); 

         if (balance && key && balance[key] !== undefined) {
           balance[key] = Math.max(0, balance[key] - days);
           await balance.save();
         }
       } catch (error) {
         console.error("Manager auto-deduction failed (ignoring):", error);
         // We continue creating the leave even if deduction fails
       }
    }

    // 5. Create Leave
    const leave = await LeaveApplication.create({
      userId: req.user.userId,
      startDate,
      endDate,
      leaveType, // Saves "casual", "sick", etc.
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
   6. APPROVE LEAVE (Safe Deduction Logic)
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

    // ✅ DEDUCTION LOGIC
    try {
      const balance = await LeaveBalance.findOne({ userId: leave.userId._id });
      if (balance) {
        // Use helper to match "casual" correctly
        const key = getBalanceKey(leave.leaveType); 
        
        if (key && balance[key] !== undefined) {
          balance[key] = Math.max(0, balance[key] - leave.days);
          await balance.save();
        }
      }
    } catch (deductErr) {
       console.error("Balance deduction error:", deductErr);
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
      status: { $regex: /^approved$/i }, 
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
