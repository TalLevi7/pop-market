// backend/api/updateApiPrices.js
// refreshes the API-based prices in pop_catalog database every 24 hours

const cron = require('node-cron');
const db   = require('../db');
const { fetchPriceData } = require('./pricechartingApi');

// run at 03:00 every day (Jerusalem time)
cron.schedule('0 3 * * *', refreshAllPrices, { timezone: 'Asia/Jerusalem' });

// also refresh on server start (optional)
// refreshAllPrices();

async function refreshAllPrices() {
  console.log(' Starting daily price refresh...');
  try {
    const [rows] = await db.query(
      'SELECT pop_id, pop_name, serial_number FROM pop_catalog'
    );

    for (const { pop_id, pop_name, serial_number } of rows) {
      try {
        const price = await fetchPriceData(pop_name, serial_number);
        await db.query(
          `UPDATE pop_catalog
             SET estimated_price  = ?,
                 price_updated_at = NOW()
           WHERE pop_id = ?`,
          [price, pop_id]
        );
        console.log(`- ${pop_name} → $${price}`);
      } catch (e) {
        console.error(` Failed to update ${pop_name}:`, e.message);
      }
    }

    console.log('✅ Price refresh complete.');
  } catch (err) {
    console.error('❌ Could not load catalog for price refresh:', err);
  }
}
