const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const RoleRequest = require('../models/RoleRequest');
const Setting = require('../models/Setting');
const { addToBlacklist } = require('../middleware/authMiddleware');

// Generate token containing user id and tokenVersion
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      tokenVersion: user.tokenVersion !== undefined ? user.tokenVersion : 0 
    }, 
    process.env.JWT_SECRET || 'supersecretcyberkey12345', 
    { expiresIn: '7d' }
  );
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Type & presence validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'A valid name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim().slice(0, 100);

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email format' });
    }

    // Password strength check (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters in length' });
    }

    const userExists = await User.findOne({ where: { email: cleanEmail } });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // All registrations are strictly defaulted to 'customer'
    // To obtain other roles, the operator must submit a clearance request to Admin
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: 'customer',
      tokenVersion: 0
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      address: user.address,
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error processing registration' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Valid email and password credentials required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: cleanEmail } });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        token: generateToken(user)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during authentication' });
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
    console.error('Profile fetch error:', error.message);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

// Update user profile (name, phone, address, avatar) with strict attribute filtering and protocol validation
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, address, avatar } = req.body;

    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      updates.name = name.trim().slice(0, 100);
    }
    if (phone !== undefined) {
      updates.phone = typeof phone === 'string' ? phone.trim().slice(0, 30) : null;
    }
    if (address !== undefined) {
      updates.address = typeof address === 'string' ? address.trim().slice(0, 1000) : null;
    }
    if (avatar !== undefined) {
      if (typeof avatar === 'string') {
        const cleanAvatar = avatar.trim();
        // Prevent javascript: or vbscript: or other active content schemes (Self-XSS / DOM XSS defense)
        if (cleanAvatar.toLowerCase().startsWith('javascript:') || cleanAvatar.toLowerCase().startsWith('vbscript:')) {
          return res.status(400).json({ message: 'Invalid avatar scheme detected' });
        }
        updates.avatar = cleanAvatar.slice(0, 500);
      } else {
        updates.avatar = null;
      }
    }

    await user.update(updates);

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// Change password - invalidates all other active sessions (Session Hijacking defense)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Both current and new password are required strings' });
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
    
    // Increment tokenVersion to invalidate all existing sessions
    const nextTokenVersion = (user.tokenVersion || 0) + 1;
    await user.update({ 
      password: hashedPassword,
      tokenVersion: nextTokenVersion
    });

    // Generate new token for the current session
    const freshToken = generateToken({ ...user.toJSON(), tokenVersion: nextTokenVersion });

    res.json({ message: 'Password changed successfully. All other sessions invalidated.', token: freshToken });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ message: 'Server error updating password' });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        addToBlacklist(token);
      }
      res.json({ message: 'Decoupled connection signature successfully blacklisted.' });
    } else {
      res.status(400).json({ message: 'No signature tokens detected.' });
    }
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

exports.createRoleRequest = async (req, res) => {
  const { requestedRole, reason } = req.body;

  if (!['seller', 'order_manager'].includes(requestedRole)) {
    return res.status(400).json({ message: 'Invalid role requested. Permitted roles: seller, order_manager' });
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return res.status(400).json({ message: 'A valid explanation (minimum 5 characters) is required' });
  }

  try {
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
      reason: reason.trim().slice(0, 1000),
      status: 'pending'
    });

    res.status(201).json(roleRequest);
  } catch (error) {
    console.error('Create role request error:', error.message);
    res.status(500).json({ message: 'Server error creating role upgrade request' });
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
    console.error('Fetch my role requests error:', error.message);
    res.status(500).json({ message: 'Server error retrieving role requests' });
  }
};

exports.getTaxRate = async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: 'tax_rate' } });
    const taxRate = setting ? parseFloat(setting.value) : 18.0;
    res.json({ taxRate: isNaN(taxRate) ? 18.0 : taxRate });
  } catch (error) {
    console.error('Fetch tax rate error:', error.message);
    res.json({ taxRate: 18.0 });
  }
};
