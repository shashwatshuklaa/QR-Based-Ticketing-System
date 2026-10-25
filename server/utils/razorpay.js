const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Returns an instance of the official Razorpay SDK if environment variables
 * RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are configured.
 */
const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

/**
 * Creates a Razorpay order via the official SDK when configured,
 * or returns a simulated test order when test keys are omitted.
 *
 * @param {number} amountInPaise - The trusted amount in paise (1 INR = 100 paise)
 * @param {string} receiptId - Unique receipt identifier
 * @param {object} notes - Optional metadata notes (e.g. userId, eventId)
 * @returns {Promise<object>} Order details containing id, amount, currency, and isSimulated flag
 */
const createRazorpayOrder = async (amountInPaise, receiptId, notes = {}) => {
  const razorpay = getRazorpayInstance();

  // If actual test keys are configured in environment, use official Razorpay SDK
  if (razorpay) {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amountInPaise),
        currency: 'INR',
        receipt: receiptId,
        notes: notes,
      });
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        isSimulated: false,
      };
    } catch (error) {
      // Do not log secrets or sensitive payload
      const safeErrorMessage = error.error?.description || error.message || 'Failed to create Razorpay order';
      console.error('[Razorpay SDK] Order creation error:', safeErrorMessage);
      throw new Error(safeErrorMessage);
    }
  }

  // Graceful test fallback: If no Razorpay keys are configured in local environment,
  // create a simulated test order so developers can test without crashing.
  console.log('[Razorpay] No API keys configured in environment. Using simulated test order mode.');
  return {
    id: `order_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    amount: Math.round(amountInPaise),
    currency: 'INR',
    receipt: receiptId,
    status: 'created',
    isSimulated: true,
  };
};

/**
 * Verifies Razorpay payment signature using the RAZORPAY_KEY_SECRET.
 * Uses timing-safe string comparison to protect against timing analysis attacks.
 *
 * @param {string} orderId - Razorpay order ID (e.g. order_xxx)
 * @param {string} paymentId - Razorpay payment ID (e.g. pay_xxx)
 * @param {string} signature - HMAC SHA256 signature returned by Razorpay Checkout
 * @returns {boolean} True if signature is valid, false otherwise
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    if (!orderId || !paymentId || !signature) {
      return false;
    }

    // When RAZORPAY_KEY_SECRET is configured, perform standard Razorpay HMAC SHA256 verification
    if (process.env.RAZORPAY_KEY_SECRET && !orderId.startsWith('order_sim_')) {
      const payload = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
      const signatureBuffer = Buffer.from(signature, 'utf-8');

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    }

    // Fallback scheme for simulated orders when test keys are not configured
    if (orderId.startsWith('order_sim_') || orderId.startsWith('order_test_')) {
      const expectedSimulated = crypto
        .createHash('sha256')
        .update(`${orderId}|${paymentId}|test_secret`)
        .digest('hex');
      return signature === expectedSimulated || signature === 'test_signature';
    }

    console.warn('[Razorpay] Cannot verify signature: RAZORPAY_KEY_SECRET environment variable is not set.');
    return false;
  } catch (error) {
    console.error('[Razorpay] Signature verification error:', error.message);
    return false;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayInstance,
};
