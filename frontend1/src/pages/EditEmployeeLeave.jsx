import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authentication'; // ✅ FIXED
import { API_BASE } from '../config';

export default function EditEmployeeLeave() {
  const { id } = useParams();
  const { token } = useAuth();
  const nav = useNavigate();

  const [balance, setBalance] = useState(null);
  const [casual, setCasual] = useState(0);
  const [sick, setSick] = useState(0);
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/manager/leave/balance/${id}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(data => {
        setBalance(data);
        setCasual(data.casual || 0);
        setSick(data.sick || 0);
        setEarned(data.earned || 0);
      })
      .catch(() => {
        alert("Failed to load leave balance or unauthorized.");
        nav("/manager");
      });
  }, [id, token, nav]);

  const save = async () => {
    if (!token) return alert("Unauthorized"); // ✅ safety

    const res = await fetch(`${API_BASE}/api/manager/leave/edit-balance/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        casual: Number(casual),
        sick: Number(sick),
        earned: Number(earned)
      })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Update failed");

    alert("Leave balance updated successfully");
    nav("/manager");
  };

  if (!balance) return <p>Loading leave details...</p>;

  return (
    <div className="container">
      <h2>Edit Employee Leave Balance</h2>

      <div className="card">
        <p><strong>Employee ID:</strong> {id}</p>

        <label>Casual Leave</label>
        <input type="number" value={casual} onChange={e => setCasual(e.target.value)} />

        <label>Sick Leave</label>
        <input type="number" value={sick} onChange={e => setSick(e.target.value)} />

        <label>Earned Leave</label>
        <input type="number" value={earned} onChange={e => setEarned(e.target.value)} />

        <button onClick={save}>Save Changes</button>
        <button onClick={() => nav("/manager")}>Cancel</button>
      </div>
    </div>
  );
}
