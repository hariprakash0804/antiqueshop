const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Order, OrderItem, Product } = require('../models');

// Initialize Razorpay
// Note: Fallback to mock behavior if no real keys are provided
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
    console.error('Error initializing Razorpay, switching to simulation mode:', err.message);
  }
}

exports.createRazorpayOrder = async (req, res) => {
  const { amount, orderId } = req.body;
  
  if (!amount || !orderId) {
    return res.status(400).json({ message: 'Amount and orderId are required' });
  }

  try {
    const orderDetails = await Order.findByPk(orderId);
    if (!orderDetails) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (isMockMode || !razorpayInstance) {
      console.log('--- Payments Simulation Mode (Mock Razorpay Order) ---');
      const mockRazorpayOrderId = `mock_rzp_order_${Math.random().toString(36).substring(7)}`;
      
      // Save mock order ID to our DB order record
      await orderDetails.update({ razorpayOrderId: mockRazorpayOrderId });

      return res.json({
        id: mockRazorpayOrderId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `receipt_order_${orderId}`,
        isMock: true,
        key: 'mock_key_id'
      });
    }

    // Real Razorpay integration
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: `receipt_order_${orderId}`
    };

    const rzpOrder = await razorpayInstance.orders.create(options);
    
    // Save order ID to our DB order record
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
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ message: 'Error initiating payment gateway order' });
  }
};

exports.verifyPayment = async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    orderId,
    isMock
  } = req.body;

  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found in database' });
    }

    if (isMock || isMockMode || !razorpayInstance) {
      // Simulation signature verification
      console.log('--- Payments Simulation Mode (Mock Payment Verification) ---');
      
      // Update order status to Paid
      await order.update({
        status: 'Paid',
        razorpayPaymentId: razorpay_payment_id || `mock_rzp_pay_${Math.random().toString(36).substring(7)}`
      });

      // Deduct product stock
      for (const item of order.items) {
        const prod = await Product.findByPk(item.productId);
        if (prod) {
          await prod.update({ stock: Math.max(0, prod.stock - item.quantity) });
        }
      }

      return res.json({ status: 'success', message: 'Payment simulated and verified successfully' });
    }

    // Real Signature Verification
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Update Order Status to Paid
      await order.update({
        status: 'Paid',
        razorpayPaymentId: razorpay_payment_id
      });

      // Deduct product stock
      for (const item of order.items) {
        const prod = await Product.findByPk(item.productId);
        if (prod) {
          await prod.update({ stock: Math.max(0, prod.stock - item.quantity) });
        }
      }

      res.json({ status: 'success', message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ status: 'failed', message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
};

exports.refundPayment = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Cancelled') {
      return res.status(400).json({ message: 'Only cancelled orders can be refunded' });
    }

    if (isMockMode || !razorpayInstance || order.razorpayPaymentId.startsWith('mock_')) {
      console.log('--- Payments Simulation Mode (Mock Refund) ---');
      const mockRefundId = `mock_rzp_ref_${Math.random().toString(36).substring(7)}`;
      
      await order.update({
        status: 'Refunded',
        razorpayRefundId: mockRefundId
      });

      return res.json({ status: 'success', message: 'Refund simulated successfully', refundId: mockRefundId });
    }

    // Real Razorpay Refund
    const refund = await razorpayInstance.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(order.totalAmount * 100), // full refund in paise
      speed: 'normal',
      notes: {
        reason: 'Order cancelled by administrator/order manager',
        orderId: order.id.toString()
      }
    });

    await order.update({
      status: 'Refunded',
      razorpayRefundId: refund.id
    });

    res.json({ status: 'success', message: 'Refund processed successfully via Razorpay', refundId: refund.id });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Error processing refund via Razorpay' });
  }
};
