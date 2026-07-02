"""
app/graph/state.py

Defines the single shared state TypedDict that flows through
every node in the MedVerify LangGraph pipeline.

Task 3.6 — LangGraph state schema.
"""
from __future__ import annotations

from typing import Optional
from typing_extensions import TypedDict


class MedVerifyState(TypedDict):
    """
    Shared state threaded through every LangGraph node.

    LangGraph passes the full state into each node and merges
    the partial dict returned by the node back in.

    Fields
    ------
    query               Original clinical question from the clinician.
    retrieved_chunks    Serialised RetrievedChunk dicts from the retrieval node (≤20).
    reranked_chunks     Top-5 chunks selected by the CrossEncoder reranker node.
    confidence_score    Float 0.0–1.0 scored by the verifier LLM.
    verifier_reason     One-sentence rationale from the verifier.
    answer              Final answer text. None until the answer/review/gap node runs.
    citations           List of {document_title, page_number, document_id} dicts.
    route               Pipeline decision: "answered" | "review" | "gap".
    gap_logged          True after the gap logger has written to Supabase.
    review_required     True when the query is routed to the human review queue.
    """
    query: str
    org_id: str                   # The organization this query belongs to
    retrieved_chunks: list
    reranked_chunks: list
    confidence_score: float
    verifier_reason: str
    answer: Optional[str]
    citations: list
    route: str
    gap_logged: bool
    review_required: bool
