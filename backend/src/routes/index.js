const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const lotsRoutes = require('./lots');
const offersRoutes = require('./offers');
const transactionsRoutes = require('./transactions');
const intelligenceRoutes = require('./intelligence');
const profileRoutes = require('./profile');
const transportRoutes = require('./transport');
const aiRoutes = require('./ai');
// const adminRoutes = require('./admin');

router.use('/auth', authRoutes);
router.use('/lots', lotsRoutes);
router.use('/offers', offersRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/profile', profileRoutes);
router.use('/transport', transportRoutes);
router.use('/ai', aiRoutes);
// router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Farmora API is running' });
});

module.exports = router;
