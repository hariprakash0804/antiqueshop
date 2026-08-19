const { Order, OrderItem, Product, User, Coupon, Setting } = require('../models');
const sequelize = require('../config/db');

exports.createOrder = async (req, res) => {
  const { items, shippingAddress, couponCode } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items provided in order acquisition queue' });
  }

  if (!shippingAddress || typeof shippingAddress !== 'string' || !shippingAddress.trim()) {
    return res.status(400).json({ message: 'A valid shipping destination address is required' });
  }

  const t = await sequelize.transaction();

  try {
    let subtotal = 0;
    const verifiedItems = [];

    // 1. Authoritatively verify stock and compute true price from database records
    for (const item of items) {
      const productId = parseInt(item.productId);
      const quantity = parseInt(item.quantity);

      if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid item product ID or quantity format' });
      }

      const prod = await Product.findByPk(productId, { transaction: t });
      if (!prod) {
        await t.rollback();
        return res.status(404).json({ message: `Product with ID ${productId} not found` });
      }
      if (prod.stock < quantity) {
        await t.rollback();
        return res.status(400).json({ message: `Insufficient stock for product: ${prod.title}. Available: ${prod.stock}` });
      }

      const unitPrice = parseFloat(prod.price);
      subtotal += unitPrice * quantity;

      verifiedItems.push({
        productId: prod.id,
        quantity,
        price: unitPrice
      });
    }

    // 2. Authoritatively validate and apply coupon discount if provided
    let discountAmount = 0;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCouponCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ where: { code: cleanCouponCode }, transaction: t });
      if (coupon && coupon.discount > 0) {
        discountAmount = parseFloat(((subtotal * coupon.discount) / 100).toFixed(2));
      }
    }

    // 3. Authoritatively compute shipping fee from transit method
    let shippingFee = 0;
    const cleanAddress = shippingAddress.trim().slice(0, 1000);
    if (cleanAddress.toUpperCase().includes('ORBITAL')) {
      shippingFee = 2500;
    } else if (cleanAddress.toUpperCase().includes('ESCORT')) {
      shippingFee = 9500;
    }

    // 4. Authoritatively fetch tax rate and compute tax & total amount
    const taxSetting = await Setting.findOne({ where: { key: 'tax_rate' }, transaction: t });
    const taxRate = taxSetting ? parseFloat(taxSetting.value) : 18.0;
    const taxableBase = Math.max(0, subtotal - discountAmount + shippingFee);
    const taxAmount = parseFloat(((taxableBase * taxRate) / 100).toFixed(2));
    const totalAmount = parseFloat((taxableBase + taxAmount).toFixed(2));

    // 5. Create Order in Pending status
    const order = await Order.create({
      userId: req.user.id,
      subtotalAmount: parseFloat(subtotal.toFixed(2)),
      taxAmount,
      discountAmount,
      totalAmount,
      shippingAddress: cleanAddress,
      status: 'Pending'
    }, { transaction: t });

    // 6. Create OrderItem records with authentic verified prices
    for (const vItem of verifiedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: vItem.productId,
        quantity: vItem.quantity,
        price: vItem.price
      }, { transaction: t });
    }

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    res.status(201).json(fullOrder);
  } catch (error) {
    await t.rollback();
    console.error('Create order error:', error.message);
    res.status(500).json({ message: 'Server error initializing order' });
  }
};

exports.getOrders = async (req, res) => {
  const role = req.user.role;

  try {
    let orders;

    if (role === 'admin' || role === 'order_manager') {
      orders = await Order.findAll({
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'name', 'email']
          },
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else if (role === 'seller') {
      const orderItems = await OrderItem.findAll({
        include: [
          {
            model: Product,
            as: 'product',
            where: { sellerId: req.user.id }
          },
          {
            model: Order,
            as: 'order',
            include: [{ model: User, as: 'customer', attributes: ['id', 'name', 'email'] }]
          }
        ]
      });

      const orderMap = {};
      orderItems.forEach(oi => {
        if (oi.order) {
          const ordId = oi.order.id;
          if (!orderMap[ordId]) {
            orderMap[ordId] = {
              ...oi.order.toJSON(),
              items: []
            };
          }
          orderMap[ordId].items.push({
            id: oi.id,
            productId: oi.productId,
            quantity: oi.quantity,
            price: oi.price,
            product: oi.product
          });
        }
      });

      orders = Object.values(orderMap).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      orders = await Order.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'name', 'email']
          },
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error.message);
    res.status(500).json({ message: 'Server error retrieving orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided' });
  }

  const t = await sequelize.transaction();

  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Rule: once an order status is changed to delivered, it cannot be changed to any other status
    if (order.status === 'Delivered') {
      await t.rollback();
      return res.status(400).json({ message: 'Delivered orders are finalized and cannot be shifted to any other state.' });
    }

    // Rule: when cancelled, the status can be changed only to refunded
    if (order.status === 'Cancelled' && status !== 'Refunded') {
      await t.rollback();
      return res.status(400).json({ message: 'Cancelled orders can only transition to Refunded.' });
    }

    // Checking authorizations
    if (req.user.role === 'seller' && (status === 'Cancelled' || status === 'Refunded')) {
      await t.rollback();
      return res.status(403).json({ message: 'Sellers cannot cancel or refund orders globally' });
    }

    // Stock Restoration Guard: If order was Paid/Shipped and is being Cancelled/Refunded, replenish stock
    if (['Paid', 'Shipped'].includes(order.status) && ['Cancelled', 'Refunded'].includes(status)) {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const prod = await Product.findByPk(item.productId, { transaction: t });
          if (prod) {
            await prod.update({ stock: prod.stock + item.quantity }, { transaction: t });
          }
        }
      }
    }

    const updateData = { status };
    if (notes !== undefined) {
      updateData.notes = typeof notes === 'string' ? notes.slice(0, 1000) : null;
    }

    await order.update(updateData, { transaction: t });
    await t.commit();

    res.json(order);
  } catch (error) {
    await t.rollback();
    console.error('Update status error:', error.message);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

exports.requestCancellation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify it is the user's order or authorized admin/order_manager (BOLA / IDOR protection)
    if (order.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'order_manager') {
      await t.rollback();
      return res.status(403).json({ message: 'Unauthorized to cancel this order' });
    }

    if (order.status === 'Delivered' || order.status === 'Cancelled' || order.status === 'Refunded') {
      await t.rollback();
      return res.status(400).json({ message: `Cannot cancel an order in ${order.status} state` });
    }

    // Restore stock if the order was already Paid
    if (order.status === 'Paid' && order.items && order.items.length > 0) {
      for (const item of order.items) {
        const prod = await Product.findByPk(item.productId, { transaction: t });
        if (prod) {
          await prod.update({ stock: prod.stock + item.quantity }, { transaction: t });
        }
      }
    }

    await order.update({ status: 'Cancelled' }, { transaction: t });
    await t.commit();

    res.json({ message: 'Order successfully cancelled', order });
  } catch (error) {
    await t.rollback();
    console.error('Cancel request error:', error.message);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
};
