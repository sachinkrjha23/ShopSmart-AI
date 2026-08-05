# 🛍️ ShopSmart AI

A full-stack e-commerce platform with AI-powered product search, a multi-vendor seller marketplace, and a complete admin/moderation system — built as a campus project.

[![Live Demo](https://img.shields.io/badge/Live-Demo-28a745?style=for-the-badge&logo=render&logoColor=white)](https://shopsmart-ai-z3cx.onrender.com)
[![License](https://img.shields.io/badge/License-Educational-ff69b4?style=for-the-badge)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Notes](#architecture-notes)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## 🚀 Overview

**ShopSmart AI** is a **PERN-stack** (PostgreSQL, Express, React, Node) online store that goes beyond a basic shopping cart. Buyers can search products in **plain English or Hinglish** using Google Gemini, sellers can apply for and run their own storefronts within the platform, and admins have full moderation, reporting, and broadcast-notification tools.

---

## ✨ Features

### 🔐 Authentication
- JWT-based authentication with **httpOnly cookies**
- **Google Sign-In** (OAuth) integration
- Email verification via **pending-registration flow** (accounts aren't created until the verification link is clicked)

### 🤖 AI-Powered Search
- Natural language / Hinglish product search using **Google Gemini (gemini-2.5-flash)**
- Intelligent product discovery beyond keyword matching

### 🛒 Shopping & Checkout
- Per-user cart with **stock-aware quantity caps**
- Wishlist functionality
- Multiple saved addresses
- Coupon system (platform-wide and seller-scoped)
- **Razorpay** payments with signature-verified webhooks

### 📦 Order Management
- Full lifecycle tracking: **Processing → Shipped → Delivered**
- Per-item cancellation and refunds
- **7-day return-request window**

### 🏪 Multi-Vendor Marketplace
- Seller applications with admin approval/rejection
- Cooldown periods for reapplying
- Seller-scoped coupons
- Seller ratings separate from product reviews

### ⭐ Reviews & Ratings
- Product reviews gated on **verified delivery**
- Seller ratings are a single upsertable rating per buyer-seller pair (not per-order)

### 🔔 Notifications
- Personal notifications (order updates, report resolutions)
- Admin broadcast announcements with **audience targeting** and expiry

### 🛠️ Admin Panel
- Dashboard stats
- User/seller/product/report management
- Activity log
- Admin-secret-gated account deletion with a **last-admin safety block**

### 📄 Invoices
- PDF invoice generation and download per order

---

## 🧰 Tech Stack

| Category | Tools |
|----------|-------|
| **Frontend** | React + Vite + Tailwind CSS v4 + Redux Toolkit + React Router |
| **Backend** | Node.js + Express + PostgreSQL (raw SQL via `pg`, no ORM) |
| **Authentication** | JWT (httpOnly cookies) + Google OAuth |
| **Image Storage** | Cloudinary |
| **AI** | Google Gemini API |
| **Payments** | Razorpay (test mode) |
| **Testing** | Jest + Supertest (backend), Vitest + React Testing Library (frontend) |
| **Hosting** | Render (single web service) + Supabase (managed PostgreSQL) |

---

## 🏗️ Architecture Notes

### Same-Origin Deployment Strategy

The frontend and backend are deployed as a **single Render web service** rather than two separate services:

- Express serves the built React app (`client/dist`) as static files
- Handles all `/api/v1/...` routes on the same origin

**Why this approach?**
> Hosting them on separate domains (e.g., `frontend.onrender.com` and `backend.onrender.com`) causes modern browsers to treat authentication cookies as **third-party** and block them. Same-origin serving avoids this entirely without needing a custom domain or switching away from cookie-based auth.

### Database Connectivity

The database connection uses **Supabase's Session Pooler** (IPv4-compatible) rather than its direct connection, since Render's free tier and most home networks can't reach Supabase's IPv6-only direct connection endpoint.

---

## 📁 Project Structure

<details>
<summary><strong>Click to expand the full project structure</strong></summary>

```bash
ShopSmart-AI/
├── client/
│   ├── .env                                   
│   ├── .oxlintrc.json                          # Oxlint configuration
│   ├── index.html                              # HTML template
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── vite.config.js                          # Vite configuration
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   └── logo.png
│   ├── dist/                                   # Built frontend (generated at build time)
│   │   ├── assets/
│   │   │   ├── index-*.css
│   │   │   ├── index-*.js
│   │   │   └── logo-*.png
│   │   └── index.html
│   └── src/
│       ├── api/                                # Axios calls per feature
│       │   ├── addressApi.js
│       │   ├── adminApi.js
│       │   ├── authApi.js
│       │   ├── contactApi.js
│       │   ├── couponApi.js
│       │   ├── notificationApi.js
│       │   ├── orderApi.js
│       │   ├── productApi.js
│       │   ├── reportApi.js
│       │   ├── returnApi.js
│       │   ├── sellerApi.js
│       │   ├── settingsApi.js
│       │   └── wishlistApi.js
│       ├── assets/
│       │   └── images/
│       │       └── logo.png
│       ├── components/
│       │   ├── address/
│       │   │   ├── AddressCard.jsx
│       │   │   └── AddressModal.jsx
│       │   ├── admin/
│       │   │   ├── AdminLayout.jsx
│       │   │   ├── AdminNavbar.jsx
│       │   │   ├── AdminSidebar.jsx
│       │   │   ├── CouponModal.jsx
│       │   │   ├── DashboardSummary.jsx
│       │   │   ├── LowStockAlert.jsx
│       │   │   ├── OrderStatusPieChart.jsx
│       │   │   ├── RevenueChart.jsx
│       │   │   ├── StatsCard.jsx
│       │   │   └── TopProductsTable.jsx
│       │   ├── auth/
│       │   │   ├── GoogleLoginButton.jsx
│       │   │   ├── LoginModal.jsx
│       │   │   └── RegisterModal.jsx
│       │   ├── cart/
│       │   │   ├── CartItem.jsx
│       │   │   ├── CartSummary.jsx
│       │   │   └── CouponInput.jsx
│       │   ├── checkout/
│       │   │   ├── AddressForm.jsx
│       │   │   ├── AddressSelector.jsx
│       │   │   ├── OrderSummary.jsx
│       │   │   └── RazorpayButton.jsx
│       │   ├── home/
│       │   │   ├── AISearchBar.jsx
│       │   │   ├── CategoryGrid.jsx
│       │   │   ├── FeaturedProducts.jsx
│       │   │   ├── HeroBanner.jsx
│       │   │   └── TestimonialsSection.jsx
│       │   ├── layout/
│       │   │   ├── CartDrawer.jsx
│       │   │   ├── Footer.jsx
│       │   │   ├── Navbar.jsx
│       │   │   ├── NotificationBell.jsx
│       │   │   └── ScrollToTop.jsx
│       │   ├── order/
│       │   │   ├── OrderCard.jsx
│       │   │   ├── OrderStatusBadge.jsx
│       │   │   ├── OrderTimeline.jsx
│       │   │   ├── RateSellerModal.jsx
│       │   │   └── RequestReturnModal.jsx
│       │   ├── product/
│       │   │   ├── AIDescriptionHelper.jsx
│       │   │   ├── ProductCard.jsx
│       │   │   ├── ProductCarousel.jsx
│       │   │   ├── ProductFilters.jsx
│       │   │   ├── ProductGrid.jsx
│       │   │   ├── ReviewCard.jsx
│       │   │   └── ReviewForm.jsx
│       │   ├── profile/
│       │   │   ├── AvatarUpload.jsx
│       │   │   ├── DeleteAccountSection.jsx
│       │   │   ├── PasswordForm.jsx
│       │   │   └── ProfileForm.jsx
│       │   ├── report/
│       │   │   └── ReportButton.jsx
│       │   ├── returns/
│       │   │   └── ReturnRequestList.jsx
│       │   ├── seller/
│       │   │   ├── SellerCouponModal.jsx
│       │   │   ├── SellerLayout.jsx
│       │   │   ├── SellerNavbar.jsx
│       │   │   └── SellerSidebar.jsx
│       │   ├── ui/
│       │   │   ├── Badge.jsx
│       │   │   ├── Breadcrumb.jsx
│       │   │   ├── Button.jsx
│       │   │   ├── ConfirmDialog.jsx
│       │   │   ├── DetailPageSkeleton.jsx
│       │   │   ├── ImageCarousel.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Loader.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Pagination.jsx
│       │   │   ├── StarRating.jsx
│       │   │   ├── TableSkeleton.jsx
│       │   │   └── Tooltip.jsx
│       │   └── wishlist/
│       │       ├── WishlistButton.jsx
│       │       └── WishlistCard.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useCart.js
│       │   └── useRazorpay.js
│       ├── lib/
│       │   └── axios.js                         # Configured axios instance
│       ├── pages/
│       │   ├── About.jsx
│       │   ├── Addresses.jsx
│       │   ├── BecomeSeller.jsx
│       │   ├── Cart.jsx
│       │   ├── Checkout.jsx
│       │   ├── ContactUs.jsx
│       │   ├── FAQ.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── Home.jsx
│       │   ├── NotFound.jsx
│       │   ├── NotificationInbox.jsx
│       │   ├── OrderDetail.jsx
│       │   ├── Orders.jsx
│       │   ├── PaymentFailed.jsx
│       │   ├── PaymentSuccess.jsx
│       │   ├── PrivacyPolicy.jsx
│       │   ├── ProductDetail.jsx
│       │   ├── Products.jsx
│       │   ├── Profile.jsx
│       │   ├── ResetPassword.jsx
│       │   ├── ReturnPolicy.jsx
│       │   ├── SearchResults.jsx
│       │   ├── SellerProfile.jsx
│       │   ├── TermsAndConditions.jsx
│       │   ├── UpdatePassword.jsx
│       │   ├── VerifyEmail.jsx
│       │   ├── VerifyEmailChange.jsx
│       │   └── Wishlist.jsx
│       │   ├── admin/
│       │   │   ├── ActivityLog.jsx
│       │   │   ├── AddProduct.jsx
│       │   │   ├── Broadcasts.jsx
│       │   │   ├── Coupons.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   ├── EditProduct.jsx
│       │   │   ├── Messages.jsx
│       │   │   ├── OrderDetail.jsx
│       │   │   ├── Orders.jsx
│       │   │   ├── Products.jsx
│       │   │   ├── Reports.jsx
│       │   │   ├── Returns.jsx
│       │   │   ├── Reviews.jsx
│       │   │   ├── SellerDetail.jsx
│       │   │   ├── Sellers.jsx
│       │   │   ├── Settings.jsx
│       │   │   └── Users.jsx
│       │   └── seller/
│       │       ├── AddProduct.jsx
│       │       ├── Coupons.jsx
│       │       ├── EditProduct.jsx
│       │       ├── Returns.jsx
│       │       ├── SellerDashboard.jsx
│       │       ├── SellerOrderDetail.jsx
│       │       ├── SellerOrders.jsx
│       │       └── SellerProducts.jsx
│       ├── routes/
│       │   ├── AdminRoute.jsx
│       │   ├── PrivateRoute.jsx
│       │   ├── PublicRoute.jsx
│       │   └── SellerRoute.jsx
│       ├── store/
│       │   ├── store.js
│       │   └── slices/
│       │       ├── addressSlice.js
│       │       ├── adminSlice.js
│       │       ├── authSlice.js
│       │       ├── cartSlice.js
│       │       ├── contactSlice.js
│       │       ├── couponSlice.js
│       │       ├── notificationSlice.js
│       │       ├── orderSlice.js
│       │       ├── productSlice.js
│       │       ├── reportSlice.js
│       │       ├── returnSlice.js
│       │       ├── sellerSlice.js
│       │       ├── settingsSlice.js
│       │       ├── uiSlice.js
│       │       └── wishlistSlice.js
│       ├── tests/                                # Vitest + RTL tests
│       │   ├── AdminRoute.test.jsx
│       │   ├── authSlice.test.js
│       │   ├── cartSlice.test.js
│       │   ├── couponSlice.test.js
│       │   ├── logout.test.js
│       │   ├── PrivateRoute.test.jsx
│       │   └── setupTests.js
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
├── server/
│   ├── app.js                                   # Express app config, middleware, routes, static frontend serving
│   ├── server.js                                # Entry point — starts the server, background intervals
│   ├── jest.config.js
│   ├── jsconfig.json
│   ├── package-lock.json
│   ├── package.json
│   ├── cloudflared.exe                          # Cloudflare tunnel executable (optional, for local testing)
│   ├── config/
│   │   └── config.env                           
│   ├── controllers/                             
│   │   ├── addressControllers.js
│   │   ├── adminControllers.js
│   │   ├── authControllers.js
│   │   ├── contactControllers.js
│   │   ├── couponControllers.js
│   │   ├── notificationControllers.js
│   │   ├── paymentControllers.js
│   │   ├── productControllers.js
│   │   ├── reportControllers.js
│   │   ├── returnControllers.js
│   │   ├── sellerControllers.js
│   │   ├── settingsControllers.js
│   │   └── wishlistControllers.js
│   ├── database/
│   │   └── db.js                               # PostgreSQL connection pool
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── catchAsyncError.js
│   │   └── errorMiddleware.js
│   ├── models/                                  # Table-creation SQL, one file per table
│   │   ├── addressTable.js
│   │   ├── adminActivityLogTable.js
│   │   ├── categoryTable.js
│   │   ├── contactMessagesTable.js
│   │   ├── couponTable.js
│   │   ├── notificationsTable.js
│   │   ├── orderItemsTable.js
│   │   ├── ordersTable.js
│   │   ├── paymentsTable.js
│   │   ├── pendingRegistrationsTable.js
│   │   ├── productReviewsTable.js
│   │   ├── productTable.js
│   │   ├── reportsTable.js
│   │   ├── returnRequestsTable.js
│   │   ├── sellerRatingsTable.js
│   │   ├── sellersTable.js
│   │   ├── shipping_info.js
│   │   ├── storeSettingsTable.js
│   │   ├── userTable.js
│   │   └── wishlistTable.js
│   ├── router/
│   │   ├── addressRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── couponRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── productRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── returnRoutes.js
│   │   ├── sellerRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── wishlistRoutes.js
│   ├── tests/                                   # Jest + Supertest tests
│   │   ├── auth.test.js
│   │   ├── authorization.test.js
│   │   ├── coupon.test.js
│   │   ├── order.test.js
│   │   ├── payment.test.js
│   │   ├── readme.md
│   │   ├── return.test.js
│   │   ├── setupEnv.js
│   │   ├── test.html
│   │   ├── testSignature.js
│   │   └── webhook.test.js
│   ├── uploads/                                 # Temp file-upload staging (runtime generated, not tracked)
│   │   └── tmp-*.tmp
│   └── utils/
│       ├── adminActivityLogger.js
│       ├── anonymizeUser.js
│       ├── applyPaymentSuccessEffects.js
│       ├── autoCancelStaleOrders.js
│       ├── autoExpireNotifications.js
│       ├── createTables.js
│       ├── generateForgotPasswordEmailTemplate.js
│       ├── generateInvoice.js
│       ├── generateProductDescription.js
│       ├── generateResetPasswordToken.js
│       ├── getAIRecommendation.js
│       ├── jwtToken.js
│       ├── passwordValidation.js
│       └── sendEmail.js
│
├── node_modules/                                # Dependencies (not tracked in Git, generated by npm install)
│   └── ...
│
├── output/                                      # Build output, logs, or generated artifacts (not part of source)
│   └── ...
│
└── README.md                                    # This file
</details>
🛠️ Local Development Setup
Prerequisites
Node.js (v16 or higher)

PostgreSQL (running locally)

Accounts/API keys for:

Cloudinary

Google Gemini

Razorpay (test mode)

Google OAuth

An SMTP-capable email account (e.g., Gmail with an app password)

Backend Setup
Navigate to the server directory:

bash
cd server
npm install
Create environment configuration:

Create server/config/config.env with the following variables:

env
PORT=1920
FRONTEND_URL=http://localhost:5173
DASHBOARD_URL=http://localhost:5173
JWT_EXPIRES_IN=30d
COOKIE_EXPIRES_IN=30
JWT_SECRET_KEY=your_jwt_secret
SMTP_SERVICE=gmail
SMTP_MAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLIENT_NAME=your_cloudinary_name
CLOUDINARY_CLIENT_API=your_cloudinary_api_key
CLOUDINARY_CLIENT_SECRET=your_cloudinary_secret
RAZORPAY_SECRET_KEY=your_razorpay_secret
RAZORPAY_FRONTEND_KEY=your_razorpay_test_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
DB_USER=postgres
DB_PASSWORD=your_local_db_password
DB_HOST=localhost
DB_NAME=your_local_db_name
DB_PORT=5432
GOOGLE_CLIENT_ID=your_google_oauth_client_id
Start the backend server:

bash
npm run dev
Note: Database tables are created automatically on startup.

Frontend Setup
Navigate to the client directory:

bash
cd client
npm install
Create environment configuration:

Create client/.env with:

env
VITE_BACKEND_URL=http://localhost:1920
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
Start the frontend dev server:

bash
npm run dev
The app will be available at http://localhost:5173 (or the next available port).

🧪 Running Tests
Backend Tests (Jest + Supertest)
bash
cd server
npm test
Frontend Tests (Vitest + React Testing Library)
bash
cd client
npm test
🚀 Deployment
Deployed on Render (single web service) with Supabase as the managed PostgreSQL database.

Build Process
Installs both client and server dependencies

Runs vite build to produce the static frontend (client/dist)

Express serves the static frontend alongside the API from the same origin

Why same-origin? This avoids cookie-related issues that arise when frontend and backend are on separate domains.

⚠️ Known Limitations
Phone/OTP login — was shelved due to the absence of a free SMS provider at this project's stage.

Local network testing — testing on physical mobile devices over the local network was blocked by firewall/network-profile restrictions. The production deployment (HTTPS-enabled public URL) sidesteps this issue entirely, and the team relied on responsive design tools in DevTools for mobile testing during development.

📄 License
This project was built for educational purposes as a campus project.
