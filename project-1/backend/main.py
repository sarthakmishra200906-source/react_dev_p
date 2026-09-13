# backend/main.py
import asyncio
import datetime
import json
import os
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from rag.project1_rag import Project1RAG, rag_pipeline

app = FastAPI(title="Unified Multi-Modal RAG API", version="2.0.0")

# Base directory paths
BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)
NOTES_EXPORT_DIR = BASE_DIR / "notes_export"
NOTES_EXPORT_DIR.mkdir(parents=True, exist_ok=True)

# In-Memory PDF & Session Cache (Capped at 15,000 characters)
pdf_session_cache: Dict[str, str] = {
    "text": "",
    "filename": "",
    "updated_at": "",
}

# Optional Single-User Access Code Guard
ACCESS_CODE = os.getenv("ACCESS_CODE", "").strip()

@app.middleware("http")
async def security_access_code_middleware(request: Request, call_next):
    """Protects /api endpoints with x-access-code if configured in .env."""
    if ACCESS_CODE and request.method != "OPTIONS":
        if request.url.path.startswith("/api/") and request.url.path not in {"/api/health"}:
            client_code = request.headers.get("x-access-code", "").strip()
            if client_code != ACCESS_CODE:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access Forbidden: Invalid or missing x-access-code header."},
                )
    return await call_next(request)

# Enable CORS for React frontend (Vite port 5173, local WiFi IP, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def export_markdown_notes(text_content: str):
    """
    Local Markdown Desktop Syncing:
    Persists structured notes and tasks directly to notes_export/ for Obsidian & VS Code.
    """
    try:
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        export_file = NOTES_EXPORT_DIR / "study_workspace_notes.md"
        
        md_content = f"""---
title: Study Workspace & Revision Notes
updated: {now_str}
tags:
  - study-plan
  - dbms
  - ai-rag
---

# 📚 Study Workspace Notes

*Last synchronized from AI Assistant on {now_str}*

{text_content.strip()}

---
*Auto-synced for Obsidian, VS Code, and Markdown readers.*
"""
        with open(export_file, "w", encoding="utf-8") as f:
            f.write(md_content)
    except Exception as e:
        print(f"Failed to export markdown notes: {e}")


@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Unified Multi-Modal RAG API Server is running.",
        "endpoints": {
            "generate_report": "POST /api/generate-report",
            "generate_flowchart": "POST /api/generate-flowchart",
            "generate_quiz": "POST /api/generate-quiz",
            "generate_schedule": "POST /api/generate-schedule",
            "compare_models": "POST /api/compare-models",
            "document_chat": "POST /api/document-chat",
            "clear_session": "POST /api/clear-session",
            "health": "GET /api/health",
        },
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "pipeline": "Project1RAG active",
        "has_cached_pdf": bool(pdf_session_cache["text"]),
        "cached_chars": len(pdf_session_cache["text"]),
    }


@app.post("/api/clear-session")
async def clear_session():
    """Clears all stored user session files, in-memory cache, and uploaded PDFs."""
    try:
        if DOCS_DIR.exists():
            for file_path in DOCS_DIR.glob("*"):
                if file_path.is_file():
                    file_path.unlink(missing_ok=True)
        pdf_session_cache["text"] = ""
        pdf_session_cache["filename"] = ""
        pdf_session_cache["updated_at"] = ""
        return {"status": "success", "message": "Backend docs and session cache cleared successfully."}
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
        # 1. Save user's tasks & notes into backend/docs/usert.txt and notes_export/
        usert_file = DOCS_DIR / "usert.txt"
        with open(usert_file, "w", encoding="utf-8") as f:
            f.write(text_content.strip() + "\n")
        export_markdown_notes(text_content)

        # 2. If PDF is uploaded, save & extract into 15,000-char session memory
        pdf_bytes = None
        if pdf:
            pdf_bytes = await pdf.read()
            clean_filename = re.sub(r"[^\w\.-]", "_", pdf.filename or "uploaded_doc.pdf")
            saved_pdf_path = DOCS_DIR / clean_filename
            with open(saved_pdf_path, "wb") as f:
                f.write(pdf_bytes)

            extracted = rag_pipeline._extract_multimodal_pdf(pdf_bytes)
            # Cap at 15,000 characters for memory safety
            pdf_session_cache["text"] = extracted[:15000]
            pdf_session_cache["filename"] = clean_filename
            pdf_session_cache["updated_at"] = datetime.datetime.now().isoformat()

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


@app.post("/api/generate-flowchart")
async def generate_flowchart(text_content: str = Form("")):
    """Generates study dependency graph nodes and edges for Canvas/SVG visualization."""
    try:
        data = rag_pipeline.generate_flowchart_data(text_content)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-quiz")
async def generate_quiz(text_content: str = Form("")):
    """Generates 5 3D flip flashcards and 3 self-grading MCQs."""
    try:
        data = rag_pipeline.generate_quiz_data(text_content)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-schedule")
