import asyncio
import os
import shutil
import uuid
import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.ingest import fetch_from_url, normalize_image, extract_frames, generate_preview_url
from services.fingerprint import generate_phash
from services.embedding import generate_embedding
from services.matcher import find_best_match
from services.scorer import compute_verdict
from services.gemini import describe_content
from db.firestore import save_detection, increment_detection_count

router = APIRouter()

class BatchDetectRequest(BaseModel):
    urls: List[str] = Field(..., max_items=10)


# Max 1 concurrent heavy task for Free Tiers (512MB RAM limit)
MAX_CONCURRENT_TASKS = 1
semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS)

def _run_detection_for_url(url: str) -> dict:
    detection_id = str(uuid.uuid4())
    tmp_path = None
    rep_frame = None
    preview_frame = None
    original_image_for_gemini = None

    try:
        # Step 1: Ingest
        tmp_path = fetch_from_url(url)
        is_video = tmp_path.suffix.lower() in [".mp4", ".mov", ".webm", ".avi"]

        # Step 2: Extract & Normalize
        if is_video:
            frames = extract_frames(tmp_path)
            if not frames:
                return {"url": url, "error": "No frames could be extracted from video", "status": "failed"}
            rep_frame = normalize_image(frames[0])
            total_frames = len(frames)
            preview_frame = frames[0] if frames else None
            original_image_for_gemini = frames[0] if frames else None
        else:
            rep_frame = normalize_image(tmp_path)
            frames = [rep_frame]
            total_frames = 1
            preview_frame = tmp_path
            original_image_for_gemini = tmp_path

        if not rep_frame:
            return {"url": url, "error": "Normalization failed", "status": "failed"}

        # Step 3: Fingerprinting
        query_phash = generate_phash(rep_frame)
        query_embedding = generate_embedding(rep_frame)

        # Step 4: Matching
        match = find_best_match(query_phash, query_embedding)
        similarity = match["combined_similarity"] if match else 0.0

        # Step 5: Coverage (Video Only)
        matched_frames = 1 if match else 0
        if is_video and match and total_frames > 1:
            check_frames = frames[:10]
            for f in check_frames:
                f_norm = normalize_image(f)
                if find_best_match(generate_phash(f_norm), generate_embedding(f_norm)):
                    matched_frames += 1
                if f_norm != f and f_norm.exists():
                    os.remove(f_norm)
        
        coverage_ratio = matched_frames / max(total_frames, 1)

        # Step 6: Scoring & Verdict
        verdict, confidence = compute_verdict(similarity, coverage_ratio)

        # Step 7: AI Analysis (Gemini)
        gemini_desc = None
        if match:
            try:
                gemini_desc = describe_content(original_image_for_gemini)
            except Exception as e:
                print(f"Gemini failed for {url}: {e}")
                gemini_desc = "AI analysis unavailable"

        # Step 8: Update Stats
        if match and verdict in ["Pirated", "Suspicious"]:
            increment_detection_count(match["content_id"])

        result = {
            "url": url,
            "detection_id": detection_id,
            "verdict": verdict,
            "confidence_score": confidence,
            "similarity_score": similarity,
            "coverage_ratio": coverage_ratio,
            "matched_content_id": match["content_id"] if match else None,
            "matched_owner": match["owner_name"] if match else None,
            "matched_file_url": match.get("file_url") if match else None,
            "submitted_url": generate_preview_url(preview_frame) if preview_frame else None,
            "gemini_description": gemini_desc,
            "detection_timestamp": datetime.datetime.utcnow().isoformat(),
            "status": "success"
        }

        save_detection(result)
        return result

    except Exception as exc:
        import traceback
        print(f"Batch detection error for {url}: {str(exc)}")
        print(traceback.format_exc())
        return {"url": url, "error": str(exc), "status": "failed"}
    finally:
        try:
            if tmp_path and tmp_path.exists():
                os.remove(tmp_path)
            if rep_frame and rep_frame != tmp_path and isinstance(rep_frame, Path) and rep_frame.exists():
                os.remove(rep_frame)
            if preview_frame and preview_frame != tmp_path and isinstance(preview_frame, Path) and preview_frame.exists():
                os.remove(preview_frame)
            if original_image_for_gemini and original_image_for_gemini != tmp_path and isinstance(original_image_for_gemini, Path) and original_image_for_gemini.exists():
                os.remove(original_image_for_gemini)
        except Exception as e:
            print(f"Cleanup warning for {url}: {e}")
