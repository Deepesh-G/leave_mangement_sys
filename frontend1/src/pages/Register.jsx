import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from '../config';

export default function Register() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [managerCode, setManagerCode] = useState("");

  const submit = async () => {
    if (!name || !email || !password) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      name,
      email: email.trim().toLowerCase(),
      password,
      role,
    };

    if (role === "employee") {
      if (!managerCode.trim()) {
        alert("Manager code is required for employees");
        return;
      }
      payload.managerCode = managerCode.trim();
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      if (role === "manager" && data.managerCode) {
        alert(`Manager Registered Successfully!\n\nYour Manager Code: ${data.managerCode}`);
      } else {
        alert("Employee Registered Successfully");
      }

      nav("/");
    } catch (e) {
      alert("Network error");
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>

      <input
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>

        {role === "employee" && (
          <input
            placeholder="Manager Code (MGR-12345)"
            value={managerCode}
            onChange={(e) => setManagerCode(e.target.value)}
          />
        )}
      </div>

      <button className="btn-primary" style={{ marginTop: 12 }} onClick={submit}>
        Register
      </button>
    </div>
  );
}
