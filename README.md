# StaffSync - Modern Human Resource Management Solution (HRMS)

A production-ready, full-stack **MERN** (MongoDB, Express.js, React, Node.js) web application engineered for modern organizational human resource workflows. Features role-based access control (RBAC), biometric 1-click attendance tracking, time-off leave approval lifecycle, interactive employee directory, corporate announcement broadcasts, and employee learning & development (L&D) programs.

Ready to run locally and deploy to GitHub: **https://github.com/Yashikaa29/repository1**

---

## 🌟 Key Highlights & Features

- 🔐 **Role-Based Access Control (RBAC):**
  - **HR / Admin:** Global company management. Add/edit/delete employee profiles, review company-wide attendance and all leaves, broadcast high/medium/low priority announcements, and assign employee training.
  - **Manager:** Department-level operations. Access direct reports, review/approve/reject team leave applications, monitor team shift attendance, and track team training.
  - **Employee:** Self-service portal. Daily 1-click Check-In / Check-Out punch clock, apply for leaves (Annual, Sick, Casual, Unpaid) with real-time status tracker, browse announcements, and progress through assigned career courses.
- ⚡ **1-Click Demo Role Switcher:** Instant role-switching buttons in the navigation bar to preview HR, Manager, and Employee experiences on the fly.
- ⏱️ **Biometric Punch Clock & Shift Timesheets:** Live digital clock with check-in, check-out, duration calculation, and automated half-day/present detection.
- 🌴 **Leave Management Lifecycle:** Interactive leave balances (Annual: 18, Sick: 12, Casual: 6), submission form with date validation, reviewer feedback notes, and 1-click approval/rejection drawer.
- 📢 **Company Announcements Feed:** Priority badges (High: Red, Medium: Yellow, Low: Blue) with categorized tagging and full HR authoring controls.
- 🎓 **Training & Development Programs:** Course cards with department tags, completion deadlines, and interactive status progression (`Upcoming` ➔ `In-Progress` ➔ `Completed`).
- 🛡️ **Security:** JSON Web Tokens (JWT), bcryptjs password hashing, protected API routes, and CORS middleware.
- 💾 **Dual-Mode Persistence:** Native Mongoose ODM connection with automatic, seamless in-memory fallback for instant zero-config sandboxed execution.

---

## 🏗️ Architecture & Tech Stack

```
                          ┌───────────────────────────┐
                          │   React (Vite SPA) UI     │
                          │ Tailwind CSS, Lucide, RR6 │
                          └─────────────┬─────────────┘
                                        │ Axios (/api/*)
                                        ▼
                          ┌───────────────────────────┐
                          │  Express.js REST API      │
                          │  JWT Auth & RBAC Guard    │
                          └─────────────┬─────────────┘
                                        │ Mongoose ODM
                                        ▼
                          ┌───────────────────────────┐
                          │    MongoDB Database       │
                          │ (Users, Leaves, Logs, etc)│
                          └───────────────────────────┘
```

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router DOM v6, Axios, Lucide React Icons.
- **Backend:** Node.js, Express.js (RESTful API), JWT authentication, bcryptjs, CORS.
- **Database:** MongoDB with Mongoose ODM schemas.

---

## 📂 Project Structure

```text
├── server/
│   ├── config/
│   │   └── db.js                 # Database connection & dual-mode fallback
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── employeeController.js # CRUD operations for workforce directory
│   │   ├── attendanceController.js# 1-click check-in/out, daily shift logs
│   │   ├── leaveController.js    # Leave application and approval workflows
│   │   ├── announcementController.js # Broadcasts and priority news
│   │   └── trainingController.js # Course creation, assignment, progress
│   ├── middleware/
│   │   └── auth.js               # JWT verification & role authorization guard
│   ├── models/
│   │   ├── User.js               # User & Employee Mongoose schema
│   │   ├── Attendance.js         # Daily attendance records schema
│   │   ├── Leave.js              # Leave applications schema
│   │   ├── Announcement.js       # Company news schema
│   │   └── Training.js           # L&D training module schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── leaveRoutes.js
│   │   ├── announcementRoutes.js
│   │   └── trainingRoutes.js
│   ├── seed.js                   # Runnable MongoDB demo data seeding script
│   ├── server.js                 # Standalone Express backend entry
│   ├── package.json              # Backend package configuration
│   └── .env.example              # Server environment template
├── src/
│   ├── components/
│   │   ├── Layout.tsx            # Main shell with responsive sidebar & navbar
│   │   ├── Navbar.tsx            # Header with role quick-switcher & profile
│   │   ├── Sidebar.tsx           # Collapsible role-aware navigation
│   │   ├── ProtectedRoute.tsx    # RBAC route protection
│   │   ├── StatCard.tsx          # Metric cards
│   │   └── Modal.tsx             # Accessible dialog component
│   ├── context/
│   │   └── AuthContext.tsx       # Auth provider & session persistence
│   ├── pages/
│   │   ├── Login.tsx             # Auth portal with 1-click demo access
│   │   ├── Dashboard.tsx         # Role-specific KPI metrics and widgets
│   │   ├── Employees.tsx         # Directory with search, filters & HR CRUD
│   │   ├── Attendance.tsx        # Punch clock, shift history, and stats
│   │   ├── Leaves.tsx            # Time-off balances & approval drawer
│   │   ├── Announcements.tsx     # Newsfeed and priority bulletins
│   │   ├── Training.tsx          # Career courses and progress toggles
│   │   └── Profile.tsx           # Contact details and profile viewer
│   ├── services/
│   │   └── api.ts                # Axios instance with JWT interceptor
│   ├── App.tsx                   # Main routing setup
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Global Tailwind styles
├── server.ts                     # Full-stack dev server (Express + Vite)
├── package.json
└── README.md
```

