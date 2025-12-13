import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authentication"; // ✅ FIXED

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ApplyLeave from "./pages/ApplyLeave";
import MyLeaves from "./pages/MyLeaves";
import TeamLeaves from "./pages/TeamLeaves";
import TeamHistory from "./pages/TeamHistory";
import TeamCalendar from "./pages/TeamCalendar";
import EditEmployeeLeave from "./pages/EditEmployeeLeave";

function RequireAuth({ children, allowedRole }) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/" />;

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* EMPLOYEE ROUTES */}
          <Route
            path="/employee-dashboard"
            element={
              <RequireAuth allowedRole="employee">
                <EmployeeDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/apply"
            element={
              <RequireAuth allowedRole="employee">
                <ApplyLeave />
              </RequireAuth>
            }
          />
          <Route
            path="/my-leaves"
            element={
              <RequireAuth allowedRole="employee">
                <MyLeaves />
              </RequireAuth>
            }
          />

          {/* MANAGER ROUTES */}
          <Route
            path="/manager-dashboard"
            element={
              <RequireAuth allowedRole="manager">
                <ManagerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/team-leaves"
            element={
              <RequireAuth allowedRole="manager">
                <TeamLeaves />
              </RequireAuth>
            }
          />
          <Route
            path="/team-history"
            element={
              <RequireAuth allowedRole="manager">
                <TeamHistory />
              </RequireAuth>
            }
          />
          <Route
            path="/team-calendar"
            element={
              <RequireAuth allowedRole="manager">
                <TeamCalendar />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-leave/:id"
            element={
              <RequireAuth allowedRole="manager">
                <EditEmployeeLeave />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
