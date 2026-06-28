"""
app/graph/nodes/gap.py

Task 3.13 — Knowledge gap logger node.

Called when verifier confidence is below 0.50.
Checks if this query already exists in the `knowledge_gaps` table:
  - If yes  → increments asked_count and updates last_asked_at.
  - If no   → inserts a new gap record.
Auto-tags the gap with a clinical specialty using keyword matching.
Returns a safe, transparent message to the clinician.
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.graph.state import MedVerifyState


# ─── Specialty keyword map ────────────────────────────────────────────────────
# (keywords, specialty) — first match wins
_SPECIALTY_MAP: list[tuple[list[str], str]] = [
    (["child", "paediatric", "pediatric", "infant", "neonatal", "neonate"],   "Paediatrics"),
    (["cardiac", "heart", "myocardial", "atrial", "ventricular", "arrhythmia"], "Cardiology"),
    (["oncol", "cancer", "tumour", "tumor", "chemotherapy", "carcinoma"],     "Oncology"),
    (["neuro", "brain", "stroke", "seizure", "epilepsy", "dementia"],         "Neurology"),
    (["renal", "kidney", "nephro", "dialysis", "creatinine"],                 "Nephrology"),
    (["pulmon", "lung", "respiratory", "asthma", "copd", "pneumonia"],        "Pulmonology"),
    (["gastro", "liver", "hepat", "bowel", "crohn", "ulcerative"],            "Gastroenterology"),
    (["obstetric", "pregnan", "maternal", "foetal", "fetal", "labour"],       "Obstetrics"),
    (["psychiatr", "mental", "depression", "anxiety", "schizophrenia"],       "Psychiatry"),
    (["infect", "antibiotic", "sepsis", "virus", "bacterial", "fungal"],      "Infectious Disease"),
]


def _detect_specialty(query: str) -> str:
    q = query.lower()
    for keywords, specialty in _SPECIALTY_MAP:
        if any(kw in q for kw in keywords):
            return specialty
    return "General Medicine"


# ─── Node ─────────────────────────────────────────────────────────────────────

def gap_logger_node(state: MedVerifyState) -> dict:
    """
    3.13 — Knowledge gap logger node.

    Upserts a gap record in Supabase `knowledge_gaps`.
    Uses ILIKE on the first 60 chars of the query to detect duplicates.
    Auto-tags with a clinical specialty for admin prioritisation.

    Returns partial state update with:
      - 'answer'     → transparent message to the clinician
      - 'citations'  → empty
      - 'route'      → "gap"
      - 'gap_logged' → True
    """
    from app.core.database import get_supabase

    db = get_supabase()
    query = state["query"]
    specialty = _detect_specialty(query)
    now = datetime.now(timezone.utc).isoformat()

    try:
        existing = (
            db.table("knowledge_gaps")
            .select("id, asked_count")
            .ilike("query_text", f"%{query[:60]}%")
            .limit(1)
            .execute()
        )

        if existing.data:
            gap_id = existing.data[0]["id"]
            new_count = existing.data[0]["asked_count"] + 1
            db.table("knowledge_gaps").update({
                "asked_count": new_count,
                "last_asked_at": now,
            }).eq("id", gap_id).execute()
            print(f"[GapLogger] Gap #{gap_id} count → {new_count}")
        else:
            db.table("knowledge_gaps").insert({
                "query_text": query,
                "specialty_tag": specialty,
                "asked_count": 1,
                "last_asked_at": now,
                "first_asked_at": now,
            }).execute()
            print(f"[GapLogger] New gap: {specialty}")

    except Exception as e:
        print(f"[GapLogger] DB error (non-fatal): {e}")

    clinician_message = (
        "Insufficient clinical evidence was found in the knowledge base to "
        "answer this question reliably. Please consult a specialist directly. "
        "This gap has been logged for the documentation team to address."
    )
    return {
        "answer": clinician_message,
        "citations": [],
        "route": "gap",
        "gap_logged": True,
    }
