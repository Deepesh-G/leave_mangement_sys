import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authentication"; // ✅ FIXED
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";
import "../styles/main.css";

export default function ManagerDashboard() {
  const { token, user } = useAuth();
  const [team, setTeam] = useState([]);
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch team list
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/manager/leave/team-list`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setTeam(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Fetch team error:", err);
        setTeam([]);
      });
  }, [token]);

  const goToCalendar = () => {
    navigate(`/team-calendar?from=${fromDate || ""}&to=${toDate || ""}`);
  };

  return (
    <div className="container">
      <Navbar />

      <div className="header">
        <h2>Manager Dashboard</h2>
      </div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div>
          <div className="card">
            <h3>Your Profile</h3>
            <p><strong>Name:</strong> {user?.name}</p>
            <p>
              <strong>Manager Code:</strong>{" "}
              <span className="code-box">{user?.managerCode || "N/A"}</span>
            </p>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Share this code with new employees so they can join your team.
            </p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Your Team ({team.length})</h3>

            {team.length === 0 ? (
              <p className="text-muted">No employees found.</p>
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {team.map((emp) => (
                  <div key={emp._id} className="list-item">
                    <div>
                      <strong>{emp.name}</strong>
                      <div className="text-muted">{emp.email}</div>
                    </div>
                    <Link to={`/edit-leave/${emp._id}`} style={{ fontSize: "0.85rem" }}>
                      Edit Balance
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <aside>
          <div className="card">
            <h3>Inbox & Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link to="/team-leaves" className="btn-primary" style={{ textAlign: "center" }}>
                📬 View Pending Requests
              </Link>
              <Link to="/team-history" className="btn" style={{ textAlign: "center" }}>
                📜 View Past History
              </Link>
              <Link to="/team-calendar" className="btn" style={{ textAlign: "center" }}>
                📅 View Team Calendar
              </Link>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Search Calendar</h3>
            <label>From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <label>To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <button className="btn-primary" onClick={goToCalendar} style={{ width: "100%", marginTop: 10 }}>
              Go
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
