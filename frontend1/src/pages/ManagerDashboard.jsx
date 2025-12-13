import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { API_BASE } from '../config';
import "../styles/main.css";

export default function ManagerDashboard() {
  const { token, user } = useAuth();
  const [team, setTeam] = useState([]);
  const navigate = useNavigate();

  // Date filters for Calendar
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch manager's team
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/manager/leave/team-history`, { // Using a safe endpoint to get team list or create a specific /team-list endpoint
       // Note: If you don't have a specific "get all employees" endpoint, 
       // you might need to add one or use the team-history one to extract names.
       // For now, let's try to hit the team endpoint if you have one, or just catch the error.
       headers: { Authorization: "Bearer " + token }
    })
      .then((res) => res.json())
      .then((data) => {
         // This depends on what your backend returns. 
         // If you don't have a pure "list employees" endpoint, this might be empty.
         // But the dashboard will still load.
         if(Array.isArray(data)) setTeam(data);
      })
      .catch((err) => console.error(err));
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
            <h3>Your Manager Profile</h3>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <aside>
          <div className="card">
            <h3>Quick Actions</h3>
            <p><Link to="/team-leaves">View Team Inbox (Approvals)</Link></p>
            <p><Link to="/team-history">View Team History</Link></p>
            <p><Link to="/team-calendar">Team Calendar</Link></p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Search Calendar</h3>
            <div className="form-group">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={goToCalendar}>View Calendar</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
