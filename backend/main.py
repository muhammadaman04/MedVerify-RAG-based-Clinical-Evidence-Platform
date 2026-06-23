from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, admin

settings = get_settings()

app = FastAPI(
    title="MedVerify API",
    description="AI-powered clinical evidence verification platform",
    version="0.1.0",
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


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "service": "MedVerify API"}
