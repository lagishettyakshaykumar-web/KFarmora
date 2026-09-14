const express = require('express');
const router = express.Router();
const { getShipments, getShipmentById } = require('../controllers/transportController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getShipments);
router.get('/:id', getShipmentById);

module.exports = router;
