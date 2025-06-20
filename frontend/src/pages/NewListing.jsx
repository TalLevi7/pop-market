import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NewListing.css';

export default function NewListing() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [popOptions, setPopOptions]               = useState([]);
  const [searchPopText, setSearchPopText]         = useState('');
  const [showPopList, setShowPopList]             = useState(false);
  const [selectedPopId, setSelectedPopId]         = useState('');
  const [selectedPopSerial, setSelectedPopSerial] = useState('');

  const [price, setPrice]                         = useState('');
  const [location, setLocation]                   = useState('');
  const [details, setDetails]                     = useState('');
  const [images, setImages]                       = useState([null, null, null]);

  const [notInCatalog, setNotInCatalog]           = useState(false);
  const [customPopName, setCustomPopName]         = useState('');
  const [customSerialNumber, setCustomSerialNumber] = useState('');

  const [error, setError]                         = useState('');
  const [loading, setLoading]                     = useState(false);

  const locationChoices = ['Tel Aviv','Jerusalem','Haifa','Beer Sheva','Central','North','South'];

  // Fetch catalog
  useEffect(() => {
    fetch(`${API_URL}/api/catalog`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setPopOptions)
      .catch(() => setError('Could not load catalog.'));
  }, [API_URL]);

  // Sort & filter
  const sortedPopOptions = useMemo(() =>
    [...popOptions].sort((a,b)=>a.pop_name.localeCompare(b.pop_name)),
    [popOptions]
  );
  const filteredOptions = useMemo(() => {
    const t = searchPopText.toLowerCase();
    return sortedPopOptions.filter(p =>
      p.pop_name.toLowerCase().includes(t) ||
      (p.serial_number && p.serial_number.toLowerCase().includes(t))
    );
  }, [sortedPopOptions, searchPopText]);

  // Auto-fill serial
  useEffect(() => {
    if (!selectedPopId) return setSelectedPopSerial('');
    const m = popOptions.find(p=>String(p.pop_id)===String(selectedPopId));
    setSelectedPopSerial(m?.serial_number || '');
  }, [selectedPopId, popOptions]);

  // close dropdown
  useEffect(() => {
    const h = e => { if (!e.target.closest('.pop-dropdown')) setShowPopList(false); };
    if (showPopList) document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [showPopList]);

  const handleImageChange = (idx, file) => {
    const copy = [...images];
    copy[idx] = file;
    setImages(copy);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Pop data
    let pop_id=null, pop_name='', serial_number='';
    if (notInCatalog) {
      if (!customPopName.trim()) return setError('Enter Pop name.');
      pop_name = customPopName.trim();
      serial_number = customSerialNumber.trim();
    } else {
      if (!selectedPopId) return setError('Select a catalog Pop.');
      pop_id = parseInt(selectedPopId,10);
      const m = popOptions.find(p=>String(p.pop_id)===String(selectedPopId));
      pop_name = m.pop_name; serial_number = m.serial_number||'';
    }

    // Validate
    if (!price||isNaN(price)||Number(price)<=0) return setError('Valid price required.');
    if (!location) return setError('Select location.');
    if (!images[0]) return setError('Primary image is required.');

    const token = localStorage.getItem('token');
    if (!token) return setError('You must be logged in.');

    setLoading(true);
    try {
      const formData = new FormData();
      if (!notInCatalog) formData.append('pop_id', pop_id);
      formData.append('not_in_catalog', notInCatalog?'true':'false');
      if (notInCatalog) {
        formData.append('custom_pop_name', pop_name);
        formData.append('custom_serial_number', serial_number);
      }
      formData.append('price', parseFloat(Number(price).toFixed(2)));
      formData.append('location', location);
      formData.append('details', details.trim());

      images.forEach(img => img && formData.append('images', img));

      const res = await fetch(`${API_URL}/api/market`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error||'Submit failed.');
      }

      alert('Listing submitted—pending approval.');
      navigate('/market');
    } catch (e) {
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
        {/* catalog toggle */}
        <div className="form-group-checkbox">
          <input
            id="notInCatalog"
            type="checkbox"
            checked={notInCatalog}
            onChange={e=>{
              setNotInCatalog(e.target.checked);
              setSelectedPopId(''); setSelectedPopSerial(''); setSearchPopText('');
            }}
          />
          <label htmlFor="notInCatalog">This Pop is not in the catalog</label>
        </div>

        {notInCatalog ? (
          <>
            <label htmlFor="customPopName">Pop Name*</label>
            <input id="customPopName" type="text"
              placeholder="Enter Pop name"
              value={customPopName}
              onChange={e=>setCustomPopName(e.target.value)}
              required
            />
            <label htmlFor="customSerialNumber">Serial Number</label>
            <input id="customSerialNumber" type="text"
              placeholder="Enter serial number"
              value={customSerialNumber}
              onChange={e=>setCustomSerialNumber(e.target.value)}
            />
          </>
        ) : (
          <>
            <label htmlFor="popSearchInput">Select Funko Pop*</label>
            <div className="pop-dropdown">
              <input
                id="popSearchInput" type="text"
                placeholder="Type to search…"
                value={searchPopText}
                onFocus={()=>setShowPopList(true)}
                onChange={e=>{
                  setSearchPopText(e.target.value);
                  setShowPopList(true);
                  setSelectedPopId(''); setSelectedPopSerial('');
                }}
                autoComplete="off"
                required
              />
              {showPopList && filteredOptions.length>0 && (
                <ul className="pop-options-list">
                  {filteredOptions.map(p=>(
                    <li key={p.pop_id} onClick={()=>{
                      setSelectedPopId(p.pop_id);
                      setSearchPopText(`${p.pop_name} – ${p.serial_number}`);
                      setSelectedPopSerial(p.serial_number||'');
                      setShowPopList(false);
                    }}>
                      {p.pop_name} – {p.serial_number}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {!notInCatalog && selectedPopSerial && (
          <div className="serial-display">
            <label>Serial Number:</label>
            <span className="serial-text">{selectedPopSerial}</span>
          </div>
        )}

        <label htmlFor="priceInput">Price (₪)*</label>
        <input id="priceInput" type="number" step="0.01" min="0"
          placeholder="e.g. 79.99"
          value={price}
          onChange={e=>setPrice(e.target.value)}
          required
        />

        <label htmlFor="locationSelect">Location*</label>
        <select id="locationSelect"
          value={location}
          onChange={e=>setLocation(e.target.value)}
          required
        >
          <option value="">-- Choose location --</option>
          {locationChoices.map(loc=>(
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* three file inputs */}
        {['Primary Image*','Secondary Image 1','Secondary Image 2'].map((label,idx)=>(
          <div key={idx}>
            <label htmlFor={`img${idx}`}>{label}</label>
            <input
              id={`img${idx}`}
              type="file"
              accept="image/*"
              onChange={e=>handleImageChange(idx, e.target.files[0]||null)}
              required={idx===0}
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

        <label htmlFor="detailsTextarea">Additional Details</label>
        <textarea id="detailsTextarea" rows="4"
          placeholder="Condition, notes…"
          value={details}
          onChange={e=>setDetails(e.target.value)}
        />

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
