# <p align="center"><img src="./Frontend/public/workflow-orchestrator-icon.svg" alt="Workflow Orchestrator Icon" width="38" valign="middle" style="vertical-align: middle; margin-right: 6px;" /> Workflow Orchestrator</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Version" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Version" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express Version" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Version" />
  <img src="https://img.shields.io/badge/Python_RAG-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector_Store-FF6F61?style=for-the-badge&logo=databricks&logoColor=white" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Groq_LLM-Llama_3.3_70B-F3A530?style=for-the-badge&logo=meta&logoColor=white" alt="Groq" />
</p>

---

### *"A comprehensive, role-based project orchestrator featuring dynamic visual task dependency designs, a local Python SentenceTransformers + ChromaDB RAG parsing microservice, and native bidirectional GitHub Issue synchronization."*

`Workflow Orchestrator` is an enterprise-grade project management application designed to bridge the gap between architectural plans and developer execution. Managers can drag-and-drop task dependency nodes in real-time, invite developers via a secure role-based invitation flow, upload raw project requirements PDFs for automatic vector search & LLM-driven task structure mapping, and keep everything in sync with GitHub issues natively.

---

## 🔍 Visual Overview

Click on the tabs below to expand high-fidelity visual representations of the application's core pages and microservices.

<details>
<summary>🖥️ <b>Manager & Admin Analytics Dashboard</b></summary>
<br />
<p align="center">
  <svg viewBox="0 0 800 240" width="100%" height="240" style="background:#0d1117; border-radius:8px; border:1px solid #30363d; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
    <rect width="100%" height="100%" fill="#0d1117" />
    <!-- Grid -->
    <path d="M 0 40 L 800 40 M 0 80 L 800 80 M 0 120 L 800 120 M 0 160 L 800 160 M 0 200 L 800 200" fill="none" stroke="#161b22" stroke-width="1"/>
    <!-- Dashboard Mockup Header -->
    <rect width="100%" height="45" fill="#161b22" rx="8" />
    <circle cx="20" cy="22" r="6" fill="#ff5f56" />
    <circle cx="38" cy="22" r="6" fill="#ffbd2e" />
    <circle cx="56" cy="22" r="6" fill="#27c93f" />
    <text x="85" y="27" fill="#8b949e" font-size="12">Workflow Orchestrator — Executive Dashboard</text>
    <!-- Left Column: Metrics -->
    <g transform="translate(20, 65)">
      <rect width="230" height="70" rx="6" fill="#1f242c" stroke="#30363d" />
      <text x="15" y="25" fill="#8b949e" font-size="11" font-weight="bold">TOTAL PROJECTS</text>
      <text x="15" y="55" fill="#58a6ff" font-size="28" font-weight="bold">12</text>
      <text x="215" y="50" fill="#3fb950" font-size="11" text-anchor="end">↑ 8% vs last mo</text>
    </g>
    <g transform="translate(20, 150)">
      <rect width="230" height="70" rx="6" fill="#1f242c" stroke="#30363d" />
      <text x="15" y="25" fill="#8b949e" font-size="11" font-weight="bold">TEAM CAPACITY</text>
      <text x="15" y="55" fill="#3fb950" font-size="28" font-weight="bold">84%</text>
      <text x="215" y="50" fill="#f3a530" font-size="11" text-anchor="end">12 Occupied</text>
    </g>
    <!-- Right Column: Recharts Chart Area -->
    <g transform="translate(270, 65)">
      <rect width="510" height="155" rx="6" fill="#1f242c" stroke="#30363d" />
      <text x="15" y="22" fill="#f0f6fc" font-size="12" font-weight="bold">Project Completion Progress (%)</text>
      <!-- Bars representing Recharts data -->
      <text x="35" y="135" fill="#8b949e" font-size="9">Proj A</text>
      <rect x="35" y="50" width="30" height="70" fill="#1f6feb" rx="3" />
      <text x="100" y="135" fill="#8b949e" font-size="9">Proj B</text>
      <rect x="100" y="30" width="30" height="90" fill="#3fb950" rx="3" />
      <text x="165" y="135" fill="#8b949e" font-size="9">Proj C</text>
      <rect x="165" y="70" width="30" height="50" fill="#f3a530" rx="3" />
      <text x="230" y="135" fill="#8b949e" font-size="9">Proj D</text>
      <rect x="230" y="90" width="30" height="30" fill="#ff7b72" rx="3" />
      <!-- Legend -->
      <circle cx="320" cy="50" r="5" fill="#1f6feb" />
      <text x="330" y="54" fill="#8b949e" font-size="10">Active Lifecycle</text>
      <circle cx="320" cy="75" r="5" fill="#3fb950" />
      <text x="330" y="79" fill="#8b949e" font-size="10">Auto-completed (100% Tasks)</text>
      <circle cx="320" cy="100" r="5" fill="#ff7b72" />
      <text x="330" y="104" fill="#8b949e" font-size="10">Blocked / Pending PR Hook</text>
    </g>
  </svg>
