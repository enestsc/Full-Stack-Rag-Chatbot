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

graph TD
    %% --- Styles ---
    classDef user fill:#f9f9f9,stroke:#333,stroke-width:2px,color:black;
    classDef frontend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:black;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:black;
    classDef db fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,color:black;
    classDef ai fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:black;
    classDef external fill:#eceff1,stroke:#455a64,stroke-width:2px,stroke-dasharray: 5 5,color:black;

    %% --- Nodes ---
    User((👤 Recruiter / User)):::user
    
    subgraph "Docker Container: Frontend"
        UI[💻 Next.js UI <br/> <i>(Chat Interface)</i>]:::frontend
    end

    subgraph "Docker Container: Backend"
        API[⚙️ FastAPI Server]:::backend
        Orchestrator[🦜 LangChain Agent <br/> <i>(RAG Logic)</i>]:::backend
        Ingest[🐍 Ingestion Script <br/> <i>(Runs on Startup)</i>]:::backend
    end

    subgraph "Local Storage (Volumes)"
        Chroma[(🔹 ChromaDB <br/> <i>Vector Store</i>)]:::db
        SQLite[(🗄️ SQLite <br/> <i>Chat History</i>)]:::db
    end

    subgraph "External Cloud Services"
        Groq[⚡ Groq LPU <br/> <i>Llama 3.3 Model</i>]:::ai
        GitHub[Octocat <br/> <i>GitHub API</i>]:::external
        PDF[📄 CV.pdf <br/> <i>Local File</i>]:::external
    end

    %% --- Connections: Chat Flow ---
    User <-->|Type Message| UI
    UI <-->|POST /chat (JSON)| API
    API <-->|Invoke Chain| Orchestrator
    
    Orchestrator -->|1. Similarity Search| Chroma
    Chroma -->|2. Retrieved Chunks| Orchestrator
    
    Orchestrator -->|3. Read/Write| SQLite
    
    Orchestrator -->|4. Prompt + Context| Groq
    Groq -->|5. Generated Answer| Orchestrator
    
    %% --- Connections: Ingestion Flow ---
    GitHub -->|Fetch Repos| Ingest
    PDF -->|Parse Text| Ingest
    Ingest -->|Embed & Upsert| Chroma

    %% --- Link Styling ---
    linkStyle 6,7,9,10,11 stroke:#7b1fa2,stroke-width:2px;
    linkStyle 12,13,14 stroke:#ef6c00,stroke-width:2px,stroke-dasharray: 5 5;
