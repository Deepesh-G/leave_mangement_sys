import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from '../config';
import Navbar from "../components/Navbar"; // ✅ Added Navbar
import "../styles/main.css";

export default function TeamCalendar() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch team calendar (approved leaves)
  useEffect(() => {
    if (!token) return;

    // ✅ FIX: URL changed from /team-calendar to /calendar (matches backend)
    fetch(`${API_BASE}/api/manager/leave/calendar`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => res.json())
      .then((data) => {
        setLeaves(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLeaves([]);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="container">
      <Navbar /> {/* ✅ Added Navbar */}
      
      <div className="header">
        <h2>Team Calendar (Approved Leaves)</h2>
      </div>

      <div className="card">
        {loading ? (
           <p>Loading calendar...</p>
        ) : leaves.length === 0 ? (
          <p className="text-muted">No approved leaves to display.</p>
        ) : (
          leaves.map((l) => (
            <div className="list-item" key={l._id}>
              <div>
                <strong style={{color: '#16a34a'}}>
                    {l.userId?.name || "Manager"}
                </strong> 
                <span style={{margin: '0 8px'}}>•</span>
                {l.leaveType}
                
                <div className="text-muted" style={{marginTop: 4}}>
                  {new Date(l.startDate).toLocaleDateString()} →{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                  <span style={{marginLeft: 8, fontWeight: 500}}>
                    ({l.days} days)
                  </span>
                </div>

                {l.managerComments && l.managerComments !== "Approved" && (
                  <div style={{ marginTop: 6, fontStyle: "italic", fontSize: '0.9rem', color: "#555" }}>
                    Note: {l.managerComments}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
