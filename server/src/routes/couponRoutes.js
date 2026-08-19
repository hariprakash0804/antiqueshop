const express = require('express');
const router = express.Router();
const { Coupon } = require('../models');

// GET /api/coupons/validate/:code - Validate a promo code
router.get('/validate/:code', async (req, res) => {
  if (!req.params.code || typeof req.params.code !== 'string') {
    return res.status(400).json({ message: 'Invalid coupon code parameter' });
  }

  const cleanCode = req.params.code.trim().toUpperCase().slice(0, 30);

  try {
    const coupon = await Coupon.findOne({ where: { code: cleanCode } });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon code invalid or expired' });
    }
    res.json({ code: coupon.code, discount: coupon.discount });
  } catch (error) {
    console.error('Validate coupon error:', error.message);
    res.status(500).json({ message: 'Server error validating coupon code' });
  }
});

module.exports = router;
