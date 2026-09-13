# backend/main.py
import json
import os
import re
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from rag.project1_rag import Project1RAG, rag_pipeline

app = FastAPI(title="Unified RAG API", version="1.0.0")

# Base directory paths
BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

# Enable CORS for React frontend (Vite port 5173, local IP, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Unified RAG API Server is running.",
        "endpoints": {
            "generate_report": "POST /api/generate-report",
            "clear_session": "POST /api/clear-session",
            "health": "GET /api/health",
        },
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "pipeline": "Project1RAG active"}


@app.post("/api/clear-session")
async def clear_session():
    """Clears all stored user session files and uploaded PDFs in backend/docs to free space."""
    try:
        if DOCS_DIR.exists():
            for file_path in DOCS_DIR.glob("*"):
                if file_path.is_file():
                    file_path.unlink(missing_ok=True)
        return {"status": "success", "message": "Backend docs and user session data cleared successfully."}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.post("/api/generate-report")
async def generate_report(
    prompt: str = Form(""),
    text_content: str = Form(""),
    chat_history: Optional[str] = Form(None),
    pdf: Optional[UploadFile] = File(None),
):
    try:
        # 1. Save user's tasks & notes into backend/docs/usert.txt
        usert_file = DOCS_DIR / "usert.txt"
        with open(usert_file, "w", encoding="utf-8") as f:
            f.write(text_content.strip() + "\n")

        # 2. If PDF is uploaded, save it into backend/docs/
        pdf_bytes = None
        if pdf:
            pdf_bytes = await pdf.read()
            clean_filename = re.sub(r"[^\w\.-]", "_", pdf.filename or "uploaded_doc.pdf")
            saved_pdf_path = DOCS_DIR / clean_filename
            with open(saved_pdf_path, "wb") as f:
                f.write(pdf_bytes)

        # 3. Parse conversation history
        parsed_history = []
        if chat_history:
            try:
                parsed_history = json.loads(chat_history)
            except Exception:
                parsed_history = []

        # 4. Execute unified RAG pipeline
        output_text = rag_pipeline.run(
            prompt=prompt,
            text_content=text_content,
            pdf_bytes=pdf_bytes,
            chat_history=parsed_history,
        )

        return {"status": "success", "result": output_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
