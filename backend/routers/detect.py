"""
detect.py — Detection Router (Agent Pipeline + SSE Streaming)
=============================================================
Wires the 3-agent D.A.R. pipeline into the FastAPI detection
endpoint. Replaces the legacy fingerprint+embedding+matcher+scorer
block with the full agent orchestrator.

Endpoints:
    POST /detect              — Run full agent pipeline on uploaded media
    GET  /detections/{id}     — Retrieve a detection result
    GET  /detections/{id}/report — Download PDF evidence report
    GET  /detect/stream/{id}  — SSE stream of agent reasoning
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from pathlib import Path
import uuid, shutil, os, datetime, base64, json, asyncio

router = APIRouter()


@router.post("/detect")
async def detect_media(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None)
):
    detection_id = str(uuid.uuid4())
    tmp_path = None
    rep_frame = None
    preview_frame = None
    original_image_for_analysis = None

<<<<<<< HEAD
    # Lazy load heavy modules to save RAM
    from services.ingest import fetch_from_url, normalize_image, extract_frames, generate_preview_url
    from services.fingerprint import generate_phash
    from services.agent_pipeline import run_pipeline
    from db.firestore import save_detection, increment_detection_count
    import cv2

=======
  # Lazy load heavy modules to save RAM
  from services.ingest import fetch_from_url, normalize_image, extract_frames, generate_preview_url
  from services.fingerprint import generate_phash
  from services.matcher import find_best_match
  from services.scorer import compute_verdict
  from services.report import generate_evidence_report
  from db.firestore import save_detection, increment_detection_count
  import cv2

  def generate_embedding(image):
    """Placeholder: AMD inference will replace this"""
    return [0.95] * 1280

  def describe_content(image):
    """Placeholder: AMD inference will replace this"""
    return "AI analysis unavailable"

  try:
    if file:
      tmp_path = Path(f"/tmp/dap/{detection_id}_{file.filename}")
      tmp_path.parent.mkdir(parents=True, exist_ok=True)
      with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    elif url:
      tmp_path = fetch_from_url(url)
    else:
      return {"error": "Provide a file or URL"}

    is_video = tmp_path.suffix.lower() in [".mp4", ".mov", ".webm", ".avi"]

    if is_video:
      frames = extract_frames(tmp_path)
      if not frames:
        return {"error": "Could not extract frames from video"}
      rep_frame = normalize_image(frames[0])
      total_frames = len(frames)
      preview_frame = frames[0]
      original_image_for_gemini = frames[0]
    else:
      rep_frame = normalize_image(tmp_path)
      total_frames = 1
      preview_frame = tmp_path
      original_image_for_gemini = tmp_path

    if not rep_frame:
      return {"error": "Could not process media"}

    # Generate preview URL
    submitted_preview_url = generate_preview_url(preview_frame) if preview_frame else None

    query_phash = generate_phash(rep_frame)
    query_embedding = generate_embedding(rep_frame)

    match = find_best_match(query_phash, query_embedding)
    similarity = match["combined_similarity"] if match else 0.0

    # Coverage ratio
    matched_frames = 1 if match else 0
    if is_video and match and total_frames > 1:
      # Check first 10 frames
      from services.ingest import extract_frames
      video_frames = extract_frames(tmp_path)
      matched_count = 0
      for f in video_frames[:10]:
          f_norm = normalize_image(f)
          if find_best_match(generate_phash(f_norm), generate_embedding(f_norm)):
              matched_count += 1
          if f_norm != f and f_norm.exists():
              os.remove(f_norm)
      matched_frames = matched_count
    
    coverage_ratio = matched_frames / max(total_frames, 1)
    verdict, confidence = compute_verdict(similarity, coverage_ratio)

    # Gemini description & Heatmap
    gemini_desc = None
    heatmap_b64 = None
    if match:
        # Gemini
        try:
          gemini_desc = describe_content(original_image_for_gemini)
        except Exception as e:
          print(f"Gemini failed: {e}")
          gemini_desc = "AI analysis unavailable"
        
        # Heatmap (if local_path exists)
        try:
            match_path = Path(match.get("local_path", ""))
            if match_path.exists():
                from services.heatmap import generate_heatmap
                hm_out = Path(f"/tmp/dap/hm_{detection_id}.jpg")
                generate_heatmap(rep_frame, match_path, hm_out)
                if hm_out.exists():
                    with open(hm_out, "rb") as hm_f:
                        heatmap_b64 = base64.b64encode(hm_f.read()).decode("utf-8")
                    os.remove(hm_out)
        except Exception as e:
            print(f"Heatmap generation failed: {e}")

    # Forensic Watermark Extraction
    from services.watermark import extract_watermark
    watermark_found = extract_watermark(rep_frame)

    # Increment detection count
    if match and verdict in ["Pirated", "Suspicious"]:
      increment_detection_count(match["content_id"])

    result = {
      "detection_id": detection_id,
      "verdict": verdict,
      "confidence_score": confidence,
      "similarity_score": similarity,
      "coverage_ratio": coverage_ratio,
      "matched_content_id": match["content_id"] if match else None,
      "matched_owner": match["owner_name"] if match else None,
      "matched_file_url": match.get("file_url") if match else None,
      "submitted_url": submitted_preview_url,
      "watermark_verified": watermark_found is not None,
      "watermark_payload": watermark_found,
      "heatmap_image": heatmap_b64,
      "gemini_description": gemini_desc,
      "detection_timestamp": datetime.datetime.utcnow().isoformat(),
    }

    save_detection(result)
    return result

  except Exception as e:
    import traceback
    print(f"CRITICAL ERROR in /detect: {str(e)}")
    print(traceback.format_exc())
    return {"error": f"Internal Server Error: {str(e)}"}

  finally:
>>>>>>> 48c5ffe (Removed Gemini embeddings and added AMD inference pipeline)
    try:
        if file:
            tmp_path = Path(f"/tmp/dap/{detection_id}_{file.filename}")
            tmp_path.parent.mkdir(parents=True, exist_ok=True)
            with open(tmp_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
        elif url:
            tmp_path = fetch_from_url(url)
        else:
            return {"error": "Provide a file or URL"}

        is_video = tmp_path.suffix.lower() in [".mp4", ".mov", ".webm", ".avi"]

        if is_video:
            frames = extract_frames(tmp_path)
            if not frames:
                return {"error": "Could not extract frames from video"}
            rep_frame = normalize_image(frames[0])
            total_frames = len(frames)
            preview_frame = frames[0]
            original_image_for_analysis = frames[0]
        else:
            rep_frame = normalize_image(tmp_path)
            total_frames = 1
            preview_frame = tmp_path
            original_image_for_analysis = tmp_path

        if not rep_frame:
            return {"error": "Could not process media"}

        # Generate preview URL
        submitted_preview_url = generate_preview_url(preview_frame) if preview_frame else None

        # ============================================================
        # 🤖 Run the 3-Agent Pipeline (replaces legacy scorer logic)
        # ============================================================
        pipeline_result = run_pipeline(rep_frame)

        # Map pipeline result to response format
        verdict = pipeline_result["final_verdict"]
        confidence = pipeline_result["confidence"]
        gemini_description = pipeline_result["vision_analyst"]["scene_description"]

        # Extract match info from investigator evidence
        investigator_data = pipeline_result["investigator"]
        top_match = investigator_data.get("top_match")
        similarity = top_match["combined_similarity"] if top_match else 0.0

        # Coverage ratio from video frame analysis
        coverage_ratio = investigator_data.get("frame_coverage", 1.0)

        # Video frame coverage (check multiple frames if video)
        if is_video and top_match and total_frames > 1:
            from services.embedding import generate_embedding
            from services.matcher import find_best_match
            video_frames = extract_frames(tmp_path)
            matched_count = 0
            for f in video_frames[:10]:
                f_norm = normalize_image(f)
                if find_best_match(generate_phash(f_norm), generate_embedding(f_norm)):
                    matched_count += 1
                if f_norm != f and f_norm.exists():
                    os.remove(f_norm)
            coverage_ratio = matched_count / max(total_frames, 1)

        # Heatmap generation (if match has local_path)
        heatmap_b64 = None
        if top_match:
            try:
                match_path = Path(top_match.get("file_url", "") or "")
                if match_path.exists():
                    from services.heatmap import generate_heatmap
                    hm_out = Path(f"/tmp/dap/hm_{detection_id}.jpg")
                    generate_heatmap(rep_frame, match_path, hm_out)
                    if hm_out.exists():
                        with open(hm_out, "rb") as hm_f:
                            heatmap_b64 = base64.b64encode(hm_f.read()).decode("utf-8")
                        os.remove(hm_out)
            except Exception as e:
                print(f"Heatmap generation failed: {e}")

        # Map verdict to legacy format for backward compatibility
        verdict_map = {
            "INFRINGEMENT": "Pirated",
            "SUSPICIOUS": "Suspicious",
            "FAIR_USE": "Original",
            "NO_MATCH": "Unknown",
        }
        display_verdict = verdict_map.get(verdict, verdict)

        # Increment detection count if infringement detected
        if top_match and verdict in ["INFRINGEMENT", "SUSPICIOUS"]:
            increment_detection_count(top_match["content_id"])

        result = {
            "detection_id": detection_id,
            "verdict": display_verdict,
            "agent_verdict": verdict,
            "confidence_score": confidence,
            "similarity_score": similarity,
            "coverage_ratio": coverage_ratio,
            "matched_content_id": top_match["content_id"] if top_match else None,
            "matched_owner": top_match["owner_name"] if top_match else None,
            "matched_file_url": top_match.get("file_url") if top_match else None,
            "submitted_url": submitted_preview_url,
            "watermark_verified": investigator_data.get("watermark_detected", False),
            "watermark_payload": investigator_data.get("watermark_payload"),
            "heatmap_image": heatmap_b64,
            "gemini_description": gemini_description,
            "detection_timestamp": datetime.datetime.utcnow().isoformat(),
            # 🤖 Full agent reasoning (for SSE streaming & dashboard)
            "agent_reasoning": {
                "investigator": pipeline_result["investigator"],
                "vision_analyst": pipeline_result["vision_analyst"],
                "chief_referee": pipeline_result["chief_referee"],
            },
            "pipeline_time_seconds": pipeline_result.get("pipeline_time_seconds"),
        }

        save_detection(result)
        return result

    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR in /detect: {str(e)}")
        print(traceback.format_exc())
        return {"error": f"Internal Server Error: {str(e)}"}

    finally:
        try:
            if tmp_path and tmp_path.exists():
                os.remove(tmp_path)
            if rep_frame and rep_frame != tmp_path and rep_frame.exists():
                os.remove(rep_frame)
            if preview_frame and preview_frame != tmp_path and isinstance(preview_frame, Path) and preview_frame.exists():
                os.remove(preview_frame)
            if original_image_for_analysis and original_image_for_analysis != tmp_path and isinstance(original_image_for_analysis, Path) and original_image_for_analysis.exists():
                os.remove(original_image_for_analysis)
        except Exception as e:
            print(f"Cleanup warning: {e}")


# ---------------------------------------------------------------------------
# SSE Streaming Endpoint — Real-time agent reasoning
# ---------------------------------------------------------------------------
@router.get("/detect/stream/{detection_id}")
async def stream_detection(detection_id: str):
    """
    Server-Sent Events endpoint that streams agent reasoning
    for a completed detection. The frontend connects to this
    after submitting a detection to watch agents 'think' in real-time.
    """
    from fastapi.responses import StreamingResponse
    from db.firestore import get_detection

    async def generate():
        detection = get_detection(detection_id)

        if not detection:
            yield f"data: {json.dumps({'error': 'Detection not found'})}\n\n"
            return

        if "agent_reasoning" not in detection:
            yield f"data: {json.dumps({'error': 'No agent reasoning available'})}\n\n"
            return

        reasoning = detection["agent_reasoning"]

        # Stream each agent's reasoning with a delay for the UI effect
        for agent_name, data in reasoning.items():
            yield f"data: {json.dumps({agent_name: data})}\n\n"
            await asyncio.sleep(0.5)

        # Final summary event
        yield f"data: {json.dumps({'pipeline_complete': True, 'final_verdict': detection.get('agent_verdict'), 'confidence': detection.get('confidence_score')})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Existing endpoints (unchanged)
# ---------------------------------------------------------------------------
@router.get("/detections/{detection_id}")
async def get_detection_result(detection_id: str):
    from db.firestore import get_detection
    detection = get_detection(detection_id)
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection


@router.get("/detections/{detection_id}/report")
async def download_report(detection_id: str):
    from services.report import generate_evidence_report
    from fastapi.responses import FileResponse
    from db.firestore import get_detection

    try:
        detection = get_detection(detection_id)
        if not detection:
            raise HTTPException(status_code=404, detail="Detection not found")

        detection_copy = detection.copy()
        detection_copy.setdefault("confidence_score", 0)
        detection_copy.setdefault("similarity_score", 0)
        detection_copy.setdefault("matched_owner", "Unknown")
        detection_copy.setdefault("gemini_description", "No AI analysis available")
        detection_copy.setdefault("timestamp_match_start", None)
        detection_copy.setdefault("timestamp_match_end", None)
        detection_copy.setdefault("verdict", "Unknown")

        report_dir = Path("/tmp/dap")
        report_dir.mkdir(parents=True, exist_ok=True)
        out_path = report_dir / f"report_{detection_id}.pdf"

        generate_evidence_report(detection_copy, out_path)

        if not out_path.exists():
            raise HTTPException(status_code=500, detail="Failed to generate report PDF")

        return FileResponse(
            out_path,
            media_type="application/pdf",
            filename=f"evidence_{detection_id}.pdf"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"REPORT GENERATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
