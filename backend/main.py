from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, admin
from app.routers.query import router as query_router

settings = get_settings()


# ---------------------------------------------------------------------------
# Startup / Shutdown lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up shared resources on startup."""
    import threading

    def _startup():
        # 1. Build BM25 index from existing Supabase chunks
        try:
            from app.services.retrieval_service import rebuild_bm25_index
            rebuild_bm25_index()
        except Exception as e:
            print(f"⚠️  BM25 startup build failed: {e}")

        # 2. Connect to Pinecone (creates index if missing)
        try:
            from app.core.pinecone_client import get_pinecone_index
            get_pinecone_index()
        except Exception as e:
            print(f"⚠️  Pinecone startup connection failed: {e}")

    # Run in a thread so it doesn't block the async event loop
    thread = threading.Thread(target=_startup, daemon=True)
    thread.start()

    yield  # Application runs here
    # (cleanup code would go after yield if needed)


app = FastAPI(
    title="MedVerify API",
    description="AI-powered clinical evidence verification platform",
    version="0.2.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — only allow the frontend origin
# ---------------------------------------------------------------------------
origins = [o.strip() for o in settings.allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(query_router)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "service": "MedVerify API", "version": "0.2.0"}
