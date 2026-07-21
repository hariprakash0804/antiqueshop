const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretcyberkey12345', {
    expiresIn: '30d',
  });
};

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // All registrations are strictly defaulted to 'customer'
    // To obtain other roles, the operator must submit a request to the Admin
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'customer'
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      address: user.address,
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile (name, phone, address, avatar)
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, address, avatar } = req.body;

    await user.update({
      name: name || user.name,
      phone: phone !== undefined ? phone : user.phone,
      address: address !== undefined ? address : user.address,
      avatar: avatar !== undefined ? avatar : user.avatar
    });

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const { blacklistedTokens } = require('../middleware/authMiddleware');

exports.logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.split(' ')[1];
      blacklistedTokens.add(token);
      res.json({ message: 'Decoupled connection signature successfully blacklisted.' });
    } else {
      res.status(400).json({ message: 'No signature tokens detected.' });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const RoleRequest = require('../models/RoleRequest');

exports.createRoleRequest = async (req, res) => {
  const { requestedRole, reason } = req.body;
  if (!['seller', 'order_manager'].includes(requestedRole)) {
    return res.status(400).json({ message: 'Invalid role requested' });
  }
  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ message: 'A valid explanation (minimum 5 characters) is required' });
  }

  try {
    // Check if there is already a pending request for the same role
    const existingPending = await RoleRequest.findOne({
      where: {
        userId: req.user.id,
        requestedRole,
        status: 'pending'
      }
    });

    if (existingPending) {
      return res.status(400).json({ message: `A pending upgrade request for ${requestedRole.toUpperCase()} already exists.` });
    }

    const roleRequest = await RoleRequest.create({
      userId: req.user.id,
      requestedRole,
      reason: reason.trim(),
      status: 'pending'
    });

    res.status(201).json(roleRequest);
  } catch (error) {
    console.error('Create role request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    console.error('Fetch my role requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
