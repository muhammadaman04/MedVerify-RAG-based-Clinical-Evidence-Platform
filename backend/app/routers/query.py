"""
query.py — Phase 3 (Tasks 3.15 & 3.16)

Clinician query endpoints:
  3.15  POST /api/query       — run the full RAG pipeline, return answer + metadata
  3.16  GET  /api/queries/me  — return the authenticated clinician's query history
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.database import get_supabase
from app.core.deps import require_any_role as get_current_user

router = APIRouter(prefix="/api", tags=["query"])


# ─── Request / Response schemas ───────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str


class CitationOut(BaseModel):
    document_title: str
    page_number: int | None = None
    document_id: str


class QueryResponse(BaseModel):
    answer: str
    confidence_score: float
    verifier_reason: str
    route: str                  # "answered" | "review" | "gap"
    citations: list[CitationOut]
    query_id: str


# ─── 3.15  POST /api/query ────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
async def run_query(
    body: QueryRequest,
    user: dict = Depends(get_current_user),
):
    """
    3.15 — Main clinical query endpoint.

    Executes the full MedVerify RAG pipeline:
      retrieval → reranker → verifier → [answer | review | gap]

    Logs the query and result to the `queries` table.
    Returns the answer, confidence score, citations, and routing decision.
    """
    query_text = body.query.strip()
    if not query_text:
        raise HTTPException(status_code=422, detail="Query cannot be empty.")
    if len(query_text) > 2000:
        raise HTTPException(status_code=422, detail="Query must be 2000 characters or fewer.")

    org_id: str | None = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="Your account is not linked to an organization.")

    # --- Run the LangGraph pipeline ---
    from app.graph import medverify_graph, MedVerifyState

    initial_state: MedVerifyState = {
        "query": query_text,
        "org_id": org_id,              # ← tenant scope flows through the entire graph
        "retrieved_chunks": [],
        "reranked_chunks": [],
        "confidence_score": 0.0,
        "verifier_reason": "",
        "answer": None,
        "citations": [],
        "route": "gap",
        "gap_logged": False,
        "review_required": False,
    }

    try:
        final_state: MedVerifyState = medverify_graph.invoke(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG pipeline error: {e}")

    # --- Log to Supabase queries table ---
    db = get_supabase()
    log_row = {
        "user_id": user["sub"],
        "organization_id": org_id,     # ← tenant scope
        "query_text": query_text,
        "answer_text": final_state.get("answer"),
        "confidence_score": final_state.get("confidence_score", 0.0),
        "route": final_state.get("route", "gap"),
        "citations": final_state.get("citations", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        log_result = db.table("queries").insert(log_row).execute()
        query_id = log_result.data[0]["id"] if log_result.data else "unknown"
    except Exception as db_err:
        print(f"[Query] Failed to log query to DB: {db_err}")
        query_id = "unknown"

    # --- If review route, backfill query_id into review_queue ---
    if final_state.get("route") == "review" and query_id != "unknown":
        try:
            rq = (
                db.table("review_queue")
                .select("id")
                .eq("query_text", query_text)
                .eq("status", "pending")
                .eq("organization_id", org_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if rq.data:
                db.table("review_queue").update({"query_id": query_id}).eq("id", rq.data[0]["id"]).execute()
        except Exception as rq_err:
            print(f"[Query] review_queue backfill failed (non-fatal): {rq_err}")

    return QueryResponse(
        answer=final_state.get("answer") or "No answer generated.",
        confidence_score=final_state.get("confidence_score", 0.0),
        verifier_reason=final_state.get("verifier_reason", ""),
        route=final_state.get("route", "gap"),
        citations=[CitationOut(**c) for c in final_state.get("citations", [])],
        query_id=str(query_id),
    )


# ─── 3.16  GET /api/queries/me ───────────────────────────────────────────────

@router.get("/queries/me")
async def get_my_queries(user: dict = Depends(get_current_user)):
    """
    3.16 — Clinician's own query history.
    Returns queries sorted newest-first, limited to 100.
    """
    db = get_supabase()
    result = (
        db.table("queries")
        .select("id, query_text, answer_text, confidence_score, route, citations, created_at")
        .eq("user_id", user["sub"])
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return {"queries": result.data or []}
