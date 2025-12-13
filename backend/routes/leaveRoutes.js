const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/leaveController");

// =============================
// EMPLOYEE + MANAGER LEAVE ROUTES
// Base URL: /api/leave
// =============================

// Apply for leave (employee OR manager)
router.post("/apply", protect, ctrl.applyLeave);

// Get my leave applications
router.get("/my", protect, ctrl.getMyLeaves);

// Get my leave balance
router.get("/balance", protect, ctrl.getBalance);

// Cancel my leave (only pending)
router.patch("/cancel/:id", protect, ctrl.cancelLeave);

module.exports = router;
