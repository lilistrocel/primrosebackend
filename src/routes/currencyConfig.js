const express = require('express');
const router = express.Router();
const currencyConfig = require('../config/currency');

// GET /api/motong/currency-config - Get currency configuration
router.get('/', (req, res) => {
  try {
    // Set cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      code: 0,
      msg: 'Currency configuration retrieved successfully',
      data: {
        CURRENCY_CODE: currencyConfig.CURRENCY_CODE,
        CURRENCY_SYMBOL: currencyConfig.CURRENCY_SYMBOL,
        CURRENCY_NAME: currencyConfig.CURRENCY_NAME,
        CURRENCY_POSITION: currencyConfig.CURRENCY_POSITION,
        DECIMAL_PLACES: currencyConfig.DECIMAL_PLACES
      }
    });
  } catch (error) {
    console.error('Error fetching currency configuration:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to fetch currency configuration',
      data: null
    });
  }
});

module.exports = router;
