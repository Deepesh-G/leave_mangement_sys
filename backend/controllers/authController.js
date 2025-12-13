const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LeaveBalance = require("../models/LeaveBalance");

// Generate readable & unique manager code
function generateManagerCode() {
  return "MGR-" + Math.floor(10000 + Math.random() * 90000);
}

/* ============================================================
   REGISTER USER
   ============================================================ */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, managerCode } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Check email exists
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password.trim(), 10);

    /* --------------------- MANAGER REGISTRATION --------------------- */
    if (role === "manager") {
      let code;
      let attempt = 0;

      // Try to generate a unique code
      while (attempt < 5) {
        code = generateManagerCode();
        const exists = await User.findOne({ managerCode: code });
        if (!exists) break;
        attempt++;
      }

      const manager = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
        role: "manager",
        managerCode: code,
      });

      await LeaveBalance.create({ userId: manager._id });

      return res.status(201).json({
        message: "Manager registered successfully",
        managerCode: code,
      });
    }

    /* --------------------- EMPLOYEE REGISTRATION --------------------- */
    if (role === "employee") {
      if (!managerCode) {
        return res.status(400).json({ message: "Manager code required" });
      }

      // ✅ FIX: Force Uppercase to match MGR-XXXX format exactly
      // This prevents "mgr-123" failing to find "MGR-123"
      const manager = await User.findOne({
        managerCode: managerCode.trim().toUpperCase(),
        role: "manager",
      });

      if (!manager) {
        return res.status(400).json({ message: "Invalid manager code" });
      }

      const employee = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
        role: "employee",
        managerId: manager._id, // ✅ Links employee to manager
      });

      await LeaveBalance.create({ userId: employee._id });

      return res.status(201).json({
        message: "Employee registered successfully",
      });
    }

    return res.status(400).json({ message: "Invalid role" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   LOGIN (Enhanced)
   ============================================================ */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ NEW: If user is employee, fetch their manager's code to display on dashboard
    let connectedManagerCode = null
