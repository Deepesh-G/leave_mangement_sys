import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

export default function ApplyLeave() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState('Casual');
  const [reason, setReason] = useState('');

  const submit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leave/apply`, {   // ✅ FIXED API_BASE usage
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: 'Bearer ' + token 
        },
        body: JSON.stringify({ 
          startDate: start, 
          endDate: end, 
          leaveType: type, 
          reason 
        })
      });

      const d = await res.json();
      if (!res.ok) { 
        alert(d.message || 'Apply failed'); 
        return; 
      }

      alert('Leave applied');
      nav('/my-leaves');

    } catch (e) { 
      alert('Network error'); 
    }
  };

  return (
    <div className="auth-container">
      <h2>Apply Leave</h2>

      <label>Start date</label>
      <input type="date" value={start} onChange={e => setStart(e.target.value)} />

      <label>End date</label>
      <input type="date" value={end} onChange={e => setEnd(e.target.value)} />

      <label>Type</label>
      <select value={type} onChange={e => setType(e.target.value)}>
        <option>Casual</option>
        <option>Sick</option>
        <option>Earned</option>
      </select>

      <label>Reason</label>
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows="4"></textarea>

      <button className="btn-primary" onClick={submit} style={{ marginTop: 10 }}>
        Submit
      </button>
    </div>
  );
}
