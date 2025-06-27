// backend/api/pricechartingApi.js
// Sends a GET request to pricecharting.com API, receives a JSON format answer

const axios = require('axios');
// get PRICECHARTING_TOKEN from .env file
require('dotenv').config();    
const token = process.env.PRICECHARTING_TOKEN;

async function fetchPriceData(popName, serialNumber) {
  const url = 'https://www.pricecharting.com/api/product';

  // first, try “Common Funko Pop” query
  let res = await axios.get(url, {
    params: { t: token, q: `${popName} ${serialNumber} Common Funko Pop` }
  });

  // fallback to a simpler query if no new-price
  if (!res.data['new-price']) {
    res = await axios.get(url, {
      params: { t: token, q: `${popName} ${serialNumber} Funko Pop` }
    });
  }
  
  // we only need the "new-price" values from the answer
  const cents = res.data['new-price'];
  if (typeof cents !== 'number') return null;
  return cents / 100; // convert pennies → dollars
}

module.exports = { fetchPriceData };
