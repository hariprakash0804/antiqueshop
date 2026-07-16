# 🏛️ NEXUS // Futuristic Antique & Luxury E-Commerce Platform

A premium, full-stack, sci-fi cyberpunk-themed e-commerce application designed for trading historical artifacts, rare coins, luxury timepieces, and royal jewelry. Built using **React 19 + Vite 5 + TailwindCSS 3** on the frontend, and **Node.js + Express + Sequelize + MySQL** on the backend, featuring secure **Razorpay payment gateway** integration.

---

## ✨ Key Features

### 🛒 High-End E-Commerce Experience
- **📦 Catalog Showcase** — Browse luxurious relics across categories (Antiques, Jewelry, Watches, Coins) with advanced search, filter, and detailed modal views.
- **🏷️ Interactive Specifications** — View deep historical registries, physical/molecular characteristics, and grading stats for every artifact.
- **💳 Cyber Cart & Coupons** — Add collectibles to your cart, and validate promotional codes (e.g. `NEXUS20`, `ANCIENT10`) for instant discounts.
- **🛡️ Secure Checkout** — Integrated Razorpay script for mock/real payment processing, billing signatures, and payment verification checks.
- **🚚 Custom Logistics Shipping** — Choose shipping options: standard drone delivery, priority orbital drop pods, or armored ground convoys.
- **⭐ Review System** — Read and submit authenticated ratings and text comments on individual relic listings.
- **💖 Holographic Wishlist** — Star your favorite items to save them directly to a centralized watchlist panel.

### 🎭 Multi-Role Interface (Dynamic Dashboards)
The platform adapts its dashboard depending on the logged-in user role:
- **👤 Customer Console** — Track active acquisitions with live visual delivery status bars (Reentry Pod / Logistics progress), and view past historical receipts.
- **💼 Seller Panel** — Manage inventories, add new artifacts, edit descriptions and specifications, delete items, and track total revenue stats.
- **🚚 Logistics Console (Order Manager)** — Manage transit status, review cancellation queries, authorize refunds, and update order phases (Paid, Processing, In Transit, Delivered, Cancelled).
- **👑 Admin Overlord Command** — Real-time platform usage metrics, user role modifier control table, coupon generation panel, and master database factory resets.

### 💬 Neural Comms Terminal
- **🤖 Dedicated AI Channels** — Encrypted side-panel chat containing channels for:
  - **Valuation Expert** — Returns instant appraisal estimates for queried items (e.g. ring, watch, bust).
  - **Logistics Officer** — Details delivery times, reentry coordinates, and pricing tiers.
  - **Vault Overseer** — Explains permission roles and platform maintenance guidelines.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|:---|:---|:---|
| React | 19.2.7 | UI rendering engine |
| Vite | 5.4.11 | Build tool & dev server |
| TailwindCSS | 3.4.17 | styling and dark design system |
| Framer Motion | 12.42.2 | Interactive animations |
| Lucide React | 1.23.0 | Modern interface iconography |
| Razorpay Script | v1 | Simulated payments integration |

### Backend
| Technology | Version | Purpose |
|:---|:---|:---|
| Node.js | v16+ | Server runtime environment |
| Express | 4.19.2 | RESTful routing framework |
| Sequelize | 6.37.3 | Database ORM |
| MySQL2 | 3.9.7 | MySQL connection driver |
| Razorpay Node SDK | 2.9.4 | Backend order generation and refunds |
| JSON Web Token | 9.0.2 | Secure stateless session authentication |
| Bcrypt.js | 2.4.3 | Salted password hashing |
| Cors | 2.8.5 | Cross-Origin resource sharing |
| Dotenv | 16.4.5 | Environment variable configuration |
| Nodemon | 3.1.0 | Development auto-restart |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v16+ (v20+ recommended)
- **MySQL** Server running locally or hosted online
- **Razorpay API Keys** (Test mode keys work perfectly)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/hariprakash0804/antiqueshop.git
cd antiqueshop

# Install root, client, and server dependencies concurrently
npm run install:all
```

### 2. Configure Environment

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=antique_shop
DB_USER=root
DB_PASS=your_mysql_password
JWT_SECRET=your_super_jwt_secret_signature
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

### 3. Seed the Database

Run the database seed script to automatically verify/create the MySQL database schema and pre-populate it with default users (Admin, Seller, Manager, Customer) and products:

```bash
npm run seed --prefix server
```

> **Seeded Credentials (Password for all: `password123`):**
> - **Admin:** `admin@antique.com`
> - **Seller:** `seller@antique.com`
> - **Order Manager:** `manager@antique.com`
> - **Customer:** `customer@antique.com`

### 4. Run the Development Server

Start both the client (Vite server on `http://localhost:5173`) and the server (Express API on `http://localhost:5000`) concurrently from the root directory:

```bash
npm run dev
```

---

## 🔑 API Endpoints Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <JWT_TOKEN>` header.

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| POST | `/api/auth/register` | ❌ | Create a new user profile |
| POST | `/api/auth/login` | ❌ | Authenticate and obtain JWT token |
| POST | `/api/auth/logout` | ✅ | Revoke authentication session |
| GET | `/api/auth/profile` | ✅ | Retrieve profile details of logged user |
| PUT | `/api/auth/profile` | ✅ | Update name, avatar, address, phone |
| PUT | `/api/auth/profile/password` | ✅ | Update user account password |

### Products Catalogue (`/api/products`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/products` | ❌ | List all items in catalog (filter by category) |
| GET | `/api/products/:id` | ❌ | Retrieve a single product by ID |
| POST | `/api/products` | ✅ | List a new artifact (Seller/Admin only) |
| PUT | `/api/products/:id` | ✅ | Update artifact specifications (Seller/Admin only) |
| DELETE | `/api/products/:id` | ✅ | De-list an item from stock (Seller/Admin only) |

