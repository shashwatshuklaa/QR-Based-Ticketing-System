const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required.');
  } else {
    console.warn('[Security Warning] JWT_SECRET is not set in environment variables. Please define JWT_SECRET in server/.env.');
  }
}

// Hashes a plain-text password using bcrypt (cost factor 12, matching the original)
const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

// Verifies if a plain-text password matches the stored hash
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Generates a 7-day JWT token with the user's role and event information
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Validates a JWT token and returns the decoded payload, or null if invalid/expired
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Extracts and verifies the token from either the Authorization header or the cookies
const getUserFromRequest = (req) => {
  let token = null;

  // 1. Check Authorization Bearer header: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Check Cookie header if no Bearer header is present: "token=<token>"
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
    token = cookies.token;
  }

  if (!token) {
    return null;
  }

  return verifyToken(token);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getUserFromRequest,
};
