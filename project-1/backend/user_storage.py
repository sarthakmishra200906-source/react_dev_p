# backend/user_storage.py
"""
Strict Per-User Data Isolation & Storage Engine
Implements:
1. Isolated directory tree per user under storage/users/{user_email}/:
   - docs/       -> User's physical PDFs & documents
   - vector_db/  -> Isolated ChromaDB / Cosine vector index per user
   - notes/      -> Obsidian / Markdown & workspace notes
   - state/      -> Resources metadata & chat history persistence
2. Zero data mixing across users:
   - Separate MultiVectorStore instances per user
   - User A's queries search ONLY User A's vector database & files
   - User B's queries search ONLY User B's vector database & files
3. Automatic local disk persistence across server restarts
"""

import os
import json
import re
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from rag.multi_vector_store import MultiVectorStore, MultiVectorDocument

BASE_DIR = Path(__file__).resolve().parent
STORAGE_ROOT = BASE_DIR / "storage" / "users"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def sanitize_email(email: str) -> str:
    """Sanitizes user email into safe directory name while preserving readability."""
    if not email:
        return "anonymous_guest"
    cleaned = email.strip().lower()
    # Replace @ with _at_ and dots/special characters with underscore
    cleaned = re.sub(r"[^\w\.-]", "_", cleaned)
    cleaned = cleaned.replace("@", "_at_").replace(".", "_")
    return cleaned


class UserWorkspace:
    """Represents an isolated user workspace with dedicated storage and vector database."""

    def __init__(self, raw_email: str):
        self.raw_email = raw_email.strip().lower() if raw_email else "guest@study.ai"
        self.clean_email = sanitize_email(self.raw_email)

        # 1. Directory Structure
        self.root_dir = STORAGE_ROOT / self.clean_email
        self.docs_dir = self.root_dir / "docs"
        self.vector_db_dir = self.root_dir / "vector_db"
        self.notes_dir = self.root_dir / "notes"
        self.state_dir = self.root_dir / "state"

        self.docs_dir.mkdir(parents=True, exist_ok=True)
        self.vector_db_dir.mkdir(parents=True, exist_ok=True)
        self.notes_dir.mkdir(parents=True, exist_ok=True)
        self.state_dir.mkdir(parents=True, exist_ok=True)

        self.resources_file = self.state_dir / "resources.json"
        self.history_file = self.state_dir / "history.json"
        self.notes_file = self.notes_dir / "study_workspace_notes.md"
        self.usert_file = self.docs_dir / "usert.txt"

        # 2. Isolated Vector Store Instance
        self.vector_store = MultiVectorStore(persist_dir=self.vector_db_dir)

        # 3. In-Memory Session Cache
        self.resources: List[Dict[str, Any]] = []
        self.history: List[Dict[str, str]] = []
        self.pdf_cache: Dict[str, Any] = {
            "text": "",
            "pdf_bytes": b"",
            "filename": "",
            "updated_at": "",
        }

        # 4. Load persisted user state
        self._load_state()

    def _load_state(self):
        """Loads user state and re-syncs physical documents from disk."""
        if self.resources_file.exists():
            try:
                with open(self.resources_file, "r", encoding="utf-8") as f:
                    self.resources = json.load(f)
            except Exception as e:
                print(f"[UserStorage: {self.raw_email}] Error loading resources: {e}")
                self.resources = []

        if self.history_file.exists():
            try:
                with open(self.history_file, "r", encoding="utf-8") as f:
                    self.history = json.load(f)
            except Exception as e:
                print(f"[UserStorage: {self.raw_email}] Error loading history: {e}")
                self.history = []

        # Sync disk PDFs into user's isolated vector store
        self.sync_docs()

    def save_resources(self):
        try:
            with open(self.resources_file, "w", encoding="utf-8") as f:
                json.dump(self.resources, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[UserStorage: {self.raw_email}] Failed to save resources: {e}")

    def save_history(self):
        try:
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(self.history, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[UserStorage: {self.raw_email}] Failed to save history: {e}")

    def sync_docs(self):
        """Syncs physical files in docs/ into user's private vector store."""
        try:
            self.vector_store.sync_from_disk(self.docs_dir)
        except Exception as e:
            print(f"[UserStorage: {self.raw_email}] Doc sync note: {e}")

    def export_notes(self, text_content: str):
        """Saves user's notes to their isolated notes directory."""
        try:
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            md_content = f"""---
title: Study Workspace & Revision Notes
user: {self.raw_email}
updated: {now_str}
tags:
  - user-isolated
  - study-plan
---

# 📚 {self.raw_email} Workspace Notes
*Last synchronized: {now_str}*

{text_content.strip()}
"""
            with open(self.notes_file, "w", encoding="utf-8") as f:
                f.write(md_content)
            # Also save usert.txt in isolated docs
            with open(self.usert_file, "w", encoding="utf-8") as f:
                f.write(text_content.strip() + "\n")
        except Exception as e:
            print(f"[UserStorage: {self.raw_email}] Failed to export notes: {e}")

    def get_storage_usage_bytes(self) -> int:
        """Calculates total disk space used across docs, vector_db, notes, and state."""
        total = 0
        if self.root_dir.exists():
            for p in self.root_dir.rglob("*"):
                if p.is_file():
                    try:
                        total += p.stat().st_size
                    except Exception:
                        pass
        return total

    def get_storage_formatted(self) -> str:
        """Returns human-readable representation of storage used."""
        num_bytes = self.get_storage_usage_bytes()
        if num_bytes < 1024:
            return f"{num_bytes} B"
        elif num_bytes < 1024 * 1024:
            return f"{num_bytes / 1024:.1f} KB"
        elif num_bytes < 1024 * 1024 * 1024:
            return f"{num_bytes / (1024 * 1024):.1f} MB"
        else:
            return f"{num_bytes / (1024 * 1024 * 1024):.2f} GB"

    def clear(self):
        """Wipes this user's isolated files without touching any other user."""
        try:
            for p in self.docs_dir.glob("*"):
                if p.is_file():
                    p.unlink(missing_ok=True)
            for p in self.notes_dir.glob("*"):
                if p.is_file():
                    p.unlink(missing_ok=True)
            self.resources.clear()
            self.history.clear()
            self.pdf_cache = {"text": "", "pdf_bytes": b"", "filename": "", "updated_at": ""}
            self.vector_store.clear()
            self.save_resources()
            self.save_history()
        except Exception as e:
            print(f"[UserStorage: {self.raw_email}] Error clearing workspace: {e}")


class UserStorageManager:
    """Manages workspace lifecycle for all active and registered users."""

    def __init__(self):
        self._workspaces: Dict[str, UserWorkspace] = {}

    def get_workspace(self, email_or_token: str) -> UserWorkspace:
        """
        Retrieves or initializes an isolated UserWorkspace.
        Accepts user email or session token.
        """
        email = (email_or_token or "").strip().lower()
        if not email:
            email = "guest_default@study.ai"

        if email not in self._workspaces:
            self._workspaces[email] = UserWorkspace(email)

        return self._workspaces[email]


# Global Singleton Storage Manager
user_storage_manager = UserStorageManager()
