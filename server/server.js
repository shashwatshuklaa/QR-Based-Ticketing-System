const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables before importing routes and database configs
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const scannerRoutes = require('./routes/scannerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

connectDB();

const app = express();

// Build list of allowed origins for CORS (remove trailing slashes for standard Origin header matching)
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://qr-based-ticketing-system-di2m.vercel.app',
];

const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',')
      .map((url) => url.trim().replace(/\/+$/, ''))
      .filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

// Enable CORS with credentials support (for cookies and authorization headers)
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Catch-all 404 for unmatched API routes (guarantees JSON instead of HTML)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler (handles JSON parse errors, DB errors, unhandled exceptions)
app.use((err, req, res, next) => {
  console.error('Unhandled API error:', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
