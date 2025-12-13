import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from '../config';

export default function TeamLeaves() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (!token) return;

    // ✅ FIXED: Updated URL to match managerLeaveRoutes.js
    // Was: /api/manager/team-leaves (Wrong)
    // Now: /api/manager/leave/team (Correct)
    fetch(`${API_BASE}/api/manager/leave/team`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setLeaves(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setLeaves([]);
      });
  }, [token]);

  // Approve or Reject
  const act = async (id, action) => {
    const comments = prompt("Manager comment (optional)") || "";
    
    // Ensure action is lowercase to match route ("approve" or "reject")
    const actionUrl = action.toLowerCase();

    // ✅ FIXED: Updated URL to match managerLeaveRoutes.js
    // Was: /api/leave/... (Wrong - this is for employees)
    // Now: /api/manager/leave/... (Correct - this is for managers)
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

      alert(data.message || "Done");

      // Update UI instantly without refreshing
      if (data.leave || data.leaveRequest) {
        // Backend might return "leave" or "leaveRequest" depending on controller
        const updatedLeave = data.leave || data.leaveRequest; 
        setLeaves((prev) =>
          prev.map((l) => (l._id === id ? updatedLeave : l))
        );
      } else {
        // Fallback: simple status update if backend didn't return full object
        setLeaves((prev) =>
            prev.map((l) => (l._id === id ? { ...l, status: action === "approve" ? "Approved" : "Rejected" } : l))
        );
      }
    } catch (error) {
      console.error("Action error:", error);
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="container">
      <h2>Team Leaves</h2>

      <div className="card">
        {leaves.length === 0 ? (
          <p>No team leave requests available.</p>
        ) : (
          leaves.map((l) => (
            <div className="list-item" key={l._id}>
              <div>
                <strong>{l.userId?.name || "Unknown User"}</strong> — {l.leaveType}
                <div className="text-muted">
                  {new Date(l.startDate).toLocaleDateString()} →{" "}
                  {new Date(l.endDate).toLocaleDateString()} ({l.days} days)
                </div>
                {l.reason && <div style={{ fontSize: "0.9em", color: "#555" }}>Reason: {l.reason}</div>}
              </div>

              {/* Buttons */}
              <div style={{ marginTop: 8 }}>
                {l.status === "Pending" && (
                  <>
                    <button onClick={() => act(l._id, "approve")}>
                      Approve
                    </button>
                    <button
                      onClick={() => act(l._id, "reject")}
                      style={{ marginLeft: 8, backgroundColor: "#e74c3c" }}
                    >
                      Reject
                    </button>
                  </>
                )}

                {l.status !== "Pending" && (
                  <span style={{ 
                    fontStyle: "italic", 
                    fontWeight: "bold",
                    color: l.status === "Approved" ? "green" : "red" 
                  }}>
                    Status: {l.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
