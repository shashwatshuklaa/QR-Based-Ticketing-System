const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../utils/razorpay');
const { generateQRId, generateQRCode } = require('../utils/qr');
const { sendTicketEmail } = require('../utils/email');
const { isValidObjectId } = require('../utils/validation');
const { getUserFromRequest } = require('../utils/auth');

/**
 * Creates a Razorpay Order for a specific event ticket booking.
 * Determines the amount strictly from trusted server-side event data.
 * Never trusts an amount supplied by the browser.
 */
exports.createOrder = async (req, res) => {
  try {
    const { eventId } = req.body;
    let userId = req.body.userId;

    // Prefer verified user from session cookie if present
    const sessionUser = getUserFromRequest(req);
    if (sessionUser && sessionUser.id) {
      userId = sessionUser.id;
    }

    if (!eventId || !userId) {
      return res.status(400).json({ error: 'Event ID and User ID are required' });
    }

    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid Event ID or User ID' });
    }

    // 1. Fetch event from database (trusted server-side data source)
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.isActive) {
      return res.status(400).json({ error: 'This event is currently inactive and not accepting registrations' });
    }

    // 2. Fetch attendee record
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Prevent duplicate ticket purchases for the same user & event
    const existingConfirmedTicket = await Ticket.findOne({
      userId,
      eventId,
      paymentStatus: 'completed',
    });
    if (existingConfirmedTicket) {
      return res.status(400).json({
        error: 'You already hold a confirmed ticket for this event',
        ticketId: existingConfirmedTicket._id,
      });
    }

    // 4. Capacity check
    const bookedCount = await Ticket.countDocuments({
      eventId,
      paymentStatus: 'completed',
    });
    if (event.maxCapacity && bookedCount >= event.maxCapacity) {
      return res.status(400).json({ error: 'This event has reached maximum capacity and is sold out' });
    }

    // 5. Calculate amount in paise from trusted event ticket price (1 INR = 100 paise)
    // NEVER read or trust an amount from req.body!
    const amountInPaise = Math.round(event.ticketPrice * 100);
    const receiptId = `rcpt_${userId.toString().slice(-8)}_${Date.now()}`;

    // 6. Create Razorpay order via SDK
    const order = await createRazorpayOrder(amountInPaise, receiptId, {
      userId: userId.toString(),
      eventId: eventId.toString(),
    });

    // 7. Record or update pending ticket to track this checkout session
    let ticket = await Ticket.findOne({
      userId,
      eventId,
      paymentStatus: 'pending',
    });

    if (ticket) {
      ticket.orderId = order.id;
      ticket.amount = event.ticketPrice;
      await ticket.save();
    } else {
      ticket = await Ticket.create({
        userId,
        eventId,
        orderId: order.id,
        amount: event.ticketPrice,
        paymentStatus: 'pending',
        scanStatus: 'unused',
      });
    }

    // 8. Return order details and public Key ID (never RAZORPAY_KEY_SECRET)
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated',
      isSimulated: !!order.isSimulated,
      ticketId: ticket._id,
    });
  } catch (error) {
    console.error('[Payment] Create order error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Failed to create payment order' });
  }
};

