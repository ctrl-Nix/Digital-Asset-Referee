"""
scheduler.py — D.A.R. Auto-Detection Scheduler
================================================
Runs a background loop every N minutes that:
    1. Scrapes media from Twitter/X, YouTube, Reddit
    2. Feeds each item through the 3-agent detection pipeline
    3. Logs results to Firestore
    4. Triggers real-time alerts for infringement detections

Can be started as a background task from FastAPI or run standalone.

Exports:
    start_scheduler(interval_minutes: int) -> None
    stop_scheduler() -> None
    run_scan_cycle() -> list[dict]   (manual trigger)
    get_scheduler_status() -> dict
"""

import logging
import time
import os
import asyncio
import threading
import datetime
import uuid
from pathlib import Path
from typing import Optional

logger = logging.getLogger("dar.scheduler")

# ---------------------------------------------------------------------------
# Scheduler state
# ---------------------------------------------------------------------------
_scheduler_thread: Optional[threading.Thread] = None
_scheduler_running = False
_last_scan_time: Optional[str] = None
_last_scan_results: list = []
_total_scans = 0
_total_detections = 0


# ---------------------------------------------------------------------------
# Core scan cycle
# ---------------------------------------------------------------------------
def run_scan_cycle(queries: dict = None) -> list[dict]:
    """
    Execute one complete scrape → detect → store cycle.

    Args:
        queries: Custom search queries (see scrapers.scrape_all).
                 If None, uses default sports-related queries.

    Returns:
        List of detection results for this scan cycle.
    """
    global _last_scan_time, _last_scan_results, _total_scans, _total_detections

    cycle_id = str(uuid.uuid4())[:8]
    cycle_start = time.time()
    logger.info("=" * 60)
    logger.info("🔄 Scan Cycle [%s] — Starting", cycle_id)
    logger.info("=" * 60)

    results = []

    # ------------------------------------------------------------------
    # Step 1: Scrape media from platforms
    # ------------------------------------------------------------------
    try:
        from services.scrapers import scrape_all
        scraped_items = scrape_all(queries)
        logger.info("📥 Scraped %d items across platforms", len(scraped_items))
    except Exception as e:
        logger.error("Scraping failed: %s", e)
        scraped_items = []

    # ------------------------------------------------------------------
    # Step 2: Run detection pipeline on each item
    # ------------------------------------------------------------------
    for i, item in enumerate(scraped_items):
        local_path = Path(item.get("local_path", ""))
        if not local_path.exists():
            logger.warning("  Skipping — file not found: %s", local_path)
            continue

        logger.info(
            "🔍 Processing %d/%d — %s [%s]",
            i + 1, len(scraped_items),
            item.get("metadata", {}).get("title", "untitled")[:50],
            item["platform"],
        )

        try:
            from services.agent_pipeline import run_pipeline
            pipeline_result = run_pipeline(local_path)

            detection_result = {
                "detection_id": str(uuid.uuid4()),
                "source": "auto_scan",
                "scan_cycle_id": cycle_id,
                "platform": item["platform"],
                "source_url": item["url"],
                "source_metadata": item.get("metadata", {}),
                "verdict": pipeline_result.get("final_verdict", "SUSPICIOUS"),
                "agent_verdict": pipeline_result.get("final_verdict"),
                "confidence_score": pipeline_result.get("confidence", 0.0),
                "agent_reasoning": {
                    "investigator": pipeline_result.get("investigator", {}),
                    "vision_analyst": pipeline_result.get("vision_analyst", {}),
                    "chief_referee": pipeline_result.get("chief_referee", {}),
                },
                "pipeline_time_seconds": pipeline_result.get("pipeline_time_seconds"),
                "detection_timestamp": datetime.datetime.utcnow().isoformat(),
            }

            # Map to legacy verdict for compatibility
            verdict_map = {
                "INFRINGEMENT": "Pirated",
                "SUSPICIOUS": "Suspicious",
                "FAIR_USE": "Original",
                "NO_MATCH": "Unknown",
            }
            detection_result["verdict"] = verdict_map.get(
                detection_result["agent_verdict"],
                detection_result["agent_verdict"]
            )

            # Extract match info from investigator
            inv = pipeline_result.get("investigator", {})
            top_match = inv.get("top_match")
            if top_match:
                detection_result["matched_content_id"] = top_match.get("content_id")
                detection_result["matched_owner"] = top_match.get("owner_name")
                detection_result["similarity_score"] = top_match.get("combined_similarity", 0.0)

            detection_result["watermark_verified"] = inv.get("watermark_detected", False)
            detection_result["gemini_description"] = pipeline_result.get(
                "vision_analyst", {}
            ).get("scene_description", "")

            results.append(detection_result)

        except Exception as e:
            logger.error("  Pipeline failed for %s: %s", item["url"], e)
            results.append({
                "detection_id": str(uuid.uuid4()),
                "source": "auto_scan",
                "scan_cycle_id": cycle_id,
                "platform": item["platform"],
                "source_url": item["url"],
                "verdict": "Error",
                "error": str(e),
                "detection_timestamp": datetime.datetime.utcnow().isoformat(),
            })

        # Clean up downloaded file
        try:
            if local_path.exists():
                os.remove(local_path)
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Step 3: Save results to Firestore
    # ------------------------------------------------------------------
    infringements = [r for r in results if r.get("agent_verdict") == "INFRINGEMENT"]
    suspicious = [r for r in results if r.get("agent_verdict") == "SUSPICIOUS"]

    try:
        from db.firestore import save_detection, increment_detection_count

        for result in results:
            save_detection(result)

            # Increment count for matched content
            if result.get("agent_verdict") in ["INFRINGEMENT", "SUSPICIOUS"]:
                content_id = result.get("matched_content_id")
                if content_id:
                    increment_detection_count(content_id)

        logger.info("💾 Saved %d results to Firestore", len(results))

    except Exception as e:
        logger.error("Firestore save failed: %s", e)

    # ------------------------------------------------------------------
    # Step 4: Log summary
    # ------------------------------------------------------------------
    elapsed = round(time.time() - cycle_start, 2)
    _last_scan_time = datetime.datetime.utcnow().isoformat()
    _last_scan_results = results
    _total_scans += 1
    _total_detections += len(results)

    logger.info("=" * 60)
    logger.info("🔄 Scan Cycle [%s] — Complete in %.1fs", cycle_id, elapsed)
    logger.info("   Scraped: %d | Processed: %d", len(scraped_items), len(results))
    logger.info("   🚨 Infringements: %d | ⚠️ Suspicious: %d",
                len(infringements), len(suspicious))
    logger.info("=" * 60)

    return results


