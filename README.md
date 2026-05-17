# 🎯 GoalsPulse
### AI-Assisted Goal Setting & Tracking Portal

> Built for **AtomQuest Hackathon 1.0** · Full-stack web application with 3-role workflow, AI-powered goal suggestions, and real-time progress tracking.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat&logo=postgresql&logoColor=white)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat&logo=prisma&logoColor=white)](https://prisma.io)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [User Roles](#-user-roles)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

GoalsPulse is an enterprise-grade **Goal Setting & Tracking Portal** that replaces fragmented spreadsheets and email chains with a structured, AI-assisted workflow. It covers the full lifecycle of performance management — from goal creation to quarterly check-ins to appraisal-ready reports.

### Problem It Solves

| Before GoalsPulse | After GoalsPulse |
|---|---|
| Excel sheets shared over email | Centralized web portal |
| No approval workflow | Structured Submit → Approve → Lock flow |
| Manual progress calculations | Automatic UoM-based progress scoring |
| Zero visibility for managers | Real-time team dashboards |
| HR compiles reports manually | One-click Excel export |
| Generic goal writing | AI-powered SMART goal suggestions |

---

## ✨ Features

### Core Features (Phase 1 BRD)
- **Goal Sheet Creation** — Up to 8 goals per employee, min 10% weightage each, total must equal 100%
- **4 UoM Types** — MIN, MAX, TIMELINE, ZERO with automatic progress formula engine
- **3-Role Workflow** — Employee → Manager L1 → Admin with role-based access
- **Approval Pipeline** — Submit → Approve & Lock / Edit / Return workflow
- **Goal Locking** — Goals are immutable after manager approval (with timestamp)
- **Quarterly Check-ins** — Employees log actuals per quarter; system auto-computes progress %
- **Audit Trail** — Every change to a locked goal is logged with user, timestamp, before/after state
- **Shared Goals** — Admin can push goals to multiple employees simultaneously

### Advanced Features (Phase 2 BRD)
- **AI Goal Co-pilot** — Gemini 2.5 Flash suggests 3 SMART goal rewrites based on thrust area + description
- **Analytics Dashboard** — Goal status breakdown, employee completion heatmap, progress tracking
- **Excel Export** — Color-coded `.xlsx` achievement report with all employee data, downloadable in one click
- **Manager Effectiveness** — Check-in completion rates per manager
- **QoQ Trend Charts** — Quarter-over-quarter progress visualization

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **Prisma ORM v5** | Database access layer |
| **PostgreSQL (Supabase)** | Cloud-hosted relational database |
| **JWT + bcryptjs** | Authentication & password hashing |
| **ExcelJS** | Excel report generation |
| **@google/generative-ai** | Gemini AI integration |
| **Nodemon** | Development hot reload |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18 + Vite** | UI framework & build tool |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with JWT interceptor |
| **Inline styles** | Zero-dependency styling |

### Infrastructure
| Service | Purpose |
|---|---|
| **Supabase** | PostgreSQL database (free tier) |
| **Railway / Render** | Backend deployment |
| **Vercel** | Frontend deployment |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│                     localhost:5173 / Vercel                  │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  Login   │  │   Employee   │  │  Manager  │  Admin   │   │
│  │  Page    │  │  Dashboard   │  │ Dashboard │Dashboard │   │
│  └──────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / Axios (Bearer JWT)
┌────────────────────────▼────────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│                    localhost:4000 / Railway                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  /auth   │  │  /goals  │  │  /admin  │  │   /ai     │  │
│  │ register │  │  CRUD    │  │  users   │  │  suggest  │  │
│  │  login   │  │ approve  │  │  report  │  │  goal     │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                         │                                    │
│          ┌──────────────▼──────────────┐                   │
│          │      Prisma ORM v5          │                   │
│          └──────────────┬──────────────┘                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              PostgreSQL (Supabase Cloud)                     │
│  Users · Goals · CheckIns · AuditLogs                       │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Gemini 2.5 Flash API                        │
│           (SMART goal suggestion engine)                     │
└─────────────────────────────────────────────────────────────┘
```

### Goal State Machine

```
DRAFT ──► SUBMITTED ──► LOCKED ✓
            │
            └──► REJECTED ──► DRAFT (employee revises)
```

### Progress Formula Engine

| UoM Type | Formula | Use Case |
|---|---|---|
| **MIN** | `(Actual / Target) × 100` | Revenue, Units sold |
| **MAX** | `(Target / Actual) × 100` | TAT, Cost, Defects |
| **ZERO** | `100% if actual=0, else 0%` | Safety incidents |
| **TIMELINE** | `100% if on time, else (Target/Actual)×100` | Project deadlines |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com) account (free)
- A [Google AI Studio](https://aistudio.google.com) API key (free)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/goalspulse.git
cd goalspulse
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.XXXX.supabase.co:5432/postgres"
JWT_SECRET="goalspulse_hackathon_2024"
PORT=4000
GEMINI_API_KEY="your_gemini_api_key_here"
```

Run database migrations:

```bash
npx prisma migrate dev --name init
```

Seed demo users:

```bash
node src/seed.js
```

Start the backend:

```bash
npm run dev
```

Backend runs at `http://localhost:4000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📡 API Reference

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create new user | None |
| POST | `/api/auth/login` | Login & get JWT token | None |

### Goals

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/goals` | Create goal sheet (array) | Employee |
| GET | `/api/goals/my` | Get own goals | Employee |
| POST | `/api/goals/submit` | Submit drafts for approval | Employee |
| GET | `/api/goals/team` | Get team's goals | Manager |
| PATCH | `/api/goals/:id` | Edit goal (pre-approval) | Manager |
| POST | `/api/goals/:id/approve` | Approve & lock goal | Manager |
| POST | `/api/goals/:id/reject` | Return goal for rework | Manager |
| POST | `/api/goals/:id/checkin` | Log quarterly achievement | Employee |

### Admin

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/admin/users` | All users with goals | Admin |
| GET | `/api/admin/report` | Download Excel report | Admin |

### AI

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/ai/suggest-goal` | Get 3 SMART goal suggestions | Any |

---

## 👥 User Roles

### Employee (Priya Mehta)
- Creates personal goal sheet (up to 8 goals, total 100% weightage)
- Gets AI-powered SMART goal suggestions
- Submits goals for manager approval
- Logs quarterly check-ins with actual values
- Views real-time progress scores and status

### Manager L1 (Rahul Sharma)
- Views all direct reportees and their goal sheets
- Edits target/weightage before approving
- Approves (locks) or returns goals for rework
- Tracks team progress via check-in dashboard
- Sees team completion rates and trends

### Admin
- Full visibility across all employees and managers
- Goal status breakdown and completion analytics
- Manages appraisal cycles and escalation rules
- Downloads organization-wide Excel achievement report
- Views audit trail for governance and compliance

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Employee** | employee@goalspulse.com | employee123 |
| **Manager** | manager@goalspulse.com | manager123 |
| **Admin** | admin@goalspulse.com | admin123 |

---

## 📁 Project Structure

```
goalspulse/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # DB models (User, Goal, CheckIn, AuditLog)
│   │   └── migrations/            # Auto-generated SQL migrations
│   ├── src/
│   │   ├── server.js              # Express app entry point
│   │   ├── seed.js                # Demo data seeder
│   │   ├── lib/
│   │   │   └── prisma.js          # Prisma client singleton
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verify + role guard
│   │   └── routes/
│   │       ├── auth.js            # Register / Login
│   │       ├── goals.js           # Full goal lifecycle + UoM engine
│   │       ├── admin.js           # Admin panel + Excel export
│   │       └── ai.js              # Gemini AI suggestions
│   ├── .env                       # Environment variables (not committed)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx                # Router + PrivateRoute
    │   ├── main.jsx               # React entry point
    │   ├── index.css              # Global reset
    │   ├── lib/
    │   │   └── api.js             # Axios instance with JWT interceptor
    │   └── pages/
    │       ├── Login.jsx          # Auth page with demo credentials
    │       ├── EmployeeDashboard.jsx  # Goal creation, check-ins, AI suggestions
    │       ├── ManagerDashboard.jsx   # Approval workflow, team view
    │       └── AdminDashboard.jsx     # Analytics, export, audit trail
    └── package.json
```

---

## 🗄 Database Schema

```prisma
model User {
  id         String    # UUID primary key
  name       String
  email      String    @unique
  password   String    # bcrypt hashed
  role       Role      # EMPLOYEE | MANAGER | ADMIN
  managerId  String?   # Self-referential for hierarchy
  goals      Goal[]
  checkIns   CheckIn[]
  auditLogs  AuditLog[]
}

model Goal {
  id           String     # UUID
  userId       String     # Owner
  thrustArea   String     # Sales, Customer, Safety, etc.
  title        String
  description  String
  uomType      UoMType    # MIN | MAX | TIMELINE | ZERO
  target       Float
  weightage    Float      # Must contribute to 100% total
  status       GoalStatus # DRAFT→SUBMITTED→LOCKED / REJECTED
  actual       Float?     # Set during check-in
  progressPct  Float?     # Auto-computed by formula engine
  lockedAt     DateTime?  # Set on approval
}

model CheckIn {
  goalId    String
  quarter   Int        # 1-4
  actual    Float
  status    String     # On Track | At Risk | Completed
  comment   String?
}

model AuditLog {
  goalId    String
  userId    String
  action    String
  before    Json?
  after     Json?
}
```

---

## 🏆 Hackathon Highlights

| Criterion | Implementation |
|---|---|
| **Functionality** | All Phase 1 + Phase 2 BRD requirements covered |
| **Innovation** | Gemini AI SMART goal co-pilot, live progress preview |
| **UI/UX** | Role-based dashboards, progress bars, status chips |
| **Code Quality** | Modular routes, middleware guards, Prisma ORM |
| **Demo Readiness** | 3 seeded users, full workflow demoable in 8 minutes |
| **Scalability** | Multi-tenant ready, API-first, deployable to cloud |

---

## 🔮 Future Roadmap

- [ ] MS Teams bot integration with adaptive cards
- [ ] Entra ID / Azure AD SSO
- [ ] 360° peer feedback module
- [ ] AI-generated appraisal narrative (end-of-year summary)
- [ ] Email notifications (submission, approval, reminders)
- [ ] Configurable escalation engine
- [ ] Multi-org / white-label support
- [ ] Mobile app (React Native)

---

## 👨‍💻 Built By

**Team GoalsPulse** · AtomQuest Hackathon 1.0

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">
  <strong>GoalsPulse</strong> · Built with ❤️ at AtomQuest Hackathon 1.0
</div>


models/gemini-2.5-flash
models/gemini-2.5-pro
models/gemini-2.0-flash
models/gemini-2.0-flash-001
models/gemini-2.0-flash-lite-001
models/gemini-2.0-flash-lite
models/gemini-2.5-flash-preview-tts
models/gemini-2.5-pro-preview-tts
models/gemma-4-26b-a4b-it
models/gemma-4-31b-it
models/gemini-flash-latest
models/gemini-flash-lite-latest
models/gemini-pro-latest
models/gemini-2.5-flash-lite
models/gemini-2.5-flash-image
models/gemini-3-pro-preview
models/gemini-3-flash-preview
models/gemini-3.1-pro-preview
models/gemini-3.1-pro-preview-customtools
models/gemini-3.1-flash-lite-preview
models/gemini-3.1-flash-lite
models/gemini-3-pro-image-preview
models/nano-banana-pro-preview
models/gemini-3.1-flash-image-preview
models/lyria-3-clip-preview
models/lyria-3-pro-preview
models/gemini-3.1-flash-tts-preview
models/gemini-robotics-er-1.5-preview
models/gemini-robotics-er-1.6-preview
models/gemini-2.5-computer-use-preview-10-2025
models/deep-research-max-preview-04-2026
models/deep-research-preview-04-2026
models/deep-research-pro-preview-12-2025
models/gemini-embedding-001
models/gemini-embedding-2-preview
models/gemini-embedding-2
models/aqa
models/imagen-4.0-generate-001
models/imagen-4.0-ultra-generate-001
models/imagen-4.0-fast-generate-001
models/veo-2.0-generate-001
models/veo-3.0-generate-001
models/veo-3.0-fast-generate-001
models/veo-3.1-generate-preview
models/veo-3.1-fast-generate-preview
models/veo-3.1-lite-generate-preview
models/gemini-2.5-flash-native-audio-latest
models/gemini-2.5-flash-native-audio-preview-09-2025
models/gemini-2.5-flash-native-audio-preview-12-2025
models/gemini-3.1-flash-live-preview


'http://localhost:5173',