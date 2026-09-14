# Twelve Production RAG Patterns for High-Quality LLM Answers

Reference architecture and training guidelines for retrieval-augmented generation, multi-vector grounding, and hallucination reduction in the StudyAI platform.

---

## 1. Hybrid Retrieval: Dense + Sparse, Together
- **Problem**: Pure vector search misses exact keywords, abbreviations, and code symbols; pure keyword search misses synonyms and semantic meaning.
- **Pattern**: Run dense vector similarity search and sparse BM25 (or lexical index) concurrently, deduplicate candidate sets, and cross-encode the union.
  ```python
  dense = vectordb.search(query_embedding, top_k=50)
  sparse = bm25.search(query_text, top_k=50)
  candidates = dedupe(dense + sparse)
  ranked = cross_encoder.rerank(query_text, candidates)[:k]
  ```
- **Payoff**: Accurately captures both technical jargon (e.g., "RBAC", "HIPAA", "Carnot cycle") and high-level conceptual synonyms.

---

## 2. Structured Chunking with Overlap
- **Problem**: Arbitrary token-split boundaries break definitions away from their explanatory examples and formulas.
- **Pattern**: Segment along semantic boundaries (markdown headers, paragraphs, lists, tables) with 10–15% overlap (1–2 sentences). Attach rich metadata (`source`, `page_number`, `section_title`, `timestamp`).
- **Rule of Thumb**: Keep chunk size under 1,000 tokens to pack multiple distinct perspectives into active context without prompt bloat.

---

## 3. Query Rewriting (Multi-View Retrieval)
- **Problem**: A single user query under-specifies research intent or contains typos and ambiguity.
- **Pattern**: Expand the query into multiple academic facets (definitions, procedural mechanisms, caveats, formulas) and retrieve across all facets.
  ```python
  facets = [
      f"definition of {q}",
      f"mechanisms and formulas of {q}",
      f"environmental and practical impacts of {q}",
      f"limitations and exceptions of {q}",
  ]
  docs = merge([retrieve(f) for f in facets])
  ```
- **Payoff**: Comprehensive evidence coverage and elimination of brittle, one-dimensional answers.

---

## 4. Domain-Aware Filters Before Vectors
- **Problem**: Massive vector indices dilute top-k relevance with irrelevant or obsolete documents.
- **Pattern**: Apply hard metadata pre-filters (`source_type`, `academic_year`, `module_id`, `active_toggle`) before computing cosine vector distance.
- **Example**: In StudyAI, filter `active_context=True` and `module="Module 2"` prior to vector ranking.

---

## 5. Re-Ranking with a Cross-Encoder
- **Problem**: Embedding bi-encoders prioritize broad semantic similarity, sometimes ranking "close but wrong" chunks higher than precise answers.
- **Pattern**: Use bi-encoder for high-recall top-50 candidate retrieval, then re-score with a cross-encoder to select the 3–6 most contextually precise chunks.
- **Impact**: Highest ROI improvement for answer precision and grounded formula extraction.

---

## 6. Citation-First Prompting
- **Problem**: Models extrapolate or invent details when context is ambiguous.
- **Pattern**: Instruct the LLM to cite specific page/chunk IDs (e.g., `[C1]`, `--- PDF Page 3 ---`) for every factual assertion. Explicitly prompt the model to state *"Insufficient source evidence"* if facts cannot be corroborated.
- **Impact**: Transforms generation from speculative storytelling into factual evidence synthesis.

---

## 7. Answer Planning (Two-Pass Generation)
- **Problem**: Long, complex synthesis drifts off-topic or loses cohesion.
- **Pattern**: Pass 1 generates a structured bulleted outline derived solely from retrieved snippets. Pass 2 drafts the final answer following that outline while embedding exact citations.
  ```python
  plan = llm("Construct a 5-point synthesis outline strictly from retrieved evidence: ...")
  final = llm(f"Generate the comprehensive analysis strictly following this plan:\n{plan}\nCite sources.")
  ```
- **Payoff**: High conceptual coherence, zero conversational fluff.

---

## 8. Guardrails with Typed Outputs
- **Problem**: Freeform prose introduces structural inconsistencies and parsing errors in automated pipelines.
- **Pattern**: Enforce typed schemas (JSON Schema, Pydantic classes) for intermediate extraction before rendering to clean markdown.
  ```python
  class AcademicSummary(BaseModel):
      topic: str
      core_theorems: list[str]
      equations: list[str]
      citations: list[str]
  ```

---

## 9. Retrieval Fusion Across Collections
- **Problem**: Knowledge is partitioned across heterogeneous formats (raw text, lecture PDFs, HTML tables, SVG diagrams).
- **Pattern**: Maintain dedicated indices per modality with tuned weights (e.g., 0.5 text + 0.3 tables + 0.2 vector diagrams) and fuse rankings via Reciprocal Rank Fusion (RRF).

---

## 10. Post-Answer Verification (Self-Check)
- **Problem**: Confident hallucinations occasionally slip past system instructions.
- **Pattern**: Run a post-generation verification pass that matches every generated sentence against retrieved context. If an assertion lacks ground truth, strike it or flag it as unverified.

---

## 11. Recency & De-duplication Strategy
- **Problem**: Re-uploaded revisions and duplicate chapters crowd out relevant context.
- **Pattern**: Collapse duplicates using canonical document hashing (`sha256`), prefer the most recently timestamped version, and enforce a maximum of 1 chunk per canonical section in the final prompt bundle.

---

## 12. Clarifying Questions — Only When Needed
- **Problem**: Vague user prompts lead to guesswork and generic answers.
- **Pattern**: When query ambiguity is high and vector confidence is below threshold, generate a single targeted clarifying question before executing deep retrieval.
