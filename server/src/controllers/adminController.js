const { User, Order, Product, OrderItem, Review, Coupon } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const RoleRequest = require('../models/RoleRequest');
const Setting = require('../models/Setting');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error.message);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const validRoles = ['customer', 'seller', 'order_manager', 'admin'];

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Valid roles: customer, seller, order_manager, admin' });
  }

  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Lockout Guard: Prevent last administrator from demoting themselves
    if (user.id === req.user.id && user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot demote the sole remaining platform administrator' });
      }
    }

    // Invalidate sessions on role change (Session hijacking/privilege change defense)
    const nextTokenVersion = (user.tokenVersion || 0) + 1;
    await user.update({ role, tokenVersion: nextTokenVersion });
    
    const emailAlert = `✦ ORBITAL COMMONS ALERT: TRANSMITTED ROLE RE-CLEARANCE ENVELOPE TO ${user.email.toUpperCase()} VIA TEMPORAL LINK.`;

    res.json({ message: `User role updated successfully to ${role}`, user, emailAlert });
  } catch (error) {
    console.error('Update role error:', error.message);
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    const totalReviews = await Review.count();
    
    const paidOrders = await Order.findAll({
      where: { status: { [Op.in]: ['Paid', 'Shipped', 'Delivered'] } }
    });

    const totalRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    // Orders by status breakdown
    const statusCounts = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const ordersByStatus = {};
    statusCounts.forEach(s => {
      ordersByStatus[s.status] = parseInt(s.getDataValue('count'));
    });

    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await Order.findAll({
      where: {
        status: { [Op.in]: ['Paid', 'Shipped', 'Delivered'] },
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      order: [['createdAt', 'ASC']]
    });

    const revenueByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      revenueByDay[key] = 0;
    }
    recentOrders.forEach(order => {
      const day = new Date(order.createdAt).toISOString().split('T')[0];
      if (revenueByDay[day] !== undefined) {
        revenueByDay[day] += parseFloat(order.totalAmount);
      }
    });

    // Top selling products (split query to ensure compatibility with strict ONLY_FULL_GROUP_BY modes)
    const topOrderItems = await OrderItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'totalRevenue']
      ],
      group: ['productId'],
      order: [[sequelize.literal('totalSold'), 'DESC']],
      limit: 5
    });

    const topProducts = await Promise.all(
      topOrderItems.map(async (item) => {
        const product = await Product.findByPk(item.productId, {
          attributes: ['id', 'title', 'imageUrl', 'price']
        });
        return {
          productId: item.productId,
          totalSold: parseInt(item.getDataValue('totalSold')) || 0,
          totalRevenue: parseFloat(item.getDataValue('totalRevenue')) || 0,
          product: product ? product.toJSON() : null
        };
      })
    );

    // Recent orders (last 10)
    const recentActivityOrders = await Order.findAll({
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['title'] }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Users by role
    const roleCounts = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    const usersByRole = {};
    roleCounts.forEach(r => {
      usersByRole[r.role] = parseInt(r.getDataValue('count'));
    });

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      totalReviews,
      ordersByStatus,
      revenueByDay,
      topProducts,
      recentActivity: recentActivityOrders,
      usersByRole
    });
  } catch (error) {
    console.error('Fetch stats error:', error.message);
    res.status(500).json({ message: 'Server error retrieving stats' });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deleting themselves or other admins
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Administrators cannot delete their own account' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts directly' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// Reset database (admin only, blocked in production)
exports.resetDatabase = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Database reset operation is disabled in production environment' });
  }

  try {
    const bcrypt = require('bcryptjs');

    // Force sync database models
    await sequelize.sync({ force: true });

    // Seed default admin and accounts
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const admin = await User.create({
      name: 'Alpha Admin',
      email: 'admin@antique.com',
      password: hashedPassword,
      role: 'admin',
      tokenVersion: 0
    });

    const seller = await User.create({
      name: 'Vanguard Seller',
      email: 'seller@antique.com',
      password: hashedPassword,
      role: 'seller',
      tokenVersion: 0
    });

    const manager = await User.create({
      name: 'Nexus Order Manager',
      email: 'manager@antique.com',
      password: hashedPassword,
      role: 'order_manager',
      tokenVersion: 0
    });

    const customer = await User.create({
      name: 'Cyber Customer',
      email: 'customer@antique.com',
      password: hashedPassword,
      role: 'customer',
      phone: '+91 9876543210',
      address: '77 Nebula Tower, Cybercity Sector 9, Mumbai, Maharashtra, 400001',
      tokenVersion: 0
    });

    // Seed products
    const seededProducts = await Product.bulkCreate([
      {
        title: 'Astral Chronometer Pocket Watch',
        description: 'An elegant 19th-century Swiss-made pocket watch featuring an engraved brass casing. Retrofitted with futuristic neon-cyan hand movements that sync with stellar cycles.',
        price: 45000.00,
        imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop',
        category: 'Watches',
        stock: 5,
        sellerId: seller.id,
        specifications: JSON.stringify({ spec1: 'Swiss Lever Escapement', spec2: 'Circa 1888' })
      },
      {
        title: 'Victorian Royal Emerald Ring',
        description: 'A premium 18-karat gold ring from the late Victorian era. Embellished with a brilliant 2.4-carat emerald surrounded by fine diamonds, glowing under holographic light filters.',
        price: 125000.00,
        imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop',
        category: 'Jewelry',
        stock: 2,
        sellerId: seller.id,
        specifications: JSON.stringify({ spec1: '18k Yellow Gold', spec2: '2.4ct Emerald' })
      },
      {
        title: 'Imperial Roman Bronze Bust',
        description: 'An authentic excavation piece dating back to the 2nd century AD, depicting a noble philosopher. Displayed on an electromagnetic levitation pedestal for absolute preservation.',
        price: 290000.00,
        imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=600&auto=format&fit=crop',
        category: 'Antiques',
        stock: 1,
        sellerId: seller.id,
        specifications: JSON.stringify({ spec1: 'Ancient Roman Bust', spec2: 'Excavated in Pompeii' })
      }
    ]);

    // Seed coupons & settings
    await Coupon.bulkCreate([
      { code: 'NEXUS20', discount: 20 },
      { code: 'ANCIENT10', discount: 10 }
    ]);

    await Setting.create({ key: 'tax_rate', value: '18' });

    res.json({ status: 'success', message: 'System database successfully reset to seed defaults' });
  } catch (error) {
    console.error('Reset database error:', error.message);
    res.status(500).json({ message: 'Server error resetting database' });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json(coupons);
  } catch (error) {
    console.error('Fetch coupons error:', error.message);
    res.status(500).json({ message: 'Server error retrieving coupons' });
  }
};

