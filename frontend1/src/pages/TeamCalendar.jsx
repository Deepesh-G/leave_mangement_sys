import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from '../config';

export default function TeamCalendar() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);

  // Fetch team calendar (approved leaves)
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/leave/team-calendar`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => res.json())
      .then((data) => setLeaves(Array.isArray(data) ? data : []))
      .catch(() => setLeaves([]));
  }, [token]);

  return (
    <div className="container">
      <h2>Team Calendar</h2>

      <div className="card">
        {leaves.length === 0 ? (
          <p>No approved leaves to display</p>
        ) : (
          leaves.map((l) => (
            <div className="list-item" key={l._id}>
              <div>
                <strong>{l.userId?.name}</strong> — {l.leaveType}
                <div className="text-muted">
                  {new Date(l.startDate).toLocaleDateString()} →{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                </div>

                {l.managerComments && (
                  <div style={{ marginTop: 6, fontStyle: "italic", color: "#0057b8" }}>
                    Manager: {l.managerComments}
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
