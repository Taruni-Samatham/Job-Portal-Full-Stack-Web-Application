# ⚡ JobPortal — Full Stack Job Portal Management System

A production-grade job portal inspired by LinkedIn Jobs & Indeed, built with **React**, **Node.js**, **Express**, **MongoDB**, and **JWT authentication**.

---

## 🗂️ Project Structure

```
jobportal/
├── backend/                   # Node.js + Express API
│   ├── controllers/
│   │   ├── authController.js         # Register, Login, OTP, Reset Password
│   │   ├── jobController.js          # Job CRUD, search, filters
│   │   ├── applicationController.js  # Apply, track, shortlist
│   │   ├── userController.js         # Profile, avatar, resume, saved jobs
│   │   ├── adminController.js        # Admin dashboard, user/job management
│   │   └── notificationController.js # Notifications + AI chatbot
│   ├── models/
│   │   ├── User.js            # User schema (jobseeker/recruiter/admin)
│   │   ├── Job.js             # Job postings schema
│   │   └── Application.js     # Applications + Notifications schemas
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── userRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── adminRoutes.js
│   │   └── chatRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect, authorize, generateToken
│   │   └── uploadMiddleware.js # Multer for resumes, avatars, logos
│   ├── utils/
│   │   ├── emailService.js     # Nodemailer OTP, reset, notifications
│   │   └── seeder.js           # Sample data seeder
│   ├── uploads/                # File uploads (gitignored)
│   ├── server.js               # Express app entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                  # React.js UI
│   ├── public/
│   │   └── index.html         # Complete standalone frontend (all pages + UI)
│   ├── src/
│   │   ├── App.js             # Router setup
│   │   ├── context/
│   │   │   └── AuthContext.js # Global auth state
│   │   └── utils/
│   │       └── api.js         # Axios API service layer
│   ├── package.json
│   └── .env.example
│
├── API_DOCS.md                # Full REST API documentation
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn
- Git

---

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/jobportal.git
cd jobportal

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2️⃣ Configure Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/jobportal
JWT_SECRET=your_super_secret_key_here_minimum_32_chars
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=JobPortal <noreply@jobportal.com>
FRONTEND_URL=http://localhost:3000
OTP_EXPIRE=10
```

> 💡 **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords

**Frontend:**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key
REACT_APP_NAME=JobPortal
```

---

### 3️⃣ Seed the Database

```bash
cd backend
node utils/seeder.js
```

This creates:
- 1 Admin, 2 Recruiters, 2 Job Seekers
- 6 sample job postings
- 3 sample applications
- Sample notifications

**Demo Credentials:**
| Role | Email | Password |
|------|-------|----------|
| 🔑 Admin | admin@jobportal.com | admin123 |
| 🏢 Recruiter | recruiter@techcorp.com | recruiter123 |
| 🏢 Recruiter | hr@innosoft.io | recruiter123 |
| 👤 Job Seeker | priya@example.com | user123 |
| 👤 Job Seeker | rahul@example.com | user123 |

---

### 4️⃣ Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend (React):**
```bash
cd frontend
npm start
# App running on http://localhost:3000
```

**Or open the standalone HTML:**
> Open `frontend/public/index.html` directly in any browser — no build needed!

---

## 🌟 Features Overview

### 👤 Job Seeker
- Register/Login with OTP email verification
- Browse & search jobs with advanced filters
- Apply with resume upload + cover letter
- Track applications (Applied → Shortlisted → Interview → Hired)
- Save jobs to wishlist
- Edit profile, upload avatar & resume
- Real-time notifications
- AI Chatbot for career advice

### 🏢 Recruiter
- Post, edit, delete job listings
- View all applicants per job
- Shortlist / Interview / Reject candidates
- Company profile management
- Dashboard with application analytics charts

### ⚙️ Admin
- Full user management (view, block, delete)
- Job management (feature, remove)
- Analytics dashboard with Chart.js
- Platform health metrics

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| GET  | `/api/jobs` | List/search/filter jobs |
| POST | `/api/jobs` | Create job (recruiter) |
| POST | `/api/applications/:jobId` | Apply for job |
| GET  | `/api/applications/my` | My applications |
| PUT  | `/api/applications/:id/status` | Update status |
| GET  | `/api/users/profile` | Get profile |
| PUT  | `/api/users/profile` | Update profile |
| PUT  | `/api/users/resume` | Upload resume |
| GET  | `/api/notifications` | Get notifications |
| POST | `/api/chat/message` | AI chatbot |
| GET  | `/api/admin/dashboard` | Admin analytics |

> See `API_DOCS.md` for complete documentation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom), Vanilla JS / React.js |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| File Upload | Multer (PDF resumes, images) |
| Charts | Chart.js 4 |
| Security | Helmet, CORS, Rate Limiting |
| Maps | Google Maps API (configurable) |

---

## 🚢 Deployment Guide

### Backend → Render.com
```bash
# 1. Push to GitHub
git init && git add . && git commit -m "initial commit"
git remote add origin https://github.com/you/jobportal.git
git push -u origin main

# 2. Create Web Service on render.com
# Build Command: cd backend && npm install
# Start Command: cd backend && node server.js
# Add all .env variables in Render dashboard
```

### Frontend → Vercel
```bash
cd frontend
npm run build

# Deploy via Vercel CLI
npx vercel --prod

# Or connect GitHub repo at vercel.com
# Framework: Create React App
# Root: frontend/
```

### Database → MongoDB Atlas
```
1. Create free cluster at cloud.mongodb.com
2. Get connection string
3. Replace MONGO_URI in backend .env
4. Whitelist your server IP in Atlas Network Access
```

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ JWT token authentication (30-day expiry)
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Input validation
- ✅ Role-based access control (RBAC)
- ✅ OTP email verification
- ✅ File type validation (PDF/images only)
- ✅ File size limit (5MB)

---

## 🐛 Common Issues & Fixes

**MongoDB connection refused:**
```bash
# Start MongoDB locally
mongod --dbpath /data/db
# OR use MongoDB Atlas cloud
```

**Email not sending:**
- Enable 2FA on Gmail → Create App Password
- Use App Password (not Gmail password) in .env

**Port already in use:**
```bash
kill -9 $(lsof -ti:5000)
kill -9 $(lsof -ti:3000)
```

**Multer upload errors:**
```bash
mkdir -p backend/uploads/resumes backend/uploads/avatars backend/uploads/logos
```

---

## 📄 License

MIT License — free to use for personal and commercial projects.

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

**Built with ❤️ — JobPortal 2025**
