"""
app/graph/nodes/verifier.py

Tasks 3.9 & 3.10 — Verifier node + confidence-based routing.

The verifier calls the Groq LLM to score how well the reranked evidence
supports the clinical query. It produces a float confidence_score and a
one-sentence reason. The router then decides which terminal node to call.
"""
from __future__ import annotations

import json

from app.graph.state import MedVerifyState
from app.graph.prompts import VERIFIER_SYSTEM


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_evidence_block(chunks: list[dict], max_chars: int = 8000) -> str:
    """Format chunks as a numbered evidence list for the LLM prompt."""
    lines = []
    total = 0
    for i, c in enumerate(chunks, start=1):
        header = (
            f"[{i}] {c['document_title']}"
            + (f", p.{c['page_number']}" if c.get("page_number") else "")
        )
        line = f"{header}\n{c['raw_text']}\n"
        if total + len(line) > max_chars:
            lines.append(f"[{i}] ... (truncated to fit context limit)")
            break
        lines.append(line)
        total += len(line)
    return "\n".join(lines)


def _get_groq_client():
    """Return an initialised Groq client, or None if API key is not set."""
    from app.core.config import get_settings
    settings = get_settings()
    if not settings.groq_api_key:
        return None
    from groq import Groq
    return Groq(api_key=settings.groq_api_key)


# ─── 3.9  Verifier node ───────────────────────────────────────────────────────

def verifier_node(state: MedVerifyState) -> dict:
    """
    3.9 — Evidence quality verifier.

    Sends the clinical query + top-5 reranked chunks to Groq.
    The LLM only scores the evidence — it does NOT answer the question.
    This separation keeps verification and generation as auditable steps.

    Falls back to confidence_score = 0.0 if Groq is unavailable.
    Returns partial state update with 'confidence_score' and 'verifier_reason'.
    """
    query = state["query"]
    chunks = state.get("reranked_chunks", [])

    if not chunks:
        print("[Verifier] No chunks — confidence_score = 0.0")
        return {
            "confidence_score": 0.0,
            "verifier_reason": "No evidence was retrieved for this query.",
        }

    evidence_block = _build_evidence_block(chunks)
    user_msg = f"Question: {query}\n\nEvidence chunks:\n{evidence_block}"

    groq = _get_groq_client()
    if groq is None:
        print("[Verifier] Groq not configured — defaulting to 0.0")
        return {
            "confidence_score": 0.0,
            "verifier_reason": "Groq API key not configured.",
        }

    try:
        response = groq.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": VERIFIER_SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.0,
            max_tokens=120,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content.strip()
        parsed = json.loads(raw)
        score = float(parsed.get("score", 0.0))
        reason = str(parsed.get("reason", "No reason provided."))
        score = max(0.0, min(1.0, score))

        print(f"[Verifier] Score: {score:.2f} | {reason}")
        return {"confidence_score": score, "verifier_reason": reason}

    except Exception as e:
        print(f"[Verifier] Groq error: {e}")
        return {
            "confidence_score": 0.0,
            "verifier_reason": f"Verifier error: {e}",
        }


# ─── 3.10  Conditional routing ────────────────────────────────────────────────

def route_by_confidence(state: MedVerifyState) -> str:
    """
    3.10 — Route the pipeline based on the verifier's confidence score.

      >= 0.75  →  "answer"   Generate and return a cited answer.
      >= 0.50  →  "review"   Hold for human expert review.
      <  0.50  →  "gap"      Log as knowledge gap, decline to answer.
    """
    score = state.get("confidence_score", 0.0)
    if score >= 0.75:
        decision = "answer"
    elif score >= 0.50:
        decision = "review"
    else:
        decision = "gap"

    print(f"[Router] confidence={score:.2f} → {decision}")
    return decision
