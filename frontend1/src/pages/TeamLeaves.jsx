import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from '../config';
import Navbar from "../components/Navbar";
import "../styles/main.css";

export default function TeamLeaves() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Pending Leaves using the NEW route
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/manager/leave/team`, {
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

  // ✅ Handle Approve/Reject
  const act = async (id, action) => {
    if(!window.confirm(`Are you sure you want to ${action}?`)) return;

    const comments = prompt("Optional Manager Comments:") || "";
    const actionUrl = action.toLowerCase(); // "approve" or "reject"

    try {
      const res = await fetch(`${API_BASE}/api/manager/leave/${actionUrl}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ managerComments: comments })
      });

      const data = await res.json();
      
      if (!res.ok) {
        alert(data.message || "Error processing request");
        return;
      }

      alert("Success!");
      // Update UI instantly
      setLeaves(prev => prev.filter(l => l._id !== id));

    } catch (error) {
      console.error("Action error:", error);
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="container">
      <Navbar />
      
      <div className="header">
        <h2>Team Inbox (Pending Requests)</h2>
      </div>

      <div className="card">
        {loading ? (
            <p>Loading requests...</p>
        ) : leaves.length === 0 ? (
          <p className="text-muted">No pending leave requests found.</p>
        ) : (
          leaves.map((l) => (
            <div className="list-item" key={l._id}>
              <div>
                <strong style={{fontSize:'1.1rem', color: '#0056b3'}}>
                    {l.userId?.name || "Unknown Employee"}
                </strong> 
                <span style={{margin: '0 8px'}}>•</span>
                <span style={{fontWeight:600}}>{l.leaveType}</span>
                
                <div className="text-muted" style={{marginTop: 4}}>
                  {new Date(l.startDate).toLocaleDateString()} →{" "}
                  {new Date(l.endDate).toLocaleDateString()} 
                  <span style={{marginLeft: 8, fontWeight: 500}}>
                    ({l.days} days)
                  </span>
                </div>
                
                {l.reason && (
                    <div style={{ marginTop: 6, fontStyle: "italic", color: "#555", background: "#f8f9fa", padding: "6px", borderRadius: "4px" }}>
                        "{l.reason}"
                    </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {l.status === "Pending" && (
                  <>
                    <button 
                        className="btn-primary" 
                        onClick={() => act(l._id, "approve")}
                        style={{background: '#16a34a'}} 
                    >
                      ✔ Approve
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => act(l._id, "reject")}
                      style={{ background: "#dc2626" }} 
                    >
                      ✖ Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
