import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {   // ✅ FIXED API URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Login failed');
        return;
      }

      // Save in context
      login(data);

      // Redirect based on role
      if (data.user.role === 'manager') nav('/manager');
      else nav('/employee');

    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>

      <input 
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button className="btn-primary" style={{ marginTop: 12 }} onClick={submit}>
        Login
      </button>

      <p style={{ marginTop: 12 }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
