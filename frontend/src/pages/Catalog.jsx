// src/pages/Catalog.jsx
// Shows the whole pop catalog, with search / order-by options
// Signed-in users can also receive POP-suggestions based on an implemented AI Algorithm using their current collection as suggestion base
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';        // ← still used for wishlist/collection redirects
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import '../styles/Catalog.css';

function Catalog() {
  const [catalogData, setCatalogData]       = useState([]);
  const [wishlist, setWishlist]             = useState([]);       
  const [collectionIds, setCollectionIds]   = useState([]);
  const [searchText, setSearchText]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [sortBy, setSortBy]                 = useState(''); // ← new sort state

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL;

  // 1. Load entire catalog
  useEffect(() => {
    fetch(`${API_URL}/api/catalog`)
      .then(r => r.json())
      .then(data => setCatalogData(data))
      .catch(console.error);
  }, [API_URL]);

  // 2. Load wishlist (pop_id array) on mount (requires auth)
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load wishlist');
        return r.json();
      })
      .then(rows => {
        const popIds = rows.map(item => item.pop_id);
        setWishlist(popIds);
      })
      .catch(console.error);
  }, [API_URL, token]);

  // 3. Load user’s collectionIds (pop_id) on mount (requires auth)
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/collection`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load collection');
        return r.json();
      })
      .then(items => {
        const popIds = items.map(item => item.pop_id);
        setCollectionIds(popIds);
      })
      .catch(console.error);
  }, [API_URL, token]);

  // 4. Build dynamic category/sub‐category lists based on each other
  const categories = useMemo(
    () => Array.from(
      new Set(
        catalogData
          .filter(p => !subCategoryFilter || p.sub_category === subCategoryFilter)
          .map(p => p.category)
      )
    ).sort(),
    [catalogData, subCategoryFilter]
  );
  const subCategories = useMemo(
    () => Array.from(
      new Set(
        catalogData
          .filter(p => !categoryFilter || p.category === categoryFilter)
          .map(p => p.sub_category)
      )
    ).sort(),
    [catalogData, categoryFilter]
  );

  // 5. Apply search & both filters
  const filtered = useMemo(
    () =>
      catalogData.filter(p => {
        const matchesText = p.pop_name
          .toLowerCase()
          .includes(searchText.toLowerCase());
        const matchesCat = !categoryFilter || p.category === categoryFilter;
        const matchesSub = !subCategoryFilter || p.sub_category === subCategoryFilter;
        return matchesText && matchesCat && matchesSub;
      }),
    [catalogData, searchText, categoryFilter, subCategoryFilter]
  );

  // 6. Sort the filtered list
  const sortedList = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'year') {
      // newest first
      arr.sort((a, b) => b.release_year - a.release_year);
    } else if (sortBy === 'alpha') {
      arr.sort((a, b) => a.pop_name.localeCompare(b.pop_name));
    }
    return arr;
  }, [filtered, sortBy]);

  // 7. Toggle wishlist item (add/remove)
  const toggleWishlist = async popId => {
    if (!token) {
      alert('You must be logged in to add items to wishlist');
      return navigate('/login');
    }
    const inList = wishlist.includes(popId);
    const url = `${API_URL}/api/wishlist${inList ? '/' + popId : ''}`;
    const method = inList ? 'DELETE' : 'POST';
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      ...(method === 'POST' && { body: JSON.stringify({ pop_id: popId }) })
    };
    const res = await fetch(url, opts);
    if (!res.ok) {
      let errText = 'Wishlist update failed';
      try {
        const errJson = await res.json();
        errText = errJson.error || errText;
      } catch {}
      alert(errText);
      return;
    }
    setWishlist(w =>
      inList ? w.filter(id => id !== popId) : [...w, popId]
    );
  };

  // 8. Add to collection (with duplicate check and success alert)
  const handleAddToCollection = async (popId, popName) => {
    if (!token) {
      alert(`Login required to add ${popName}`);
      return navigate('/login');
    }
    if (collectionIds.includes(popId)) {
      alert(`${popName} is already in your collection`);
      return;
    }
    const res = await fetch(`${API_URL}/api/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ pop_id: popId })
    });
    if (res.ok) {
      setCollectionIds(prev => [...prev, popId]);
      alert(`${popName} has been added to your collection`);
    } else {
      console.error('Failed to add item');
      let errText = 'Failed to add to collection';
      try {
        const errJson = await res.json();
        errText = errJson.error || errText;
      } catch {}
      alert(errText);
    }
  };

  // 9. Navigate to AI Suggestions
  const goAi = () => {
    if (!token) {
      alert('Login required to get AI suggestions');
      return navigate('/login');
    }
    if (collectionIds.length === 0) {
      alert('Add at least one POP to your collection to get suggestions.');
      return;
    }
    navigate('/catalog/ai-suggestions');
  };

  return (
    <>
      <main>
        <h1>Funko Pop Catalog</h1>

        {/* Filters */}
        <div className="catalog-filters">
          <input
            type="text"
            placeholder="Search Funko Pops..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={subCategoryFilter}
            onChange={e => setSubCategoryFilter(e.target.value)}
          >
            <option value="">All Sub-Categories</option>
            {subCategories.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
                  {/* Sort control */}
        <div className="catalog-sort">
          <label htmlFor="sortSelect">Sort by: </label>
          <select
            id="sortSelect"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="">None</option>
            <option value="year">Release-Year</option>
            <option value="alpha">A – Z</option>
          </select>
        </div>
        </div>


        <div className="catalog-buttons">
          <button className="ai-suggest-button" onClick={goAi}>
            AI Based Suggestions ✨
          </button>
          {/* ─── Suggest New Pop Button ───────────────────────────────────────── */}
          <button
            className="suggest-pop-button"
            onClick={() => window.open('/suggest', '_blank')}
          >
            Missing anything?
          </button>
        </div>

        {/* Catalog Grid */}
        <div className="catalog-grid">
          {sortedList.map(pop => {
            const id = pop.pop_id || pop.id;
            const isFav = wishlist.includes(id);
            return (
              <div className="pop-card" key={id}>
                {/* Heart icon for wishlist */}
                <div
                  className={`wishlist-icon${isFav ? ' filled' : ''}`}
                  onClick={() => toggleWishlist(id)}
                >
                  {isFav ? <FaHeart /> : <FaRegHeart />}
                </div>

                <img src={pop.picture} alt={pop.pop_name} />
                <h3>{pop.pop_name}</h3>
                <h4>{pop.serial_number}</h4>
                <p><strong>Category:</strong> {pop.category}</p>
                <p><strong>Sub-Category:</strong> {pop.sub_category}</p>
                <p><strong>Release-Year:</strong> {pop.release_year}</p>
                <div className="card-actions">
                  <button
                    className="addtocollection-button"
                    onClick={() => handleAddToCollection(id, pop.pop_name)}
                  >
                    Add to collection
                  </button>
                  <button
                    className="sellonmarket-button"
                    onClick={() => {
                      // open NewListing in new tab with pop preselected
                      const url = `${window.location.origin}/newlisting?popId=${id}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Sell on market
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

export default Catalog;
