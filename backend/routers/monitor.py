"""
monitor.py — Scheduler & Auto-Detection Monitor Router
=======================================================
Exposes REST endpoints to control and monitor the
auto-detection scheduler from the admin dashboard.

Endpoints:
    POST /monitor/start         — Start the scheduler
    POST /monitor/stop          — Stop the scheduler
    GET  /monitor/status        — Get scheduler status
    POST /monitor/scan          — Trigger a manual scan cycle
    GET  /monitor/recent        — Get recent auto-scan results
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/monitor", tags=["monitor"])


class SchedulerConfig(BaseModel):
    interval_minutes: int = 5
    twitter_query: Optional[str] = "sports highlights clip"
    youtube_query: Optional[str] = "sports game highlights"
    reddit_subreddit: Optional[str] = "sports"
    max_results_per_platform: int = 3


@router.post("/start")
async def start_scheduler(config: SchedulerConfig = SchedulerConfig()):
    """Start the auto-detection scheduler with the given configuration."""
    from services.scheduler import start_scheduler, get_scheduler_status

    status = get_scheduler_status()
    if status["running"]:
        raise HTTPException(status_code=409, detail="Scheduler is already running")

    queries = {
        "twitter": {
            "query": config.twitter_query,
            "max_results": config.max_results_per_platform,
        },
        "youtube": {
            "query": config.youtube_query,
            "max_results": config.max_results_per_platform,
        },
        "reddit": {
            "subreddit": config.reddit_subreddit,
            "max_results": config.max_results_per_platform,
        },
    }

    start_scheduler(
        interval_minutes=config.interval_minutes,
        queries=queries,
    )

    return {
        "message": f"Scheduler started — scanning every {config.interval_minutes} minutes",
        "config": config.dict(),
    }


@router.post("/stop")
async def stop_scheduler():
    """Stop the auto-detection scheduler."""
    from services.scheduler import stop_scheduler, get_scheduler_status

    status = get_scheduler_status()
    if not status["running"]:
        raise HTTPException(status_code=409, detail="Scheduler is not running")

    stop_scheduler()
    return {"message": "Scheduler stopping..."}


@router.get("/status")
async def scheduler_status():
    """Get the current scheduler status."""
    from services.scheduler import get_scheduler_status
    return get_scheduler_status()


@router.post("/scan")
async def manual_scan(config: SchedulerConfig = SchedulerConfig()):
    """Trigger a single scan cycle manually (does not affect scheduler)."""
    from services.scheduler import run_scan_cycle

    queries = {
        "twitter": {
            "query": config.twitter_query,
            "max_results": config.max_results_per_platform,
        },
        "youtube": {
            "query": config.youtube_query,
            "max_results": config.max_results_per_platform,
        },
        "reddit": {
            "subreddit": config.reddit_subreddit,
            "max_results": config.max_results_per_platform,
        },
    }

    results = run_scan_cycle(queries)

    return {
        "message": f"Manual scan complete — processed {len(results)} items",
        "total_items": len(results),
        "infringements": sum(1 for r in results if r.get("agent_verdict") == "INFRINGEMENT"),
        "suspicious": sum(1 for r in results if r.get("agent_verdict") == "SUSPICIOUS"),
        "results": results,
    }


@router.get("/recent")
async def recent_scans(limit: int = 20):
    """Get recent auto-scan detection results from Firestore."""
    try:
        from db.firestore import get_db

        db = get_db()
        if db is None:
            return {"results": [], "message": "Firestore not available"}

        query = (
            db.collection("detections")
            .where("source", "==", "auto_scan")
            .order_by("detection_timestamp", direction="DESCENDING")
            .limit(limit)
        )

        results = [doc.to_dict() for doc in query.stream()]
        return {
            "total": len(results),
            "results": results,
        }

    except Exception as e:
        return {"results": [], "error": str(e)}
