const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  logoutUser,
  createRoleRequest,
  getMyRoleRequests,
  getTaxRate
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/password', protect, changePassword);

router.post('/role-request', protect, createRoleRequest);
router.get('/role-request', protect, getMyRoleRequests);
router.get('/tax-rate', protect, getTaxRate);

module.exports = router;
