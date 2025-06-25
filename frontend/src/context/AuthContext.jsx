// src/context/AuthContext.jsx
// Page to verify a signed in user through JWToken

import React, { createContext, useState, useEffect } from 'react';

// Create context
export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  login: (_token) => {},
  logout: () => {},
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if a token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // If you want to verify expiration, decode here.
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    // Finished checking localStorage
    setIsLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
