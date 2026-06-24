"""
Pinecone client — initialises connection and auto-creates the index if needed.
384-dimensional cosine index for all-MiniLM-L6-v2 embeddings.
"""
from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings

settings = get_settings()

_index = None  # module-level singleton


def get_pinecone_index():
    """
    Returns a Pinecone Index object.
    Creates the index automatically if it does not already exist.
    Returns None if PINECONE_API_KEY is not configured (dev mode without Pinecone).
    """
    global _index
    if _index is not None:
        return _index

    if not settings.pinecone_api_key:
        print("⚠️  PINECONE_API_KEY not set — vector upsert will be skipped.")
        return None

    try:
        from pinecone import Pinecone, ServerlessSpec

        pc = Pinecone(api_key=settings.pinecone_api_key)
        index_name = settings.pinecone_index_name

        existing_indexes = [idx.name for idx in pc.list_indexes()]
        if index_name not in existing_indexes:
            print(f"🔧 Creating Pinecone index '{index_name}' (384-dim, cosine)…")
            pc.create_index(
                name=index_name,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            print(f"✓ Pinecone index '{index_name}' created.")
        else:
            print(f"✓ Pinecone index '{index_name}' already exists.")

        _index = pc.Index(index_name)
        return _index

    except Exception as e:
        print(f"✗ Pinecone initialisation failed: {e}")
        return None
