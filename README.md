# DevTwin: AI Portfolio Assistant

DevTwin is an intelligent RAG (Retrieval-Augmented Generation) system designed to act as a **Technical Recruiter & Advocate**. It ingests your CV (PDF) and scans your **GitHub Public Repositories** to answer questions about your skills, projects, and coding style in depth.

Deployed with **Next.js 16**, **React 19**, **Tailwind CSS v4**, **FastAPI**, **LangChain**, and **ChromaDB**.

<img width="1710" height="938" alt="Ekran Resmi 2025-12-09 11 30 55" src="https://github.com/user-attachments/assets/945fe4b3-3351-48cf-84a0-a395649d586e" />


## 🚀 Key Features

*   **Intelligent RAG**: Uses Groq (Llama 3.3) to reason about your experience.
*   **Recruiter Persona**: The AI proactively advocates for your fitness for a role, citing specific project examples.
*   **GitHub Auto-Sync**: Automatically fetches your public repositories, extracting READMEs, descriptions, and languages on startup.
*   **Multi-Language Support**: Seamlessly toggles between **Turkish (TR)** and **English (EN)** for international opportunities.
*   **Deep Context**: Merges CV data with live code analysis to provide "Connect the Dots" answers (e.g., linking Usage of Kafka to Distributed Systems knowledge).
*   **Modern Chat UI**: A polished, responsive interface with history, auto-scroll, and language controls.

## 🛠 Tech Stack

*   **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Lucide React, Axios.
*   **Backend**: FastAPI, LangChain, LangServe.
*   **AI Engine**: Groq (Llama-3.3-70b-versatile).
*   **Vector DB**: ChromaDB (with local persistence).
*   **Infrastructure**: Docker & Docker Compose.

## 🏃‍♂️ Setup & Run

### 1. Prerequisites
*   Docker & Docker Compose installed.
*   A [GitHub Token](https://github.com/settings/tokens) (Public Repo scope).
*   A [Groq API Key](https://console.groq.com/keys).

### 2. Clone & Configure
```bash
git clone https://github.com/your-username/DevTwin.git
cd DevTwin
```

Create a `.env` file in the root directory:
```bash
GROQ_API_KEY=gsk_your_key_here
GITHUB_TOKEN=ghp_your_token_here
GITHUB_USERNAME=your_github_username
```

### 3. Run with Docker
```bash
# Builds images and starts containers
docker-compose up --build
```
*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Data Ingestion
On startup, the backend will:
1.  Fetch all public repos for `GITHUB_USERNAME`.
2.  Save a raw dump to `./data/github_raw.json`.
3.  Generate a report at `./data/ingestion_report.md`.
4.  Ingest everything into ChromaDB.

## 🏗 Architecture

<pre>
    graph TD
    %% --- Renk ve Stil Tanımları (Dark Mode Uyumlu) ---
    classDef user fill:#212121,stroke:#fff,stroke-width:2px,color:#fff;
    classDef frontend fill:#0288d1,stroke:#01579b,stroke-width:2px,color:#fff;
    classDef backend fill:#2e7d32,stroke:#1b5e20,stroke-width:2px,color:#fff;
    classDef db fill:#f57c00,stroke:#e65100,stroke-width:2px,color:#fff;
    classDef ai fill:#7b1fa2,stroke:#4a148c,stroke-width:2px,color:#fff;
    classDef external fill:#546e7a,stroke:#37474f,stroke-width:2px,stroke-dasharray: 5 5,color:#fff;

    %% --- Düğümler (Kutucuklar) ---
    User((👤 User / Recruiter)):::user
    
    subgraph "Docker Container: Frontend"
        UI[💻 Next.js UI <br/> <i>(Chat Interface)</i>]:::frontend
    end

    subgraph "Docker Container: Backend"
        API[⚙️ FastAPI Server]:::backend
        Orchestrator[🦜 LangChain Agent <br/> <i>(RAG Logic)</i>]:::backend
        Ingest[🐍 Ingestion Script <br/> <i>(Runs on Startup)</i>]:::backend
    end

    subgraph "Local Storage (Persistent Volumes)"
        Chroma[(🔹 ChromaDB <br/> <i>Vector Store</i>)]:::db
        SQLite[(🗄️ SQLite <br/> <i>Chat History</i>)]:::db
    end

    subgraph "External Cloud Services"
        Groq[⚡ Groq LPU <br/> <i>Llama 3.3 Model</i>]:::ai
        GitHub[🐙 GitHub API <br/> <i>Public Repos</i>]:::external
        PDF[📄 CV.pdf <br/> <i>Local File</i>]:::external
    end

    %% --- Bağlantılar: Sohbet Akışı (Düz Çizgi) ---
    User <-->|1. Type Message| UI
    UI <-->|2. POST /chat (JSON)| API
    API <-->|3. Invoke Chain| Orchestrator
    
    Orchestrator -->|4. Similarity Search| Chroma
    Chroma -->|5. Retrieved Context| Orchestrator
    
    Orchestrator -->|6. Read/Write| SQLite
    
    Orchestrator -->|7. Prompt + Context| Groq
    Groq -->|8. Generated Answer| Orchestrator
    
    %% --- Bağlantılar: Veri Yükleme Akışı (Kesik Çizgi) ---
    GitHub -.->|Fetch Repos| Ingest
    PDF -.->|Parse Text| Ingest
    Ingest -.->|Embed & Upsert| Chroma

    %% --- Link Stilleri (Okların Renkleri) ---
    linkStyle 9,10,11 stroke:#f57c00,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 6,7,8 stroke:#7b1fa2,stroke-width:2px;
</pre>
