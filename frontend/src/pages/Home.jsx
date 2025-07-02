// Website's Home Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const [latestItems, setLatestItems] = useState([]);
  const [currentAd, setCurrentAd]     = useState(0);
  const navigate = useNavigate();

  // List your rotating‐ad image URLs here
  const ads = [
    "/images/ad1.png?v=2",
    "/images/ad2.png?v=2",
    "/images/ad3.png?v=2"
  ];

  // Fetch latest market items
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/latest_market`)
      .then(r => r.json())
      .then(setLatestItems)
      .catch(console.error);
  }, []);

  // Rotate ads every 5 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentAd(i => (i + 1) % ads.length);
    }, 5000);
    return () => clearInterval(iv);
  }, [ads.length]);

  return (
    <>
      {/* ─── Hero (identical to older version) ───────────────────────────────── */}
      <header className="home-hero">
        <img
          src="/images/banner.jpeg"
          alt="Funko Pops Banner"
          className="hero-bg"
        />
        <div className="hero-overlay">
          <h1>Welcome to Pop-Market</h1>
          <p>Buy, sell & discover rare Funko Pops</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/market')}
          >
            Browse Market
          </button>
        </div>
      </header>

      <main>
        <section className="latest-section">
          <h2>Latest on Pop-Market</h2>
          <div className="latest-grid">
            {latestItems.map(item => (
              <div className="latest-card" key={item.id ?? item.market_id}>
                <img
                  src={item.picture}
                  alt={item.pop_name}
                  className="latest-img"
                />
                <h4>{item.pop_name}</h4>
                <p className="latest-price">₪{parseFloat(item.price).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ad-section">
          <img
            src={ads[currentAd]}
            alt={`Advertisement ${currentAd + 1}`}
            className="ad-image"
          />
        </section>

        <section className="footer-placeholder">
          <p>✨ More exciting features coming soon… ✨</p>
        </section>
      </main>
    </>
  );
}

export default Home;
