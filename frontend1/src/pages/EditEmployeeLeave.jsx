import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ Import Link and useNavigate
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { API_BASE } from '../config';
import "../styles/main.css";

export default function ManagerDashboard() {
  const { token, user } = useAuth();
  const [team, setTeam] = useState([]);
  const navigate = useNavigate(); // ✅ Hook for navigation

  // Date filters for Calendar
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch manager's team
  useEffect(() => {
    if (!token) return;

    // NOTE: This assumes you have a "team-list" route in managerRoutes.js
    // If this returns 404, ensure your backend has: router.get('/team-list', ...)
    fetch(`${API_BASE}/api/manager/team-list`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch team");
        return res.json();
      })
      .then((data) => setTeam(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Team fetch error:", err);
        setTeam([]);
      });
  }, [token]);

  // Navigate to calendar with filters
  const goToCalendar = () => {
    // ✅ Uses React Router instead of window.location (No reload!)
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
          {/* Manager Code */}
          <div className="card">
            <h3>Your Manager Code</h3>
            <p className="code-box">{user?.managerCode || "N/A"}</p>
          </div>

          {/* Team List */}
          <div className="card" style={{ marginTop: 14 }}>
            <h3>Your Team Members</h3>

            {team.length === 0 ? (
              <p>No employees assigned to you yet.</p>
            ) : (
              <>
                <p className="text-muted">Total Employees: {team.length}</p>

                {team.map((emp) => (
                  <div key={emp._id} className="list-item">
                    <strong>{emp.name}</strong>
                    <div className="text-muted">{emp.email}</div>

                    {/* Edit Leave Link */}
                    <p style={{ marginTop: 6 }}>
                      <Link 
                        to={`/edit-leave/${emp._id}`}
                        style={{ color: "#0A58CA", fontWeight: 500, textDecoration: 'none' }}
                      >
                        ✏️ Edit Leave Balance
                      </Link>
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <aside>
          {/* Quick Navigation */}
          <div className="card">
            <h3>Quick Actions</h3>
            {/* ✅ Using Link prevents full page reload */}
            <p><Link to="/team-leaves">View Team Leaves</Link></p>
            <p><Link to="/team-history">View Team History</Link></p>
            <p><Link to="/team-calendar">Team Calendar</Link></p>
          </div>

          {/* Calendar Filter */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Search Calendar by Date</h3>

            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                className="input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                className="input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={goToCalendar}>
              View in Calendar
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
