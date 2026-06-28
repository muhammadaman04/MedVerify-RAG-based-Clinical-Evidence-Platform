"""
app/graph/builder.py

Task 3.14 — Assemble and compile the MedVerify LangGraph state machine.

This is the only file that knows the full topology of the graph.
Node implementations live in app/graph/nodes/*.
State schema lives in app/graph/state.py.
Prompts live in app/graph/prompts.py.

Graph topology:
  retrieval → reranker → verifier ──┬─(score ≥ 0.75)──→ answer ──→ END
                                    ├─(score ≥ 0.50)──→ review ──→ END
                                    └─(score <  0.50)──→ gap    ──→ END
"""
from __future__ import annotations

from langgraph.graph import StateGraph, END

from app.graph.state import MedVerifyState
from app.graph.nodes import (
    retrieval_node,
    reranker_node,
    verifier_node,
    route_by_confidence,
    answer_node,
    review_queue_node,
    gap_logger_node,
)


def _build_graph():
    """Construct and compile the LangGraph StateGraph."""
    graph = StateGraph(MedVerifyState)

    # ── Register nodes ────────────────────────────────────────────────────────
    graph.add_node("retrieval", retrieval_node)
    graph.add_node("reranker",  reranker_node)
    graph.add_node("verifier",  verifier_node)
    graph.add_node("answer",    answer_node)
    graph.add_node("review",    review_queue_node)
    graph.add_node("gap",       gap_logger_node)

    # ── Linear edges ──────────────────────────────────────────────────────────
    graph.set_entry_point("retrieval")
    graph.add_edge("retrieval", "reranker")
    graph.add_edge("reranker",  "verifier")

    # ── Conditional edge: verifier → answer | review | gap ───────────────────
    graph.add_conditional_edges(
        source="verifier",
        path=route_by_confidence,
        path_map={
            "answer": "answer",
            "review": "review",
            "gap":    "gap",
        },
    )

    # ── Terminal edges ────────────────────────────────────────────────────────
    graph.add_edge("answer", END)
    graph.add_edge("review", END)
    graph.add_edge("gap",    END)

    return graph.compile()


# Module-level compiled graph — import from app.graph, not directly from here
medverify_graph = _build_graph()
