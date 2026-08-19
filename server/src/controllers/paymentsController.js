const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Order, OrderItem, Product } = require('../models');
const sequelize = require('../config/db');

// Determine if Razorpay keys are properly configured
const isMockMode = !process.env.RAZORPAY_KEY_ID || 
                   process.env.RAZORPAY_KEY_ID.includes('placeholder') || 
                   !process.env.RAZORPAY_KEY_SECRET ||
                   process.env.RAZORPAY_KEY_SECRET.includes('placeholder');

let razorpayInstance = null;
if (!isMockMode) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.error('Error initializing Razorpay client:', err.message);
  }
}

exports.createRazorpayOrder = async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ message: 'A valid orderId is required' });
  }

  try {
    const orderDetails = await Order.findByPk(orderId);
    if (!orderDetails) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // IDOR / BOLA Prevention: Verify order belongs to the authenticated user
    if (orderDetails.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to order' });
    }

    if (orderDetails.status !== 'Pending') {
      return res.status(400).json({ message: `Order cannot be paid in ${orderDetails.status} status` });
    }

    // Authoritatively compute amount in paise from verified database totalAmount
    const amountInPaise = Math.round(parseFloat(orderDetails.totalAmount) * 100);

    if (isMockMode || !razorpayInstance) {
      const mockRazorpayOrderId = `mock_rzp_order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Save mock order ID to our DB order record
      await orderDetails.update({ razorpayOrderId: mockRazorpayOrderId });

      return res.json({
        id: mockRazorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${orderId}`,
        isMock: true,
        key: 'mock_key_id'
      });
    }

    // Real Razorpay gateway initiation
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_order_${orderId}`
    };

    const rzpOrder = await razorpayInstance.orders.create(options);
    
    // Save order ID to DB record
    await orderDetails.update({ razorpayOrderId: rzpOrder.id });

    res.json({
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
      isMock: false,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error.message);
    res.status(500).json({ message: 'Error initiating payment gateway order' });
  }
};

exports.verifyPayment = async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    orderId
  } = req.body;

  if (!orderId || !razorpay_order_id) {
    return res.status(400).json({ message: 'orderId and razorpay_order_id are required' });
  }

  const t = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found in database' });
    }

    // IDOR / BOLA Prevention: Verify ownership
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Unauthorized access to order verification' });
    }

    // Verify razorpay_order_id matches recorded order
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      await t.rollback();
      return res.status(400).json({ status: 'failed', message: 'Gateway order ID mismatch' });
    }

    if (order.status === 'Paid') {
      await t.rollback();
      return res.json({ status: 'success', message: 'Payment already verified for this order' });
    }

    // Security Check: Server-determined mock mode check (Never trust client isMock flag)
    if (isMockMode || !razorpayInstance) {
      // In server simulation mode: Verify that the mock order was actually created for this order
      if (!order.razorpayOrderId || !order.razorpayOrderId.startsWith('mock_rzp_order_')) {
        await t.rollback();
        return res.status(400).json({ status: 'failed', message: 'Invalid simulation transaction signature' });
      }

      await order.update({
        status: 'Paid',
        razorpayPaymentId: razorpay_payment_id || `mock_rzp_pay_${Date.now()}`
      }, { transaction: t });

      // Atomically deduct stock
      for (const item of order.items) {
        const prod = await Product.findByPk(item.productId, { transaction: t });
        if (prod) {
          await prod.update({ stock: Math.max(0, prod.stock - item.quantity) }, { transaction: t });
        }
      }

      await t.commit();
      return res.json({ status: 'success', message: 'Payment verified successfully' });
    }

    // Real HMAC-SHA256 Cryptographic Signature Verification
    if (!razorpay_signature || !razorpay_payment_id) {
      await t.rollback();
      return res.status(400).json({ status: 'failed', message: 'Payment signature parameters missing' });
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      await t.rollback();
      return res.status(400).json({ status: 'failed', message: 'Cryptographic payment verification failed' });
    }

    // Update Order Status to Paid
    await order.update({
      status: 'Paid',
      razorpayPaymentId: razorpay_payment_id
    }, { transaction: t });

    // Atomically deduct product stock
    for (const item of order.items) {
      const prod = await Product.findByPk(item.productId, { transaction: t });
      if (prod) {
        await prod.update({ stock: Math.max(0, prod.stock - item.quantity) }, { transaction: t });
      }
    }

    await t.commit();
    res.json({ status: 'success', message: 'Payment verified successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Verify payment error:', error.message);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
};

exports.refundPayment = async (req, res) => {
  const { orderId } = req.params;

  const t = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ message: 'Only cancelled orders can be refunded' });
    }

    if (isMockMode || !razorpayInstance || (order.razorpayPaymentId && order.razorpayPaymentId.startsWith('mock_'))) {
      const mockRefundId = `mock_rzp_ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      await order.update({
        status: 'Refunded',
        razorpayRefundId: mockRefundId
      }, { transaction: t });

      await t.commit();
      return res.json({ status: 'success', message: 'Refund processed successfully', refundId: mockRefundId });
    }

    // Real Razorpay Refund
    const refund = await razorpayInstance.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(parseFloat(order.totalAmount) * 100),
      speed: 'normal',
      notes: {
        reason: 'Order cancelled by administrator/order manager',
        orderId: order.id.toString()
      }
    });

    await order.update({
      status: 'Refunded',
      razorpayRefundId: refund.id
    }, { transaction: t });

    await t.commit();
    res.json({ status: 'success', message: 'Refund processed successfully via Razorpay', refundId: refund.id });
  } catch (error) {
    await t.rollback();
    console.error('Process refund error:', error.message);
    res.status(500).json({ message: 'Error processing refund via Razorpay' });
  }
};
