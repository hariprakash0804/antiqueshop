const { Order, OrderItem, Product, User } = require('../models');

exports.createOrder = async (req, res) => {
  const { items, totalAmount, shippingAddress } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in order' });
  }

  try {
    // 1. Verify stock availability for all items in sequence
    for (const item of items) {
      const prod = await Product.findByPk(item.productId);
      if (!prod) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${prod.title}. Available: ${prod.stock}` });
      }
    }

    // Create the Order in Pending status
    const order = await Order.create({
      userId: req.user.id,
      totalAmount,
      shippingAddress,
      status: 'Pending'
    });

    // Create OrderItems records
    const orderItemPromises = items.map(item => {
      return OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
    });

    await Promise.all(orderItemPromises);

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    res.status(201).json(fullOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrders = async (req, res) => {
  const role = req.user.role;

  try {
    let orders;

    if (role === 'admin' || role === 'order_manager') {
      // Admins and Order Managers see all orders
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
      // Sellers see orders containing their products
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

      // Group order items by order ID
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
      // Customers see their own orders
      orders = await Order.findAll({
        where: { userId: req.user.id },
        include: [
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
    console.error('Fetch orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Checking authorizations
    // Sellers can mark their orders shipped, but only Order Managers and Admins can perform full state shifts
    if (req.user.role === 'seller' && (status === 'Cancelled' || status === 'Refunded')) {
      return res.status(403).json({ message: 'Sellers cannot cancel or refund orders globally' });
    }

    const updateData = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await order.update(updateData);
    res.json(order);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.requestCancellation = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify it is the user's order
    if (order.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'order_manager') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Cancel order
    // If order was Paid, setting it to Cancelled triggers Order Manager's refund dashboard alert
    await order.update({ status: 'Cancelled' });
    res.json({ message: 'Order successfully cancelled', order });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
