# <p align="center"><img src="./Frontend/public/workflow-orchestrator-icon.svg" alt="Workflow Orchestrator Icon" width="38" valign="middle" style="vertical-align: middle; margin-right: 6px;" /> Workflow Orchestrator</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Version" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Version" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express Version" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Version" />
  <img src="https://img.shields.io/badge/Python_RAG-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" />
  <img src="https://img.shields.io/badge/LangChain-LCEL-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector_Store-FF6F61?style=for-the-badge&logo=databricks&logoColor=white" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Groq_LLM-Llama_3.3_70B-F3A530?style=for-the-badge&logo=meta&logoColor=white" alt="Groq" />
<p align="center">
  <img src="./screenshots/landing.png" alt="Workflow Orchestrator Landing Page" width="100%" style="border-radius: 8px; border: 1px solid #30363d;" />
</p>

---

### *"A comprehensive, role-based project orchestrator featuring dynamic visual task dependency designs, a local Python LangChain + ChromaDB RAG microservice, and native bidirectional GitHub Issue synchronization."*

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

*The automated task extraction flow. PDF documents are sent to the local Python microservice, chunked, vectorized and queried through LangChain, then combined with current database team capacity contexts. An LCEL chain compiles the prompt and calls Groq's high-speed API to produce a perfectly structured JSON task plan.*

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
    participant RAG as RAG Service (Flask + LangChain + ChromaDB)
    participant Groq as AI Service (Groq Llama 3.3)
    participant DB as Database (MongoDB)

    Manager->>FE: Upload Project Requirements Document (PDF)
    FE->>BE: POST /api/ai/process-pdf (Multipart PDF, JWT required)
    activate BE
    BE->>DB: Query Team Members & Availability
    DB-->>BE: Return Specializations & Active Task Counts
    Note over BE: Builds TEAM_CONTEXT string.<br/>Mongo access stays in Node — Python never touches the database.
    BE->>RAG: POST /rag (PDF Buffer + Query + TEAM_CONTEXT)<br/>header: X-RAG-Secret
    activate RAG
    Note over RAG: PyMuPDF extracts text → paragraph/sentence chunker →<br/>LangChain Documents → HuggingFaceEmbeddings (all-MiniLM-L6-v2) →<br/>Chroma collection per document (cosine) → top-k similarity retrieval.
    RAG->>Groq: LCEL chain (prompt → ChatGroq), Llama 3.3 70B, JSON mode
    activate Groq
    Groq-->>RAG: Return Structured JSON Plan
    deactivate Groq
    RAG-->>BE: Returns context, response, chunks,<br/>chunk_meta, total_chunks, db_reused
    deactivate RAG
    Note over BE: Strips markdown fences, validates JSON schema,<br/>logs (context, query, response) to the fine-tuning dataset.
    BE-->>FE: Return Generated Project Workflow & Task Nodes
    deactivate BE
    FE-->>Manager: Render Interactive Drag-and-Drop Workflow Canvas
