// General page layout
import React from 'react';
import Navbar from './Navbar'; 
import Footer from './Footer'; 
import { Outlet } from 'react-router-dom';
import '../styles/Common.css'; // Create this file if it doesn't exist

function Layout() {
  return (
    <div className="layout-container">
      <Navbar />
      <main className="layout-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