</p>
<p align="center"><i>The dynamic dashboard uses custom Recharts visualizations to display project metrics, active sprints, and automated progress levels, filtered by roles (Admin, Project Manager, Developer).</i></p>
</details>

<details>
<summary>🎨 <b>Interactive Workflow Node Canvas (React Flow)</b></summary>
<br />
<p align="center">
  <svg viewBox="0 0 800 220" width="100%" height="220" style="background:#0d1117; border-radius:8px; border:1px solid #30363d; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#21262d" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
    <!-- Connections -->
    <path d="M 170 110 C 220 110, 220 60, 270 60" fill="none" stroke="#58a6ff" stroke-width="2" stroke-dasharray="4,4" />
    <path d="M 170 110 C 220 110, 220 160, 270 160" fill="none" stroke="#1f6feb" stroke-width="2" />
    <path d="M 410 60 C 460 60, 460 110, 510 110" fill="none" stroke="#58a6ff" stroke-width="2" />
    <path d="M 410 160 C 460 160, 460 110, 510 110" fill="none" stroke="#8b949e" stroke-width="2" />
    <!-- Node 1: Authentication -->
    <g transform="translate(30, 80)">
      <rect width="140" height="60" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1.5"/>
      <rect width="4" height="60" rx="2" fill="#58a6ff" />
      <text x="15" y="25" fill="#f0f6fc" font-size="12" font-weight="bold">User Auth Module</text>
      <text x="15" y="45" fill="#8b949e" font-size="10">High Priority | Completed</text>
      <circle cx="140" cy="30" r="4" fill="#58a6ff" />
    </g>
    <!-- Node 2: Database Schemas -->
    <g transform="translate(270, 30)">
      <rect width="140" height="60" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1.5"/>
      <rect width="4" height="60" rx="2" fill="#58a6ff" />
      <text x="15" y="25" fill="#f0f6fc" font-size="12" font-weight="bold">Mongoose Schema</text>
      <text x="15" y="45" fill="#8b949e" font-size="10">High Priority | Completed</text>
      <circle cx="0" cy="30" r="4" fill="#58a6ff" />
      <circle cx="140" cy="30" r="4" fill="#58a6ff" />
    </g>
    <!-- Node 3: React Dashboard -->
    <g transform="translate(270, 130)">
      <rect width="140" height="60" rx="8" fill="#161b22" stroke="#1f6feb" stroke-width="2"/>
      <rect width="4" height="60" rx="2" fill="#1f6feb" />
      <text x="15" y="25" fill="#f0f6fc" font-size="12" font-weight="bold">Dashboard UI</text>
      <text x="15" y="45" fill="#58a6ff" font-size="10">Medium Priority | Active</text>
      <circle cx="0" cy="30" r="4" fill="#1f6feb" />
      <circle cx="140" cy="30" r="4" fill="#1f6feb" />
      <!-- Assignee tag -->
      <circle cx="122" cy="45" r="7" fill="#ff7b72" />
      <text x="119" y="48" fill="#ffffff" font-size="8" font-weight="bold">PT</text>
    </g>
    <!-- Node 4: Webhook Sync -->
    <g transform="translate(510, 80)">
      <rect width="140" height="60" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1.5"/>
      <rect width="4" height="60" rx="2" fill="#8b949e" />
      <text x="15" y="25" fill="#f0f6fc" font-size="12" font-weight="bold">GitHub Webhook</text>
      <text x="15" y="45" fill="#8b949e" font-size="10">Low Priority | Backlog</text>
      <circle cx="0" cy="30" r="4" fill="#8b949e" />
    </g>
  </svg>
</p>
<p align="center"><i>The dynamic drag-and-drop workflow canvas built on <b>@xyflow/react</b>. Edges represent prerequisite tasks. Dragging updates coordinates and syncs across collaborators via Socket.io.</i></p>
</details>

