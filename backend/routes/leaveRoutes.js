const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/leaveController");

// =============================
// EMPLOYEE ROUTES
// Base URL in server.js: /api/leave
// =============================

// Apply for leave
router.post("/apply", protect, requireRole("employee"), ctrl.applyLeave);

// Get my leave applications
router.get("/my", protect, requireRole("employee"), ctrl.getMyLeaves);

// Get my leave balance
router.get("/balance", protect, requireRole("employee"), ctrl.getBalance);

// Cancel my leave
router.patch("/cancel/:id", protect, requireRole("employee"), ctrl.cancelLeave);

module.exports = router;
