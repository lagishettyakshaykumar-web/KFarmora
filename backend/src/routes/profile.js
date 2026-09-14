const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/auth');

// All profile routes require authentication
router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);

module.exports = router;
