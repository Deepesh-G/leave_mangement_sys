import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext"; // ✅ FIXED IMPORT
import { API_BASE } from '../config';
import Navbar from '../components/Navbar';

export default function ApplyLeave() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState('casual');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!start || !end || !reason) {
      return alert("Please fill in all fields");
    }

    if (new Date(start) > new Date(end)) {
      return alert("End date cannot be before start date");
    }

    if (!token) {
      return alert("You are not logged in");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/leave/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          leaveType: type,
          reason,
        }),
      });

      const d = await res.json();

      if (!res.ok) {
        alert(d.message || 'Apply failed');
        setLoading(false);
        return;
      }

      alert('Leave applied successfully!');
      nav('/my-leaves');

    } catch (e) {
      console.error(e);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Navbar />

      <div className="auth-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h2>Apply for Leave</h2>

        <label>Start Date</label>
        <input type="date" value={start} onChange={e => setStart(e.target.value)} />

        <label>End Date</label>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} />

        <label>Leave Type</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="casual">Casual Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="earned">Earned Leave</option>
        </select>

        <label>Reason</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} />

        <button onClick={submit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
