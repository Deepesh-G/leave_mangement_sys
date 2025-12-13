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

    // ✅ FIXED: Correct Manager Route for fetching balance
    fetch(`${API_BASE}/api/manager/leave/balance/${id}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setBalance(data);
        setCasual(data.casual || 0);
        setSick(data.sick || 0);
        setEarned(data.earned || 0);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load leave balance or unauthorized.");
        nav("/manager");
      });
  }, [id, token, nav]);

  const save = async () => {
    // ✅ FIXED: Correct Manager Route for updating balance
    const res = await fetch(`${API_BASE}/api/manager/leave/edit-balance/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      // Ensure we send Numbers, not strings
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
        {/* Note: The balance object usually contains userId with name, check your schema */}
        <p><strong>Employee ID:</strong> {id}</p>

        <div className="form-group">
          <label>Casual Leave</label>
          <input 
            type="number" 
            className="input"
            value={casual} 
            onChange={e => setCasual(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Sick Leave</label>
          <input 
            type="number" 
            className="input"
            value={sick} 
            onChange={e => setSick(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Earned Leave</label>
          <input 
            type="number" 
            className="input"
            value={earned} 
            onChange={e => setEarned(e.target.value)} 
          />
        </div>

        <button className="btn btn-primary" onClick={save} style={{ marginTop: 12 }}>
          Save Changes
        </button>
        
        <button 
          className="btn" 
          onClick={() => nav("/manager")} 
          style={{ marginTop: 12, marginLeft: 10, background: "#ccc" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
