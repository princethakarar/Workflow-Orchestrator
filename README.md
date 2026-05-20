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
<p align="center">
  <img src="./screenshots/landing.png" alt="Workflow Orchestrator Landing Page" width="100%" style="border-radius: 8px; border: 1px solid #30363d;" />
</p>

---

### *"A comprehensive, role-based project orchestrator featuring dynamic visual task dependency designs, a local Python SentenceTransformers + ChromaDB RAG parsing microservice, and native bidirectional GitHub Issue synchronization."*

`Workflow Orchestrator` is an enterprise-grade project management application designed to bridge the gap between architectural plans and developer execution. Managers can drag-and-drop task dependency nodes in real-time, invite developers via a secure role-based invitation flow, upload raw project requirements PDFs for automatic vector search & LLM-driven task structure mapping, and keep everything in sync with GitHub issues natively.

---

## 🔍 Visual Overview

Click on the tabs below to expand high-fidelity visual representations of the application's core pages and microservices.

<details>
<summary>🖥️ <b>Manager & Admin Analytics Dashboard</b></summary>

![Manager & Admin Analytics Dashboard](./screenshots/admin-dashboard.png)

*The dynamic dashboard uses custom Recharts visualizations to display project metrics, active sprints, and automated progress levels, filtered by roles (Admin, Project Manager, Developer).*

</details>

<details>
<summary>🎨 <b>Interactive Workflow Node Canvas (React Flow)</b></summary>

![Interactive Workflow Node Canvas (React Flow)](./screenshots/workflow-canvas.png)

*The dynamic drag-and-drop workflow canvas built on **@xyflow/react**. Edges represent prerequisite tasks. Dragging updates coordinates and syncs across collaborators via Socket.io.*

</details>

<details>
<summary>🤖 <b>Local Python RAG Document Parser & AI Generator</b></summary>

![Local Python RAG Document Parser & AI Generator](./screenshots/rag-analyzer.png)

*The automated task extraction flow. PDF documents are sent to the local Python microservice, vectorized, queried, and combined with current database team capacity contexts. The final payload is compiled and sent to Groq's high-speed API to produce a perfectly structured JSON task plan.*

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

<!-- <p align="center">
  Made with ❤️ by <b>Prince</b>
</p>
 -->
