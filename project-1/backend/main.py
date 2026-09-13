# backend/main.py
import asyncio
import datetime
import json
import os
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
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


# --- MULTI-RESOURCE HUB (Up to 50 Items) & DEEP RESEARCH MODE ---
resources_store: List[Dict[str, Any]] = []


@app.get("/api/resources")
async def get_resources():
    """Returns all stored resources (capped at 50)."""
    return {
        "status": "success",
        "total": len(resources_store),
        "limit": 50,
        "resources": resources_store,
    }


@app.post("/api/resources/upload")
async def upload_resource(
    file: Optional[UploadFile] = File(None),
    title: str = Form(""),
    resource_type: str = Form("text"),  # 'pdf' | 'text' | 'link'
    content: str = Form(""),
    url: str = Form(""),
):
    """Uploads a resource (PDF, text snippet, or research link) up to the 50-item limit."""
    try:
        if len(resources_store) >= 50:
            raise HTTPException(status_code=400, detail="Resource limit reached (maximum 50 resources allowed).")

        item_id = f"res-{int(time.time() * 1000)}"
        extracted_text = ""
        item_title = title.strip() or "Untitled Resource"

        if file:
            file_bytes = await file.read()
            clean_name = re.sub(r"[^\w\.-]", "_", file.filename or "uploaded.pdf")
            item_title = title.strip() or clean_name
            resource_type = "pdf" if file.filename.lower().endswith(".pdf") else "file"
            
            # Save file locally
            file_path = DOCS_DIR / f"{item_id}_{clean_name}"
            with open(file_path, "wb") as f:
                f.write(file_bytes)

            if resource_type == "pdf":
                extracted_text = rag_pipeline._extract_multimodal_pdf(file_bytes)
            else:
                extracted_text = file_bytes.decode("utf-8", errors="ignore")[:10000]
        elif resource_type == "link":
            item_title = title.strip() or url.strip()
            extracted_text = f"Reference Link: {url.strip()}\nSummary/Notes: {content.strip()}"
        else:
            extracted_text = content.strip()

        resource_entry = {
            "id": item_id,
            "title": item_title,
            "type": resource_type,
            "file_path": str(file_path) if file else "",
            "url": url.strip() if resource_type == "link" else "",
            "preview": extracted_text[:300],
            "text": extracted_text[:15000],
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        }

        resources_store.insert(0, resource_entry)

        return {
            "status": "success",
            "message": "Resource added successfully.",
            "resource": resource_entry,
            "total": len(resources_store),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/resources/{resource_id}")
async def delete_resource(resource_id: str):
    """
    Deletes a resource from the in-memory library and actively purges
    corresponding physical disk files from backend/docs/ to prevent ghost file buildup.
    """
    global resources_store, pdf_session_cache
    target_res = next((r for r in resources_store if r.get("id") == resource_id), None)

    # 1. Actively remove physical files from backend/docs/
    deleted_files = []
    try:
        if target_res and target_res.get("file_path"):
            recorded_p = Path(target_res["file_path"])
            if recorded_p.exists() and recorded_p.is_file():
                recorded_p.unlink(missing_ok=True)
                deleted_files.append(recorded_p.name)

        # Catch any file starting with resource_id in DOCS_DIR
        for disk_file in DOCS_DIR.glob(f"{resource_id}*"):
            if disk_file.is_file():
                disk_file.unlink(missing_ok=True)
                deleted_files.append(disk_file.name)
    except Exception as e:
        print(f"[Cleanup Warning] Error deleting disk file for resource {resource_id}: {e}")

    # 2. Clear active in-memory PDF cache if matching
    if target_res and target_res.get("title") and target_res["title"] == pdf_session_cache.get("filename"):
        pdf_session_cache["text"] = ""
        pdf_session_cache["filename"] = ""
        pdf_session_cache["updated_at"] = ""

    # 3. Remove from memory store
    initial_len = len(resources_store)
    resources_store = [r for r in resources_store if r.get("id") != resource_id]
    if len(resources_store) == initial_len and not deleted_files:
        raise HTTPException(status_code=404, detail="Resource not found.")

    return {
        "status": "success",
        "message": f"Resource deleted and {len(deleted_files)} disk file(s) permanently purged from backend/docs/.",
        "deleted_disk_files": deleted_files,
        "remaining": len(resources_store),
    }


@app.post("/api/research")
async def deep_research(
    query: str = Form(""),
    selected_resource_ids: Optional[str] = Form(None),
):
    """
    Gemini-Style Deep Research Mode:
    Executes deep academic synthesis across all stored resources without line-count limits.
    """
    try:
        clean_query = query.strip()
        if not clean_query:
            raise HTTPException(status_code=400, detail="Research query cannot be empty.")

        # Gather context from all or selected resources
        selected_ids = json.loads(selected_resource_ids) if selected_resource_ids else []
        contexts = []

        # 1. Include usert.txt workspace context
        usert_file = DOCS_DIR / "usert.txt"
        if usert_file.exists():
            with open(usert_file, "r", encoding="utf-8") as f:
                contexts.append(f"=== WORKSPACE NOTES ===\n{f.read()}")

        # 2. Include multi-resources
        for res in resources_store:
            if not selected_ids or res.get("id") in selected_ids:
                contexts.append(f"=== RESOURCE: {res.get('title')} ({res.get('type')}) ===\n{res.get('text', '')[:4000]}")

        combined_context = "\n\n---\n\n".join(contexts)

        # Run deep research
        research_result = await asyncio.to_thread(
            rag_pipeline.run_deep_research,
            clean_query,
            combined_context,
        )

        return {
            "status": "success",
            "query": clean_query,
            "research_report": research_result,
            "resources_consulted": len(resources_store),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/prompt")
async def execute_prompt(request: Request):
    """
    Direct prompt execution endpoint for AI Note Summaries and AI Task Breakdown.
    Accepts JSON body or Form data.
    """
    try:
        content_type = request.headers.get("content-type", "")
        prompt = ""
        text_content = ""
        if "application/json" in content_type:
            body = await request.json()
            prompt = body.get("prompt", "")
            text_content = body.get("text_content", "")
        else:
            form = await request.form()
            prompt = form.get("prompt", "")
            text_content = form.get("text_content", "")

        usert_file = DOCS_DIR / "usert.txt"
        if not text_content and usert_file.exists():
            with open(usert_file, "r", encoding="utf-8") as f:
                text_content = f.read()

        result = await asyncio.to_thread(
            rag_pipeline.run,
            prompt=prompt,
            text_content=text_content,
        )
        return {"status": "success", "rag_answer": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
