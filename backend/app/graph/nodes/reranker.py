"""
app/graph/nodes/reranker.py

Task 3.8 — Reranker node.

Deserialises the retrieved_chunks from state, runs the CrossEncoder
on each (query, chunk_text) pair, and returns the top-5 as reranked_chunks.
"""
from __future__ import annotations

from app.graph.state import MedVerifyState
from app.services.retrieval_service import RetrievedChunk


def _dict_to_chunk(d: dict) -> RetrievedChunk:
    """Rebuild a RetrievedChunk dataclass from a serialised state dict."""
    return RetrievedChunk(
        chunk_id=d["chunk_id"],
        pinecone_vector_id=d["pinecone_vector_id"],
        raw_text=d["raw_text"],
        page_number=d.get("page_number"),
        heading_context=d.get("heading_context"),
        document_id=d["document_id"],
        document_title=d["document_title"],
        score=d["score"],
    )


def _chunk_to_dict(chunk: RetrievedChunk) -> dict:
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


def reranker_node(state: MedVerifyState) -> dict:
    """
    3.8 — CrossEncoder reranker node.

    Takes retrieved_chunks (up to 20 plain dicts from state),
    rebuilds RetrievedChunk objects, runs the CrossEncoder to score
    each (query, chunk_text) pair, and returns the top-5 best chunks.

    Returns partial state update with 'reranked_chunks'.
    """
    from app.services.reranker_service import rerank

    query = state["query"]
    raw_chunks = state.get("retrieved_chunks", [])

    if not raw_chunks:
        print("[Reranker] No chunks to rerank.")
        return {"reranked_chunks": []}

    chunk_objects = [_dict_to_chunk(c) for c in raw_chunks]
    top5 = rerank(query, chunk_objects, top_n=5)

    print(f"[Reranker] Selected top {len(top5)} chunks.")
    return {"reranked_chunks": [_chunk_to_dict(c) for c in top5]}
