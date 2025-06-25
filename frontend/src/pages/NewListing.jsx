// src/pages/NewListing.jsx
// Form-Page for users to upload a new Market Ad - List a POP for sale
// Users can select to either sell a POP existing in the catalog, or a POP that isn't in the catalog which then will be added + edited by Admin

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/NewListing.css';

export default function NewListing() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const initialPop = params.get('popId');

  // ─── Form state ────────────────────────────────────────────────────────────
  const [popOptions, setPopOptions]               = useState([]);
  const [searchPopText, setSearchPopText]         = useState('');      // typed text
  const [showPopList, setShowPopList]             = useState(false);   // show suggestions?
  const [selectedPopId, setSelectedPopId]         = useState(initialPop || '');
  const [selectedPopSerial, setSelectedPopSerial] = useState('');      // auto from option

  const [price, setPrice]                         = useState('');
  const [location, setLocation]                   = useState('');
  const [details, setDetails]                     = useState('');
  const [images, setImages]                       = useState([null, null, null]);

  // “Not in catalog” fields
  const [notInCatalog, setNotInCatalog]           = useState(false);
  const [customPopName, setCustomPopName]         = useState('');
  const [customSerialNumber, setCustomSerialNumber] = useState('');

  const [error, setError]                         = useState('');
  const [loading, setLoading]                     = useState(false);

  // Hard‐coded location options
  const locationChoices = [
    'Tel Aviv',
    'Jerusalem',
    'Haifa',
    'Beer Sheva',
    'Central',
    'North',
    'South'
  ];

  // ─── Fetch catalog pops on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${API_URL}/api/catalog`);
        if (!res.ok) {
          throw new Error(`Failed to load catalog: ${res.statusText}`);
        }
        const data = await res.json();
        setPopOptions(data);
      } catch (e) {
        console.error(e);
        setError('Could not load catalog. Try again later.');
      }
    };
    fetchCatalog();
  }, [API_URL]);

  // ─── Pre‐select if initialPop passed in query ───────────────────────────────
  useEffect(() => {
    if (initialPop && popOptions.length > 0) {
      const pop = popOptions.find(p => String(p.pop_id) === String(initialPop));
      if (pop) {
        setSearchPopText(`${pop.pop_name} – ${pop.serial_number}`);
        setSelectedPopId(initialPop);
      }
    }
  }, [initialPop, popOptions]);

  // ─── Sort options by pop_name ─────────────────────────────────────────────────
  const sortedPopOptions = useMemo(() => {
    return [...popOptions].sort((a, b) =>
      a.pop_name.localeCompare(b.pop_name)
    );
  }, [popOptions]);

  // ─── Filtered options based on searchPopText ─────────────────────────────────
  const filteredOptions = useMemo(() => {
    const text = searchPopText.toLowerCase();
    return sortedPopOptions.filter(p =>
      p.pop_name.toLowerCase().includes(text) ||
      (p.serial_number && p.serial_number.toLowerCase().includes(text))
    );
  }, [sortedPopOptions, searchPopText]);

  // ─── When a pop is selected, auto‐fill its serial number ───────────────────
  useEffect(() => {
    if (!selectedPopId) {
      setSelectedPopSerial('');
      return;
    }
    const match = popOptions.find(p => String(p.pop_id) === String(selectedPopId));
    setSelectedPopSerial(match ? (match.serial_number || '') : '');
  }, [selectedPopId, popOptions]);

  // ─── Click outside to close the suggestion list ─────────────────────────────
  useEffect(() => {
    const handleClickOutside = e => {
      if (!e.target.closest('.pop-dropdown')) {
        setShowPopList(false);
      }
    };
    if (showPopList) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPopList]);

  // ─── Handle image inputs ─────────────────────────────────────────────────────
  const handleImageChange = (idx, file) => {
    const copy = [...images];
    copy[idx] = file;
    setImages(copy);
  };

  // ─── Handle form submission ────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // 1) Determine which “Pop” data to send
    let pop_id = null;
    let pop_name = '';
    let serial_number = '';

    if (notInCatalog) {
      if (!customPopName.trim()) {
        setError('Please enter the Pop name.');
        return;
      }
      pop_name = customPopName.trim();
      serial_number = customSerialNumber.trim();
    } else {
      if (!selectedPopId) {
        setError('Please select a Pop from the catalog.');
        return;
      }
      pop_id = parseInt(selectedPopId, 10);
      const match = popOptions.find(p => String(p.pop_id) === String(selectedPopId));
      pop_name = match.pop_name;
      serial_number = match.serial_number || '';
    }

    // 2) Validate price, location, images
    if (!price || isNaN(price) || Number(price) <= 0) {
      setError('Enter a valid price.');
      return;
    }
    if (!location) {
      setError('Choose a location.');
      return;
    }
    if (!images[0]) {
      setError('Primary Image is required.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to post an ad.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (!notInCatalog) {
        formData.append('pop_id', pop_id);
      }
      formData.append('not_in_catalog', notInCatalog ? 'true' : 'false');
      if (notInCatalog) {
        formData.append('custom_pop_name', pop_name);
        formData.append('custom_serial_number', serial_number);
      }
      formData.append('price', parseFloat(Number(price).toFixed(2)));
      formData.append('location', location);
      formData.append('details', details.trim());

      images.forEach(img => img && formData.append('images', img));

      const res = await fetch(`${API_URL}/api/market`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to submit listing.');
      }

      alert('Your listing has been submitted! It will go live once approved.');
      navigate('/market');
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="newlisting-container">
      <h1 className="newlisting-title">Post a New Listing</h1>

      {error && <div className="newlisting-error">{error}</div>}

      <form className="newlisting-form" onSubmit={handleSubmit}>
        {/* ─── Not in Catalog Checkbox ─────────────────────────────────────── */}
        <div className="form-group-checkbox">
          <input
            id="notInCatalog"
            type="checkbox"
            checked={notInCatalog}
            onChange={e => {
              setNotInCatalog(e.target.checked);
              setSelectedPopId('');
              setSelectedPopSerial('');
              setSearchPopText('');
            }}
          />
          <label htmlFor="notInCatalog">This Pop is not in the catalog</label>
        </div>

        {/* ─── If notInCatalog: free‐text fields ───────────────────────────── */}
        {notInCatalog ? (
          <>
            <label htmlFor="customPopName">Pop Name*</label>
            <input
              id="customPopName"
              type="text"
              placeholder="Enter Pop name"
              value={customPopName}
              onChange={e => setCustomPopName(e.target.value)}
              required
            />

            <label htmlFor="customSerialNumber">Serial Number</label>
            <input
              id="customSerialNumber"
              type="text"
              placeholder="Enter serial number"
              value={customSerialNumber}
              onChange={e => setCustomSerialNumber(e.target.value)}
            />
          </>
        ) : (
          /* ─── Otherwise: combined searchable dropdown ──────────────────── */
          <>
            <label htmlFor="popSearchInput">Select Funko Pop*</label>
            <div className="pop-dropdown">
              <input
                id="popSearchInput"
                type="text"
                placeholder="Type to search…"
                value={searchPopText}
                onFocus={() => setShowPopList(true)}
                onChange={e => {
                  setSearchPopText(e.target.value);
                  setShowPopList(true);
                  setSelectedPopId('');
                  setSelectedPopSerial('');
                }}
                autoComplete="off"
                required={!notInCatalog}
              />
              {showPopList && filteredOptions.length > 0 && (
                <ul className="pop-options-list">
                  {filteredOptions.map(p => (
                    <li
                      key={p.pop_id}
                      onClick={() => {
                        setSelectedPopId(p.pop_id);
                        setSearchPopText(`${p.pop_name} – ${p.serial_number}`);
                        setSelectedPopSerial(p.serial_number || '');
                        setShowPopList(false);
                      }}
                    >
                      {p.pop_name} – {p.serial_number}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* ─── Show serial number if a catalog Pop is chosen ─────────────── */}
        {!notInCatalog && selectedPopSerial && (
          <div className="serial-display">
            <label>Serial Number:</label>
            <span className="serial-text">{selectedPopSerial}</span>
          </div>
        )}

        {/* ─── Price ─────────────────────────────────────────────────────────── */}
        <label htmlFor="priceInput">Price (₪)*</label>
        <input
          id="priceInput"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 79.99"
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
        />

        {/* ─── Location ───────────────────────────────────────────────────────── */}
        <label htmlFor="locationSelect">Location*</label>
        <select
          id="locationSelect"
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
        >
          <option value="">-- Choose location --</option>
          {locationChoices.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* ─── Image Uploads ───────────────────────────────────────────────────── */}
        {['Primary Image*','Secondary Image 1','Secondary Image 2'].map((label, idx) => (
          <div key={idx}>
            <label htmlFor={`img${idx}`}>{label}</label>
            <input
              id={`img${idx}`}
              type="file"
              accept="image/*"
              onChange={e => handleImageChange(idx, e.target.files[0] || null)}
              required={idx === 0}
            />
            {images[idx] && (
              <img
                src={URL.createObjectURL(images[idx])}
                alt={`preview ${idx+1}`}
                className="preview-thumb"
              />
            )}
          </div>
        ))}

        {/* ─── Details ────────────────────────────────────────────────────────── */}
        <label htmlFor="detailsTextarea">Additional Details</label>
        <textarea
          id="detailsTextarea"
          rows="4"
          placeholder="Describe condition, any special notes…"
          value={details}
          onChange={e => setDetails(e.target.value)}
        />

        {/* ─── Submit Button ──────────────────────────────────────────────────── */}
        <button
          type="submit"
          className="newlisting-submit-button"
          disabled={loading}
        >
          {loading ? 'Submitting…' : 'Submit Listing'}
        </button>
      </form>
    </main>
  );
}
