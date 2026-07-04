const { Review, User, Product, OrderItem } = require('../models');
const { Op } = require('sequelize');

// GET all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.productId },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate average rating
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? (total / reviews.length).toFixed(1) : 0;

    res.json({ reviews, avgRating: parseFloat(avgRating), count: reviews.length });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST a new review (only customers who purchased can review)
exports.createReview = async (req, res) => {
  const { productId, rating, comment, imageUrl } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if user already reviewed this product
    const existing = await Review.findOne({
      where: { userId: req.user.id, productId }
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Check if user actually purchased this product
    const purchased = await OrderItem.findOne({
      where: { productId },
      include: [{
        model: require('../models/Order'),
        as: 'order',
        where: {
          userId: req.user.id,
          status: { [Op.in]: ['Paid', 'Shipped', 'Delivered'] }
        }
      }]
    });

    if (!purchased && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only review products you have purchased' });
    }

    const review = await Review.create({
      userId: req.user.id,
      productId,
      rating,
      comment,
      imageUrl
    });

    const fullReview = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }]
    });

    res.status(201).json(fullReview);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE a review (owner or admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await review.destroy();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
