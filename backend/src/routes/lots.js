const express = require('express');
const router = express.Router();
const lotsController = require('../controllers/lotsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/', lotsController.getLots);
router.get('/:id', lotsController.getLotById);

router.post('/', authMiddleware, roleMiddleware(['FARMER']), lotsController.createLot);

module.exports = router;
