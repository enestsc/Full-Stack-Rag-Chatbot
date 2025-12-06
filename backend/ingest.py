import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
import chromadb

# Define paths
current_dir = os.path.dirname(os.path.abspath(__file__))
pdf_path = os.path.join(current_dir, "..", "cv", "cv.pdf")
persist_directory = os.path.join(current_dir, "chroma_db")

def ingest_data():
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return

    print("Loading PDF...")
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    print("Splitting text...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)

    print(f"Creating embeddings for {len(texts)} chunks...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("Saving to ChromaDB...")
    # Initialize Chroma client with persistence
    vector_store = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    
    print("Ingestion complete!")

if __name__ == "__main__":
    ingest_data()
