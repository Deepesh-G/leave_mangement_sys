import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import Navbar from '../components/Navbar'; // ✅ Added Navbar for navigation

export default function ApplyLeave() {
  const { token } = useAuth();
  const nav = useNavigate();
  
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState('Casual');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    // 1. Basic Validation
    if (!start || !end || !reason) {
      return alert("Please fill in all fields");
    }

    if (new Date(start) > new Date(end)) {
      return alert("End date cannot be before start date");
    }

    setLoading(true);

    try {
      // ✅ Correct API Route for Employees
      const res = await fetch(`${API_BASE}/api/leave/apply`, {
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
        setLoading(false);
        return; 
      }

      alert('Leave applied successfully!');
      nav('/my-leaves'); // Redirect to "My Leaves" list

    } catch (e) { 
      console.error(e);
      alert('Network error. Please try again.'); 
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Navbar /> {/* ✅ Show Navbar */}

      <div className="auth-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h2>Apply for Leave</h2>

        <div className="form-group">
          <label>Start Date</label>
          <input 
            type="date" 
            className="input" 
            value={start} 
            onChange={e => setStart(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>End Date</label>
          <input 
            type="date" 
            className="input" 
            value={end} 
            onChange={e => setEnd(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Leave Type</label>
          <select 
            className="input" 
            value={type} 
            onChange={e => setType(e.target.value)}
          >
            <option value="casual">Casual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="earned">Earned Leave</option>
          </select>
        </div>

        <div className="form-group">
          <label>Reason</label>
          <textarea 
            className="input" 
            value={reason} 
            onChange={e => setReason(e.target.value)} 
            rows="4"
            placeholder="Why do you need leave?"
          ></textarea>
        </div>

        <button 
          className="btn-primary" 
          onClick={submit} 
          disabled={loading}
          style={{ marginTop: 10, width: '100%' }}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
