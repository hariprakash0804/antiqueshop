const { Review, User, Product, OrderItem, Order } = require('../models');
const { Op } = require('sequelize');

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return true;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('javascript:') || clean.startsWith('vbscript:') || clean.startsWith('data:text/html')) {
    return false;
  }
  return true;
};

// GET all reviews for a product
exports.getProductReviews = async (req, res) => {
  const productId = parseInt(req.params.productId);
  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const reviews = await Review.findAll({
      where: { productId },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? (total / reviews.length).toFixed(1) : 0;

    res.json({ reviews, avgRating: parseFloat(avgRating), count: reviews.length });
  } catch (error) {
    console.error('Fetch reviews error:', error.message);
    res.status(500).json({ message: 'Server error retrieving reviews' });
  }
};

// POST a new review (only customers who purchased can review)
exports.createReview = async (req, res) => {
  const { productId, rating, comment, imageUrl } = req.body;
  const parsedProductId = parseInt(productId);
  const parsedRating = parseInt(rating);

  if (isNaN(parsedProductId)) {
    return res.status(400).json({ message: 'Valid product ID is required' });
  }

  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  if (!isValidImageUrl(imageUrl)) {
    return res.status(400).json({ message: 'Invalid image URL protocol detected' });
  }

  try {
    // Check if user already reviewed this product
    const existing = await Review.findOne({
      where: { userId: req.user.id, productId: parsedProductId }
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Check if user actually purchased this product
    const purchased = await OrderItem.findOne({
      where: { productId: parsedProductId },
      include: [{
        model: Order,
        as: 'order',
        where: {
          userId: req.user.id,
          status: { [Op.in]: ['Paid', 'Shipped', 'Delivered'] }
        }
      }]
    });

    if (!purchased && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only review products you have purchased and received' });
    }

    const review = await Review.create({
      userId: req.user.id,
      productId: parsedProductId,
      rating: parsedRating,
      comment: typeof comment === 'string' ? comment.trim().slice(0, 2000) : null,
      imageUrl: imageUrl ? imageUrl.trim().slice(0, 1000) : null
    });

    const fullReview = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }]
    });

    res.status(201).json(fullReview);
  } catch (error) {
    console.error('Create review error:', error.message);
    res.status(500).json({ message: 'Server error creating review' });
  }
};

// DELETE a review (owner or admin)
exports.deleteReview = async (req, res) => {
  const reviewId = parseInt(req.params.id);
  if (isNaN(reviewId)) {
    return res.status(400).json({ message: 'Invalid review ID format' });
  }

  try {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    await review.destroy();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error.message);
    res.status(500).json({ message: 'Server error deleting review' });
  }
};
