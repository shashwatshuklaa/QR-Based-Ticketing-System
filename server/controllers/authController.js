const User = require('../models/User');
const Event = require('../models/Event');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const OTP = require('../models/OTP');
const {
  isValidEmail,
  isValidPhone,
  sanitizeString,
  isValidPassword,
  isValidDOB,
  isValidObjectId,
  checkRateLimit,
} = require('../utils/validation');
const {
  hashPassword,
  comparePassword,
  generateToken,
  getUserFromRequest,
} = require('../utils/auth');
const { sendOTPEmail } = require('../utils/email');

/**
 * Helper to set standard auth cookie on response
 */
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true, // Prevents JavaScript from reading the cookie (protects against XSS)
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

/**
 * Register a new attendee for an event
 */
exports.register = async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, password, eventId } = req.body;

    if (!name || !email || !phone || !dateOfBirth || !password || !eventId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number. Please enter a valid 10-digit number' });
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] });
    }

    if (!isValidDOB(new Date(dateOfBirth))) {
      return res.status(400).json({ error: 'Invalid date of birth. Must be at least 10 years old' });
    }

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const existingUser = await User.findOne({ email: sanitizedEmail, eventId });
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered for this event' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      password: hashedPassword,
      eventId,
    });

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: 'user',
      eventId: user.eventId.toString(),
    });

    setTokenCookie(res, token);

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        eventId: user.eventId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error.message || error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User already registered for this event' });
    }
    return res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * User login for an event
 */
exports.login = async (req, res) => {
  try {
    const { email, password, eventId } = req.body;

    if (!email || !password || !eventId) {
      return res.status(400).json({ error: 'Email, password, and event ID are required' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(`login:${clientIp}:${email}`, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes' });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const user = await User.findOne({ email: sanitizedEmail, eventId });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: 'user',
      eventId: user.eventId.toString(),
    });

    setTokenCookie(res, token);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        eventId: user.eventId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Admin Login
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(`admin-login:${clientIp}:${email}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes' });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: sanitizedEmail });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: admin._id.toString(),
      email: admin.email,
      role: 'admin',
      eventIds: admin.eventIds ? admin.eventIds.map((id) => id.toString()) : [],
    });

    setTokenCookie(res, token);

    return res.status(200).json({
      message: 'Admin login successful',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        eventIds: admin.eventIds,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Admin login failed' });
  }
};

/**
 * Super Admin Login
 */
exports.superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(`superadmin-login:${clientIp}:${email}`, 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes' });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const superAdmin = await SuperAdmin.findOne({ email: sanitizedEmail });
    if (!superAdmin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, superAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: superAdmin._id.toString(),
      email: superAdmin.email,
      role: 'superadmin',
    });

    setTokenCookie(res, token);

    return res.status(200).json({
      message: 'Super Admin login successful',
      superAdmin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
      },
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    return res.status(500).json({ error: 'Super Admin login failed' });
  }
};

/**
 * Get current session user
 */
exports.getMe = async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(200).json({ user: null });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Current user error:', error);
    return res.status(200).json({ user: null });
  }
};

/**
 * Log out user (clears session cookie)
 */
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
};
