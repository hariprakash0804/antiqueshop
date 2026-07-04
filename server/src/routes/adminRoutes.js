const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, getPlatformStats, deleteUser, resetDatabase, getCoupons, createCoupon, deleteCoupon } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here require Admin privilege
router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/stats', getPlatformStats);
router.post('/reset-db', resetDatabase);

router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:code', deleteCoupon);

module.exports = router;
