import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, IndianRupee, QrCode, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { safeJsonFetch } from '../utils/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlEventId = searchParams.get('eventId');
  const { register, user } = useAuth();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    eventId: urlEventId || '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Payment checkout modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [registeredUserId, setRegisteredUserId] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (formData.eventId) {
      fetchEventDetails(formData.eventId);
    } else {
      setSelectedEvent(null);
    }
  }, [formData.eventId]);

  const fetchEvents = async () => {
    try {
      const data = await safeJsonFetch('/api/events', { credentials: 'include' });
      const list = Array.isArray(data) ? data : data.events || [];
      setEvents(list);

      if (!urlEventId && list.length > 0) {
        const defaultId = list[0]._id || list[0].id;
        setFormData((prev) => ({ ...prev, eventId: defaultId }));
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      setToast({ message: error.message || 'Failed to load events', type: 'error' });
    }
  };

  const fetchEventDetails = async (id) => {
    try {
      const data = await safeJsonFetch(`/api/events/${id}`, { credentials: 'include' });
      setSelectedEvent(data.event || data);
    } catch (error) {
      console.error('Failed to load event details:', error);
      setSelectedEvent(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!formData.eventId) {
      setToast({ message: 'Please select an event', type: 'error' });
      return;
    }

    if (formData.password.length < 8) {
      setToast({ message: 'Password must be at least 8 characters long', type: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // 1. Register attendee account and establish session
      const registerRes = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password,
        eventId: formData.eventId,
      });

      const userId = registerRes.user.id || registerRes.user._id;
      setRegisteredUserId(userId);

      // 2. Initiate payment order on server
      const orderData = await safeJsonFetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: formData.eventId,
          userId,
        }),
      });

      setPendingOrder(orderData);
      setShowPaymentModal(true);
    } catch (error) {
      setToast({ message: error.message || 'Registration failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Complete payment and verify on server
  const handleVerifyTestPayment = async () => {
    if (!pendingOrder || !registeredUserId) return;
    setPaymentLoading(true);

    try {
      const paymentId = `pay_test_${Date.now()}`;
      // In test mode, matching the server's test verification
      const verifyData = await safeJsonFetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: pendingOrder.orderId,
          paymentId,
          signature: 'test_signature',
          userId: registeredUserId,
          eventId: formData.eventId,
          amount: pendingOrder.amount,
        }),
      });

      setShowPaymentModal(false);
      setToast({
        message: 'Payment verified! Your QR ticket is ready. Redirecting...',
        type: 'success',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setToast({ message: err.message || 'Payment verification failed', type: 'error' });
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Payment Checkout Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Ticket Payment"
      >
        {selectedEvent && pendingOrder && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Event:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedEvent.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Attendee:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formData.name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">Total Payable:</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  ₹{(pendingOrder.amount / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>Test Mode:</strong> Click below to verify payment on the server and generate your cryptographic QR ticket pass.
              </span>
            </div>

            <Button
              onClick={handleVerifyTestPayment}
              loading={paymentLoading}
              className="w-full"
              size="lg"
            >
              Confirm Payment (₹{pendingOrder.amount / 100})
            </Button>
          </div>
        )}
      </Modal>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg my-6"
      >
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <QrCode className="w-7 h-7 text-gray-900 dark:text-white" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Register</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Create your account to secure your event pass.
          </p>

          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedEvent.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(selectedEvent.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedEvent.venue}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ₹{selectedEvent.ticketPrice}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">per ticket</span>
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Select Event
              </label>
              <select
                required
                value={formData.eventId}
                onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 outline-none transition-all text-sm"
              >
                <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">-- Choose an event --</option>
                {events.map((event) => {
                  const id = event._id || event.id;
                  return (
                    <option key={id} value={id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {event.name} (₹{event.ticketPrice})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 outline-none transition-all text-sm"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 outline-none transition-all text-sm"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 outline-none transition-all text-sm"
                  placeholder="9876543210"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10-digit mobile number</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Date of Birth
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 outline-none transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" loading={loading} size="lg">
              {selectedEvent ? `Proceed to Pay ₹${selectedEvent.ticketPrice}` : 'Register'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already registered?{' '}
            <Link
              to={formData.eventId ? `/login?eventId=${formData.eventId}` : '/login'}
              className="font-medium text-gray-900 dark:text-white hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