<details>
<summary>🤖 <b>Local Python RAG Document Parser & AI Generator</b></summary>
<br />
<p align="center">
  <svg viewBox="0 0 800 220" width="100%" height="220" style="background:#0d1117; border-radius:8px; border:1px solid #30363d; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
    <rect width="100%" height="100%" fill="#0d1117" />
    <!-- Left Column: PDF Dropzone -->
    <g transform="translate(30, 40)">
      <rect width="160" height="140" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1.5" stroke-dasharray="4,4"/>
      <path d="M 110 70 L 110 100 M 95 85 L 110 70 L 125 85" fill="none" stroke="#58a6ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="110" y="125" fill="#58a6ff" font-size="11" font-weight="bold" text-anchor="middle">Click to Upload PDF</text>
      <text x="110" y="140" fill="#8b949e" font-size="9" text-anchor="middle">System Requirements Doc</text>
    </g>
    <!-- Connectors -->
    <path d="M 190 110 L 250 110" fill="none" stroke="#30363d" stroke-width="3" stroke-dasharray="4,4"/>
    <polygon points="255,110 245,105 245,115" fill="#30363d" />
    <!-- Middle: Flask RAG Core -->
    <g transform="translate(270, 30)">
      <rect width="260" height="45" rx="6" fill="#161b22" stroke="#238636" stroke-width="1"/>
      <text x="15" y="26" fill="#f0f6fc" font-size="11" font-weight="bold">1. PyMuPDF Text Extraction</text>
      <text x="245" y="26" fill="#3fb950" font-size="10" font-weight="bold" text-anchor="end">Done</text>
      <rect width="260" height="45" rx="6" fill="#161b22" stroke="#1f6feb" stroke-width="1.5" y="55"/>
      <text x="15" y="81" fill="#f0f6fc" font-size="11" font-weight="bold">2. SentenceTransformers Embedding</text>
      <text x="245" y="81" fill="#58a6ff" font-size="10" font-weight="bold" text-anchor="end">Active</text>
      <rect width="260" height="45" rx="6" fill="#161b22" stroke="#30363d" stroke-width="1" y="110"/>
      <text x="15" y="136" fill="#f0f6fc" font-size="11" font-weight="bold">3. ChromaDB Vector Match</text>
      <text x="245" y="136" fill="#8b949e" font-size="10" font-weight="bold" text-anchor="end">Queued</text>
    </g>
    <!-- Connectors -->
    <path d="M 530 110 L 590 110" fill="none" stroke="#30363d" stroke-width="3" stroke-dasharray="4,4"/>
    <polygon points="595,110 585,105 585,115" fill="#30363d" />
    <!-- Right Column: Groq Context Synthesizer -->
    <g transform="translate(610, 40)">
      <rect width="160" height="140" rx="8" fill="#161b22" stroke="#f3a530" stroke-width="1.5"/>
      <circle cx="80" cy="70" r="22" fill="none" stroke="#f3a530" stroke-width="2"/>
      <path d="M 70 70 L 90 70 M 80 60 L 80 80" stroke="#f3a530" stroke-width="2"/>
      <text x="80" y="115" fill="#f0f6fc" font-size="12" font-weight="bold" text-anchor="middle">Groq Llama 3.3</text>
      <text x="80" y="132" fill="#8b949e" font-size="9" text-anchor="middle">Structured JSON plan</text>
    </g>
  </svg>
</p>
<p align="center"><i>The automated task extraction flow. PDF documents are sent to the local Python microservice, vectorized, queried, and combined with current database team capacity contexts. The final payload is compiled and sent to Groq's high-speed API to produce a perfectly structured JSON task plan.</i></p>
</details>

---

## ⚙️ Role-Based Authentication & Collaboration Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin/Project Manager
    actor Developer as Developer
    participant BE as Backend Server (Express)
    participant DB as Database (MongoDB)
    participant SMTP as Email Service (Nodemailer)

    Admin->>BE: Create Invitation (Email, Role, Specialization)
    activate BE
    BE->>DB: Save Pending Invitation & OTP Hash
    BE->>SMTP: Send Invitation Link & OTP
    deactivate BE
    SMTP-->>Developer: Delivers Email with Invitation OTP
    Developer->>BE: Submit OTP + Set Password (Registration)
    activate BE
    BE->>DB: Create User (Role assigned: Developer)
    BE-->>Developer: Return JWT Access + Refresh Tokens
    deactivate BE
    Developer->>BE: Establish WebSocket Connection (Socket.io)
    BE-->>Developer: Connection Verified & Room Joined (Project Room)
