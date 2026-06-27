"""
retrieval_service.py — Phase 3 (Tasks 3.1 – 3.4)

Implements hybrid retrieval for MedVerify's RAG pipeline:
  - 3.1  BM25 index (in-memory, rebuilt on demand)
  - 3.2  Vector search via Pinecone + MiniLM embeddings
  - 3.3  BM25 keyword search
  - 3.4  Reciprocal Rank Fusion to merge both result sets
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from app.core.database import get_supabase
from app.core.pinecone_client import get_pinecone_index

# ─── Shared data structures ───────────────────────────────────────────────────

@dataclass
class RetrievedChunk:
    """A single retrieved chunk with its metadata and text."""
    chunk_id: str           # Supabase UUID
    pinecone_vector_id: str
    raw_text: str
    page_number: Optional[int]
    heading_context: Optional[str]
    document_id: str
    document_title: str
    score: float            # RRF fused score (used for ranking)


# ─── 3.1  BM25 Index ─────────────────────────────────────────────────────────

class BM25Index:
    """
    In-memory BM25 index over all document chunks.
    Call `rebuild()` after each new document is ingested.
    """
    def __init__(self) -> None:
        self._bm25 = None          # rank_bm25.BM25Okapi instance
        self._chunk_ids: list[str] = []      # parallel list: chunk_id
        self._pinecone_ids: list[str] = []   # parallel list: pinecone_vector_id
        self._corpus: list[list[str]] = []   # tokenised documents

    # ------------------------------------------------------------------
    def _tokenise(self, text: str) -> list[str]:
        """Lowercase, split on whitespace and punctuation, strip empties."""
        return [t for t in re.split(r"[\s\W]+", text.lower()) if t]

    # ------------------------------------------------------------------
    def rebuild(self) -> None:
        """
        Fetch every chunk from Supabase and build a fresh BM25 index.
        Called once at startup and after each successful document ingestion.
        """
        from rank_bm25 import BM25Okapi

        db = get_supabase()
        result = (
            db.table("document_chunks")
            .select("id, pinecone_vector_id, raw_text")
            .execute()
        )
        rows = result.data or []

        if not rows:
            print("⚠️  BM25: No chunks found in Supabase. Index is empty.")
            self._bm25 = None
            return

        self._chunk_ids = [r["id"] for r in rows]
        self._pinecone_ids = [r["pinecone_vector_id"] for r in rows]
        self._corpus = [self._tokenise(r["raw_text"]) for r in rows]

        self._bm25 = BM25Okapi(self._corpus)
        print(f"✓ BM25 index rebuilt with {len(rows)} chunks.")

    # ------------------------------------------------------------------
    def search(self, query: str, top_k: int = 20) -> list[dict]:
        """
        3.3 — BM25 keyword search.
        Returns list of {pinecone_vector_id, bm25_score} dicts, best-first.
        """
        if self._bm25 is None:
            return []

        tokenised_query = self._tokenise(query)
        scores = self._bm25.get_scores(tokenised_query)

        # Pair each score with its pinecone_vector_id then sort descending
        ranked = sorted(
            zip(self._pinecone_ids, scores),
            key=lambda x: x[1],
            reverse=True,
        )[:top_k]

        return [{"pinecone_vector_id": vid, "bm25_score": float(s)} for vid, s in ranked]


# Module-level singleton
_bm25_index = BM25Index()


def get_bm25_index() -> BM25Index:
    """Return the shared BM25 index singleton."""
    return _bm25_index


def rebuild_bm25_index() -> None:
    """Rebuild the shared BM25 index (call after new document ingestion)."""
    _bm25_index.rebuild()


# ─── 3.2  Vector search via Pinecone ─────────────────────────────────────────

_embedding_model = None


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        print("🔧 Loading MiniLM embedding model for query encoding…")
        _embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        print("✓ Embedding model ready.")
    return _embedding_model


def vector_search(query: str, top_k: int = 20) -> list[dict]:
    """
    3.2 — Vector search.
    Embeds the query and queries Pinecone for the most semantically similar chunks.
    Returns list of {pinecone_vector_id, score, metadata} dicts.
    """
    index = get_pinecone_index()
    if index is None:
        print("⚠️  Pinecone not configured — vector search returning empty.")
        return []

    model = _get_embedding_model()
    query_vector = model.encode(query, normalize_embeddings=True).tolist()

    results = index.query(vector=query_vector, top_k=top_k, include_metadata=True)

    return [
        {
            "pinecone_vector_id": match["id"],
            "score": float(match["score"]),
            "metadata": match.get("metadata", {}),
        }
        for match in results.get("matches", [])
    ]


# ─── 3.4  Reciprocal Rank Fusion ─────────────────────────────────────────────

def reciprocal_rank_fusion(
    vector_results: list[dict],
    bm25_results: list[dict],
    top_k: int = 20,
    k: int = 60,
) -> list[dict]:
    """
    3.4 — Reciprocal Rank Fusion.
    Merges vector and BM25 ranked lists into a single list.

    RRF formula: score(doc) = Σ 1 / (k + rank_in_list)
    Chunks appearing in both lists get additive scores → higher combined rank.

    Returns top_k entries sorted by combined RRF score (best first).
    Each entry: {pinecone_vector_id, rrf_score, metadata}
    """
    rrf_scores: dict[str, float] = {}
    metadata_map: dict[str, dict] = {}

    # Score vector results (1-indexed rank)
    for rank, item in enumerate(vector_results, start=1):
        vid = item["pinecone_vector_id"]
        rrf_scores[vid] = rrf_scores.get(vid, 0.0) + 1.0 / (k + rank)
        if "metadata" in item:
            metadata_map[vid] = item["metadata"]

    # Score BM25 results additively
    for rank, item in enumerate(bm25_results, start=1):
        vid = item["pinecone_vector_id"]
        rrf_scores[vid] = rrf_scores.get(vid, 0.0) + 1.0 / (k + rank)

    # Sort by combined score and return top_k
    ranked = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

    return [
        {
            "pinecone_vector_id": vid,
            "rrf_score": score,
            "metadata": metadata_map.get(vid, {}),
        }
        for vid, score in ranked
    ]


# ─── Hydrate chunks from Supabase ────────────────────────────────────────────

def hydrate_chunks(fused_results: list[dict]) -> list[RetrievedChunk]:
    """
    Given RRF-fused results (which carry pinecone_vector_id + metadata),
    fetch the raw_text and full metadata from Supabase document_chunks.
    Returns fully populated RetrievedChunk objects, ordered by RRF score.
    """
    if not fused_results:
        return []

    db = get_supabase()
    pinecone_ids = [r["pinecone_vector_id"] for r in fused_results]
    rrf_score_map = {r["pinecone_vector_id"]: r["rrf_score"] for r in fused_results}

    # Single DB query — fetch all matching chunks
    result = (
        db.table("document_chunks")
        .select(
            "id, pinecone_vector_id, raw_text, page_number, heading_context, document_id"
        )
        .in_("pinecone_vector_id", pinecone_ids)
        .execute()
    )

    rows = result.data or []

    # We also need document titles — batch fetch
    doc_ids = list({r["document_id"] for r in rows})
    titles_result = (
        db.table("documents")
        .select("id, title")
        .in_("id", doc_ids)
        .execute()
    )
    title_map = {d["id"]: d["title"] for d in (titles_result.data or [])}

    # Build RetrievedChunk objects
    chunks: list[RetrievedChunk] = []
    for row in rows:
        chunks.append(
            RetrievedChunk(
                chunk_id=row["id"],
                pinecone_vector_id=row["pinecone_vector_id"],
                raw_text=row["raw_text"],
                page_number=row.get("page_number"),
                heading_context=row.get("heading_context"),
                document_id=row["document_id"],
                document_title=title_map.get(row["document_id"], "Unknown Document"),
                score=rrf_score_map.get(row["pinecone_vector_id"], 0.0),
            )
        )

    # Preserve RRF ordering
    chunks.sort(key=lambda c: c.score, reverse=True)
    return chunks


# ─── Top-level hybrid retrieval function ─────────────────────────────────────

def hybrid_retrieve(query: str, top_k: int = 20) -> list[RetrievedChunk]:
    """
    Full hybrid retrieval pipeline:
      1. Run vector search (Pinecone)
      2. Run BM25 keyword search
      3. Fuse with Reciprocal Rank Fusion
      4. Hydrate from Supabase (get raw_text + titles)
    Returns top_k RetrievedChunk objects.
    """
    vec_results = vector_search(query, top_k=top_k)
    bm25_results = get_bm25_index().search(query, top_k=top_k)
    fused = reciprocal_rank_fusion(vec_results, bm25_results, top_k=top_k)
    return hydrate_chunks(fused)
