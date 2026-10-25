const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../utils/razorpay');
const { generateQRId, generateQRCode } = require('../utils/qr');
const { sendTicketEmail } = require('../utils/email');
const { isValidObjectId } = require('../utils/validation');

exports.createOrder = async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ error: 'Event ID and User ID are required' });
    }

    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid Event ID or User ID' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const receiptId = `rcpt_${userId.slice(-10)}_${Date.now()}`;
    const order = await createRazorpayOrder(event.ticketPrice, receiptId);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated',
      isSimulated: !!order.isSimulated,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create payment order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, userId, eventId, amount } = req.body;

    if (!orderId || !paymentId || !signature || !userId || !eventId || !amount) {
      return res.status(400).json({ error: 'Missing required payment verification fields' });
    }

    if (!isValidObjectId(userId) || !isValidObjectId(eventId)) {
      return res.status(400).json({ error: 'Invalid User or Event ID' });
    }

    // 1. Safe against duplicate payment processing (Idempotency check)
    const existingTicketByPayment = await Ticket.findOne({ paymentId });
    if (existingTicketByPayment) {
      return res.status(200).json({
        message: 'Payment already processed',
        ticket: {
          id: existingTicketByPayment._id,
          qrCode: existingTicketByPayment.qrCode,
          qrId: existingTicketByPayment.qrId,
        },
      });
    }

    // 2. Server-side signature verification (Never trust the browser alone!)
    const isValidSignature = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // 3. Verify user and event exist
    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // 4. Check if user already holds a ticket for this event
    const existingUserTicket = await Ticket.findOne({ userId, eventId });
    if (existingUserTicket) {
      return res.status(200).json({
        message: 'You already hold a ticket for this event',
        ticket: {
          id: existingUserTicket._id,
          qrCode: existingUserTicket.qrCode,
          qrId: existingUserTicket.qrId,
        },
      });
    }

    // 5. Generate QR Code containing unique cryptographic ID
    const qrId = generateQRId();
    const qrPayload = JSON.stringify({
      qrId,
      ticketId: `TKT_${Date.now()}`,
      userId: user._id.toString(),
      eventId: event._id.toString(),
    });
    const qrCode = await generateQRCode(qrPayload);

    // 6. Create ticket record with verified payment
    const ticket = await Ticket.create({
      userId: user._id,
      eventId: event._id,
      qrCode,
      qrId,
      paymentId,
      paymentStatus: 'completed',
      amount: amount / 100, // Convert paise to rupees
      scanStatus: 'unused',
    });

    console.log('[Ticket] Ticket created successfully:', ticket._id);

    // 7. Non-blocking ticket email delivery
    sendTicketEmail(
      user.email,
      user.name,
      event.name,
      qrCode,
      ticket._id.toString()
    ).catch((err) => console.error('[Ticket] Email sending failed:', err.message));

    return res.status(200).json({
      message: 'Payment verified and ticket generated successfully',
      ticket: {
        id: ticket._id,
        qrCode: ticket.qrCode,
        qrId: ticket.qrId,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
};
