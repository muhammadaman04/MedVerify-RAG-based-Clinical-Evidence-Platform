"""
app/graph/nodes/retrieval.py

Task 3.7 — Retrieval node.

Runs the hybrid retrieval pipeline (vector + BM25 + RRF fusion)
and populates state['retrieved_chunks'] with up to 20 serialised chunks.
"""
from __future__ import annotations

from app.graph.state import MedVerifyState


def _chunk_to_dict(chunk) -> dict:
    """Serialise a RetrievedChunk dataclass to a plain dict for state storage."""
    return {
        "chunk_id": chunk.chunk_id,
        "pinecone_vector_id": chunk.pinecone_vector_id,
        "raw_text": chunk.raw_text,
        "page_number": chunk.page_number,
        "heading_context": chunk.heading_context,
        "document_id": chunk.document_id,
        "document_title": chunk.document_title,
        "score": chunk.score,
    }


def retrieval_node(state: MedVerifyState) -> dict:
    """
    3.7 — Hybrid retrieval node.

    Calls hybrid_retrieve() which runs:
      1. Vector search (Pinecone + MiniLM)
      2. BM25 keyword search
      3. Reciprocal Rank Fusion
      4. Supabase hydration (fetch raw_text + document titles)

    Returns partial state update with 'retrieved_chunks'.
    """
    from app.services.retrieval_service import hybrid_retrieve

    query = state["query"]
    org_id = state["org_id"]
    print(f"\n[Retrieval] Query: {query[:80]}… (org={org_id[:8]})")

    chunks = hybrid_retrieve(query, org_id=org_id, top_k=20)
    print(f"[Retrieval] Retrieved {len(chunks)} chunks.")

    return {"retrieved_chunks": [_chunk_to_dict(c) for c in chunks]}
