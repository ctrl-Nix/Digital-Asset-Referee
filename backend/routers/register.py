from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
from firebase_admin import auth as fb_auth
from services.ingest import normalize_image, extract_frames
from services.fingerprint import generate_phash
from services.embedding import generate_embedding
from services.watermark import embed_watermark
from db.firestore import save_official_media, get_db
from pathlib import Path
from datetime import datetime, timezone
import uuid, shutil

router = APIRouter()

@router.post("/register")
async def register_asset(
  file: UploadFile = File(...),
  owner_name: str = Form(...),
  sport_category: str = Form(...),
  authorization: str = Header(...)
):
  # Verify Firebase ID token
  id_token = authorization.replace("Bearer ", "")
  try:
    from firebase_admin import auth as fb_auth
    fb_auth.verify_id_token(id_token)
  except Exception:
    # If DB is offline, we allow registration for the demo
    if get_db() is not None:
        raise HTTPException(status_code=401, detail="Invalid auth token")

  content_id = str(uuid.uuid4())
  tmp_path = Path(f"/tmp/dap/{content_id}_{file.filename}")
  with open(tmp_path, "wb") as f:
    shutil.copyfileobj(file.file, f)

  is_video = file.content_type.startswith("video")

  if is_video:
    frames = extract_frames(tmp_path)
    rep_frame = normalize_image(frames[0]) if frames else None
  else:
    rep_frame = normalize_image(tmp_path)

  if not rep_frame:
    raise HTTPException(status_code=400, detail="Could not process media")

  phash = generate_phash(rep_frame)
  embedding = generate_embedding(rep_frame)

  # Embed watermark on representative frame
  wm_payload = f"{content_id}:{owner_name}"
  wm_path = Path(f"/tmp/dap/wm_{content_id}.jpg")
  embed_watermark(rep_frame, wm_payload, wm_path)

  # Save to Firestore
  save_official_media({
    "content_id": content_id,
    "owner_name": owner_name,
    "sport_category": sport_category,
    "phash": phash,
    "embedding": embedding,
    "watermark_payload": wm_payload,
    "detection_count": 0,
    "file_url": "",
    "upload_timestamp": datetime.now(timezone.utc),
  })

  return {"content_id": content_id, "message": "Asset registered successfully"}
