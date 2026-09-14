# backend/rag/multi_query_retriever.py
"""
Multi-Query Expansion & Multi-Vector Retrieval Engine
Integrates patterns from 10_multi_query_retrieval.py:
1. Generates 5 semantic query variations using structured outputs / schema.
2. Performs ensemble multi-vector retrieval with cosine similarity.
3. Enforces exact retrieval payload:
   - Top 2 expanded queries
   - Top 4 optimal chunks (with HTML tables & SVG diagrams unpacked)
   - Recent chat history turns
"""

import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple
from rag.multi_vector_store import MultiVectorDocument, MultiVectorStore, vector_store


class QueryVariationsResponse:
    """Pydantic-compatible structured schema for 5 semantic query variations."""
    def __init__(self, variations: List[str]):
        self.variations = variations

    def to_dict(self) -> Dict[str, Any]:
        return {"variations": self.variations}


class MultiQueryRetriever:
    """
    Orchestrates query expansion, multi-vector retrieval, and payload assembly.
    """

    def __init__(self, store: Optional[MultiVectorStore] = None):
        self.store = store or vector_store

    def generate_query_variations(
        self,
        base_query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        llm_caller: Optional[Any] = None,
    ) -> List[str]:
        """
        Generates 5 semantic query variations to overcome vocabulary mismatch.
        Uses structured generation with fallback to deterministic heuristic variations.
        """
        clean_q = base_query.strip()
        if not clean_q:
            return ["Overview of active study materials and tasks"]

        # If LLM caller provided, try structured output
        if llm_caller and callable(llm_caller):
            prompt = (
                f"You are an AI language model assistant. Your task is to generate 5 different "
                f"versions of the given user question to retrieve relevant documents from a vector database. "
                f"By generating multiple perspectives on the user question, your goal is to help the user "
                f"overcome some of the limitations of distance-based similarity search.\n\n"
                f"Original Question: {clean_q}\n\n"
                f"Provide your response as a JSON object with a 'variations' array containing exactly 5 string variations:\n"
                f"{{\"variations\": [\"v1\", \"v2\", \"v3\", \"v4\", \"v5\"]}}"
            )
            try:
                raw = llm_caller(prompt)
                match = re.search(r"\{.*\}", raw, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    var_list = parsed.get("variations", [])
                    if isinstance(var_list, list) and len(var_list) >= 3:
                        return [v.strip() for v in var_list[:5] if v.strip()]
            except Exception as e:
                print(f"[MultiQueryRetriever] LLM query expansion fallback: {e}")

        # Deterministic semantic variations fallback
        variations = [
            clean_q,
            f"Explain key concepts, definitions, and architecture of {clean_q}",
            f"Step-by-step breakdown and examples for {clean_q}",
            f"Core principles, summary tables, and practical applications of {clean_q}",
            f"Common exam questions, algorithms, and revision notes on {clean_q}",
        ]
        return variations[:5]

    def retrieve_payload(
        self,
        base_query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        llm_caller: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Enforces the precise retrieval payload:
        - Top 2 expanded queries
        - Top 4 optimal chunks (with HTML tables + SVG diagrams)
        - Recent chat history turns
        """
        # 1. Generate 5 semantic query variations
        all_variations = self.generate_query_variations(base_query, chat_history, llm_caller)
        
        # Select Top 2 expanded variations (excluding the exact base query if possible)
        expanded_candidates = [v for v in all_variations if v.lower() != base_query.lower()]
        top_2_expanded = expanded_candidates[:2] if len(expanded_candidates) >= 2 else all_variations[:2]

        # 2. Ensemble retrieval: gather candidates across all variations
        candidate_docs: Dict[str, Tuple[MultiVectorDocument, float]] = {}
        
        queries_to_run = [base_query] + top_2_expanded
        for q in queries_to_run:
            results = self.store.search(q, top_k=4, only_active=True)
            for doc, score in results:
                if doc.doc_id not in candidate_docs or score > candidate_docs[doc.doc_id][1]:
                    candidate_docs[doc.doc_id] = (doc, score)

        # 3. Sort by highest score and take Top 4 optimal chunks
        sorted_candidates = sorted(candidate_docs.values(), key=lambda x: x[1], reverse=True)
        top_4_optimal_docs = [doc for doc, _ in sorted_candidates[:4]]

        # If vector store is empty, provide default contextual chunk
        if not top_4_optimal_docs:
            default_doc = MultiVectorDocument(
                doc_id="system_default",
                resource_id="workspace_state",
                raw_content="No active documents indexed. Using general study intelligence workspace context.",
                summary="Default workspace context.",
            )
            top_4_optimal_docs = [default_doc]

        # 4. Extract recent chat history turns (last 4 messages)
        recent_history = (chat_history or [])[-4:]

        return {
            "base_query": base_query,
            "top_2_expanded_queries": top_2_expanded,
            "top_4_chunks": [doc.to_dict() for doc in top_4_optimal_docs],
            "recent_chat_history": recent_history,
        }


# Global singleton
multi_query_retriever = MultiQueryRetriever()
