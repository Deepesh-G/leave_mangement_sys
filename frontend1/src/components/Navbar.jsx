import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/main.css'; // Ensure styles are loaded

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <nav className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* LEFT SIDE: Logo & Home Link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, background: '#16a34a', borderRadius: '50%' }}></div>
        <Link 
          to={user?.role === 'manager' ? '/manager-dashboard' : '/employee-dashboard'} 
          style={{ textDecoration: 'none', color: '#333', fontSize: '1.1rem' }}
        >
          <strong>Leave Management</strong>
        </Link>
      </div>

      {/* MIDDLE: Navigation Links (Only if logged in) */}
      {user && (
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Common Link */}
          <Link to={user.role === 'manager' ? '/manager-dashboard' : '/employee-dashboard'} className="nav-link">
            Dashboard
          </Link>

          {/* Employee Specific Links */}
          {user.role === 'employee' && (
            <>
              <Link to="/apply-leave" className="nav-link">Apply Leave</Link>
              <Link to="/my-leaves" className="nav-link">My Leaves</Link>
            </>
          )}

          {/* Manager Specific Links */}
          {user.role === 'manager' && (
            <>
              <Link to="/team-leaves" className="nav-link">Team Inbox</Link>
              <Link to="/team-calendar" className="nav-link">Calendar</Link>
            </>
          )}
        </div>
      )}

      {/* RIGHT SIDE: User Info & Logout */}
      <div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#555', fontSize: '0.9rem' }}>
              Hi, <strong>{user.name}</strong> ({user.role})
            </span>
            <button 
              onClick={handleLogout} 
              className="btn" 
              style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#e74c3c' }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/" style={{ textDecoration: 'none', color: '#0A58CA' }}>Login</Link>
        )}
      </div>
    </nav>
  );
}
