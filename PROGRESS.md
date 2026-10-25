# MERN QR Ticketing System — Development Progress & Roadmap

## 📊 Status Overview
This document tracks the migration and implementation progress from the original Next.js reference project to the standalone MERN (MongoDB, Express, React, Node) stack.

---

## ✅ Completed & Verified Work

### 1. Database & Schemas (`server/models/`)
* **`Event.js`**: Event management, pricing, capacity, and active status.
* **`User.js`**: Attendee records with password hashing and unique per-event registration.
* **`Ticket.js`**: Cryptographic QR tickets with payment link, QR data URL, and scan status tracking (`unused` vs `used`).
* **`Admin.js`**: Event staff accounts with event assignments.
* **`SuperAdmin.js`**: Master administrator account.
* **`Entry.js`**: Attendance log with gate name, scanner admin ID, timestamp, and offline sync tracking.
* **`ActivityLog.js`**: Audit trail for admin actions (e.g. QR resets).
* **`OTP.js`**: Temporary one-time verification codes with auto-expiring TTL index.

### 2. Backend Security & Business Logic (`server/`)
* **Authentication (`controllers/authController.js`)**:
  * Cookie-based `httpOnly` JWT session management strictly matching the original reference.
  * In-memory brute force rate limiting (5 attempts / 15 minutes).
  * Attendee registration (`POST /api/auth/register`) & login (`POST /api/auth/login`).
  * Admin login (`POST /api/auth/admin/login`).
  * Super Admin login (`POST /api/auth/superadmin/login`).
  * Current session verification (`GET /api/auth/me`).
  * Cookie clearing logout (`POST /api/auth/logout`).
* **Payment & Ticket Generation (`controllers/paymentController.js`)**:
  * Razorpay order creation (`POST /api/payment/create-order`).
  * Server-side cryptographic signature verification (`POST /api/payment/verify`) with idempotency (prevents duplicate tickets on retried payments).
  * Unique QR ID and high-resolution QR data URL generation using `qrcode` and `crypto`.
  * Non-blocking automated email confirmation with HTML pass rendering.
* **Attendee Tickets (`controllers/ticketController.js`)**:
  * Protected endpoint (`GET /api/tickets`) fetching all tickets for the authenticated attendee.
* **QR Scanner & Attendance (`controllers/scannerController.js`)**:
  * Live ticket verification (`POST /api/scanner/scan`) with duplicate-scan prevention and gate recording.
  * Offline sync processing (`POST /api/scanner/sync`) with timestamp conflict resolution.
* **Admin Operations (`controllers/adminController.js`)**:
  * Live check-in statistics (`GET /api/admin/dashboard`).
  * Attendee roster and ticket search (`GET /api/admin/users`).
  * Gate QR pass reset (`POST /api/admin/users/:id/reset-qr`) with activity logging.
* **Super Admin Console (`controllers/superAdminController.js`)**:
  * Cross-event analytics and revenue calculation (`GET /api/superadmin/analytics`).
  * Event creation and deletion (`POST/DELETE /api/superadmin/events`).
  * Staff admin account creation and event assignment (`GET/POST/DELETE /api/superadmin/admins`).
* **Database Seeding (`scripts/seed.js`)**:
  * Populates a demo event (`TechCon 2026`). Does not store or automatically generate default administrative accounts or credentials.
* **Account Creation Utility (`scripts/create-admin.js`)**:
  * Safe interactive CLI tool (`npm run create-admin`) to create or update local admin and super admin accounts with private password entry (masked in terminal, hashed with bcrypt).

### 3. Frontend Client (`client/src/`)
* **Routing (`react-router-dom`)**:
  * `/` → Homepage with upcoming events feed.
  * `/register` → Registration form with event selector and payment checkout.
  * `/login` → Attendee login.
  * `/dashboard` → Attendee ticket passbook with QR view modal and PNG download.
  * `/admin` → Admin gate staff login.
  * `/admin/dashboard` → Live stats and recent check-in feed.
  * `/admin/scanner` → Live camera QR scanner with sound/beep synthesizer, vibration, and offline queue.
  * `/admin/registrations` → Attendee list with search and pass reset.
  * `/super-admin` → Master administrator login.
  * `/super-admin/dashboard` → Revenue analytics, event creator, and staff administrator manager.
* **Session Management (`AuthContext.jsx`)**:
  * Cookie-backed authentication across all pages using `credentials: 'include'`. Zero tokens exposed to `localStorage`.

---

## 🛠 Local Setup & Account Creation
* **Attendee Account:** Register directly via `/register` or `/`.
* **Super Admin / Staff Accounts:** Run the interactive creation script to configure administrator credentials privately (it prompts for your password privately and masks it with asterisks, never saving plaintext):
  ```bash
  npm run create-admin
  # Or with flags:
  node scripts/create-admin.js --type=superadmin --email=superadmin@example.com
  node scripts/create-admin.js --type=admin --email=staff@example.com
  ```
