const { Wishlist, Product, User } = require('../models');

// GET user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        as: 'product',
        include: [{ model: User, as: 'seller', attributes: ['id', 'name'] }]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(items);
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST toggle a product in wishlist (add if absent, remove if present)
exports.toggleWishlist = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'productId is required' });
  }

  try {
    const existing = await Wishlist.findOne({
      where: { userId: req.user.id, productId }
    });

    if (existing) {
      await existing.destroy();
      return res.json({ action: 'removed', productId });
    } else {
      // Verify product exists
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      await Wishlist.create({ userId: req.user.id, productId });
      return res.json({ action: 'added', productId });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE remove a product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      where: { userId: req.user.id, productId: req.params.productId }
    });
    if (!item) {
      return res.status(404).json({ message: 'Item not in wishlist' });
    }
    await item.destroy();
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
