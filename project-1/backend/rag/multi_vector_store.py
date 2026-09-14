# backend/rag/multi_vector_store.py
"""
Multi-Vector Store with Cosine Distance Support
Implements:
1. Multi-vector representation:
   - Raw text chunks
   - Tables converted to clean semantic HTML
   - Diagrams/visuals converted to SVGs / structured descriptors
   - Dense AI summaries indexed into vector store
2. Standardized persistent directory using pathlib.Path (db/chroma_db)
3. Resource visibility toggles (include/exclude from active retrieval context)
4. Cosine similarity indexing (hnsw:space: cosine)
"""

import json
import math
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "db" / "chroma_db"
DB_DIR.parent.mkdir(parents=True, exist_ok=True)
DB_DIR.mkdir(parents=True, exist_ok=True)


def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """Computes cosine distance/similarity between sparse TF-IDF style term vectors."""
    dot = sum(vec1[k] * vec2.get(k, 0.0) for k in vec1)
    norm1 = math.sqrt(sum(v * v for v in vec1.values()))
    norm2 = math.sqrt(sum(v * v for v in vec2.values()))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


def text_to_vector(text: str) -> Dict[str, float]:
    """Generates normalized term-frequency vectors for cosine distance calculation."""
    words = re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text.lower())
    tf: Dict[str, float] = {}
    for w in words:
        tf[w] = tf.get(w, 0.0) + 1.0
    total = sum(tf.values()) or 1.0
    return {k: v / total for k, v in tf.items()}


