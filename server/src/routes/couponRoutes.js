const express = require('express');
const router = express.Router();
const { Coupon } = require('../models');

// GET /api/coupons/validate/:code - Validate a promo code
router.get('/validate/:code', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ where: { code: req.params.code.toUpperCase() } });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon invalid or corrupted.' });
    }
    res.json({ code: coupon.code, discount: coupon.discount });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(550).json({ message: 'Server error validating coupon.' });
  }
});

module.exports = router;
