from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

# Ensure temp directory exists
Path("/tmp/dar").mkdir(parents=True, exist_ok=True)

# Fixed Imports: Removed 'monitor' which was causing the crash
from routers import register, detect, assets, batch, ai_router

app = FastAPI(title="Digital Asset Protection API — AMD Powered")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include only the existing routers
app.include_router(register.router)
app.include_router(detect.router)
app.include_router(assets.router)
app.include_router(batch.router)
app.include_router(ai_router.router) # Added the new AMD AI router
# app.include_router(monitor.router) # Commented out because the file is missing

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mount the React static files (only if the directory exists)
static_dir = Path(__file__).parent / "static"
if static_dir.exists() and static_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
    
    # Catch-all route to serve the React index.html for SPA routing
    @app.api_route("/{path_name:path}", methods=["GET"])
    async def catch_all(path_name: str):
        if path_name.startswith("api/") or path_name in ["health", "detect", "register", "assets", "batch"]:
            return {"error": "Not found"}
        
        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"error": "Frontend build not found"}


