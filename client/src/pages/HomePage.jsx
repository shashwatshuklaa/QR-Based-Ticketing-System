import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Ticket,
  Users,
  BarChart3,
  QrCode,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { safeJsonFetch } from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await safeJsonFetch('/api/events', { credentials: 'include' });
      const list = Array.isArray(data) ? data : data.events || [];
      setEvents(list);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      icon: <Zap className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'Lightning Fast',
      description:
        'Instant QR code generation and quick camera-based gate scanning check-in.',
    },
    {
      icon: <Shield className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'Secure & Safe',
      description:
        'Single-use encrypted QR tokens with tamper protection and access validation.',
    },
    {
      icon: <Clock className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'Offline Support',
      description:
        'Scan tickets even without internet. Auto-sync when back online.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'Real-time Analytics',
      description:
        'Track attendance, revenue, and trends with live dashboard updates.',
    },
    {
      icon: <Users className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'Easy Management',
      description:
        'Manage attendees, staff, and events from one intuitive interface.',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'Always Reliable',
      description:
        'Reliable event check-in designed for high availability and resilient data handling.',
    },
  ];

  const stats = [
    { value: 'Fast', label: 'Check-In' },
    { value: 'Live', label: 'Verification' },
    { value: 'Offline', label: 'Gate Sync' },
  ];

  const formatShortDate = (dateVal) => {
    if (!dateVal) return 'Upcoming';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Upcoming';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFullDate = (dateVal) => {
    if (!dateVal) return 'Date TBA';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Animated background gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-gray-400/10 dark:bg-gray-600/5 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-gray-500/10 dark:bg-gray-700/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gray-300/10 dark:bg-gray-800/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-gray-900 dark:text-white" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                QR Ticketing
              </h1>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-3"
            >
              <ThemeToggle />
              {user ? (
                <Button onClick={() => navigate('/dashboard')} size="sm">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/login')}
                    variant="ghost"
                    size="sm"
                  >
                    Login
                  </Button>
                  <Button onClick={() => navigate('/register')} size="sm">
                    Get Started
                  </Button>
                </>
              )}
            </motion.div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 space-y-3 border-t border-gray-200/40 dark:border-gray-800/40"
            >
              {user ? (
                <Button
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-center"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-center"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      navigate('/register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-center"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-24 lg:py-32 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Pill Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full mb-6 sm:mb-8"
            >
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Modern Event Management
              </span>
            </motion.div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-gray-900 dark:text-white">
              Event Ticketing
              <br className="hidden sm:block" />
              <span className="text-gray-700 dark:text-gray-300">
                {' '}
                Made Simple
              </span>
            </h2>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
              Seamless QR-based registration, ticketing, and entry management
              for your events.
            </p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
            >
              <Button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto"
              >
                Get Started Free
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full sm:w-auto"
              >
                Sign In
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-2 sm:gap-6 md:gap-8 mt-12 sm:mt-16 max-w-2xl mx-auto px-4"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
              Why Choose Us
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Everything you need to run successful events
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featureCards.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 h-full border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all hover:shadow-lg">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl text-gray-900 dark:text-white">
                      {feature.icon}
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      {feature.title}
                    </h4>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
              Upcoming Events
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Register for upcoming events
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : events.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((event, index) => {
                const eventId = event._id || event.id;
                const dateVal = event.startDate || event.date;
                return (
                  <motion.div
                    key={eventId || index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden h-full flex flex-col border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all">
                      {/* Event header */}
                      <div className="h-24 sm:h-28 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-800 dark:to-gray-950 relative flex items-end p-4 sm:p-5">
                        <div className="inline-flex px-2.5 sm:px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg text-gray-900 dark:text-white text-xs sm:text-sm font-semibold">
                          {formatShortDate(dateVal)}
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 flex-1 flex flex-col">
                        <h4 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-white">
                          {event.name}
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
                          {event.description}
                        </p>

                        <div className="space-y-2 text-sm mb-4 sm:mb-5">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <QrCode className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <span>{formatFullDate(dateVal)}</span>
                          </div>
                          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                            <Ticket className="w-4 h-4 flex-shrink-0" />
                            <span>₹{event.ticketPrice}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            navigate(`/register?eventId=${eventId}`)
                          }
                          className="w-full"
                          size="sm"
                        >
                          Register Now
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-800"
            >
              <QrCode className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                No upcoming events at the moment. Check back soon!
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 sm:py-10 px-4 mt-12 sm:mt-16 md:mt-20">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              QR Ticketing
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">
            Making event management simple and efficient.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            &copy; {new Date().getFullYear()} QR Ticketing System. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
