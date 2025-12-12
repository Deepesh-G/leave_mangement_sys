import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { API_BASE } from '../config';

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState(null);

  // Fetch leave balance from backend
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/leave/balance`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => res.json())
      .then((data) => setBalance(data))
      .catch(() => setBalance(null));
  }, [token]);

  return (
    <div className="container">
      <Navbar />

      <div className="header">
        <h2>Employee Dashboard</h2>
      </div>

      <div className="dashboard-grid">

        {/* LEFT COLUMN */}
        <div>
          {/* Welcome Card */}
          <div className="card">
            <h3>Welcome, {user?.name}</h3>
            <p>
              Manager Code: <strong>{user?.managerCode || "N/A"}</strong>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginTop: 12 }}>
            <h4>Quick Actions</h4>
            <p><a href="/apply">Apply Leave</a></p>
            <p><a href="/my-leaves">My Leaves</a></p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <aside>
          <div className="card">
            <h4>Leave Balance</h4>

            {!balance ? (
              <p>Loading...</p>
            ) : (
              <p>
                Casual: <strong>{balance.casual}</strong> |
                Sick: <strong>{balance.sick}</strong> |
                Earned: <strong>{balance.earned}</strong>
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
