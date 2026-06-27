"""
reranker_service.py — Phase 3 (Task 3.5)

CrossEncoder reranker using cross-encoder/ms-marco-MiniLM-L-6-v2.
Takes the 20 RRF-fused candidates and returns the top 5 that best
answer the specific clinical question.
"""
from __future__ import annotations

from app.services.retrieval_service import RetrievedChunk

# ─── Model singleton ──────────────────────────────────────────────────────────

_cross_encoder = None


def _get_cross_encoder():
    """Lazily load the CrossEncoder model (runs on CPU, ~85MB)."""
    global _cross_encoder
    if _cross_encoder is None:
        from sentence_transformers.cross_encoder import CrossEncoder
        print("🔧 Loading CrossEncoder reranker (ms-marco-MiniLM-L-6-v2)…")
        _cross_encoder = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L-6-v2",
            max_length=512,
        )
        print("✓ CrossEncoder reranker loaded.")
    return _cross_encoder


# ─── 3.5  Rerank function ─────────────────────────────────────────────────────

def rerank(
    query: str,
    chunks: list[RetrievedChunk],
    top_n: int = 5,
) -> list[RetrievedChunk]:
    """
    3.5 — CrossEncoder reranker.

    Takes up to 20 RRF-fused RetrievedChunk candidates and re-scores each
    one by running the (query, chunk_text) pair through the CrossEncoder.
    The CrossEncoder reads both texts jointly — far more precise than
    comparing embeddings independently.

    Returns the top_n chunks sorted by CrossEncoder score (best first).
    The returned chunks have their .score field updated to the CrossEncoder
    score for downstream use by the verifier node.
    """
    if not chunks:
        return []

    model = _get_cross_encoder()

    # Build (query, chunk_text) pairs
    pairs = [(query, chunk.raw_text) for chunk in chunks]

    # Score all pairs in one batch call
    cross_scores = model.predict(pairs, show_progress_bar=False)

    # Attach CrossEncoder scores and sort
    scored = sorted(
        zip(chunks, cross_scores.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )[:top_n]

    # Return RetrievedChunk objects with updated score = CrossEncoder score
    result = []
    for chunk, ce_score in scored:
        # Create a copy with updated score
        reranked = RetrievedChunk(
            chunk_id=chunk.chunk_id,
            pinecone_vector_id=chunk.pinecone_vector_id,
            raw_text=chunk.raw_text,
            page_number=chunk.page_number,
            heading_context=chunk.heading_context,
            document_id=chunk.document_id,
            document_title=chunk.document_title,
            score=float(ce_score),  # CrossEncoder score replaces RRF score
        )
        result.append(reranked)

    return result
