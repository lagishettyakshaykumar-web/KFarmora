const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');

router.get('/market-data', intelligenceController.getMarketData);

module.exports = router;
