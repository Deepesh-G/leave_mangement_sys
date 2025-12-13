import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";

export default function ApplyLeave() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState("casual");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!startDate || !endDate || !reason) {
      alert("Please fill all fields");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("End date cannot be before start date");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/leave/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          leaveType,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to apply leave");
        setLoading(false);
        return;
      }

      alert("Leave applied successfully");
      navigate("/my-leaves");
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Navbar />

      <div className="auth-container" style={{ maxWidth: 600, margin: "40px auto" }}>
        <h2>Apply Leave</h2>

        <label>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label>End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <label>Leave Type</label>
        <select
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
        >
          <option value="casual">Casual Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="earned">Earned Leave</option>
        </select>

        <label>Reason</label>
        <textarea
          rows="4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for leave"
        />

        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading}
          style={{ width: "100%", marginTop: 12 }}
        >
          {loading ? "Submitting..." : "Apply Leave"}
        </button>
      </div>
    </div>
  );
}
