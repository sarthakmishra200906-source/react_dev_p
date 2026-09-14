# backend/rag/dual_engine.py
"""
Cascading Dual-Engine Inference Module
Primary Engine: Google Cloud Gemini Flash
Secondary Engine: Local Ollama Llama 3 (http://localhost:11434)
Tertiary Fallback: Offline Deterministic Synthesizer

Catches HTTP 429 (rate limit), connection drops, and quota errors to silently
and instantly fall back to local Ollama Llama 3 using the pre-processed chunks,
HTML tables, and SVG diagrams.
"""

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional


class DualEngineClient:
    def __init__(
        self,
        ollama_base_url: str = "http://localhost:11434",
        ollama_model: str = "llama3",
        gemini_api_key: Optional[str] = None,
    ):
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", ollama_base_url).rstrip("/")
        self.ollama_model = os.getenv("OLLAMA_MODEL", ollama_model)
        raw_key = (
            gemini_api_key
            or os.getenv("GOOGLE_API_KEY")
            or os.getenv("GEMINI_API_KEY")
            or ""
        )
        self.gemini_api_key = raw_key.strip("[]'\"") if raw_key else None
        self.gemini_models = [
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-3.8-flash",
        ]

    def generate(
        self,
        query: str,
        retrieval_payload: Dict[str, Any],
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
    ) -> Dict[str, Any]:
        """
        Executes dual-engine cascading generation:
        1. Cloud Gemini Flash (Primary)
        2. Local Ollama Llama 3 (Fallback on 429 / connection error)
        3. Deterministic Synthesizer (Offline Fallback)
        """
        # Refresh API key from environment dynamically
        raw_key = (
            os.getenv("GOOGLE_API_KEY")
            or os.getenv("GEMINI_API_KEY")
            or self.gemini_api_key
            or ""
        )
        self.gemini_api_key = raw_key.strip("[]'\"") if raw_key else None

        # Build composite context from multi-vector payload
        prompt_context = self._build_context_prompt(query, retrieval_payload)

        # 1. Primary: Gemini Flash
        if self.gemini_api_key:
            for model_name in self.gemini_models:
                try:
                    res_text = self._call_gemini_api(model_name, prompt_context, system_instruction)
                    if res_text and res_text.strip():
                        return {
                            "engine": "gemini",
                            "model": model_name,
                            "response": res_text.strip(),
                            "status": "success",
                        }
                except Exception as e:
                    err_str = str(e)
                    print(f"[DualEngine] Gemini ({model_name}) error: {err_str[:120]} -> Failing over")
                    if "429" in err_str or "quota" in err_str.lower() or "401" in err_str or "403" in err_str or "invalid" in err_str.lower() or "key" in err_str.lower():
                        print(f"[DualEngine] Gemini auth/quota error -> Instant silent failover to Local Ollama")
                        break

        # 2. Secondary Fallback: Local Ollama Llama 3
        try:
            print(f"[DualEngine] Routing to Local Ollama ({self.ollama_model})...")
            ollama_res = self._call_ollama_api(prompt_context, system_instruction)
            if ollama_res and ollama_res.strip():
                return {
                    "engine": "ollama",
                    "model": self.ollama_model,
                    "response": ollama_res.strip(),
                    "status": "success",
                }
        except Exception as e:
            print(f"[DualEngine] Local Ollama unavailable: {e}")

        # 3. Tertiary Fallback: Offline Synthesis
        offline_res = self._offline_synthesizer(query, retrieval_payload)
        return {
            "engine": "offline_synthesizer",
            "model": "rule-based",
            "response": offline_res,
            "status": "fallback",
        }

    def _build_context_prompt(self, query: str, payload: Dict[str, Any]) -> str:
        """Assembles multi-vector chunks, HTML tables, and SVG diagrams into grounded context."""
        parts = [f"=== USER QUERY: {query} ==="]

        # Top 2 expanded queries
        expanded = payload.get("top_2_expanded_queries", [])
        if expanded:
            parts.append("=== SEARCH PERSPECTIVES / EXPANDED QUERIES ===")
            for i, exp in enumerate(expanded, 1):
                parts.append(f"{i}. {exp}")

        # Top 4 optimal chunks with HTML tables and SVG descriptions
        chunks = payload.get("top_4_chunks", [])
        if chunks:
            parts.append("\n=== RETRIEVED EVIDENCE & SOURCE MATERIAL ===")
            for idx, c in enumerate(chunks, 1):
                meta = c.get("metadata", {})
                source = meta.get("source", "Document")
                raw = c.get("raw_content", "")
                parts.append(f"--- Chunk {idx} (Source: {source}) ---")
                parts.append(raw)

                # Unpack HTML tables
                tables = c.get("tables_html", [])
                for t_idx, tbl in enumerate(tables, 1):
                    parts.append(f"[Table {t_idx} (HTML Layout)]:\n{tbl}")

                # Unpack SVG diagrams
                svgs = c.get("images_svg", [])
                for s_idx, svg in enumerate(svgs, 1):
                    parts.append(f"[Diagram {s_idx} (SVG Vector Structure)]:\n{svg}")

        # Recent chat history
        history = payload.get("recent_chat_history", [])
        if history:
            parts.append("\n=== RECENT CONVERSATION HISTORY ===")
            for h in history:
                role = h.get("role") or h.get("sender") or "user"
                content = h.get("content") or h.get("text") or ""
                parts.append(f"{role.capitalize()}: {content}")

        parts.append(
            "\n=== INSTRUCTIONS ===\n"
            "Synthesize an accurate, high-yield academic response answering the user query directly.\n"
            "Base your answer strictly on the provided evidence, tables, and diagrams."
        )
        return "\n".join(parts)

    def _call_gemini_api(
        self,
        model_name: str,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> str:
        """Calls Google Gemini REST endpoint directly without external heavy SDKs."""
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_name}:generateContent?key={self.gemini_api_key}"
        )
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 3000},
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = response.read().decode("utf-8")
                data = json.loads(res_body)
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            if e.code in (401, 403) or "API_KEY_INVALID" in err_body:
                raise PermissionError("INVALID_GEMINI_KEY")
            raise e
        return ""

    def _call_ollama_api(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Calls Local Ollama daemon via REST API."""
        endpoint = f"{self.ollama_base_url}/api/generate"
        payload = {
            "model": self.ollama_model,
            "prompt": prompt[:4000],  # Bounded prompt for fast local CPU speed
            "system": system_instruction or "You are an expert AI study assistant. Answer clearly and concisely.",
            "stream": False,
            "options": {"temperature": 0.2, "num_predict": 300},
        }
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            return data.get("response", "")

    def _offline_synthesizer(self, query: str, payload: Dict[str, Any]) -> str:
        """Dynamic grounded synthesis when both Gemini and Ollama are unavailable."""
        chunks = payload.get("top_4_chunks", [])
        all_text = "\n\n".join(c.get("raw_content", "") for c in chunks)
        
        equations = re.findall(r"[^\n]+(?:%|=|kcal|efficiency|reaction|heat|formula|voltage)[^\n]+", all_text, re.IGNORECASE)
        theorems = re.findall(r"[^\n]+(?:defined as|refers to|consists of|types of|impact|classification|law|deforestation|erosion|pesticide)[^\n]+", all_text, re.IGNORECASE)

        eq_lines = [f"- {e.strip()}" for e in equations if len(e.strip()) > 10][:5]
        th_lines = [f"- {t.strip()}" for t in theorems if len(t.strip()) > 10][:5]

        th_output = "\n".join(th_lines) if th_lines else "- Grounded domain principles extracted from retrieved context."
        eq_output = "\n".join(eq_lines) if eq_lines else "- Mathematical and empirical formulations extracted from retrieved context."

        return f"""### Retrieved Academic Synthesis: {query}
Synthesized directly from retrieved vector chunks:

**Core Theorems & Conceptual Principles:**
{th_output}

**Mathematical & Empirical Formulations:**
{eq_output}
"""


# Global singleton
dual_engine = DualEngineClient()
