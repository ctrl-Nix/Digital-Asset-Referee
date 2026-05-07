from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Ensure temp directory exists
Path("/tmp/dar").mkdir(parents=True, exist_ok=True)

from routers import register, detect, assets, batch

app = FastAPI(title="Digital Asset Referee — D.A.R. API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(register.router)
app.include_router(detect.router)
app.include_router(assets.router)
app.include_router(batch.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
