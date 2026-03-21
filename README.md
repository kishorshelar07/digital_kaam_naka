# 🏗️ Digital Kaam Naka
### *घरी बसा, काम मिळा! — Stay Home, Get Work!*

> Digitizing Maharashtra's traditional Naka system where daily wage workers gather every morning for work. Now workers mark themselves available from home, and employers find and hire them online.

---

## 🎯 What is Digital Kaam Naka?

In Maharashtra, India, there is a traditional system called **"Naka"** where daily wage workers (कामगार) gather at a specific street corner every morning, and employers (मालक) come to hire them for the day.

**Digital Kaam Naka digitizes this exact system:**
- Workers open the app, toggle "**Aaj Uplabdh Ahe**" (Available Today) ON → GPS location is captured
- Employers search for available workers nearby on a map
- Booking request sent → Worker accepts/rejects → Work happens → Payment & rating

No more standing at the naka for hours. No middlemen. Direct connection.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js 18, React Router v6, Bootstrap 5 |
| **State** | React Context API (Auth, Notifications, Location) |
| **Real-time** | Socket.IO (booking notifications, live availability) |
| **i18n** | react-i18next (Marathi default, Hindi, English) |
| **Maps** | Leaflet.js (no API key required) |
| **Backend** | Node.js + Express.js REST API |
| **Database** | PostgreSQL 15 + Sequelize ORM + PostGIS |
| **Auth** | JWT (httpOnly cookies) + OTP via Twilio SMS |
| **Payments** | Razorpay (UPI, Card, Net Banking) |
| **Files** | Cloudinary (profile photos, Aadhar scans) |
| **Push** | Firebase Cloud Messaging (FCM) |
| **WhatsApp** | Meta WhatsApp Business API |
| **Email** | Nodemailer (Gmail SMTP) |

---

## 📁 Project Structure

```
digital-kaam-naka/
├── client/          # React.js Frontend
│   └── src/
│       ├── pages/   # All 13 pages
│       ├── components/  # Reusable components
│       ├── context/ # Auth, Notifications, Location
│       ├── services/ # API calls (Axios)
│       ├── hooks/   # useSocket, useLocation
│       ├── i18n/    # Marathi, Hindi, English translations
│       └── styles/  # Global CSS design system
├── server/          # Node.js Backend
│   ├── models/      # 15 Sequelize models
│   ├── controllers/ # Business logic
│   ├── routes/      # API endpoints
│   ├── middleware/  # Auth, Role, Upload, Validation
│   ├── config/      # DB, Cloudinary, Socket, Razorpay
│   └── utils/       # SMS, WhatsApp, Push, GPS helpers
├── database/        # SQL schema + seed data
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with PostGIS extension
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/your-org/digital-kaam-naka.git
cd digital-kaam-naka

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Database Setup

```bash
# Create database
createdb kamnaka_db

# Enable PostGIS
psql -d kamnaka_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run schema
psql -d kamnaka_db -f database/schema.sql

# Seed categories and locations
psql -d kamnaka_db -f database/seed_categories.sql
```

### 3. Environment Variables

```bash
# Server
cd server
cp .env.example .env
# Fill in your values in .env

# Client
cd ../client
cp .env.example .env
# Fill in your values
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend API (port 5000)
cd server && npm run dev

# Terminal 2 — React Frontend (port 3000)
cd client && npm start
```

### 5. Docker (Recommended)

```bash
# Starts PostgreSQL + pgAdmin + API
docker-compose up -d

# Then start frontend separately
cd client && npm start
```

---

## 🗃️ Database Schema (15 Tables)

| Table | Description |
|-------|-------------|
| `users` | Central auth table (all roles) |
| `workers` | Worker profile, GPS, availability |
| `employers` | Employer profile, company info |
| `categories` | 12 job categories (trilingual) |
| `worker_skills` | Worker ↔ Category many-to-many |
| `availability` | Daily availability schedule |
| `job_posts` | Employer job listings |
| `bookings` | Booking lifecycle management |
| `payments` | Razorpay + cash transactions |
| `ratings` | Bidirectional rating system |
| `notifications` | Trilingual notifications |
| `subscriptions` | Employer subscription plans |
| `locations` | Maharashtra locations data |
| `disputes` | Dispute resolution system |
| `admin_logs` | Admin audit trail |

---

## 🌐 API Endpoints

**Base URL:** `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to phone |
| POST | `/auth/verify-otp` | Verify OTP and login |
| POST | `/auth/register` | Complete registration |
| GET | `/workers` | All workers with filters |
| GET | `/workers/nearby` | GPS-based nearby workers |
| POST | `/workers/availability` | Toggle availability (THE core feature) |
| GET | `/jobs` | All job posts |
| POST | `/jobs` | Create job post |
| POST | `/bookings` | Create booking |
| PUT | `/bookings/:id/accept` | Accept booking |
| PUT | `/bookings/:id/complete` | Complete work |
| POST | `/payments/verify` | Verify Razorpay payment |
| POST | `/ratings` | Submit rating |

Full API documentation: `docs/API.md`

---

## 💳 Subscription Plans

| Plan | Price | Posts | Features |
|------|-------|-------|----------|
| Free | ₹0 | 3/month | Basic search |
| Basic | ₹299/month | 15 | Standard listing |
| Pro | ₹799/month | Unlimited | Priority listing |
| Premium | ₹1999/month | Unlimited | Priority + Analytics |

---

## 🌍 Deployment

| Service | Platform |
|---------|----------|
| **Frontend** | Vercel (free tier) |
| **Backend** | Render / Railway |
| **Database** | Supabase (PostgreSQL + PostGIS) |
| **Files** | Cloudinary |
| **Domain** | digitalkamnaka.in |

```bash
# Deploy frontend to Vercel
cd client && npx vercel

# Backend: Set env vars on Render/Railway and push
git push origin main
```

---

## 🔐 Security Features

- JWT in httpOnly cookies (XSS protection)
- OTP rate limiting (3 attempts, 30-min block)
- Bcrypt password hashing (12 salt rounds)
- Helmet.js security headers
- CORS restricted to frontend domain
- Role-based access control (RBAC)
- Input validation via Joi (server) + Yup (client)
- File upload validation (type + size)

---

## 🌐 Supported Languages

| Code | Language | Status |
|------|----------|--------|
| `mr` | मराठी (Marathi) | ✅ Default |
| `hi` | हिंदी (Hindi) | ✅ Complete |
| `en` | English | ✅ Complete |
| `gu` | ગુજરાતી (Gujarati) | 🔄 Phase 2 |

---

## 🤝 Contributing

This platform serves Maharashtra's daily wage workers. Every feature should be:
- **Mobile-first** — most users are on cheap Android phones
- **Low-literacy friendly** — large buttons, icons, minimal text
- **Offline graceful** — show cached data when disconnected
- **Fast** — under 3s load time on 3G

---

## 📞 Contact

- **Email:** info@digitalkamnaka.in
- **Website:** digitalkamnaka.in
- **Mission:** Digitizing Maharashtra's Naka System → All India

---

*Built with ❤️ for Maharashtra's millions of daily wage workers*

*© 2024 Digital Kaam Naka — All Rights Reserved*