```

> **Note on the split:** retrieval *and* generation both live in the Python service — the
> LCEL chain owns the prompt, so Express never calls Groq directly. Team context is the
> one exception: it needs MongoDB, so Node computes it and passes it through as a string.

---

## ⚡ Features

### 🛠️ Project Lifecycle & Execution
*   **Full CRUD & Finite States**: Complete workflow management using statuses: `Planning` ➔ `Active` ➔ `On Hold` ➔ `Completed` / `Cancelled`.
*   **Auto-Completion Engine**: Projects automatically transition to `Completed` when all nested subtasks reach 100% completion, releasing developer assets back to the availability pool.

### 🎨 Visual Graph Canvas & Multiplayer Sync
*   **Visual Node Canvas**: Real-time dependency drag-and-drop editor utilizing `@xyflow/react` and `dnd-kit` to trace dependencies.
*   **Multiplayer Collision & Sync**: Synchronized room-based updates via `socket.io-client` preventing overriding and tracking user movements instantly.

### 📄 AI-Driven Architecture Analysis (RAG on LangChain)
*   **LangChain Pipeline**: The Python microservice runs the full retrieval-and-generation chain on LangChain — `langchain-huggingface` embeddings, `langchain-chroma` for the vector store, and an LCEL chain (`prompt | ChatGroq`) for generation. Deliberately *not* a canned `RetrievalQA` chain, whose default prompt would silently override the hand-tuned rules block.
*   **Local Vector Embeddings**: `HuggingFaceEmbeddings` wrapping `sentence-transformers` (`all-MiniLM-L6-v2`, 384-dim) on CPU, indexed into one local `ChromaDB` collection per document, keyed by SHA-256 of the PDF bytes so re-uploading the same file skips re-embedding entirely.
*   **Content-Aware Chunking**: A custom paragraph- and sentence-boundary chunker (not a generic character splitter) emits LangChain `Document`s carrying page and character-offset metadata, with overlap budgeted *before* the size ceiling so no chunk overruns it.
*   **Dynamic LLM Generation**: `ChatGroq` with Llama 3.3 70B in JSON mode produces high-fidelity JSON complete with module definitions, estimated complexity, required specializations, and priority hierarchies. Express validates the schema and persists the result.
*   **Regression Baseline**: `rag_service/validation/golden_chunks_v1.json` freezes the pre-LangChain chunk text and embedding vectors, so any future change to chunking or the embedding model can be diffed against a known-good reference rather than eyeballed.

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
*   Receives Multipart PDF uploads behind JWT auth and a rate limiter, buffers them in memory, and forwards them to the RAG microservice with a shared-secret header.
*   Owns everything that needs MongoDB — including the team-availability context injected into the AI prompt — and validates the JSON plan that comes back before persisting it.

### 3. The RAG Semantic Parser (Python 3.11, Flask & LangChain)
*   Extracts text via PyMuPDF, chunks it on paragraph and sentence boundaries, and wraps the result in LangChain `Document`s with page and character-offset metadata.
*   Embeds on CPU through `HuggingFaceEmbeddings` and indexes into a per-document `langchain-chroma` collection created with explicit cosine distance.
*   Runs retrieval with a request-scoped `k` (clamped to the collection size), then generates the task plan through an LCEL chain and returns both the retrieved context and the raw completion to Express.
*   Served by **gunicorn** in production; the Flask dev server is local-development only.

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
![LangChain](https://img.shields.io/badge/LangChain-LCEL-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-CPU-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF6F61?style=flat-square&logo=databricks&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F3A530?style=flat-square&logo=meta&logoColor=white)
![Gunicorn](https://img.shields.io/badge/Gunicorn-WSGI-499848?style=flat-square&logo=gunicorn&logoColor=white)

**Pinned LangChain stack** (`Backend/rag_service/requirements.txt`):

| Package | Version | Role |
| :--- | :--- | :--- |
| `langchain-core` | `1.5.3` | LCEL primitives, prompt templates, `Document` |
| `langchain-chroma` | `1.1.0` | Vector-store integration |
| `langchain-huggingface` | `1.0.0` | `HuggingFaceEmbeddings` wrapper |
| `langchain-groq` | `1.1.3` | `ChatGroq` chat model |
| `chromadb` | `1.5.9` | Underlying vector store |

> ⚠️ `langchain-huggingface` is pinned to **1.0.0, not latest**. Version 1.2.2 requires
> `sentence-transformers>=5.2.0` and `transformers>=5.0.0`, which would upgrade the embedding
> stack and invalidate the frozen baseline in `validation/`. 1.0.0 declares
> `sentence-transformers>=2.6.0,<3.0.0` — an exact fit for the pins already in use.
> The bare `langchain` umbrella package is intentionally **not** installed: an LCEL chain
> only needs `langchain-core`, and the free-tier instance cannot spare the extra import weight.

---

## 📂 Folder Structure

```
Workflow-Orchestrator/
├── Backend/
│   ├── rag_service/              # Python RAG Microservice
│   │   ├── app.py                # Flask + LangChain (chunk → embed → Chroma → LCEL → Groq)
│   │   ├── requirements.txt      # CPU-only torch + pinned LangChain stack
│   │   ├── validation/           # Frozen chunk/embedding baseline for regression diffs
│   │   ├── .env                  # Local-only: GROQ_API_KEY, RAG_SHARED_SECRET (untracked)
│   │   ├── .dockerignore         # Keeps venv/ and chroma_db/ out of the image
│   │   └── chroma_db/            # Local vector DB (untracked — rebuilt on demand)
│   │
│   ├── src/                      # Node.js API Service
│   │   ├── config/               # ragConfig.js — RAG URL normalisation, auth header, timeouts
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

Navigate to the `rag_service` folder, install CPU-optimized PyTorch, LangChain and the vector store, then boot up:

```bash
# Navigate to the Python microservice
cd Backend/rag_service

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate       # On Windows: .\venv\Scripts\activate

# Install dependencies with CPU-targeted PyTorch resolutions
pip install -r requirements.txt

# Start the Flask microservice (development)
python app.py
```

Because generation now happens inside this service, it needs its own credentials.
Create `Backend/rag_service/.env` (untracked, and excluded from the Docker image):

```dotenv
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile

# Must match RAG_SHARED_SECRET in Backend/.env
RAG_SHARED_SECRET=your_shared_secret
```

> [!NOTE]
> The Flask RAG server starts locally on `http://127.0.0.1:5001/rag`.
> In production it is served by gunicorn instead — `gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120 app:app`.

> [!IMPORTANT]
> **`GROQ_API_KEY` now belongs to the RAG service, not just the Node backend.** The chain is
> built lazily, so the service will start and pass its health check without the key and then
> fail every `/rag` request. When deploying, set it on the Python service too.

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
| `RAG_SERVICE_URL` | AI Service Connector (base URL or `…/rag` — both accepted) | `http://127.0.0.1:5001/rag` |
| `RAG_SHARED_SECRET` | Shared secret sent as `X-RAG-Secret` to the RAG service | `43_char_random_url_safe_string` |
| `GITHUB_TOKEN` | Octokit Sync Token | `ghp_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_OWNER` | GitHub Repository Owner | `princethakarar` |
| `GITHUB_REPO` | GitHub Repository Name | `Workflow-Orchestrator` |
| `GITHUB_WEBHOOK_SECRET` | GitHub Security Key | `any_custom_secure_string` |

And a second `.env` in `Backend/rag_service/` for the Python service:

| Variable Name | Purpose / Category | Example Value |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Groq LLM Key — **required**, generation runs here now | `gsk_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `GROQ_MODEL` | Model override (defaults to Llama 3.3 70B) | `llama-3.3-70b-versatile` |
| `RAG_SHARED_SECRET` | Must match the value in `Backend/.env` | `43_char_random_url_safe_string` |
| `RAG_ALLOWED_ORIGINS` | Optional browser CORS allow-list; empty = server-to-server only | *(leave empty)* |

> [!WARNING]
> **Rollout order for `RAG_SHARED_SECRET`:** set it on the **Node backend first**, then on the
> RAG service. An unconfigured RAG service ignores the header and logs a warning on every start,
> so configuring in this order begins enforcement without an outage window. Every route is gated
> once the secret is present — including `DELETE /cache` — with the sole exception of
> `GET /health`, which stays open for the keep-alive pinger and returns a trimmed payload.

---

<!-- <p align="center">
  Made with ❤️ by <b>Prince</b>
</p>
 -->
