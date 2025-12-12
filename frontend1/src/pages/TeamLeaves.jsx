import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from '../config';

export default function TeamLeaves() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/manager/team-leaves`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => res.json())
      .then((data) => setLeaves(Array.isArray(data) ? data : []))
      .catch(() => setLeaves([]));
  }, [token]);

  // Approve or Reject
  const act = async (id, action) => {
    const comments = prompt("Manager comment (optional)") || "";

    const res = await fetch(`${API_BASE}/api/leave/${action}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ managerComments: comments })
    });

    const data = await res.json();
    alert(data.message || "Done");

    if (data.leave) {
      setLeaves((prev) =>
        prev.map((l) => (l._id === id ? data.leave : l))
      );
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
                <strong>{l.userId?.name}</strong> — {l.leaveType}
                <div className="text-muted">
                  {new Date(l.startDate).toLocaleDateString()} →{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                </div>
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
                      style={{ marginLeft: 8 }}
                    >
                      Reject
                    </button>
                  </>
                )}

                {l.status !== "Pending" && (
                  <span style={{ fontStyle: "italic" }}>
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
