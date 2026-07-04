const { User, Order, Product, OrderItem, Review, Coupon } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const validRoles = ['customer', 'seller', 'order_manager', 'admin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ role });
    
    // Simulate dispatching orbital alert email
    console.log(`[ORBITAL COMMONS] Dispatching role update warning to operator: ${user.email} (New Role: ${role.toUpperCase()})`);
    const emailAlert = `✦ ORBITAL COMMONS ALERT: TRANSMITTED ROLE RE-CLEARANCE ENVELOPE TO ${user.email.toUpperCase()} VIA TEMPORAL LINK.`;

    res.json({ message: `User role updated successfully to ${role}`, user, emailAlert });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
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

    // Top selling products
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'totalRevenue']
      ],
      group: ['productId'],
      order: [[sequelize.literal('totalSold'), 'DESC']],
      limit: 5,
      include: [{ model: Product, as: 'product', attributes: ['id', 'title', 'imageUrl', 'price'] }]
    });

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
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset database to seed defaults (admin only)
exports.resetDatabase = async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    
    const seedScript = path.join(__dirname, '..', 'scripts', 'seed.js');
    
    exec(`node "${seedScript}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Reset database exec error: ${error}`);
        return res.status(500).json({ message: 'Database reset process failed', error: error.message });
      }
      console.log(`Database Reset: ${stdout}`);
      res.json({ status: 'success', message: 'System database successfully reset to seed defaults' });
    });
  } catch (error) {
    console.error('Reset database error:', error);
    res.status(500).json({ message: 'Server error resetting database' });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json(coupons);
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCoupon = async (req, res) => {
  const { code, discount } = req.body;
  if (!code || isNaN(discount) || discount < 1 || discount > 100) {
    return res.status(400).json({ message: 'Invalid code input or discount range.' });
  }

  try {
    const exists = await Coupon.findOne({ where: { code: code.toUpperCase() } });
    if (exists) {
      return res.status(400).json({ message: 'Coupon code already registered.' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discount
    });
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ where: { code: req.params.code.toUpperCase() } });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    await coupon.destroy();
    res.json({ message: 'Promo coupon registry deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