```

---

## 🤖 AI Task Generation & RAG Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Project Manager
    participant FE as Frontend App (React Flow)
    participant BE as Backend Server (Express)
    participant RAG as RAG Service (Flask + ChromaDB)
    participant Groq as AI Service (Groq Llama 3.3)
    participant DB as Database (MongoDB)

    Manager->>FE: Upload Project Requirements Document (PDF)
    FE->>BE: POST /api/ai/upload (Multipart PDF)
    activate BE
    BE->>RAG: POST /rag (Sends PDF Buffer + Query)
    activate RAG
    Note over RAG: PyMuPDF extracts text.<br/>Sentence Transformers convert to embeddings.<br/>Query retrieves semantic chunks from ChromaDB.
    RAG-->>BE: Return Context Chunks & Snippets
    deactivate RAG
    BE->>DB: Query Team Members & Availability
    DB-->>BE: Return Specializations & Task Counts
    Note over BE: Compiles Prompt containing Context Chunks,<br/>Team availability structure, and strict JSON rules.
    BE->>Groq: ChatCompletion (Llama 3.3 70B Model)
    activate Groq
    Groq-->>BE: Return Valid Structured JSON
    deactivate Groq
    Note over BE: Validates JSON structure.<br/>Saves project, modules, tasks, and visual node/edge coordinates.
    BE-->>FE: Return Generated Project Workflow & Task Nodes
    deactivate BE
    FE-->>Manager: Render Interactive Drag-and-Drop Workflow Canvas
```

---

## ⚡ Features

### 🛠️ Project Lifecycle & Execution
*   **Full CRUD & Finite States**: Complete workflow management using statuses: `Planning` ➔ `Active` ➔ `On Hold` ➔ `Completed` / `Cancelled`.
*   **Auto-Completion Engine**: Projects automatically transition to `Completed` when all nested subtasks reach 100% completion, releasing developer assets back to the availability pool.

### 🎨 Visual Graph Canvas & Multiplayer Sync
*   **Visual Node Canvas**: Real-time dependency drag-and-drop editor utilizing `@xyflow/react` and `dnd-kit` to trace dependencies.
*   **Multiplayer Collision & Sync**: Synchronized room-based updates via `socket.io-client` preventing overriding and tracking user movements instantly.

### 📄 AI-Driven Architecture Analysis (RAG)
*   **Local Vector Embeddings**: Python-based microservice uses `sentence-transformers` (`all-MiniLM-L6-v2`) and local `ChromaDB` instances to index parsed PDFs.
*   **Dynamic LLM Generation**: Express backend connects with `Groq` using Llama 3.3 to construct high-fidelity JSON arrays complete with module definitions, estimated complexity, required specializations, and priority hierarchies.

### 🔐 Bidirectional GitHub Synchronization
*   **Octokit Sync Engine**: Automatically maps and registers nodes on the canvas into GitHub Issues.
*   **Webhooks Lifecycle**: Inbound webhooks intercept issue status modifications (e.g., closing an issue via standard Git commit or Pull Request) and cascade changes directly back to update task status in MongoDB.

### 📧 Auth & Verification
*   **Role-Based Security**: Complete access permissions based on role definitions (`Admin`, `Project Manager`, `Developer`).
*   **Secure Invitations**: Email invitation flow utilizing OTP tokens generated on-the-fly and parsed with `mailgen` + `nodemailer`.

---

## 🧠 Step-by-Step System Flow & Architecture

The application is split into three decoupled services cooperating in real-time:

### 1. The Client (React 19 & Vite 7)
*   Provides role-based views.
*   Uses `@xyflow/react` to render task states, dragging listeners, and connector nodes.
*   Opens a client-side WebSocket tunnel to the server to establish real-time coordination hooks during project editing.

### 2. The Primary Core API (Node.js & Express 5)
*   Serves standard CRUD pipelines, authenticates users with JWT access and refresh rotation, and coordinates team resources.
*   Manages open Socket.io rooms, enabling developers to co-author workflows concurrently.
*   Receives Multipart PDF uploads, buffers them, streams them to the RAG microservice, compiles context-augmented prompt trees, and communicates with `Groq`.

### 3. The RAG Semantic Parser (Python 3.11 & Flask)
*   Receives standard file buffers, extracts raw texts via PyMuPDF, chunks paragraphs, embeds texts natively using CPU-optimized PyTorch models, and indexes them in a local ChromaDB collection.
*   Resolves spatial semantic similarity requests, returning context vectors back to the Express controller within milliseconds.

---

## 🛠️ Detailed Technical Deep-Dives

### 🔄 JWT Access & Refresh Token Silent Rotation
To prevent user interruption, we implement a secure token cycle:
1.  On login, users receive an `accessToken` (short-lived, in-memory) and a `refreshToken` (long-lived, saved in a secure HTTP-Only cookie).
2.  Client-side Axios interceptors check for a `401 Unauthorized` response on expired calls and silently ping `/api/auth/refresh-token` to rotate tokens before repeating the failed request.