exports.createCoupon = async (req, res) => {
  const { code, discount } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ message: 'Valid coupon code string required' });
  }

  const parsedDiscount = parseInt(discount);
  if (isNaN(parsedDiscount) || parsedDiscount < 1 || parsedDiscount > 100) {
    return res.status(400).json({ message: 'Discount percentage must be an integer between 1 and 100' });
  }

  const cleanCode = code.trim().toUpperCase().slice(0, 30);

  try {
    const exists = await Coupon.findOne({ where: { code: cleanCode } });
    if (exists) {
      return res.status(400).json({ message: 'Coupon code already registered' });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      discount: parsedDiscount
    });
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error.message);
    res.status(500).json({ message: 'Server error creating coupon' });
  }
};

exports.deleteCoupon = async (req, res) => {
  if (!req.params.code || typeof req.params.code !== 'string') {
    return res.status(400).json({ message: 'Invalid coupon code format' });
  }

  try {
    const cleanCode = req.params.code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ where: { code: cleanCode } });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    await coupon.destroy();
    res.json({ message: 'Promo coupon registry deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error.message);
    res.status(500).json({ message: 'Server error deleting coupon' });
  }
};

exports.getRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    console.error('Fetch all role requests error:', error.message);
    res.status(500).json({ message: 'Server error retrieving role requests' });
  }
};

exports.resolveRoleRequest = async (req, res) => {
  const requestId = parseInt(req.params.id);
  const { status } = req.body; // 'approved' or 'rejected'

  if (isNaN(requestId)) {
    return res.status(400).json({ message: 'Invalid request ID format' });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid resolution status' });
  }

  try {
    const request = await RoleRequest.findByPk(requestId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Role request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been resolved' });
    }

    // Update request status
    await request.update({ status });

    // If approved, update user role and increment tokenVersion to require clean session re-auth
    if (status === 'approved' && request.user) {
      const nextTokenVersion = (request.user.tokenVersion || 0) + 1;
      await request.user.update({ 
        role: request.requestedRole,
        tokenVersion: nextTokenVersion 
      });
    }

    res.json({ message: `Role upgrade request successfully ${status}`, request });
  } catch (error) {
    console.error('Resolve role request error:', error.message);
    res.status(500).json({ message: 'Server error resolving role request' });
  }
};

exports.updateTaxRate = async (req, res) => {
  const { taxRate } = req.body;
  const parsedTax = parseFloat(taxRate);
  
  if (taxRate === undefined || isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
    return res.status(400).json({ message: 'Invalid tax rate value. Must be a number between 0 and 100.' });
  }

  try {
    let setting = await Setting.findOne({ where: { key: 'tax_rate' } });
    if (setting) {
      await setting.update({ value: parsedTax.toString() });
    } else {
      setting = await Setting.create({ key: 'tax_rate', value: parsedTax.toString() });
    }
    res.json({ message: 'Tax rate updated successfully', taxRate: parsedTax });
  } catch (error) {
    console.error('Update tax rate error:', error.message);
    res.status(500).json({ message: 'Server error updating tax rate' });
  }
};