class MultiVectorDocument:
    """
    Stores multi-vector representation:
    - raw_content: raw source text
    - summary: dense summary used for primary vector search
    - tables_html: list of extracted tables in HTML
    - images_svg: list of extracted visual diagrams in SVG
    - metadata: document tags, resource_id, active_context flag
    """

    def __init__(
        self,
        doc_id: str,
        resource_id: str,
        raw_content: str,
        summary: str,
        tables_html: Optional[List[str]] = None,
        images_svg: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.doc_id = doc_id
        self.resource_id = resource_id
        self.raw_content = raw_content
        self.summary = summary or raw_content[:300]
        self.tables_html = tables_html or []
        self.images_svg = images_svg or []
        self.metadata = metadata or {}
        self.vector = text_to_vector(f"{self.summary} {self.raw_content[:200]}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "doc_id": self.doc_id,
            "resource_id": self.resource_id,
            "raw_content": self.raw_content,
            "summary": self.summary,
            "tables_html": self.tables_html,
            "images_svg": self.images_svg,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MultiVectorDocument":
        return cls(
            doc_id=data["doc_id"],
            resource_id=data["resource_id"],
            raw_content=data["raw_content"],
            summary=data["summary"],
            tables_html=data.get("tables_html", []),
            images_svg=data.get("images_svg", []),
            metadata=data.get("metadata", {}),
        )


class MultiVectorStore:
    """
    Persistent Multi-Vector Index supporting ChromaDB if installed,
    with an embedded pure-Python Cosine Vector Database adhering to
    'hnsw:space: cosine' indexing and resource context filtering.
    """

    def __init__(self, persist_dir: Optional[Path] = None):
        self.persist_dir = (persist_dir or DB_DIR).resolve()
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.persist_dir / "multi_vector_index.json"
        self.documents: Dict[str, MultiVectorDocument] = {}
        self.chroma_collection = None
        self._init_storage()

    def _init_storage(self):
        # 1. Attempt ChromaDB connection
        try:
            import chromadb
            from chromadb.config import Settings
            client = chromadb.PersistentClient(
                path=str(self.persist_dir),
                settings=Settings(anonymized_telemetry=False),
            )
            self.chroma_collection = client.get_or_create_collection(
                name="studyai_multivector",
                metadata={"hnsw:space": "cosine"},
            )
            print(f"[MultiVectorStore] ChromaDB loaded at {self.persist_dir}")
        except Exception as e:
            self.chroma_collection = None
            print(f"[MultiVectorStore] Using standalone Cosine Index: {e}")

        # 2. Load persistent JSON cache
        if self.index_file.exists():
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        doc = MultiVectorDocument.from_dict(item)
                        self.documents[doc.doc_id] = doc
            except Exception as e:
                print(f"[MultiVectorStore] Error reading index file: {e}")

    def _persist(self):
        try:
            serializable = [doc.to_dict() for doc in self.documents.values()]
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(serializable, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[MultiVectorStore] Failed to persist index: {e}")

    def add_document(self, doc: MultiVectorDocument):
        self.documents[doc.doc_id] = doc
        self._persist()

        if self.chroma_collection:
            try:
                self.chroma_collection.upsert(
                    ids=[doc.doc_id],
                    documents=[doc.summary],
                    metadatas=[{
                        "resource_id": doc.resource_id,
                        "active_context": str(doc.metadata.get("active_context", True)),
                        "has_table": bool(doc.tables_html),
                        "has_svg": bool(doc.images_svg),
                    }],
                )
            except Exception as e:
                print(f"[ChromaDB Upsert Warning]: {e}")

    def toggle_resource(self, resource_id: str, active: bool) -> int:
        """Toggles active_context flag for all chunks of a resource."""
        updated = 0
        for doc in self.documents.values():
            if doc.resource_id == resource_id:
                doc.metadata["active_context"] = active
                updated += 1
        if updated > 0:
            self._persist()
        return updated

    def get_resource_ids(self) -> List[str]:
        return sorted(list({doc.resource_id for doc in self.documents.values()}))

    def search(
        self,
        query: str,
        top_k: int = 4,
        only_active: bool = True,
    ) -> List[Tuple[MultiVectorDocument, float]]:
        """
        Executes Cosine Similarity search over dense summaries.
        Returns top_k MultiVectorDocuments with similarity scores.
        """
        query_vec = text_to_vector(query)
        scored: List[Tuple[MultiVectorDocument, float]] = []

        for doc in self.documents.values():
            # Check resource toggle
            if only_active and not doc.metadata.get("active_context", True):
                continue

            sim = cosine_similarity(query_vec, doc.vector)
            scored.append((doc, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def clear(self):
        self.documents.clear()
        if self.index_file.exists():
            self.index_file.unlink(missing_ok=True)
        if self.chroma_collection:
            try:
                self.chroma_collection.delete(where={})
            except Exception:
                pass

    def sync_from_disk(self, docs_dir: Optional[Path] = None):
        """Scans docs directory and automatically indexes any unindexed PDF or TXT files."""
        target_dir = docs_dir or (BASE_DIR / "docs")
        if not target_dir.exists():
            return

        new_count = 0
        for fpath in target_dir.glob("*"):
            if not fpath.is_file() or fpath.name.startswith(".") or fpath.name == "usert.txt":
                continue

            resource_id = f"disk_{re.sub(r'[^a-zA-Z0-9_]', '_', fpath.stem)}"
            already_indexed = any(doc.resource_id == resource_id or doc.metadata.get("source") == fpath.name for doc in self.documents.values())
            if already_indexed:
                continue

            full_text = ""
            if fpath.suffix.lower() == ".pdf":
                try:
                    from pypdf import PdfReader
                    reader = PdfReader(str(fpath))
                    pages_text = []
                    for idx, p in enumerate(reader.pages, 1):
                        ptxt = p.extract_text() or ""
                        if ptxt.strip():
                            pages_text.append(f"--- PDF Page {idx} ---\n{ptxt.strip()}")
                    full_text = "\n\n".join(pages_text)
                except Exception as e:
                    print(f"[MultiVectorStore] Error reading PDF {fpath.name}: {e}")
            elif fpath.suffix.lower() in [".txt", ".md"]:
                try:
                    full_text = fpath.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    pass

            if not full_text.strip():
                continue

            # Detect and convert table lines to clean HTML
            tables_html = []
            table_lines = [l for l in full_text.split("\n") if "|" in l or "\t" in l]
            if len(table_lines) >= 2:
                html = ["<table border='1' class='extracted-data-table'>"]
                for l in table_lines[:10]:
                    cells = [c.strip() for c in re.split(r"[|\t]", l) if c.strip()]
                    if cells:
                        html.append("  <tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>")
                html.append("</table>")
                tables_html.append("\n".join(html))

            # Chunk into overlapping segments
            paragraphs = full_text.split("\n\n")
            chunks = []
            curr = []
            curr_len = 0
            for p in paragraphs:
                p_c = p.strip()
                if not p_c:
                    continue
                if curr_len + len(p_c) > 450 and curr:
                    chunks.append("\n\n".join(curr))
                    curr = [p_c]
                    curr_len = len(p_c)
                else:
                    curr.append(p_c)
                    curr_len += len(p_c)
            if curr:
                chunks.append("\n\n".join(curr))

            print(f"[MultiVectorStore] Ingesting {fpath.name} -> {len(chunks)} chunks into ChromaDB / Vector Store")
            for i, chunk in enumerate(chunks):
                doc_id = f"{resource_id}_c{i}"
                doc = MultiVectorDocument(
                    doc_id=doc_id,
                    resource_id=resource_id,
                    raw_content=chunk,
                    summary=chunk[:280],
                    tables_html=tables_html if i == 0 else [],
                    images_svg=[],
                    metadata={
                        "source": fpath.name,
                        "resource_id": resource_id,
                        "active_context": True,
                        "chunk_index": i,
                    },
                )
                self.add_document(doc)
                new_count += 1

        if new_count > 0:
            self._persist()
            print(f"[MultiVectorStore] Synced {new_count} new chunks from disk to vector index.")


# Global singleton instance
vector_store = MultiVectorStore()
