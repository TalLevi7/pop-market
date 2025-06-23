// src/pages/PopSuggestion.jsx

import React, { useState } from 'react';
import { useNavigate }  from 'react-router-dom';
import '../styles/PopSuggestions.css';

export default function PopSuggestion() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // ─── Form state ─────────────────────────────────────────────────
  const [popName,   setPopName]   = useState('');
  const [serial,    setSerial]    = useState('');
  const [details,   setDetails]   = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!popName.trim()) {
      return setError('Please enter a Pop name.');
    }

    const formData = new FormData();
    formData.append('pop_name', popName.trim());
    if (serial.trim())  formData.append('serial_number', serial.trim());
    if (details.trim()) formData.append('details', details.trim());
    if (imageFile)      formData.append('image', imageFile);

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/suggestions`, {
        method: 'POST',
        ...(token && { headers: { Authorization: `Bearer ${token}` } }),
        body: formData
      });
      if (!res.ok) {
        const errJson = await res.json().catch(()=>({}));
        throw new Error(errJson.error || 'Failed to submit suggestion.');
      }
      alert('Thank you! Your suggestion has been submitted.');
      navigate('/catalog');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="suggestion-container">
      <h1>Suggest a New Pop</h1>
      {error && <div className="suggestion-error">{error}</div>}

      <form className="suggestion-form" onSubmit={handleSubmit}>
        <label htmlFor="popName">Pop Name *</label>
        <input
          id="popName"
          type="text"
          value={popName}
          onChange={e => setPopName(e.target.value)}
          required
        />

        <label htmlFor="serialNumber">Serial Number</label>
        <input
          id="serialNumber"
          type="text"
          value={serial}
          onChange={e => setSerial(e.target.value)}
        />

        <label htmlFor="details">Additional Details</label>
        <textarea
          id="details"
          rows="4"
          placeholder="Release date, stores, any other notes…"
          value={details}
          onChange={e => setDetails(e.target.value)}
        ></textarea>

        <label htmlFor="imageUpload">Image (optional)</label>
        <input
          id="imageUpload"
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files[0] || null)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Suggestion'}
        </button>
      </form>
    </main>
  );
}