# ---------------------------------------------------------------------------
# Background scheduler
# ---------------------------------------------------------------------------
def _scheduler_loop(interval_minutes: int, queries: dict = None):
    """Internal loop that runs scan cycles at the specified interval."""
    global _scheduler_running

    logger.info("🕐 Scheduler started — interval: %d minutes", interval_minutes)

    while _scheduler_running:
        try:
            run_scan_cycle(queries)
        except Exception as e:
            logger.error("Scan cycle error: %s", e)

        # Sleep in small increments so we can stop quickly
        sleep_seconds = interval_minutes * 60
        for _ in range(sleep_seconds):
            if not _scheduler_running:
                break
            time.sleep(1)

    logger.info("🛑 Scheduler stopped")


def start_scheduler(interval_minutes: int = 5, queries: dict = None):
    """
    Start the auto-detection scheduler as a background thread.

    Args:
        interval_minutes: How often to run scan cycles (default: 5).
        queries: Custom scraper queries (see scrapers.scrape_all).
    """
    global _scheduler_thread, _scheduler_running

    if _scheduler_running:
        logger.warning("Scheduler is already running")
        return

    _scheduler_running = True
    _scheduler_thread = threading.Thread(
        target=_scheduler_loop,
        args=(interval_minutes, queries),
        daemon=True,
        name="dar-scheduler",
    )
    _scheduler_thread.start()
    logger.info("✅ Scheduler started (interval=%d min)", interval_minutes)


def stop_scheduler():
    """Stop the auto-detection scheduler."""
    global _scheduler_running

    if not _scheduler_running:
        logger.warning("Scheduler is not running")
        return

    _scheduler_running = False
    logger.info("⏹ Scheduler stopping...")


def get_scheduler_status() -> dict:
    """Return current scheduler status."""
    return {
        "running": _scheduler_running,
        "last_scan_time": _last_scan_time,
        "total_scans": _total_scans,
        "total_detections": _total_detections,
        "last_scan_count": len(_last_scan_results),
        "last_scan_infringements": sum(
            1 for r in _last_scan_results
            if r.get("agent_verdict") == "INFRINGEMENT"
        ),
    }
