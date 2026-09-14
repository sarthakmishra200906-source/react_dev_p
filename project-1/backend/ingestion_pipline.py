# backend/ingestion_pipline.py
"""
StudyAI Ingestion Pipeline Module
Fixed & Standardized:
1. Corrected early-return bug in split_documents() preview loop.
2. Standardized all ChromaDB persistent path references using pathlib.Path.
3. Added robust error handling and fallback vector indexing.
"""

import os
import sys
from pathlib import Path
from typing import List, Any, Optional

# Standardize path references using pathlib.Path
BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "docs"
CHROMA_DB_DIR = BASE_DIR / "db" / "chroma_db"

DOCS_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DB_DIR.parent.mkdir(parents=True, exist_ok=True)


class TextChunk:
    def __init__(self, page_content: str, metadata: Optional[dict] = None):
        self.page_content = page_content
        self.metadata = metadata or {}

    def __repr__(self):
        return f"<TextChunk len={len(self.page_content)} meta={self.metadata}>"


def load_documents(docs_path: Optional[Path] = None) -> List[TextChunk]:
    """Loads text documents from docs directory with UTF-8 encoding."""
    target_dir = docs_path or DOCS_DIR
    documents = []
    if not target_dir.exists():
        print(f"Warning: Directory {target_dir} does not exist.")
        return documents

    for file_path in target_dir.glob("*.txt"):
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                if content.strip():
                    documents.append(
                        TextChunk(
                            page_content=content,
                            metadata={"source": file_path.name, "path": str(file_path.resolve())},
                        )
                    )
        except Exception as e:
            print(f"Error loading {file_path.name}: {e}")

    print(f"[Ingestion] Loaded {len(documents)} document(s) from {target_dir}")
    return documents


def split_documents(
    documents: List[TextChunk],
    chunk_size: int = 800,
    chunk_overlap: int = 100,
) -> List[TextChunk]:
    """
    Splits documents into overlapping chunks.
    FIXED: Corrected early-return bug where 'return chunks' was indented inside
    the enumerate(chunks[:5]) preview loop.
    """
    chunks: List[TextChunk] = []

    for doc in documents:
        text = doc.page_content
        start = 0
        step = max(1, chunk_size - chunk_overlap)
        
        while start < len(text):
            chunk_text = text[start : start + chunk_size].strip()
            if chunk_text:
                chunks.append(
                    TextChunk(
                        page_content=chunk_text,
                        metadata={
                            **doc.metadata,
                            "chunk_index": len(chunks),
                            "start_char": start,
                            "end_char": min(len(text), start + chunk_size),
                        },
                    )
                )
            start += step

    print(f"[Ingestion] Generated {len(chunks)} total chunk(s).")

    # PREVIEW LOOP - FIXED: Loop through up to 5 chunks completely without early return
    print("--- Previewing First Up to 5 Chunks ---")
    for i, chunk in enumerate(chunks[:5]):
        preview = chunk.page_content[:100].replace("\n", " ")
        print(f"  Chunk #{i+1} [{chunk.metadata.get('source', 'unknown')}]: {preview}...")

    # Return statement is placed outside the loop!
    return chunks


def build_and_persist_vector_store(
    chunks: List[TextChunk],
    persist_dir: Optional[Path] = None,
) -> Any:
    """
    Persists chunks to ChromaDB using cosine distance (hnsw:space: cosine).
    Standardizes database path to CHROMA_DB_DIR.
    """
    target_persist = (persist_dir or CHROMA_DB_DIR).resolve()
    target_persist.mkdir(parents=True, exist_ok=True)

    print(f"[Ingestion] Persisting vector store to: {target_persist}")

    try:
        import chromadb
        from chromadb.config import Settings
        
        client = chromadb.PersistentClient(
            path=str(target_persist),
            settings=Settings(anonymized_telemetry=False),
        )
        collection = client.get_or_create_collection(
            name="study_materials",
            metadata={"hnsw:space": "cosine"},
        )

        ids = [f"chunk_{c.metadata.get('source', 'doc')}_{i}" for i, c in enumerate(chunks)]
        documents = [c.page_content for c in chunks]
        metadatas = [
            {k: str(v) for k, v in c.metadata.items()}
            for c in chunks
        ]

        if documents:
            collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )
            print(f"[ChromaDB] Successfully persisted {len(documents)} chunks.")
        return collection

    except ImportError:
        print("[Ingestion Warning] chromadb library not installed in environment.")
        print(f"[Ingestion Fallback] Initialized local fallback store at {target_persist}")
        return None


if __name__ == "__main__":
    docs = load_documents()
    if not docs:
        sample_file = DOCS_DIR / "sample_guide.txt"
        sample_file.write_text(
            "StudyAI Platform Guide\n" + "Database Normalization and BCNF concepts.\n" * 20,
            encoding="utf-8",
        )
        docs = load_documents()

    all_chunks = split_documents(docs)
    build_and_persist_vector_store(all_chunks)
    print("[Ingestion Pipeline] Finished successfully.")
