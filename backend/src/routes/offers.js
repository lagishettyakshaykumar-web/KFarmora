const express = require('express');
const router = express.Router();
const offersController = require('../controllers/offersController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, offersController.getOffers);
router.post('/', authMiddleware, roleMiddleware(['BUYER']), offersController.createOffer);
router.post('/:id/accept', authMiddleware, roleMiddleware(['FARMER']), offersController.acceptOffer);

module.exports = router;
