import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import Toast from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch('/api/auth/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Super Admin login failed');
      }

      setToast({ message: 'Super Admin authenticated! Redirecting...', type: 'success' });
      setTimeout(() => {
        navigate('/super-admin/dashboard');
      }, 1000);
    } catch (err) {
      setToast({ message: err.message || 'Login failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
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
            <Crown className="w-7 h-7 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Admin Console</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Global administration, cross-event analytics, and staff assignment.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Super Admin Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 outline-none transition-all text-sm"
                placeholder="superadmin@example.com"
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

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In to Master Console
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
