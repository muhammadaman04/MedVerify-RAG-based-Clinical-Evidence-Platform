"""
rag_graph.py — Phase 3 (Task 3.6)

Defines the LangGraph state schema (MedVerifyState) and the
compiled graph that will orchestrate the full RAG pipeline.

Tasks covered here:
  3.6  — State TypedDict schema
"""
from __future__ import annotations

from typing import Optional
from typing_extensions import TypedDict


# ─── 3.6  LangGraph State Schema ─────────────────────────────────────────────

class MedVerifyState(TypedDict):
    """
    Shared state object passed through every node in the LangGraph graph.

    Each node receives the full state, modifies only its own fields,
    and returns the updated dict. LangGraph merges partial updates.

    Fields
    ------
    query               : The original clinical question from the clinician.
    retrieved_chunks    : Output of the hybrid retrieval node (up to 20 chunks).
    reranked_chunks     : Output of the CrossEncoder reranker node (top 5).
    confidence_score    : Float 0.0–1.0 produced by the verifier LLM.
    verifier_reason     : One-sentence explanation from the verifier.
    answer              : The generated clinical answer (None until answer node runs).
    citations           : List of citation dicts {document_title, page_number}.
    route               : Decision: "answered" | "review" | "gap"
    gap_logged          : Whether the knowledge gap has been saved to Supabase.
    review_required     : True when the query is routed to the review queue.
    """
    query: str
    retrieved_chunks: list
    reranked_chunks: list
    confidence_score: float
    verifier_reason: str
    answer: Optional[str]
    citations: list
    route: str
    gap_logged: bool
    review_required: bool
