"""
investigator.py — Agent 1: Forensic Investigator
=================================================
The evidence-gathering agent. Wraps D.A.R.'s existing forensic
toolkit (pHash fingerprinting, CNN embeddings, watermark extraction,
and database matching) into a single structured evidence packet.

This agent does NOT call any LLM — it is purely deterministic
forensics. Its output feeds Agent 2 (Vision Analyst) and
Agent 3 (Chief Referee).

Exports:
    investigate(image_path: Path) -> dict
"""

import logging
import time
from pathlib import Path

logger = logging.getLogger("dar.investigator")

# ---------------------------------------------------------------------------
# Import existing forensic services
# ---------------------------------------------------------------------------
from services.fingerprint import generate_phash, phash_similarity
from services.watermark import extract_watermark
from services.matcher import find_best_match
from services.embedding import generate_embedding
from services.ingest import normalize_image


def investigate(image_path: Path) -> dict:
    """
    Run the full forensic investigation pipeline on a single image.

    Steps:
        1. Normalize the image (resize to 256×256 for hashing)
        2. Generate perceptual hash (pHash)
        3. Generate CNN embedding (MobileNetV2)
        4. Search the registered asset database for the best match
        5. Extract any invisible watermark payload
        6. Compute similarity metrics

    Args:
        image_path: Path to the image file to investigate.

    Returns:
        Structured evidence packet (dict) with all forensic findings.
    """
    start_time = time.time()
    logger.info("🔍 Forensic Investigator starting — %s", image_path)

    evidence = {
        "agent": "Forensic Investigator",
        "status": "running",
        "phash": None,
        "hamming_distance": None,
        "phash_similarity": 0.0,
        "watermark_detected": False,
        "watermark_payload": None,
        "top_match": None,
        "embedding_generated": False,
        "frame_coverage": 1.0,
        "errors": [],
    }

    # ------------------------------------------------------------------
    # Step 1: Normalize the image
    # ------------------------------------------------------------------
    try:
        norm_path = normalize_image(image_path)
        logger.info("  ✓ Image normalized → %s", norm_path)
    except Exception as e:
        logger.error("  ✗ Normalization failed: %s", e)
        evidence["errors"].append(f"normalization: {e}")
        norm_path = image_path  # fallback to original

    # ------------------------------------------------------------------
    # Step 2: Generate perceptual hash
    # ------------------------------------------------------------------
    try:
        query_phash = generate_phash(norm_path)
        evidence["phash"] = query_phash
        logger.info("  ✓ pHash generated → %s", query_phash)
    except Exception as e:
        logger.error("  ✗ pHash generation failed: %s", e)
        evidence["errors"].append(f"phash: {e}")
        query_phash = None

    # ------------------------------------------------------------------
    # Step 3: Generate CNN embedding
    # ------------------------------------------------------------------
    try:
        query_embedding = generate_embedding(norm_path)
        evidence["embedding_generated"] = True
        logger.info("  ✓ CNN embedding generated (dim=%d)", len(query_embedding))
    except Exception as e:
        logger.error("  ✗ Embedding generation failed: %s", e)
        evidence["errors"].append(f"embedding: {e}")
        query_embedding = [0.0] * 1280  # fallback zero vector

    # ------------------------------------------------------------------
    # Step 4: Search for best match in registered asset database
    # ------------------------------------------------------------------
    if query_phash:
        try:
            match = find_best_match(query_phash, query_embedding)
            if match:
                # Compute detailed similarity metrics
                match_phash = match.get("phash")
                if match_phash:
                    from services.fingerprint import hamming_distance
                    h_dist = hamming_distance(query_phash, match_phash)
                    p_sim = phash_similarity(query_phash, match_phash)
                    evidence["hamming_distance"] = h_dist
                    evidence["phash_similarity"] = round(p_sim, 4)

                evidence["top_match"] = {
                    "content_id": match.get("content_id"),
                    "owner_name": match.get("owner_name"),
                    "combined_similarity": round(
                        match.get("combined_similarity", 0.0), 4
                    ),
                    "file_url": match.get("file_url"),
                }
                logger.info(
                    "  ✓ Match found → %s (sim=%.2f)",
                    match.get("content_id"),
                    match.get("combined_similarity", 0.0),
                )
            else:
                logger.info("  ○ No match found in registered asset database")
        except Exception as e:
            logger.error("  ✗ Database matching failed: %s", e)
            evidence["errors"].append(f"matcher: {e}")

    # ------------------------------------------------------------------
    # Step 5: Extract invisible watermark
    # ------------------------------------------------------------------
    try:
        watermark_payload = extract_watermark(norm_path)
        if watermark_payload:
            evidence["watermark_detected"] = True
            evidence["watermark_payload"] = watermark_payload
            logger.info("  ✓ Watermark detected → %s", watermark_payload)
        else:
            logger.info("  ○ No watermark found")
    except Exception as e:
        logger.error("  ✗ Watermark extraction failed: %s", e)
        evidence["errors"].append(f"watermark: {e}")

    # ------------------------------------------------------------------
    # Finalize
    # ------------------------------------------------------------------
    elapsed = round(time.time() - start_time, 2)
    evidence["status"] = "complete"
    evidence["processing_time_seconds"] = elapsed

    # Clean up errors list (remove if empty for cleaner output)
    if not evidence["errors"]:
        del evidence["errors"]

    logger.info(
        "🔍 Forensic Investigator complete — %.2fs | match=%s | watermark=%s",
        elapsed,
        evidence["top_match"] is not None,
        evidence["watermark_detected"],
    )

    return evidence
