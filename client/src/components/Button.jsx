import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Button({
  variant = 'primary',
  loading = false,
  children,
  disabled,
  className = '',
  size = 'md',
  ...props
}) {
  const variants = {
    primary:
      'bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-sm hover:shadow-md',
    secondary:
      'bg-gray-700 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white shadow-sm hover:shadow-md',
    danger:
      'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white shadow-sm hover:shadow-md',
    success:
      'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white shadow-sm hover:shadow-md',
    outline:
      'border border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
    ghost:
      'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.99 }}
      className={`${variants[variant] || variants.primary} ${sizes[size] || sizes.md} rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
