/**
 * Validation utilities translated directly from the original project
 */

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  // Supports: 10 digits, +91 prefix, with or without spaces/dashes
  const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ""));
};

const sanitizeString = (input) => {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
};

const isValidPassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
};

const isValidDOB = (date) => {
  const now = new Date();
  const dob = new Date(date);

  if (isNaN(dob.getTime())) return false;
  if (dob >= now) return false;

  // Must be at least 10 years old
  const minAge = new Date();
  minAge.setFullYear(minAge.getFullYear() - 10);
  if (dob > minAge) return false;

  // Must be less than 120 years old
  const maxAge = new Date();
  maxAge.setFullYear(maxAge.getFullYear() - 120);
  if (dob < maxAge) return false;

  return true;
};

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Rate limiting in-memory store (matches original implementation)
const rateLimitStore = new Map();

const checkRateLimit = (
  key,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000 // 15 minutes
) => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Periodically clean up expired records
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  sanitizeString,
  isValidPassword,
  isValidDOB,
  isValidObjectId,
  checkRateLimit,
};
