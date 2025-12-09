import os
import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from operator import itemgetter

from dotenv import load_dotenv
from database import init_db, get_db, ChatHistory

load_dotenv()

app = FastAPI(title="RAG Chatbot API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB
init_db()

# Load RAG components
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables.")

current_dir = os.path.dirname(os.path.abspath(__file__))
persist_directory = os.path.join(current_dir, "chroma_db")

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
retriever = vector_store.as_retriever(search_kwargs={"k": 15})

llm = ChatGroq(
    temperature=0,
    model_name="llama-3.3-70b-versatile",
    groq_api_key=GROQ_API_KEY
)

# Custom Prompt
prompt_template = """
You are a highly skilled Technical Recruiter and Advocate for the candidate.
Your goal is to demonstrate the candidate's fitness for a role based on their CV and Projects.
CONTEXT FROM DATABASE: {context}

USER QUESTION: {question}

LANGUAGE INSTRUCTION: {language_instruction}

GUIDELINES:

GENERAL SUMMARY: If the user asks a broad question (e.g., "Who is Enes?", "What are his skills?"), you MUST summarize the ENTIRE portfolio. Do NOT focus on just one project. Construct a narrative that weaves together the CV, 'Medvice', 'RAG Chatbot', and other GitHub repos.

NO FORCED LOGIC: If a skill is NOT in the context, say "Bağlamda [Teknoloji] ile ilgili doğrudan bir kanıt bulunmuyor." Do NOT assume skills.

PROJECT DIVERSITY: Mention at least 2-3 different projects in your answer if relevant. Show breadth of experience.

STRICT CONTEXT: Only cite technologies explicitly listed in the files.

FINAL INSTRUCTION: {language_instruction}
"""
PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "question", "language_instruction"]
)

# define format_docs helper
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# LCEL Chain
qa_chain = (
    {
        "context": itemgetter("question") | retriever | format_docs,
        "question": itemgetter("question"),
        "language_instruction": itemgetter("language_instruction")
    }
    | PROMPT
    | llm
    | StrOutputParser()
)

class ChatRequest(BaseModel):
    message: str
    language: str = "tr" # Default to 'tr' if not provided, or 'en'

@app.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        query = request.message
        language = request.language
        
        # Set language instruction
        if language == "en":
            lang_instruction = "Answer strictly in ENGLISH."
        else:
            lang_instruction = "Cevabı kesinlikle TÜRKÇE ver."

        chain_input = {"question": query, "language_instruction": lang_instruction}
        
        answer = qa_chain.invoke(chain_input)

        # Save to DB
        chat_entry = ChatHistory(user_query=query, bot_response=answer)
        db.add(chat_entry)
        db.commit()
        db.refresh(chat_entry)

        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


@app.get("/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    history = db.query(ChatHistory).order_by(ChatHistory.timestamp.desc()).limit(limit).all()
    # Reverse to show chronological order if needed, or keep desc for "recent first"
    return [{"id": h.id, "user_query": h.user_query, "bot_response": h.bot_response, "timestamp": h.timestamp} for h in history]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
