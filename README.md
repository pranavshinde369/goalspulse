<div align="center">
  <!-- 🖼️ PLACEHOLDER: PROJECT LOGO -->
  <img src="https://via.placeholder.com/150x150.png?text=GoalsPulse+Logo" alt="GoalsPulse Logo" width="150" />

  <h1>🎯 GoalsPulse</h1>
  <h3>AI-Assisted Goal Setting & Tracking Portal</h3>

  <p>A full-stack enterprise web application with a 3-role workflow, AI-powered goal suggestions, and real-time progress tracking.</p>

  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com)
  [![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
  [![Gemini AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
  [![Google Cloud Run](https://img.shields.io/badge/Deployed_on-Google_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](#-live-demo)
</div>

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [User Roles](#-user-roles)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)

---

## 🌐 Live Demo

The application is deployed and running live on **Google Cloud Run**.

- **Frontend Application**: [https://goalspulse-frontend-53119045662.us-central1.run.app](https://goalspulse-frontend-53119045662.us-central1.run.app)
- **Backend API**: [https://goalspulse-backend-53119045662.us-central1.run.app](https://goalspulse-backend-53119045662.us-central1.run.app)

*(Please use the [Demo Credentials](#-demo-credentials) to log in and test the system).*

---

## 🌟 Overview

GoalsPulse is an enterprise-grade **Goal Setting & Tracking Portal** that replaces fragmented spreadsheets and email chains with a structured, AI-assisted workflow. It covers the full lifecycle of performance management — from goal creation to quarterly check-ins to appraisal-ready reports.

### 💡 The Problem We Solve

Traditional performance management relies on fragmented Excel spreadsheets, endless email threads, and manual check-ins. This leads to misaligned objectives, lack of transparency, and hours of administrative overhead. 

**GoalsPulse transforms this chaotic process into a streamlined, automated, and intelligent workflow:**

| The Old Way (Pain Points) | The GoalsPulse Way (Solutions) |
| :--- | :--- |
| ❌ **Fragmented Data:** Excel sheets lost in email chains. | ✅ **Single Source of Truth:** Centralized, cloud-based web portal. |
| ❌ **Vague Objectives:** "Increase sales" or "Do better." | ✅ **AI Co-pilot:** Gemini AI auto-generates structured, SMART goals. |
| ❌ **No Accountability:** Goals are forgotten until December. | ✅ **Real-Time Tracking:** Quarterly check-ins with automated progress scoring. |
| ❌ **Zero Visibility:** Managers can't see team alignment. | ✅ **Live Dashboards:** Managers get instant oversight of team progress. |
| ❌ **Manual Reporting:** HR spends weeks compiling data. | ✅ **Instant Analytics:** One-click Excel exports for the entire organization. |

---

## ✨ Features

### Core Features (Phase 1 BRD)
- **Goal Sheet Creation** — Up to 8 goals per employee, min 10% weightage each, total must equal 100%
- **4 UoM Types** — MIN, MAX, TIMELINE, ZERO with automatic progress formula engine
- **3-Role Workflow** — Employee → Manager L1 → Admin with role-based access
- **Approval Pipeline** — Submit → Approve & Lock / Edit / Return workflow
- **Quarterly Check-ins** — Employees log actuals per quarter; system auto-computes progress %

### Advanced Features (Phase 2 BRD)
- **AI Goal Co-pilot** — Gemini 2.5 Flash suggests 3 SMART goal rewrites based on thrust area + description
- **Analytics Dashboard** — Goal status breakdown, employee completion heatmap, progress tracking
- **Excel Export** — Color-coded `.xlsx` achievement report with all employee data

---

## 📸 Screenshots

### 1. Employee Dashboard
> An interactive dashboard where employees track their locked goals and perform quarterly check-ins.
<div align="center">
  <img src="docs/images/employee_dashboard.png" alt="Employee Dashboard" width="800"/>
</div>

### 2. Manager Approval Workflow
> Managers review submitted goal sheets, enter observations, and approve or request adjustments.
<div align="center">
  <img src="docs/images/manager_dashboard.png" alt="Manager Dashboard" width="800"/>
</div>

### 3. Admin Analytics & Users Grid
> Global oversight for Admins, featuring organization-wide metrics and a user-role management grid.
<div align="center">
  <img src="docs/images/admin_dashboard.png" alt="Admin Analytics & Users" width="800"/>
</div>

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **Prisma ORM v5** | Database access layer |
| **PostgreSQL (Supabase)** | Cloud-hosted relational database |
| **ExcelJS** | Excel report generation |
| **@google/generative-ai** | Gemini AI integration |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18 + Vite** | UI framework & build tool |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with JWT interceptor |

---

## 🏗 Architecture

```text
┌────────────────────────────────────────────────────────┐
│                  WEB CLIENT / BROWSER                  │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼─────────────────────────────┐
│             FRONTEND (Google Cloud Run)                │
│  [ React SPA ]  ↔  [ React Router ]  ↔  [ Axios ]      │
└──────────────────────────┬─────────────────────────────┘
                           │ RESTful API
┌──────────────────────────▼─────────────────────────────┐
│             BACKEND (Google Cloud Run)                 │
│                [ API Gateway Router ]                  │
│                                                        │
│   ├── [ Auth Service ]       ├── [ Goals Engine ]      │
│   └── [ Admin & Reports ]    └── [ Prisma ORM ]        │
└─────────┬───────────────────────────────┬──────────────┘
          │ Connection Pool               │ HTTPS
┌─────────▼──────────────┐       ┌────────▼──────────────┐
│  DATABASE (Supabase)   │       │ EXTERNAL AI (Google)  │
│  [ PostgreSQL DB ]     │       │ [ Gemini 2.5 API ]    │
└────────────────────────┘       └───────────────────────┘
```

> **Note:** The above flow represents the deployment architecture. The Frontend and Backend are decoupled microservices deployed on Google Cloud Run, communicating with a managed Supabase database and external Google AI APIs.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com) account (for PostgreSQL)
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini)

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

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.XXXX.supabase.co:5432/postgres"
JWT_SECRET="your_secret"
PORT=4000
GEMINI_API_KEY="your_gemini_api_key"
```

Run migrations and seed the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
node src/seed.js
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.development` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:4000/api
```

Start the local server:
```bash
npm run dev
```

---

## 📡 API Reference

### Auth
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login & get JWT token

### Goals
- `POST /api/goals` - Create goal sheet
- `GET /api/goals/my` - Get own goals
- `POST /api/goals/submit` - Submit drafts for approval
- `POST /api/goals/:id/approve` - Approve & lock goal (Manager)
- `POST /api/goals/:id/checkin` - Log quarterly achievement

### Admin & AI
- `GET /api/admin/report` - Download Excel report
- `POST /api/ai/suggest-goal` - Get 3 SMART goal suggestions

---

## 👥 User Roles & Workflows

GoalsPulse is built around a secure, role-based architecture designed to mirror real-world enterprise hierarchies.

### 1. The Employee (The Performer)
*Empowering individuals to set clear, trackable, and ambitious objectives.*
- **The Problem:** Employees often struggle to translate broad company targets into actionable, measurable goals.
- **The Solution:** An interactive dashboard where employees can draft up to 8 weighted goals. The **Gemini AI Co-pilot** acts as a personal mentor, analyzing their raw ideas and suggesting three polished, SMART (Specific, Measurable, Achievable, Relevant, Time-bound) alternatives instantly.

### 2. The Manager (The Reviewer)
*Providing leaders with the tools to align, monitor, and coach their teams.*
- **The Problem:** Managers lack visibility into what their team is actively working on and struggle to track progress consistently throughout the year.
- **The Solution:** A dedicated approval hub. Managers can review submitted goals, edit targets, and lock them in. Throughout the year, they use the Team Dashboard to monitor real-time quarterly check-ins, allowing them to intervene early when a team member is falling behind.

### 3. The Administrator (The Orchestrator)
*Giving HR and executives a bird's-eye view of organizational performance.*
- **The Problem:** Compiling end-of-year performance data across hundreds of employees takes weeks of manual data entry.
- **The Solution:** Global analytics. The Admin dashboard provides an instant breakdown of goal statuses across the company. With a single click, Admins can generate and download a comprehensive, color-coded Excel report containing every employee's performance metrics, ready for appraisal cycles.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Employee** | employee@goalspulse.com | employee123 |
| **Manager** | manager@goalspulse.com | manager123 |
| **Admin** | admin@goalspulse.com | admin123 |

---

## 📁 Project Structure

```text
goalspulse/
├── backend/                  # Express.js REST API
│   ├── prisma/               # DB Models & Migrations
│   ├── src/                  
│   │   ├── routes/           # Express Route Handlers
│   │   ├── middleware/       # JWT Auth Guards
│   │   ├── server.js         # Entry Point
│   │   └── seed.js           # Demo User Generation
│   └── Dockerfile            # Cloud Run Config
│
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI Elements
│   │   ├── pages/            # Role-Based Views
│   │   ├── lib/api.js        # Axios Client Config
│   │   └── App.jsx           # React Router Setup
│   ├── Dockerfile            # Cloud Run / Nginx Config
│   ├── nginx.conf            # Nginx Routing
│   └── .env.production       # Live Cloud API URL
│
├── README.md                 # Project Documentation
└── vercel.json               # Vercel Fallback Config
```

---

## 👨‍💻 Built By

**Team GoalsPulse**

<div align="center">
  <br>
  <sub>Built with ❤️ and AI</sub>
</div>