// src/components/PrivateRoute.jsx
// Used to protect user-restricted pages for signed in users only

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ element }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  // 1. While we’re still checking localStorage, render nothing (or a spinner).
  if (isLoading) {
    return <div>Loading…</div>;
  }

  // 2. Once loading is done: if not authenticated, redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Otherwise, render the protected element
  return element;
};

export default PrivateRoute;
