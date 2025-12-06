# Full Stack RAG Chatbot (Dockerized)

A production-ready, containerized chatbot application that uses Retrieval-Augmented Generation (RAG) to answer questions based on a specific Curriculum Vitae (CV). The project is built with a **FastAPI** backend, a **Next.js** frontend, and uses **Groq** for high-speed LLM inference, orchestrated via **Docker Compose**.

## 🚀 Features

-   **RAG Architecture**: Uses a local vector database (ChromaDB) to retrieve relevant context from the CV before answering.
-   **Model**: Powered by **Llama-3.3-70b-versatile** via the Groq API for lightning-fast responses.
-   **Embeddings**: Uses local HuggingFace embeddings (`all-MiniLM-L6-v2`) via CPU-optimized PyTorch.
-   **Chat History**: Persists user conversations using SQLite.
-   **Modern UI**: Responsive chat interface built with Next.js, Tailwind CSS, and Shadcn UI.
-   **Dockerized**: Full stack (Frontend + Backend + Database) runs with a single command.
-   **Auto-Scroll**: Chat interface automatically scrolls to the latest message.

## 🛠️ Tech Stack

### Backend
-   **Framework**: FastAPI (Python)
-   **LLM API**: Groq (Llama 3.3)
-   **Orchestration**: LangChain (LCEL)
-   **Vector DB**: ChromaDB (Local Persistence)
-   **Database**: SQLite (SQLAlchemy ORM)
-   **Embeddings**: HuggingFace (`sentence-transformers`)

### Frontend
-   **Framework**: Next.js 14 (React)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Components**: Shadcn UI & Lucide React
-   **State Management**: React Hooks

### DevOps
-   **Containerization**: Docker & Docker Compose
-   **Optimization**: CPU-only PyTorch build for smaller image sizes.

---

## 🏃‍♂️ How to Run

### Prerequisites
-   Docker & Docker Compose installed.
-   A [Groq API Key](https://console.groq.com/).

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ragchatbot
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```bash
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Build and Start
Run the following command to build the Docker images and start the services:
```bash
docker-compose up --build
```
This might take a few minutes the first time as it downloads necessary dependencies (Checking for CPU-optimized PyTorch).

Once running:
-   **Frontend**: [http://localhost:3000](http://localhost:3000)
-   **Backend**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

### 4. Ingest the CV (First Time Only)
To populate the vector database with the CV information, run the ingestion script inside the backend container:
```bash
docker-compose exec backend python ingest.py
```
*Note: Make sure your `cv.pdf` is located in the `cv/` directory in the root folder.*

### 5. Chat
Open [http://localhost:3000](http://localhost:3000) and start asking questions about the CV!

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py          # FastAPI Application & RAG Logic
│   ├── database.py      # SQLite Database Models
│   ├── ingest.py        # PDF Ingestion Script
│   ├── requirements.txt # Python Dependencies
│   └── Dockerfile       # Backend Docker Image (CPU Optimized)
├── frontend/
│   ├── app/             # Next.js Pages & Components
│   └── Dockerfile       # Frontend Docker Image
├── cv/
│   └── cv.pdf           # The Source Document
├── docker-compose.yml   # Service Orchestration
└── .env                 # API Keys (Not committed)
```

## 🐛 Troubleshooting

-   **OOM (Out Of Memory) during Ingestion**: Ensure your Docker has enough memory allocated (4GB+ recommended), though the CPU-optimization should mitigate this.
-   **500 Errors**: Check if your Groq API Key is valid and set in the `.env` file.