### ⚡ Collaborative Auto-Save & Synchronization
To avoid merge conflicts on the visual canvas:
1.  Moving nodes triggers small coordinate deltas streamed to the active Socket.io room.
2.  The server validates permissions and broadcasts coordinates to other active developers, running a silent refetch to display the change in real-time.

---

### AI & RAG Microservice
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-CPU-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF6F61?style=flat-square&logo=databricks&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F3A530?style=flat-square&logo=meta&logoColor=white)

---

## 📂 Folder Structure

```
Workflow-Orchestrator/
├── Backend/
│   ├── rag_service/              # Python RAG Microservice
│   │   ├── app.py                # Flask Server (PyMuPDF + sentence-transformers + ChromaDB)
│   │   ├── requirements.txt      # Python CPU-optimized requirements
│   │   └── chroma_db/            # Local vector DB directory
│   │
│   ├── src/                      # Node.js API Service
│   │   ├── controllers/          # Route handlers (auth, project, task, team, workflow, analytics, AI)
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
│   ├── src/                      # React Frontend Service
│   │   ├── pages/                # Dashboards, Projects, Workflow Editor, Auth views
│   │   ├── components/           # HeadlessUI components, sidebar, node components
│   │   ├── context/              # React Contexts (Auth, Theme)
│   │   ├── hooks/                # Custom React hooks (useWorkflow, etc.)
│   │   ├── layouts/              # Screen wrappers
│   │   ├── services/             # Axios API integration layers
│   │   ├── utils/                # Helper utilities (flowHelpers, etc.)
│   │   ├── App.jsx               # React Router config
│   │   └── main.jsx              # App entry point
│   ├── .env
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ⚡ Quick Start

### 📋 Prerequisites
- **Node.js**: v20 or higher
- **Python**: v3.11.x
- **MongoDB**: A running local or Atlas instance

---

### 1. Set Up the RAG Microservice

Navigate to the `rag_service` folder, install CPU-optimized PyTorch and vector stores, then boot up:

```bash
# Navigate to the Python microservice
cd Backend/rag_service

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate       # On Windows: .\venv\Scripts\activate

# Install dependencies with CPU-targeted PyTorch resolutions
pip install -r requirements.txt

# Start the Flask microservice
python app.py
```
> [!NOTE]
> The Flask RAG server starts locally on `http://127.0.0.1:5001/rag`.

---

### 2. Set Up the Node.js Backend API

Open a new terminal tab and install dependencies:

```bash
# Navigate to Backend
cd Backend

# Install packages
npm install

# Build environment configuration
# Copy .env configuration variables as shown in the table below

# Launch in Development Mode
npm run dev
```
> [!NOTE]
> The Express REST Server listens on `http://localhost:8000`.

---

### 3. Set Up the Vite Frontend App

Open a new terminal tab to launch the interface:

```bash
# Navigate to Frontend
cd Frontend

# Install packages
npm install

# Launch Vite hot-reload server
npm run dev
```
> [!IMPORTANT]
> Access the fully responsive app at `http://localhost:5173`.

---

## 🔑 Environment Variables Configuration

Create a `.env` file in the `Backend` directory containing the following:

| Variable Name | Purpose / Category | Example Value |
| :--- | :--- | :--- |
| `MONGO_URI` | Database Connection | `mongodb+srv://user:pass@cluster.mongodb.net/workflow` |
| `PORT` | API Server Port | `8000` |
| `CORS_ORIGIN` | CORS Security | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | JWT Security | `64_char_random_hex_string` |
| `ACCESS_TOKEN_EXPIRY` | JWT Security | `1d` |
| `REFRESH_TOKEN_SECRET` | JWT Security | `64_char_random_hex_string` |
| `REFRESH_TOKEN_EXPIRY` | JWT Security | `10d` |
| `RESEND_API_KEY` | Mail Notification | `re_xxxxxxxxx` |
| `MAIL_FROM_ADDRESS` | Mail Notification | `onboarding@resend.dev` |
| `FRONTEND_URL` | Application Routing | `http://localhost:5173` |
| `SERVER_URL` | Application Routing | `http://localhost:8000` |
| `RAG_SERVICE_URL` | AI Service Connector | `http://127.0.0.1:5001/rag` |
| `GROQ_API_KEY` | Groq LLM Key | `gsk_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_TOKEN` | Octokit Sync Token | `ghp_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_OWNER` | GitHub Repository Owner | `princethakarar` |
| `GITHUB_REPO` | GitHub Repository Name | `Workflow-Orchestrator` |
| `GITHUB_WEBHOOK_SECRET` | GitHub Security Key | `any_custom_secure_string` |

---

<p align="center">
  Made with ❤️ by <b>Prince</b>
</p>

