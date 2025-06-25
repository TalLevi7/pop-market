// src/pages/About.jsx
// 'About' page
import React from 'react';
import '../styles/About.css';  // Create this CSS for styling

export default function About() {
  return (
    <main className="about-container">
      <h1>About PopMarket</h1>
      <p>
        Welcome to <strong>PopMarket</strong> – the ultimate marketplace for Funko Pop collectors and fans.
        Whether you're hunting for a rare grail, browsing the latest releases,
        or listing figures from your personal collection, PopMarket is your go-to place to buy, sell, and connect with fellow enthusiasts.
      </p>
      <p>
      Our mission is to create a simple, trustworthy, and fun platform where collectors can trade with confidence.
      Every listing is reviewed to maintain quality and authenticity, and our smart filters make it easy to discover exactly what you're looking for.
      </p>
      <p>
        Thank you for being part of the PopMarket community! If you have any
        questions or suggestions, <br /> feel free to <a href="/contactus">contact us</a>.
      </p>
    </main>
  );
}
