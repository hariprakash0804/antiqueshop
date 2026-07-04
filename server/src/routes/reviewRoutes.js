const express = require('express');
const router = express.Router();
const { getProductReviews, createReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public: get reviews for a product
router.get('/product/:productId', getProductReviews);

// Protected: create a review
router.post('/', protect, createReview);

// Protected: delete own review (or admin)
router.delete('/:id', protect, deleteReview);

module.exports = router;
