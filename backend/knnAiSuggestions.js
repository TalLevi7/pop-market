// routes/knnAiSuggestions.js
// knn algorithm based AI suggestions for POPs from catalog

const express = require('express');
const axios = require('axios');
const router = express.Router();
const authenticate = require('./authenticate'); 

router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const response = await axios.get('http://localhost:6000/api/catalog/knn-suggestions', {
      params: { user_id: userId }
    });

    res.json(response.data);
  } catch (err) {
    console.error('KNN AI error:', err.message);
    res.status(500).json({ error: 'Could not get AI suggestions' });
  }
});

module.exports = router;
