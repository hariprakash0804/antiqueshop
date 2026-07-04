const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrderStatus, requestCancellation } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.put('/:id/status', protect, authorize('order_manager', 'admin', 'seller'), updateOrderStatus);
router.post('/:id/cancel', protect, requestCancellation);

module.exports = router;
