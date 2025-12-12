import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

export default function EditEmployeeLeave() {
  const { id } = useParams();            // employee ID
  const { token } = useAuth();
  const nav = useNavigate();

  const [balance, setBalance] = useState(null);
  const [casual, setCasual] = useState(0);
  const [sick, setSick] = useState(0);
  const [earned, setEarned] = useState(0);

  // Load employee leave balance
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/leave/balance/${id}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then((data) => {
        setBalance(data);
        setCasual(data.casual);
        setSick(data.sick);
        setEarned(data.earned);
      })
      .catch(() => {
        alert("Failed to load leave balance");
        nav("/manager");
      });
  }, [id, token, nav]);

  const save = async () => {
    const res = await fetch(`${API_BASE}/api/leave/update-balance/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ casual, sick, earned })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.message || "Update failed");

    alert("Leave balance updated");
    nav("/manager");
  };

  if (!balance)
    return (
      <div className="container">
        <p>Loading leave details...</p>
      </div>
    );

  return (
    <div className="container">
      <h2>Edit Employee Leave Balance</h2>

      <div className="card">
        <p><strong>{balance.name || "Employee"}</strong></p>

        <label>Casual Leave</label>
        <input type="number" value={casual} onChange={e => setCasual(e.target.value)} />

        <label>Sick Leave</label>
        <input type="number" value={sick} onChange={e => setSick(e.target.value)} />

        <label>Earned Leave</label>
        <input type="number" value={earned} onChange={e => setEarned(e.target.value)} />

        <button className="btn-primary" onClick={save} style={{ marginTop: 12 }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
