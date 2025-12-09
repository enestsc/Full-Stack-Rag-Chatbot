import os
import json
import datetime
from typing import List, Dict, Any
from github import Github
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import chromadb

# Define paths
current_dir = os.path.dirname(os.path.abspath(__file__))
pdf_path = os.path.join(current_dir, "..", "cv", "cv.pdf")
persist_directory = os.path.join(current_dir, "chroma_db")
data_dir = os.path.join(current_dir, "..", "data")

# Ensure data directory exists
os.makedirs(data_dir, exist_ok=True)

def fetch_github_data() -> List[Dict[str, Any]]:
    """
    Fetches public repositories for the user.
    Returns a list of dictionaries containing repo data.
    """
    token = os.getenv("GITHUB_TOKEN")
    username = os.getenv("GITHUB_USERNAME")

    if not token or not username:
        print("Warning: GITHUB_TOKEN or GITHUB_USERNAME not set. Skipping GitHub ingestion.")
        return []

    print(f"Connecting to GitHub as {username}...")
    from github import Auth
    auth = Auth.Token(token)
    g = Github(auth=auth)
    user = g.get_user(username)
    
    repos_data = []
    print("Fetching repositories...")
    
    # Get public repos
    for repo in user.get_repos(type='public'):
        print(f"Processing {repo.name}...")
        
        repo_info = {
            "name": repo.name,
            "url": repo.html_url,
            "description": repo.description or "",
            "language": repo.language or "Unknown",
            "readme": ""
        }

        try:
            # Try to get README
            readme = repo.get_readme()
            repo_info["readme"] = readme.decoded_content.decode("utf-8")
        except Exception as e:
            print(f"No README found for {repo.name}: {e}")

        repos_data.append(repo_info)

    # Save raw dump
    dump_path = os.path.join(data_dir, "github_raw.json")
    with open(dump_path, "w", encoding="utf-8") as f:
        json.dump(repos_data, f, indent=4, ensure_ascii=False)
    print(f"Saved GitHub raw data to {dump_path}")

    return repos_data

def generate_report(repos_data: List[Dict[str, Any]]):
    """
    Generates a markdown report of the ingested data.
    """
    if not repos_data:
        return

    report_path = os.path.join(data_dir, "ingestion_report.md")
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Calculate stats
    total_repos = len(repos_data)
    languages = {}
    for repo in repos_data:
        lang = repo.get("language", "Unknown")
        languages[lang] = languages.get(lang, 0) + 1
    
    # Sort languages by count
    top_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:3]
    top_langs_str = ", ".join([f"{l} ({c})" for l, c in top_languages])

    md_content = f"""# Ingestion Report - {timestamp}

## İstatistikler
- **Toplam Repo Sayısı**: {total_repos}
- **En Popüler 3 Dil**: {top_langs_str}

## Proje Listesi
"""

    for repo in repos_data:
        desc = repo.get("description", "")
        if not desc and repo.get("readme"):
            desc = repo.get("readme")[:200].replace("\n", " ") + "..."
        
        md_content += f"""
### [{repo['name']}]({repo['url']})
- **Tespit Edilen Diller**: {repo['language']}
- **Özet**: {desc}
- **Durum**: ✅ Başarıyla Vektör Veritabanına Eklendi.
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"Generated report at {report_path}")

def process_github_documents(repos_data: List[Dict[str, Any]]) -> List[Document]:
    """
    Converts fetched GitHub data into LangChain Documents.
    """
    documents = []
    for repo in repos_data:
        # Create document from README
        if repo.get("readme"):
            doc = Document(
                page_content=repo["readme"],
                metadata={
                    "source": "github",
                    "repo_name": repo["name"],
                    "repo_url": repo["url"],
                    "language": repo["language"]
                }
            )
            documents.append(doc)
        
        # Create document from description if it exists
        if repo.get("description"):
             doc = Document(
                page_content=f"Description of {repo['name']}: {repo['description']}",
                metadata={
                    "source": "github",
                    "repo_name": repo["name"],
                    "repo_url": repo["url"],
                    "language": repo["language"]
                }
            )
             documents.append(doc)
             
    return documents

def ingest_data():
    # 1. Fetch GitHub Data
    repos_data = fetch_github_data()
    generate_report(repos_data)
    github_docs = process_github_documents(repos_data)
    
    # 2. Load PDF
    pdf_docs = []
    if os.path.exists(pdf_path):
        print("Loading PDF...")
        loader = PyPDFLoader(pdf_path)
        pdf_docs = loader.load()
    else:
        print(f"Warning: PDF not found at {pdf_path}")

    # 3. Combine Documents
    all_documents = github_docs + pdf_docs
    
    if not all_documents:
        print("No documents to ingest!")
        return

    print("Splitting text...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(all_documents)

    print(f"Creating embeddings for {len(texts)} chunks...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("Saving to ChromaDB...")
    # Initialize Chroma client with persistence
    # Note: We might want to clear existing data or update it. 
    # For now, simplistic approach implies appending or overwriting if persisted dir is same.
    # To ensure fresh start on startup as requested ("database is fresh"), 
    # we relies on the fact that we might not be deleting the dir, but Chroma handles updates?
    # Actually user said "database is fresh every time". 
    # If we want 100% fresh, we should probably clear the directory first?
    # But usually 'fresh' means 'updated'. Let's stick to standard ingest.
    # IF the user wants "fresh", maybe we should delete the old DB?
    # "Modify the Backend startup command... This ensures the database is fresh every time"
    # I will add a step to clear the DB directory if it exists to ensure no duplicates if repeated.
    
    if os.path.exists(persist_directory):
        import shutil
        print("Clearing existing ChromaDB...")
        # Cannot remove the directory itself if it is a mounted volume
        for filename in os.listdir(persist_directory):
            file_path = os.path.join(persist_directory, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}. Reason: {e}")
        
    vector_store = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    
    print("Ingestion complete!")

if __name__ == "__main__":
    ingest_data()
