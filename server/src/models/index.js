const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const Wishlist = require('./Wishlist');
const Coupon = require('./Coupon');
const RoleRequest = require('./RoleRequest');
const Setting = require('./Setting');

// ── User ↔ Product (Seller relationship) ──
User.hasMany(Product, { foreignKey: 'sellerId', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

// ── User ↔ Order ──
User.hasMany(Order, { foreignKey: 'userId', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'customer' });

// ── Order ↔ OrderItem ──
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// ── OrderItem ↔ Product ──
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });

// ── User ↔ Review ──
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });

// ── Product ↔ Review ──
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ── User ↔ Wishlist ──
User.hasMany(Wishlist, { foreignKey: 'userId', as: 'wishlistItems', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Product ↔ Wishlist ──
Product.hasMany(Wishlist, { foreignKey: 'productId', as: 'wishlistedBy', onDelete: 'CASCADE' });
Wishlist.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ── User ↔ RoleRequest ──
User.hasMany(RoleRequest, { foreignKey: 'userId', as: 'roleRequests', onDelete: 'CASCADE' });
RoleRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Product,
  Order,
  OrderItem,
  Review,
  Wishlist,
  Coupon,
  RoleRequest,
  Setting
};
