const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, refundPayment } = require('../controllers/paymentsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);

// Only order managers and admins can trigger refunds manually
router.post('/refund/:orderId', protect, authorize('order_manager', 'admin'), refundPayment);

module.exports = router;
