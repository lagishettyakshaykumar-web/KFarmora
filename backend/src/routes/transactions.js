const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, transactionsController.getTransactions);
router.post('/:id/advance', authMiddleware, roleMiddleware(['FARMER', 'ADMIN']), transactionsController.advanceTransaction);

module.exports = router;
