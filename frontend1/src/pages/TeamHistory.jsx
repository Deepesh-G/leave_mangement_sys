import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from '../config';


export default function TeamHistory() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/manager/team-history`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, [token]);

  return (
    <div className="container">
      <h2>Team Leave History</h2>

      <div className="card">
        {history.length === 0 ? (
          <p>No team leave history available.</p>
        ) : (
          history.map((h) => (
            <div className="list-item" key={h._id}>
              <div>
                <strong>{h.userId?.name}</strong> — {h.leaveType}
                
                <div className="text-muted">
                  {new Date(h.startDate).toLocaleDateString()} →{" "}
                  {new Date(h.endDate).toLocaleDateString()}
                </div>

                {h.managerComments && (
                  <div style={{ marginTop: 8, fontStyle: "italic" }}>
                    Manager comment: {h.managerComments}
                  </div>
                )}

                <div style={{ marginTop: 6, color: "#0A58CA" }}>
                  Status: <strong>{h.status}</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