### Orders & Logistics (`/api/orders`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| POST | `/api/orders` | ✅ | Create a new order registry record |
| GET | `/api/orders` | ✅ | List user orders (or all platform orders for Admin/Manager) |
| PUT | `/api/orders/:id/status` | ✅ | Update shipping status (Seller/Manager/Admin only) |
| POST | `/api/orders/:id/cancel` | ✅ | Submit a client-side cancellation request |

### Razorpay Payments (`/api/payments`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| POST | `/api/payments/create-order` | ✅ | Initialize Razorpay order with total amount |
| POST | `/api/payments/verify` | ✅ | Verify payment signature and complete transaction |
| POST | `/api/payments/refund/:orderId`| ✅ | Trigger refund for cancelled order (Manager/Admin only) |

### Promo Coupons (`/api/coupons`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/coupons/validate/:code` | ❌ | Check discount rate and existence of promo code |

### Wishlist (`/api/wishlist`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/wishlist` | ✅ | Retrieve user's wishlisted items |
| POST | `/api/wishlist/toggle` | ✅ | Add or remove a product from wishlist |
| DELETE | `/api/wishlist/:productId`| ✅ | Remove an item directly from wishlist |

### Reviews (`/api/reviews`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/reviews/product/:productId`| ❌ | Fetch all reviews posted for a product |
| POST | `/api/reviews` | ✅ | Post a new rating and comment |
| DELETE | `/api/reviews/:id` | ✅ | Delete a review (User's own or Admin) |

### Command & Controls (`/api/admin`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/admin/users` | ✅ | View all registered accounts (Admin only) |
| PUT | `/api/admin/users/:id/role` | ✅ | Modify a user's role privilege (Admin only) |
| DELETE | `/api/admin/users/:id` | ✅ | Delete/Ban user account (Admin only) |
| GET | `/api/admin/stats` | ✅ | View telemetry stats of platforms (Admin only) |
| POST | `/api/admin/coupons` | ✅ | Create a new coupon code (Admin only) |
| DELETE | `/api/admin/coupons/:code` | ✅ | Remove an active coupon code (Admin only) |
| POST | `/api/admin/reset-db` | ✅ | Wipe database and seed fresh default setup (Admin only) |

---

## 📁 Project Directory Structure

```
antiqueshop/
├── client/                     # Frontend Vite SPA
│   ├── public/                 # Favicon and static files
│   ├── src/
│   │   ├── assets/             # Static graphics & icons
│   │   ├── components/         # Modular interface components
│   │   │   ├── Auth.jsx        # Login & Signup forms
│   │   │   ├── Cart.jsx        # Sliding cart drawer with coupon validation
│   │   │   ├── Catalog.jsx     # Main store grid, filters & product inspect
│   │   │   ├── Checkout.jsx    # Shipping preferences & Razorpay triggers
│   │   │   ├── CommsTerminal.jsx # encypted AI-assist sidebar panel
│   │   │   ├── Dashboards.jsx  # Customer, Seller, Manager, Admin dashboards
│   │   │   ├── Footer.jsx      # Cyberpunk footer elements
│   │   │   ├── Hero.jsx        # Animated landing graphic with particle feel
│   │   │   ├── Navbar.jsx      # Sticky upper navigation controls
│   │   │   ├── ProfileSettings.jsx # Account data update page
│   │   │   ├── Toast.jsx       # Alert triggers provider
│   │   │   └── WishlistView.jsx # Watchlist panel view
│   │   ├── config.js           # API_BASE environment mapping
│   │   ├── index.css           # Custom glassmorphism, animations & Tailwind
│   │   ├── main.jsx            # Entry point rendering App
│   │   └── App.jsx             # Core router and modal container
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vercel.json             # Vercel deployment rewrite rules
├── server/                     # Backend API server
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # Sequelize connection pool builder
│   │   ├── controllers/        # Route controllers containing logic
│   │   ├── middleware/
│   │   │   └── authMiddleware.js # JWT verification and role parsing
│   │   ├── models/             # Sequelize schemas (User, Product, Order, etc.)
│   │   ├── routes/             # Express API routing handlers
│   │   ├── scripts/
│   │   │   └── seed.js         # DB creation and seed data executor
│   │   └── app.js              # Express config, middleware stack & server spin
│   └── package.json
├── package.json                # Project script controller
└── README.md
```

---

## ⚙️ Security & Design Architecture

- **🔒 Token-Based Encryption** — Stateless sessions secured via JWT.
- **🧬 Sequelize Safe Hooks** — Strict data relationship mapping, ensuring order integrity with cascade protection.
- **🛡️ Custom Rate-Limiters** — In-memory auth rate limiting to safeguard sign-ins and registrations.
- **✨ Premium Visual Polish** — Seamless glassmorphic cards, pulse glows, animated scanning grids, custom scrollbars, and neon color states matching the luxury theme.

---

## 🚢 Production Deployment

### Frontend (Vercel)
1. Set the root directory to `client` during import.
2. Select **Vite** as the preset.
3. Configure the **Build Command** to `npm run build` and the output folder to `dist`.
4. Add the environment variable: `VITE_API_URL` pointing to your deployed API server URL.

### Backend (Render / Heroku)
1. Set the root directory to `server`.
2. Configure **Build Command** as `npm install`.
3. Set the **Start Command** to `node src/app.js`.
4. Attach environment variables for database credentials, JWT secrets, and Razorpay API tokens.

---

## 📄 License

MIT
