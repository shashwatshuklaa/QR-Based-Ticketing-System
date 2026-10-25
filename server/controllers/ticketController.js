const Ticket = require('../models/Ticket');
const { getUserFromRequest } = require('../utils/auth');

exports.getMyTickets = async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'user') {
      return res.status(401).json({ error: 'Unauthorized. User session required' });
    }

    const tickets = await Ticket.find({ userId: user.id, paymentStatus: 'completed' })
      .populate('eventId')
      .sort({ createdAt: -1 });

    return res.status(200).json({ tickets });
  } catch (error) {
    console.error('Fetch tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};
