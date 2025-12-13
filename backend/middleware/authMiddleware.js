const jwt = require("jsonwebtoken");

/* ============================================================
   AUTH — PROTECT ROUTES (FIXED)
============================================================ */
exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX: Support BOTH id and userId
    req.user = {
      userId: decoded.userId || decoded.id,
      role: decoded.role,
    };

    if (!req.user.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* ============================================================
   ROLE CHECKER
============================================================ */
exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};
