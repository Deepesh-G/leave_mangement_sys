const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// ROUTES
const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const managerRoutes = require("./routes/managerRoutes");
const managerLeaveRoutes = require("./routes/managerLeaveRoutes");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Leave Management API running" });
});

// ROUTE MOUNTING
app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);          // Employee leave routes
app.use("/api/manager", managerRoutes);      // Manager info routes
app.use("/api/manager/leave", managerLeaveRoutes); // Manager approvals

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
