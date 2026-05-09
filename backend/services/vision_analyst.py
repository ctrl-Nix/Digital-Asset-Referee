"""
vision_analyst.py — Agent 2: Vision Analyst
=============================================
The multimodal observation agent. Sends the suspect image to the
Qwen-VL vision-language model (hosted on AMD vLLM) along with
context from the Forensic Investigator's evidence, and returns
a structured visual analysis.

Exports:
    analyze(image_path: Path, evidence: dict) -> dict
"""

import json
import logging
import re
from pathlib import Path

from services.amd_inference import vision_inference

logger = logging.getLogger("dar.vision_analyst")


# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------
def _build_prompt(evidence: dict) -> str:
    """Construct the forensic vision prompt using investigator evidence."""

    # Extract key values safely
    phash_sim = evidence.get("phash_similarity", 0.0)
    phash_pct = f"{phash_sim * 100:.0f}" if phash_sim else "0"

    top_match = evidence.get("top_match")
    owner = top_match.get("owner_name", "unknown") if top_match else "unknown"

    watermark_info = ""
    if evidence.get("watermark_detected"):
        watermark_info = (
            f"An invisible watermark was detected with payload: "
            f"'{evidence.get('watermark_payload', 'N/A')}'."
        )

    return f"""You are a forensic vision analyst reviewing potential IP infringement.
The forensic investigator found {phash_pct}% hash similarity with a registered asset owned by {owner}.
{watermark_info}
Analyze this image and describe:
1. What sports/media content is shown
2. Any visible modifications (cropping, filters, overlays, watermarks)
3. Whether this appears to be a direct copy, edited version, or unrelated content
4. Confidence that this is unauthorized redistribution (High/Medium/Low)
Be specific and factual. Under 150 words."""


# ---------------------------------------------------------------------------
# Response parser
# ---------------------------------------------------------------------------
def _parse_response(raw_text: str) -> dict:
    """
    Parse the vision model's free-text response into a structured dict.
    Uses heuristics to extract key fields; falls back gracefully.
    """
    text_lower = raw_text.lower()

    # --- Detect content type ---
    if "direct copy" in text_lower or "identical" in text_lower:
        content_type = "direct_copy"
    elif any(w in text_lower for w in ["edited", "derivative", "modified", "cropped", "altered"]):
        content_type = "derivative"
    elif "unrelated" in text_lower or "no match" in text_lower:
        content_type = "unrelated"
    else:
        content_type = "derivative"  # conservative default

    # --- Detect confidence ---
    if "high" in text_lower:
        confidence = "High"
    elif "medium" in text_lower or "moderate" in text_lower:
        confidence = "Medium"
    elif "low" in text_lower:
        confidence = "Low"
    else:
        confidence = "Medium"

    # --- Detect modifications ---
    modifications = []
    mod_keywords = {
        "cropped": "cropped",
        "cropping": "cropped",
        "filter": "color_filter",
        "color": "color_filter",
        "overlay": "overlay",
        "text overlay": "text_overlay",
        "watermark": "watermark_visible",
        "logo": "logo_overlay",
        "resized": "resized",
        "compressed": "compressed",
        "blurred": "blurred",
        "flipped": "flipped",
        "mirrored": "mirrored",
        "rotated": "rotated",
        "screenshot": "screenshot",
    }
    for keyword, mod_name in mod_keywords.items():
        if keyword in text_lower and mod_name not in modifications:
            modifications.append(mod_name)

    return {
        "scene_description": raw_text.strip(),
        "modifications_detected": modifications,
        "content_type": content_type,
        "infringement_confidence": confidence,
    }


# ---------------------------------------------------------------------------
# Main analysis function
# ---------------------------------------------------------------------------
def analyze(image_path: Path, evidence: dict) -> dict:
    """
    Run the Vision Analyst agent on a suspect image.

    Args:
        image_path: Path to the image file.
        evidence: The evidence packet from Agent 1 (Forensic Investigator).

    Returns:
        Structured vision analysis dict.
    """
    logger.info("👁️  Vision Analyst starting — %s", image_path)

    result = {
        "agent": "Vision Analyst",
        "status": "running",
        "scene_description": "",
        "modifications_detected": [],
        "content_type": "unknown",
        "infringement_confidence": "Low",
    }

    try:
        prompt = _build_prompt(evidence)
        logger.info("  → Sending to Qwen-VL vision model…")

        raw_response = vision_inference(image_path, prompt)
        logger.info("  ✓ Vision model responded (%d chars)", len(raw_response))

        # Parse the free-text response into structured fields
        parsed = _parse_response(raw_response)
        result.update(parsed)
        result["status"] = "complete"

    except Exception as e:
        logger.error("  ✗ Vision analysis failed: %s", e)
        result["status"] = "error"
        result["error"] = str(e)
        result["scene_description"] = "Vision analysis unavailable"

    logger.info(
        "👁️  Vision Analyst complete — type=%s, confidence=%s",
        result["content_type"],
        result["infringement_confidence"],
    )

    return result
