import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, QrCode } from 'lucide-react';
import Button from '../components/Button';
import Toast from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { safeJsonFetch } from '../utils/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlEventId = searchParams.get('eventId');
  const { login, user } = useAuth();

  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    eventId: urlEventId || '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch available events for the dropdown
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await safeJsonFetch('/api/events', { credentials: 'include' });
      const list = Array.isArray(data) ? data : data.events || [];
      setEvents(list);

      // Pre-select first event if none selected from URL
      if (!urlEventId && list.length > 0) {
        setFormData((prev) => ({ ...prev, eventId: list[0]._id || list[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!formData.eventId) {
      setToast({ message: 'Please select an event', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password, formData.eventId);
      setToast({
        message: 'Login successful! Redirecting...',
        type: 'success',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      setToast({ message: error.message || 'Login failed', type: 'error' });
    } finally {
      setLoading(false);
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md my-6"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Log in to manage your registrations and view your session.
          </p>

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
                      {event.name}
                    </option>
                  );
                })}
              </select>
            </div>

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
            </div>

            <Button type="submit" className="w-full mt-2" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account yet?{' '}
            <Link
              to={formData.eventId ? `/register?eventId=${formData.eventId}` : '/register'}
              className="font-medium text-gray-900 dark:text-white hover:underline"
            >
              Register now
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
