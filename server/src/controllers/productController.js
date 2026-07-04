const { Product, User, Review } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

exports.getProducts = async (req, res) => {
  const { category, search, sort, page, limit } = req.query;
  const whereClause = {};
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 20;
  const offset = (pageNum - 1) * pageSize;

  const { minPrice, maxPrice } = req.query;

  if (category && category !== 'All') {
    whereClause.category = category;
  }

  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
  }

  // Determine sort order
  let orderClause = [['createdAt', 'DESC']];
  if (sort === 'price_asc') orderClause = [['price', 'ASC']];
  else if (sort === 'price_desc') orderClause = [['price', 'DESC']];
  else if (sort === 'newest') orderClause = [['createdAt', 'DESC']];
  else if (sort === 'oldest') orderClause = [['createdAt', 'ASC']];

  try {
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'seller', attributes: ['id', 'name', 'email'] }
      ],
      order: orderClause,
      limit: pageSize,
      offset
    });

    // Get average ratings for these products
    const productIds = products.map(p => p.id);
    const ratings = await Review.findAll({
      attributes: [
        'productId',
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
      ],
      where: { productId: { [Op.in]: productIds } },
      group: ['productId']
    });

    const ratingMap = {};
    ratings.forEach(r => {
      ratingMap[r.productId] = {
        avgRating: parseFloat(parseFloat(r.getDataValue('avgRating')).toFixed(1)),
        reviewCount: parseInt(r.getDataValue('reviewCount'))
      };
    });

    const enrichedProducts = products.map(p => ({
      ...p.toJSON(),
      avgRating: ratingMap[p.id]?.avgRating || 0,
      reviewCount: ratingMap[p.id]?.reviewCount || 0
    }));

    res.json({
      products: enrichedProducts,
      pagination: {
        total: count,
        page: pageNum,
        pages: Math.ceil(count / pageSize),
        limit: pageSize
      }
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: User, as: 'seller', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get reviews
    const reviews = await Review.findAll({
      where: { productId: product.id },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? parseFloat((total / reviews.length).toFixed(1)) : 0;

    res.json({
      ...product.toJSON(),
      reviews,
      avgRating,
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Fetch product by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProduct = async (req, res) => {
  const { title, description, price, imageUrl, category, stock, specifications } = req.body;

  if (!title || !description || !price || !category) {
    return res.status(400).json({ message: 'Title, description, price, and category are required' });
  }

  try {
    const product = await Product.create({
      title,
      description,
      price,
      imageUrl,
      category,
      stock: stock || 0,
      sellerId: req.user.id,
      specifications
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify ownership or admin privileges
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const { title, description, price, imageUrl, category, stock, specifications } = req.body;
    await product.update({
      title: title || product.title,
      description: description || product.description,
      price: price || product.price,
      imageUrl: imageUrl || product.imageUrl,
      category: category || product.category,
      stock: stock !== undefined ? stock : product.stock,
      specifications: specifications !== undefined ? specifications : product.specifications
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify ownership or admin privileges
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
