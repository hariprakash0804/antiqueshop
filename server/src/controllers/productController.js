const { Product, User, Review } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Helper to sanitize and validate image URLs against dangerous schemes (XSS prevention)
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return true; // optional field
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('javascript:') || clean.startsWith('vbscript:') || clean.startsWith('data:text/html')) {
    return false;
  }
  return true;
};

exports.getProducts = async (req, res) => {
  const { category, search, sort, page, limit, minPrice, maxPrice } = req.query;
  const whereClause = {};

  // Cap limit between 1 and 100 to prevent DoS resource exhaustion
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const offset = (pageNum - 1) * pageSize;

  if (category && typeof category === 'string' && category !== 'All') {
    whereClause.category = category.trim().slice(0, 100);
  }

  // Escape SQL LIKE wildcards (% and _) to prevent LIKE injection DoS
  if (search && typeof search === 'string' && search.trim()) {
    const escapedSearch = search.trim().slice(0, 100).replace(/[%_\\]/g, '\\$&');
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${escapedSearch}%` } },
      { description: { [Op.like]: `%${escapedSearch}%` } }
    ];
  }

  if (minPrice || maxPrice) {
    whereClause.price = {};
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && min >= 0) whereClause.price[Op.gte] = min;
    if (!isNaN(max) && max >= 0) whereClause.price[Op.lte] = max;
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
    let ratingMap = {};

    if (productIds.length > 0) {
      const ratings = await Review.findAll({
        attributes: [
          'productId',
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
        ],
        where: { productId: { [Op.in]: productIds } },
        group: ['productId']
      });

      ratings.forEach(r => {
        ratingMap[r.productId] = {
          avgRating: parseFloat(parseFloat(r.getDataValue('avgRating') || 0).toFixed(1)),
          reviewCount: parseInt(r.getDataValue('reviewCount') || 0)
        };
      });
    }

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
    console.error('Fetch products error:', error.message);
    res.status(500).json({ message: 'Server error retrieving products' });
  }
};

exports.getProductById = async (req, res) => {
  const productId = parseInt(req.params.id);
  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const product = await Product.findByPk(productId, {
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
    console.error('Fetch product by ID error:', error.message);
    res.status(500).json({ message: 'Server error retrieving product' });
  }
};

exports.createProduct = async (req, res) => {
  const { title, description, price, imageUrl, category, stock, specifications } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Valid title string is required' });
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ message: 'Valid description string is required' });
  }
  if (!category || typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ message: 'Valid category string is required' });
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ message: 'Price must be a positive number' });
  }

  const parsedStock = stock !== undefined ? parseInt(stock) : 0;
  if (isNaN(parsedStock) || parsedStock < 0) {
    return res.status(400).json({ message: 'Stock must be a non-negative integer' });
  }

  if (!isValidImageUrl(imageUrl)) {
    return res.status(400).json({ message: 'Invalid image URL protocol detected' });
  }

  try {
    const product = await Product.create({
      title: title.trim().slice(0, 255),
      description: description.trim().slice(0, 5000),
      price: parsedPrice,
      imageUrl: imageUrl ? imageUrl.trim().slice(0, 1000) : null,
      category: category.trim().slice(0, 100),
      stock: parsedStock,
      sellerId: req.user.id,
      specifications: specifications ? (typeof specifications === 'object' ? JSON.stringify(specifications) : String(specifications).slice(0, 2000)) : null
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

exports.updateProduct = async (req, res) => {
  const productId = parseInt(req.params.id);
  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify ownership or admin privileges (BOLA / IDOR defense)
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const { title, description, price, imageUrl, category, stock, specifications } = req.body;

    const updates = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ message: 'Title cannot be empty' });
      updates.title = title.trim().slice(0, 255);
    }
    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) return res.status(400).json({ message: 'Description cannot be empty' });
      updates.description = description.trim().slice(0, 5000);
    }
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) return res.status(400).json({ message: 'Price must be a positive number' });
      updates.price = parsedPrice;
    }
    if (imageUrl !== undefined) {
      if (!isValidImageUrl(imageUrl)) return res.status(400).json({ message: 'Invalid image URL protocol detected' });
      updates.imageUrl = imageUrl ? imageUrl.trim().slice(0, 1000) : null;
    }
    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) return res.status(400).json({ message: 'Category cannot be empty' });
      updates.category = category.trim().slice(0, 100);
    }
    if (stock !== undefined) {
      const parsedStock = parseInt(stock);
      if (isNaN(parsedStock) || parsedStock < 0) return res.status(400).json({ message: 'Stock must be a non-negative integer' });
      updates.stock = parsedStock;
    }
    if (specifications !== undefined) {
      updates.specifications = specifications ? (typeof specifications === 'object' ? JSON.stringify(specifications) : String(specifications).slice(0, 2000)) : null;
    }

    await product.update(updates);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = parseInt(req.params.id);
  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const product = await Product.findByPk(productId);
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
    console.error('Delete product error:', error.message);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};
