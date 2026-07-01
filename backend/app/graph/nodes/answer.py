"""
app/graph/nodes/answer.py

Task 3.11 — Answer generation node.

Calls Groq with the top-5 reranked chunks as grounding context
and generates a citation-backed clinical answer.
"""
from __future__ import annotations

from app.graph.state import MedVerifyState
from app.graph.prompts import ANSWER_SYSTEM


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
            lines.append(f"[{i}] ... (truncated)")
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


def answer_node(state: MedVerifyState) -> dict:
    """
    3.11 — Answer generation node.

    Uses Groq (openai/gpt-oss-20b) with the top-5 reranked chunks
    as context. Instructs the model to cite evidence inline using
    [Document Title, p.X] format. Never extrapolates beyond the evidence.

    Extracts citation metadata from the chunks used so the frontend
    can render citation chips.

    Returns partial state update with 'answer', 'citations', and 'route'.
    """
    query = state["query"]
    chunks = state.get("reranked_chunks", [])
    evidence_block = _build_evidence_block(chunks)

    user_msg = (
        f"Clinical question: {query}\n\n"
        f"Evidence:\n{evidence_block}\n\n"
        "Provide a clear, concise clinical answer with inline citations "
        "in [Document Title, p.X] format."
    )

    groq = _get_groq_client()
    if groq is None:
        return {
            "answer": "Groq API key not configured. Unable to generate answer.",
            "citations": [],
            "route": "answered",
        }

    try:
        response = groq.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": ANSWER_SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.1,
            max_tokens=1024,
        )
        answer_text = response.choices[0].message.content.strip()

        # Deduplicate citations from the chunks used
        seen: set[tuple] = set()
        citations: list[dict] = []
        for chunk in chunks:
            key = (chunk["document_title"], chunk.get("page_number"))
            if key not in seen:
                seen.add(key)
                citations.append({
                    "document_title": chunk["document_title"],
                    "page_number": chunk.get("page_number"),
                    "document_id": chunk["document_id"],
                })

        print(f"[Answer] {len(answer_text)} chars, {len(citations)} citations.")
        return {"answer": answer_text, "citations": citations, "route": "answered"}

    except Exception as e:
        print(f"[Answer] Groq error: {e}")
        return {
            "answer": f"An error occurred while generating the answer: {e}",
            "citations": [],
            "route": "answered",
        }
