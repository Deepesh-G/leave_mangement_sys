import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

export default function MyLeaves() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);

  // Fetch leaves
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/leave/my`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setLeaves(Array.isArray(data) ? data : []))
      .catch(() => setLeaves([]));
  }, [token]);

  // Cancel Leave
  const cancelLeave = async (id) => {
    if (!window.confirm("Cancel this leave?")) return;

    const res = await fetch(`${API_BASE}/api/leave/cancel/${id}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();
    alert(data.message || "Updated");

    if (res.ok) {
      setLeaves((prev) => prev.filter((l) => l._id !== id));
    }
  };

  return (
    <div className="container">
      <h2>My Leaves</h2>

      <div className="card">
        {leaves.length === 0 ? (
          <p>No leaves found</p>
        ) : (
          leaves.map((l) => (
            <div className="list-item" key={l._id}>
              <div>
                <strong>{l.leaveType}</strong>

                <div className="text-muted">
                  {new Date(l.startDate).toLocaleDateString()} —{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                </div>

                <div style={{ marginTop: 6, fontWeight: "600" }}>
                  Status:{" "}
                  <span
                    style={{
                      color:
                        l.status === "Approved"
                          ? "green"
                          : l.status === "Rejected"
                          ? "red"
                          : "#b58900",
                    }}
                  >
                    {l.status}
                  </span>
                </div>

                {l.managerComments && (
                  <div style={{ marginTop: 8, fontStyle: "italic", color: "#444" }}>
                    Manager: {l.managerComments}
                  </div>
                )}
              </div>

              {l.status === "Pending" && (
                <button
                  className="btn-danger"
                  style={{ marginTop: 10 }}
                  onClick={() => cancelLeave(l._id)}
                >
                  Cancel Leave
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
