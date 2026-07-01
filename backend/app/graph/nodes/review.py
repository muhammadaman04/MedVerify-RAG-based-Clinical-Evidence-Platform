"""
app/graph/nodes/review.py

Task 3.12 — Human review queue node.

Called when the verifier confidence is in the 0.50–0.74 range.
Saves the query, evidence snapshot, and a draft answer to the
Supabase `review_queue` table for admin inspection before release.
Returns a safe, transparent message to the clinician.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from app.graph.state import MedVerifyState
from app.graph.prompts import REVIEW_DRAFT_SYSTEM


def _build_evidence_block(chunks: list[dict], max_chars: int = 6000) -> str:
    lines = []
    total = 0
    for i, c in enumerate(chunks, start=1):
        header = (
            f"[{i}] {c['document_title']}"
            + (f", p.{c['page_number']}" if c.get("page_number") else "")
        )
        line = f"{header}\n{c['raw_text']}\n"
        if total + len(line) > max_chars:
            break
        lines.append(line)
        total += len(line)
    return "\n".join(lines)


def _get_groq_client():
    from app.core.config import get_settings
    settings = get_settings()
    if not settings.groq_api_key:
        return None
    from groq import Groq
    return Groq(api_key=settings.groq_api_key)


def _generate_draft(query: str, chunks: list[dict]) -> str:
    """
    Generate a draft answer for the admin reviewer (non-streamed).
    Labelled clearly as a draft requiring expert sign-off.
    """
    groq = _get_groq_client()
    if groq is None:
        return "Draft unavailable — Groq not configured."

    try:
        resp = groq.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": REVIEW_DRAFT_SYSTEM},
                {
                    "role": "user",
                    "content": (
                        f"Clinical question: {query}\n\n"
                        f"Evidence:\n{_build_evidence_block(chunks)}\n\n"
                        "Draft an answer for expert review."
                    ),
                },
            ],
            temperature=0.1,
            max_tokens=800,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"Draft generation failed: {e}"


def review_queue_node(state: MedVerifyState) -> dict:
    """
    3.12 — Human review queue node.

    Saves query, evidence snapshot, draft answer, confidence score,
    and verifier reason to Supabase `review_queue` (status = pending).
    The `query_id` FK is backfilled by the query router after DB logging.

    Returns a partial state update with:
      - 'answer'          → polite message to the clinician
      - 'citations'       → empty (not yet verified)
      - 'route'           → "review"
      - 'review_required' → True
    """
    from app.core.database import get_supabase

    db = get_supabase()
    query = state["query"]
    chunks = state.get("reranked_chunks", [])
    score = state.get("confidence_score", 0.0)
    reason = state.get("verifier_reason", "")

    draft = _generate_draft(query, chunks)

    try:
        db.table("review_queue").insert({
            "query_text": query,
            "retrieved_context": json.dumps(chunks),
            "proposed_answer": draft if draft else "Draft unavailable.",
            "confidence_score": score,
            "reason": "low_confidence",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        print("[ReviewQueue] Saved to review_queue.")
    except Exception as e:
        print(f"[ReviewQueue] DB insert failed (non-fatal): {e}")

    clinician_message = (
        "The available evidence has moderate confidence for this query. "
        "Your question has been forwarded to a clinical specialist for review. "
        "You will receive a verified response shortly."
    )
    return {
        "answer": clinician_message,
        "citations": [],
        "route": "review",
        "review_required": True,
    }