async def generate_schedule(text_content: str = Form("")):
    """Generates study sprints and RFC 5545 iCal (.ics) calendar payload."""
    try:
        schedule = rag_pipeline.generate_schedule_data(text_content)
        
        # Build standard RFC 5545 iCalendar content
        now = datetime.datetime.now()
        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//AI Study Assistant//RAG Study Scheduler//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
        ]

        for s in schedule:
            dt_start = now.strftime("%Y%m%dT090000")
            dt_end = now.strftime("%Y%m%dT103000")
            ics_lines.extend([
                "BEGIN:VEVENT",
                f"UID:{s['id']}-{int(time.time())}@aistudy.local",
                f"DTSTAMP:{now.strftime('%Y%m%dT%H%M%SZ')}",
                f"DTSTART:{dt_start}",
                f"DTEND:{dt_end}",
                f"SUMMARY:{s['title']}",
                f"DESCRIPTION:{s['description']}",
                "STATUS:CONFIRMED",
                "END:VEVENT",
            ])

        ics_lines.append("END:VCALENDAR")
        ics_content = "\r\n".join(ics_lines)

        return {
            "status": "success",
            "schedule": schedule,
            "ics_content": ics_content,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compare-models")
async def compare_models(
    prompt: str = Form(""),
    text_content: str = Form(""),
):
    """
    Parallel Cloud (Gemini) vs. Local (Ollama) execution:
    Uses asyncio.gather(return_exceptions=True) to guarantee non-blocking resilience.
    """
    context = text_content or "General Study Planning"
    user_q = prompt or "Provide a 5-line prioritized revision strategy."

    async def call_gemini():
        t0 = time.time()
        try:
            full_prompt = (
                f"Context:\n{context}\n\nQuestion: {user_q}\n"
                f"Provide exactly 5 clear, numbered study steps."
            )
            # Run in worker thread so sync urlopen doesn't block event loop
            res = await asyncio.to_thread(
                rag_pipeline._call_gemini_api,
                rag_pipeline.gemini_models[0],
                full_prompt
            )
            elapsed_ms = int((time.time() - t0) * 1000)
            if res:
                formatted = rag_pipeline._clean_and_enforce_lines(res, 5)
                return {"model": "Google Gemini 3.6 Flash (Cloud)", "text": formatted, "latency_ms": elapsed_ms, "status": "success"}
            return {"model": "Google Gemini 3.6 Flash (Cloud)", "text": "No response returned.", "latency_ms": elapsed_ms, "status": "empty"}
        except Exception as e:
            elapsed_ms = int((time.time() - t0) * 1000)
            return {"model": "Google Gemini 3.6 Flash (Cloud)", "text": f"Cloud API unavailable: {str(e)}", "latency_ms": elapsed_ms, "status": "error"}

    async def call_ollama():
        t0 = time.time()
        try:
            full_prompt = (
                f"Context:\n{context}\n\nQuestion: {user_q}\n"
                f"Provide exactly 5 clear, numbered study steps."
            )
            res = await asyncio.to_thread(rag_pipeline._call_ollama_api, full_prompt)
            elapsed_ms = int((time.time() - t0) * 1000)
            if res:
                formatted = rag_pipeline._clean_and_enforce_lines(res, 5)
                return {"model": "Ollama Llama 3 (Local)", "text": formatted, "latency_ms": elapsed_ms, "status": "success"}
            return {"model": "Ollama Llama 3 (Local)", "text": "Local model returned empty response.", "latency_ms": elapsed_ms, "status": "empty"}
        except Exception as e:
            elapsed_ms = int((time.time() - t0) * 1000)
            return {"model": "Ollama Llama 3 (Local)", "text": f"Ollama local error: {str(e)}", "latency_ms": elapsed_ms, "status": "error"}

    # Execute concurrently
    results = await asyncio.gather(call_gemini(), call_ollama(), return_exceptions=True)
    
    gemini_out = results[0] if not isinstance(results[0], Exception) else {
        "model": "Google Gemini 3.6 Flash (Cloud)",
        "text": f"Execution error: {str(results[0])}",
        "latency_ms": 0,
        "status": "error"
    }

    ollama_out = results[1] if not isinstance(results[1], Exception) else {
        "model": "Ollama Llama 3 (Local)",
        "text": f"Execution error: {str(results[1])}",
        "latency_ms": 0,
        "status": "error"
    }

    return {
        "status": "success",
        "comparison": [gemini_out, ollama_out],
    }


@app.post("/api/document-chat")
async def document_chat(
    message: str = Form(""),
    chat_history: Optional[str] = Form(None),
):
    """
    RAG Document Chat Drawer endpoint:
    Queries cached in-memory PDF text without requiring raw PDF upload on each message.
    """
    try:
        parsed_history = []
        if chat_history:
            try:
                parsed_history = json.loads(chat_history)
            except Exception:
                parsed_history = []

        usert_file = DOCS_DIR / "usert.txt"
        workspace_context = ""
        if usert_file.exists():
            with open(usert_file, "r", encoding="utf-8") as f:
                workspace_context = f.read()

        cached_text = pdf_session_cache["text"]
        answer = await asyncio.to_thread(
            rag_pipeline.query_document_chat,
            cached_text,
            message,
            workspace_context,
            parsed_history,
        )

        return {
            "status": "success",
            "reply": answer,
            "has_document": bool(cached_text),
            "doc_name": pdf_session_cache["filename"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
