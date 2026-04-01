# Infini-Stock - QR-Based IoT Inventory Management System

A modern web application for tracking System Units and Monitors using QR codes, built with React, Node.js, and Supabase.

## 🏗️ Project Structure

```
Infini-Stock/
├── frontend/          # React + Vite + Tailwind UI
│   ├── src/
│   │   ├── api/       # API client and endpoints
│   │   ├── components/ # React components
│   │   ├── pages/     # Page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/           # Express + TypeORM + Supabase
│   ├── src/
│   │   ├── config/    # Database config
│   │   ├── controllers/ # API handlers
│   │   ├── models/    # TypeORM entities
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   ├── middleware/ # Auth & logging
│   │   ├── utils/     # Helper functions
│   │   ├── scripts/   # Admin scripts
│   │   └── index.js   # Server entry
│   ├── .env.example
│   ├── .env
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env` (already done with Supabase credentials)
   - Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME are set

3. **Start backend server**
   ```bash
   npm run dev      # Development mode with nodemon
   npm run start    # Production mode
   ```

   The server will:
   - Initialize TypeORM connection
   - Synchronize all 9 database tables to Supabase
   - Start listening on `http://0.0.0.0:5000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment** (optional)
   - Create `.env` from `.env.example` if backend is not on localhost:5000
   - Default API URL: `http://localhost:5000/api`

3. **Start frontend dev server**
   ```bash
   npm run dev
   ```

   Opens on `http://localhost:5173`

## 📊 Database Schema

**Tables created automatically on backend startup:**

1. **profiles** - User accounts and roles
2. **locations** - QR locations and clusters
3. **units** - System unit inventory records
4. **monitors** - Monitor inventory records
5. **assets** - System Units and Monitors with QR codes
6. **monitor_assignments** - Track monitor-unit relationships
7. **asset_movements** - Location change history
8. **asset_status_history** - Status change audit trail
9. **activity_logs** - All user actions

## 🎨 Frontend Pages

- **Dashboard** - Summary and recent activity
- **System Units** - List and manage system units
- **Monitors** - List and manage monitors
- **QR Generator** - Create new QR asset tags
- **Activity Logs** - Search and filter history

## 🔌 API Endpoints

### Assets
- `GET /api/assets` - List all assets
- `POST /api/assets/scan` - Scan asset by QR
- `PATCH /api/assets/location` - Update asset location
- `PATCH /api/assets/status` - Update asset status
- `POST /api/assets/swap-monitor` - Swap monitor assignment
- `POST /api/assets/iot/scan-update` - IoT scan update

### Inventory
- `GET /api/units` - List system units
- `GET /api/monitors` - List monitors

### Logs
- `GET /api/activity-logs` - List activity logs

## 🔐 Authentication

JWT Bearer tokens are required for all API calls.
Store token in `localStorage.authToken` on frontend.

## 🎯 Tech Stack

**Frontend:**
- React 18.2
- Vite
- Tailwind CSS (Lavender theme)
- React Router
- Axios

**Backend:**
- Node.js + Express
- TypeORM
- PostgreSQL (Supabase)
- JWT Auth

## 📝 Next Steps

1. Implement user authentication pages (login/signup)
2. Add CRUD forms for assets, units, and monitors
3. Integrate QR code generation library
4. Add real-time WebSocket updates
5. Build ESP32 IoT integration
6. Add PDF report generation

---

Built for Infocom Technologies - Inventory Management System
