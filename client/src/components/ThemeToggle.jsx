import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center group overflow-hidden border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm backdrop-blur-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-gray-950 ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Subtle hover gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      />

      {/* Animated icon change */}
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.div
            key="moon"
            initial={{ y: -16, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 16, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5 text-gray-700 hover:text-gray-900 transition-colors" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: -16, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 16, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-colors" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
