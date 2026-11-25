from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    # --- Shared Infrastructure (Logging, Config, Security) ---
    app.state.ready = True
    yield
    app.state.ready = False


app = FastAPI(title="Nerdos API", version="0.1.0", lifespan=lifespan)

# Allowed origins will later come from src/shared/config.py.
allowed_origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


# --- Module Routers (e.g., app.include_router(..., prefix="/api/v1")) ---
