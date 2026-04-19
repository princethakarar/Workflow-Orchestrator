# Workflow Orchestrator

A full-stack, role-based project management and workflow orchestration platform with visual task dependency design, team management, and GitHub Issue synchronization.

---

## Features

**Project Management**
- Full CRUD with status lifecycle: `Planning → Active → On Hold → Completed / Cancelled`
- Auto-completion engine — project auto-completes at 100% subtask progress and releases team members

**Workflow Canvas**
- Interactive drag-and-drop graph editor (React Flow) for designing task dependency workflows
- Directed edges visualize prerequisites and critical paths

**Task & Subtask System**
- Two-level task hierarchy with auto-computed status based on subtask completion
- Developers toggle subtask completion, triggering cascading status updates

**GitHub Sync**
- Tasks auto-create/update/close GitHub Issues via Octokit REST API
- Inbound webhook sync — closing an issue via PR auto-completes the task

**Team Management**
- Email-based invitation flow with OTP verification, role assignment, and password setup
- Dynamic availability tracking: `Available`, `Occupied`, `Inactive`

**Authentication & Security**
- JWT access + refresh token architecture with silent rotation
- Role-based access control (Admin, Project Manager, Developer)
- OTP email verification, password recovery, rate limiting

**Analytics & UI**
- Role-specific analytics dashboards with Recharts
- System-wide dark mode with Framer Motion transitions

---

## Tech Stack

**Frontend:** React 19, Vite 7, Tailwind CSS 4, React Flow, dnd-kit, Framer Motion, Recharts, React Router v7, Axios

**Backend:** Node.js, Express 5, MongoDB + Mongoose 9, Winston, Octokit, JWT, bcrypt, Nodemailer + Mailgen, express-rate-limit, Multer

---

## Installation & Setup

### 1. Clone

```bash
git clone https://github.com/princethakarar/Workflow-Orchestrator.git
cd Workflow-Orchestrator
```

### 2. Backend

```bash
cd Backend
npm install
```

Create `Backend/.env` (see table below), then:

```bash
npm run dev       # Development (Nodemon + hot-reload)
npm run start     # Production
```

### 3. Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

### 4. Access

| URL | Description |
|---|---|
| `http://localhost:5173` | Frontend |
| `http://localhost:8000` | Backend API |

---

## Environment Variables

Create `Backend/.env` with:

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `PORT` | Server port | `8000` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | Random 64-char hex |
| `ACCESS_TOKEN_EXPIRY` | Access token TTL | `1d` |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | Random 64-char hex |
| `REFRESH_TOKEN_EXPIRY` | Refresh token TTL | `10d` |
| `RESEND_API_KEY` | Resend API key | `re_xxxxxxxxxxxxxxxx` |
| `MAIL_FROM_ADDRESS` | Sender email (use Resend testing sender first) | `onboarding@resend.dev` |
| `FRONTEND_URL` | Frontend URL (for email links) | `http://localhost:5173` |
| `SERVER_URL` | Backend URL | `http://localhost:8000` |
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxxxxxxxxxxx` |
| `GITHUB_OWNER` | GitHub repo owner | `princethakarar` |
| `GITHUB_REPO` | GitHub repo name | `Workflow-Orchestrator` |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature secret | Any random string |

---

## Folder Structure

```
Workflow-Orchestrator/
├── Backend/
│   ├── src/
│   │   ├── controllers/          # Route handlers (auth, project, task, team, workflow, analytics)
│   │   ├── db/                   # MongoDB connection
│   │   ├── middlewares/          # JWT auth, role checks, rate limiter, error handler, multer
│   │   ├── models/               # Mongoose schemas (User, Project, Task, Workflow, Invitation)
│   │   ├── routes/               # Express route definitions
│   │   ├── services/             # GitHub sync, project auto-completion
│   │   ├── utils/                # Logger (Winston), mailer, ApiError, ApiResponse, async handler
│   │   ├── validators/           # Express-validator schemas
│   │   ├── app.js                # Express app config
│   │   └── index.js              # Server entry point
│   ├── .env
│   ├── package.json
│   └── Dockerfile
│
├── Frontend/
│   ├── src/
│   │   ├── pages/                # Dashboard (Admin, Manager, Developer), Projects, Workflow, Auth pages
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # React Contexts (Auth, Theme)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── layouts/              # Page layout wrappers
│   │   ├── services/             # Axios API service layer
│   │   ├── utils/                # Helper utilities
│   │   ├── App.jsx               # Root component + routing
│   │   └── main.jsx              # Vite entry point
│   ├── .env
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```
