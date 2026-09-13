const express = require('express');
const router = express.Router();
const { verifyCropGrade } = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

// AI verification requires authentication (farmer must be logged in)
router.use(authMiddleware);

router.post('/verify-crop-grade', verifyCropGrade);

module.exports = router;
