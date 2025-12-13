import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from '../config';
import Navbar from "../components/Navbar"; // ✅ Added Navbar
import "../styles/main.css";

export default function TeamHistory() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    // ✅ FIX: Added /leave to the path to match your other routes
    fetch(`${API_BASE}/api/manager/leave/team-history`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => res.json())
      .then((data) => {
          setHistory(Array.isArray(data) ? data : []);
          setLoading(false);
      })
      .catch(() => {
          setHistory([]);
          setLoading(false);
      });
  }, [token]);

  return (
    <div className="container">
      <Navbar /> {/* ✅ Added Navbar */}

      <div className="header">
         <h2>Team Leave History</h2>
      </div>

      <div className="card">
        {loading ? (
            <p>Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-muted">No team leave history available.</p>
        ) : (
          history.map((h) => (
            <div className="list-item" key={h._id}>
              <div>
                <strong>{h.userId?.name || "Unknown"}</strong> — {h.leaveType}
                
                <div className="text-muted" style={{marginTop: 4}}>
                  {new Date(h.startDate).toLocaleDateString()} →{" "}
                  {new Date(h.endDate).toLocaleDateString()}
                </div>

                {h.managerComments && (
                  <div style={{ marginTop: 8, fontStyle: "italic", fontSize: '0.9rem' }}>
                    Manager comment: {h.managerComments}
                  </div>
                )}

                <div style={{ marginTop: 6 }}>
                  Status: 
                  <span className={`status-${h.status.toLowerCase()}`} style={{marginLeft: 6, fontWeight: 'bold'}}>
                    {h.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
