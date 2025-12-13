import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ⚡ OPTIMIZATION: Use a function () => to read localStorage only once on load
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from local storage", error);
      return null;
    }
  });

  // Optional: Sync state to localStorage automatically if it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (data) => {
    // Expects data = { token: "...", user: { role: "manager", ... } }
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setToken('');
    setUser(null);
    // localStorage is cleared by the useEffects above automatically
    // But forcing it here is also fine for safety
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
