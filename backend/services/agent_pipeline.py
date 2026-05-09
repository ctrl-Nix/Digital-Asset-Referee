"""
agent_pipeline.py — D.A.R. Agent Orchestrator
===============================================
Chains the three agents in sequence to produce a complete
infringement analysis:

    1. Forensic Investigator  → deterministic evidence gathering
    2. Vision Analyst         → multimodal visual inspection (Qwen-VL)
    3. Chief Referee          → chain-of-thought adjudication (Qwen-72B)

Exports:
    run_pipeline(image_path: Path) -> dict
    run_pipeline_streaming(image_path: Path) -> Generator[dict]
"""

import logging
import time
from pathlib import Path
from typing import Generator

from services import investigator
from services import vision_analyst
from services import chief_referee

logger = logging.getLogger("dar.pipeline")


def run_pipeline(image_path: Path) -> dict:
    """
    Execute the full 3-agent pipeline sequentially.

    Args:
        image_path: Path to the suspect image.

    Returns:
        Combined result dict containing all agent outputs
        plus the final verdict and confidence.
    """
    pipeline_start = time.time()
    logger.info("=" * 60)
    logger.info("D.A.R. Agent Pipeline — Starting")
    logger.info("  Image: %s", image_path)
    logger.info("=" * 60)

    # ------------------------------------------------------------------
    # Agent 1: Forensic Investigator
    # ------------------------------------------------------------------
    logger.info("▶ Stage 1/3 — Forensic Investigator")
    evidence = investigator.investigate(image_path)
    logger.info("  ✓ Evidence collected")

    # ------------------------------------------------------------------
    # Agent 2: Vision Analyst
    # ------------------------------------------------------------------
    logger.info("▶ Stage 2/3 — Vision Analyst")
    vision = vision_analyst.analyze(image_path, evidence)
    logger.info("  ✓ Visual analysis complete")

    # ------------------------------------------------------------------
    # Agent 3: Chief Referee
    # ------------------------------------------------------------------
    logger.info("▶ Stage 3/3 — Chief Referee")
    verdict = chief_referee.adjudicate(evidence, vision)
    logger.info("  ✓ Verdict issued")

    # ------------------------------------------------------------------
    # Assemble final result
    # ------------------------------------------------------------------
    elapsed = round(time.time() - pipeline_start, 2)

    result = {
        "investigator": evidence,
        "vision_analyst": vision,
        "chief_referee": verdict,
        "final_verdict": verdict.get("verdict", "SUSPICIOUS"),
        "confidence": verdict.get("confidence", 0.0),
        "pipeline_complete": True,
        "pipeline_time_seconds": elapsed,
    }

    logger.info("=" * 60)
    logger.info(
        "D.A.R. Pipeline Complete — %s (%.1f%%) in %.2fs",
        result["final_verdict"],
        result["confidence"] * 100,
        elapsed,
    )
    logger.info("=" * 60)

    return result


def run_pipeline_streaming(image_path: Path) -> Generator[dict, None, None]:
    """
    Execute the 3-agent pipeline, yielding each agent's result
    as it completes. Designed for SSE streaming to the frontend.

    Yields:
        dict with keys: {"agent": str, "stage": int, "data": dict}
    """
    pipeline_start = time.time()
    logger.info("D.A.R. Streaming Pipeline — Starting for %s", image_path)

    # --- Agent 1 ---
    yield {
        "agent": "Forensic Investigator",
        "stage": 1,
        "total_stages": 3,
        "status": "running",
    }

    evidence = investigator.investigate(image_path)

    yield {
        "agent": "Forensic Investigator",
        "stage": 1,
        "total_stages": 3,
        "status": "complete",
        "data": evidence,
    }

    # --- Agent 2 ---
    yield {
        "agent": "Vision Analyst",
        "stage": 2,
        "total_stages": 3,
        "status": "running",
    }

    vision = vision_analyst.analyze(image_path, evidence)

    yield {
        "agent": "Vision Analyst",
        "stage": 2,
        "total_stages": 3,
        "status": "complete",
        "data": vision,
    }

    # --- Agent 3 ---
    yield {
        "agent": "Chief Referee",
        "stage": 3,
        "total_stages": 3,
        "status": "running",
    }

    verdict = chief_referee.adjudicate(evidence, vision)

    yield {
        "agent": "Chief Referee",
        "stage": 3,
        "total_stages": 3,
        "status": "complete",
        "data": verdict,
    }

    # --- Final combined result ---
    elapsed = round(time.time() - pipeline_start, 2)

    yield {
        "agent": "Pipeline",
        "stage": "final",
        "total_stages": 3,
        "status": "complete",
        "data": {
            "final_verdict": verdict.get("verdict", "SUSPICIOUS"),
            "confidence": verdict.get("confidence", 0.0),
            "pipeline_complete": True,
            "pipeline_time_seconds": elapsed,
        },
    }

    logger.info(
        "D.A.R. Streaming Pipeline Complete — %s in %.2fs",
        verdict.get("verdict"),
        elapsed,
    )