/**
 * Verifies Razorpay payment signature and issues the official QR ticket.
 * Enforces cryptographic server-side verification before generating QR codes.
 * Guarantees idempotency on duplicate callbacks or retries.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, eventId } = req.body;
    let userId = req.body.userId;

    const sessionUser = getUserFromRequest(req);
    if (sessionUser && sessionUser.id) {
      userId = sessionUser.id;
    }

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters (orderId, paymentId, signature)' });
    }

    // 1. Idempotency Check: Payment ID already completed
    const existingTicketByPayment = await Ticket.findOne({
      paymentId,
      paymentStatus: 'completed',
    });
    if (existingTicketByPayment) {
      return res.status(200).json({
        message: 'Payment already processed and ticket confirmed',
        ticket: {
          id: existingTicketByPayment._id,
          qrCode: existingTicketByPayment.qrCode,
          qrId: existingTicketByPayment.qrId,
        },
      });
    }

    // 2. Find pending ticket/booking for this order
    let ticket = await Ticket.findOne({ orderId });
    if (!ticket && userId && eventId) {
      ticket = await Ticket.findOne({ userId, eventId });
    }

    // Idempotent retry: Ticket is already completed
    if (ticket && ticket.paymentStatus === 'completed') {
      return res.status(200).json({
        message: 'Payment already verified for this booking',
        ticket: {
          id: ticket._id,
          qrCode: ticket.qrCode,
          qrId: ticket.qrId,
        },
      });
    }

    // 3. Cryptographic server-side signature verification (RAZORPAY_KEY_SECRET)
    const isValidSignature = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      console.warn(`[Payment] Signature verification failed for order: ${orderId}`);
      if (ticket && ticket.paymentStatus === 'pending') {
        ticket.paymentStatus = 'failed';
        await ticket.save();
      }
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed' });
    }

    // 4. Resolve and verify user & event records
    const resolvedUserId = ticket ? ticket.userId : userId;
    const resolvedEventId = ticket ? ticket.eventId : eventId;

    if (!resolvedUserId || !resolvedEventId) {
      return res.status(400).json({ error: 'Unable to resolve attendee or event associated with this order' });
    }

    const user = await User.findById(resolvedUserId);
    const event = await Event.findById(resolvedEventId);

    if (!user) return res.status(404).json({ error: 'Attendee not found' });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // 5. Check if user already holds another completed ticket for this event
    const existingCompleted = await Ticket.findOne({
      userId: user._id,
      eventId: event._id,
      paymentStatus: 'completed',
    });
    if (existingCompleted) {
      return res.status(200).json({
        message: 'You already hold a confirmed ticket for this event',
        ticket: {
          id: existingCompleted._id,
          qrCode: existingCompleted.qrCode,
          qrId: existingCompleted.qrId,
        },
      });
    }

    // 6. Generate cryptographic QR ticket only AFTER signature verification succeeded
    const qrId = generateQRId();
    const qrPayload = JSON.stringify({
      qrId,
      ticketId: `TKT_${Date.now()}`,
      userId: user._id.toString(),
      eventId: event._id.toString(),
    });
    const qrCode = await generateQRCode(qrPayload);

    // 7. Mark ticket as paid and release QR pass with trusted server price
    if (ticket) {
      ticket.orderId = orderId;
      ticket.paymentId = paymentId;
      ticket.paymentStatus = 'completed';
      ticket.amount = event.ticketPrice; // Trusted server-side data!
      ticket.qrId = qrId;
      ticket.qrCode = qrCode;
      ticket.scanStatus = 'unused';
      await ticket.save();
    } else {
      ticket = await Ticket.create({
        userId: user._id,
        eventId: event._id,
        orderId,
        paymentId,
        paymentStatus: 'completed',
        amount: event.ticketPrice, // Trusted server-side data!
        qrId,
        qrCode,
        scanStatus: 'unused',
      });
    }

    console.log(`[Ticket] Ticket issued successfully: ${ticket._id}`);

    // 8. Dispatch confirmation email (non-blocking)
    sendTicketEmail(
      user.email,
      user.name,
      event.name,
      qrCode,
      ticket._id.toString()
    ).catch((err) => console.error('[Ticket] Email dispatch failed:', err.message));

    return res.status(200).json({
      message: 'Payment verified and ticket generated successfully',
      ticket: {
        id: ticket._id,
        qrCode: ticket.qrCode,
        qrId: ticket.qrId,
      },
    });
  } catch (error) {
    console.error('[Payment] Verification handler error:', error.message || error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
};

/**
 * Handles cancelled, dismissed, or failed payment sessions.
 * Never logs credentials or sensitive card details.
 */
exports.cancelPayment = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Safe sanitized logging without payment or personal secrets
    console.log(`[Payment] Order ${orderId} cancelled/failed. Reason: ${reason || 'User dismissed'}`);

    await Ticket.updateMany(
      { orderId, paymentStatus: 'pending' },
      { $set: { paymentStatus: 'failed' } }
    );

    return res.status(200).json({ message: 'Payment cancellation recorded' });
  } catch (error) {
    console.error('[Payment] Cancel payment error:', error.message || error);
    return res.status(500).json({ error: 'Failed to record payment cancellation' });
  }
};
