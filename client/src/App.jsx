import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminScannerPage from './pages/AdminScannerPage';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage';

// Super Admin Pages
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 font-sans antialiased transition-colors duration-300">
            <Routes>
              {/* Public Attendee Flow */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Admin Gate Operations */}
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/scanner" element={<AdminScannerPage />} />
              <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />

              {/* Super Admin Console */}
              <Route path="/super-admin" element={<SuperAdminLoginPage />} />
              <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
