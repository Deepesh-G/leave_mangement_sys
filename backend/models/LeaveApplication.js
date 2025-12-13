const mongoose = require("mongoose");

const LeaveApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["casual", "sick", "earned"], // ✅ MUST MATCH CONTROLLER
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    days: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },

    managerComments: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveApplication", LeaveApplicationSchema);