---

## 🔑 Demo Accounts & Credentials

All accounts come pre-configured with the default password: **`password123`**

| Role | Email Address | Access Scope |
| :--- | :--- | :--- |
| 👑 **HR / Admin** | `hr@staffsync.com` | Full enterprise control, employee CRUD, all leaves & attendance |
| 👔 **Manager** | `manager@staffsync.com` | Engineering department lead, direct report approvals, team logs |
| 💼 **Employee** | `employee@staffsync.com` | Self-service punch in/out, time-off requests, personal training |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB** *(Optional)*: Local daemon (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI. *(If omitted, StaffSync runs in self-contained in-memory mode out-of-the-box!)*

### Step 1: Clone the Repository
```bash
git clone https://github.com/Yashikaa29/repository1.git
cd repository1
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/staffsync
JWT_SECRET=staffsync_super_secret_jwt_key_2026
NODE_ENV=development
```

### Step 4: Seed Initial Database (Optional)
If running a local MongoDB instance or Atlas connection:
```bash
npm run seed
```

### Step 5: Start the Full-Stack Application
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🛠️ Standalone Backend / Frontend Setup (Alternative)

If you prefer to run the client and server on separate ports:

### Run Backend Only (Port 5000)
```bash
cd server
npm install
npm run seed     # populate MongoDB
npm run dev      # runs on http://localhost:5000
```

### Run Frontend Only (Port 3000 or 5173)
From the root directory:
```bash
npm run dev
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user & return JWT token
- `GET /api/auth/me` - Retrieve authenticated user profile
- `POST /api/auth/logout` - Clear user session

### Employees (`/api/employees`)
- `GET /api/employees` - List all employees (supports `?department=`, `?role=`, `?search=`)
- `POST /api/employees` - Create employee record *(HR Only)*
- `GET /api/employees/:id` - Get employee profile
- `PUT /api/employees/:id` - Update employee details *(HR or Self)*
- `DELETE /api/employees/:id` - Remove employee record *(HR Only)*

### Attendance (`/api/attendance`)
- `POST /api/attendance/check-in` - Record today's clock-in timestamp
- `POST /api/attendance/check-out` - Record clock-out & calculate shift duration
- `GET /api/attendance/today` - Today's punch status for logged-in user
- `GET /api/attendance/my-attendance` - Personal attendance history & statistics
- `GET /api/attendance/all` - Company/Team attendance records *(HR & Manager)*

### Leaves (`/api/leaves`)
- `POST /api/leaves/apply` - Submit leave application (Annual, Sick, Casual, Unpaid)
- `GET /api/leaves/my-leaves` - Personal leave history and balance summary
- `GET /api/leaves/pending` - Pending leave requests awaiting approval *(HR & Manager)*
- `GET /api/leaves/all` - Complete leave records *(HR & Manager)*
- `PUT /api/leaves/:id/status` - Approve or reject leave request *(HR & Manager)*

### Announcements (`/api/announcements`)
- `GET /api/announcements` - List company announcements (supports `?priority=`, `?category=`)
- `POST /api/announcements` - Publish announcement *(HR Only)*
- `PUT /api/announcements/:id` - Edit announcement *(HR Only)*
- `DELETE /api/announcements/:id` - Delete announcement *(HR Only)*

### Training & L&D (`/api/training`)
- `GET /api/training/my-trainings` - Courses assigned to current user
- `GET /api/training/all` - All training modules *(HR & Manager)*
- `POST /api/training/assign` - Create and assign training program *(HR & Manager)*
- `PUT /api/training/:id/status` - Update status (`Upcoming`, `In-Progress`, `Completed`)

---

## 📤 Push Directly to GitHub

To push this complete codebase to your GitHub repository `https://github.com/Yashikaa29/repository1`:

```bash
# 1. Initialize git if not already initialized
git init

# 2. Add remote repository URL
git remote add origin https://github.com/Yashikaa29/repository1.git

# 3. Stage all files
git add .

# 4. Commit changes
git commit -m "feat: complete production-ready StaffSync HRMS MERN application"

# 5. Push to GitHub main branch
git branch -M main
git push -u origin main --force
```

---

## 📄 License
StaffSync is open-source software licensed under the [Apache-2.0 License](LICENSE).
