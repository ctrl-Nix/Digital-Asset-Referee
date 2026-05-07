# Backend Specs — Digital Asset Protection MVP

## Stack
- Python 3.11+
- FastAPI
- Uvicorn (ASGI server)
- Deployed on Google Cloud Run (Docker container)

## Install

```bash
pip install fastapi uvicorn python-multipart pillow imagehash \
  torch torchvision opencv-python-headless ffmpeg-python \
  invisible-watermark google-generativeai firebase-admin \
  reportlab yt-dlp requests numpy scipy
```

---

## main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import register, detect, assets

app = FastAPI(title="Digital Asset Protection API")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],   # restrict to frontend URL in production
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(register.router)
app.include_router(detect.router)
app.include_router(assets.router)
```

---

## models/schemas.py

```python
from pydantic import BaseModel
from typing import Optional

class RegisterResponse(BaseModel):
  content_id: str
  message: str

class DetectRequest(BaseModel):
  url: Optional[str] = None   # used when no file upload

class DetectionResult(BaseModel):
  detection_id: str
  verdict: str                 # "Pirated" | "Suspicious" | "Original" | "Unknown"
  confidence_score: float      # 0.0 – 1.0
  similarity_score: float
  coverage_ratio: float
  matched_content_id: Optional[str]
  matched_owner: Optional[str]
  matched_file_url: Optional[str]
  timestamp_match_start: Optional[float]
  timestamp_match_end: Optional[float]
  gemini_description: Optional[str]
  detection_id: str
```

---

## services/ingest.py

```python
import yt_dlp, requests, cv2, uuid, os
from pathlib import Path

TEMP_DIR = Path("/tmp/dap")
TEMP_DIR.mkdir(exist_ok=True)

def fetch_from_url(url: str) -> Path:
  """Download media from URL. Returns local file path."""
  dest = TEMP_DIR / f"{uuid.uuid4()}"
  if "youtube.com" in url or "youtu.be" in url:
    ydl_opts = {'outtmpl': str(dest) + '.%(ext)s', 'format': 'mp4'}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
      ydl.download([url])
    return next(TEMP_DIR.glob(f"{dest.name}.*"))
  else:
    r = requests.get(url, timeout=30)
    suffix = ".mp4" if "video" in r.headers.get("content-type","") else ".jpg"
    p = Path(str(dest) + suffix)
    p.write_bytes(r.content)
    return p

def extract_frames(video_path: Path, fps: int = 1) -> list[Path]:
  """Extract 1 frame per second from a video. Returns list of image paths."""
  cap = cv2.VideoCapture(str(video_path))
  video_fps = cap.get(cv2.CAP_PROP_FPS) or 25
  frames, frame_paths = [], []
  idx = 0
  while True:
    ret, frame = cap.read()
    if not ret:
      break
    if idx % int(video_fps / fps) == 0:
      p = TEMP_DIR / f"{video_path.stem}_f{idx}.jpg"
      cv2.imwrite(str(p), frame)
      frame_paths.append(p)
    idx += 1
  cap.release()
  return frame_paths

def normalize_image(img_path: Path) -> Path:
  """Resize to 256x256 grayscale for hashing."""
  img = cv2.imread(str(img_path))
  img = cv2.resize(img, (256, 256))
  out = TEMP_DIR / f"norm_{img_path.name}"
  cv2.imwrite(str(out), img)
  return out
```

---

## services/fingerprint.py

```python
from PIL import Image
import imagehash
from pathlib import Path

def generate_phash(image_path: Path) -> str:
  """Generate perceptual hash (pHash) for an image. Returns 64-bit hex string."""
  img = Image.open(image_path).convert("L").resize((256, 256))
  return str(imagehash.phash(img))

def hamming_distance(hash1: str, hash2: str) -> int:
  """Compute Hamming distance between two hex pHash strings."""
  h1 = imagehash.hex_to_hash(hash1)
  h2 = imagehash.hex_to_hash(hash2)
  return h1 - h2

def phash_similarity(hash1: str, hash2: str) -> float:
  """Return similarity score 0.0–1.0 (1.0 = identical)."""
  dist = hamming_distance(hash1, hash2)
  return max(0.0, 1.0 - dist / 64.0)
```

---

## services/embedding.py

```python
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from pathlib import Path

model = models.mobilenet_v2(pretrained=True)
model.classifier = torch.nn.Identity()   # remove classification head, keep embeddings
model.eval()

transform = transforms.Compose([
  transforms.Resize((224, 224)),
  transforms.ToTensor(),
  transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def generate_embedding(image_path: Path) -> list[float]:
  """Generate 1280-dim MobileNetV2 feature vector for an image."""
  img = Image.open(image_path).convert("RGB")
  tensor = transform(img).unsqueeze(0)
  with torch.no_grad():
    vec = model(tensor).squeeze().numpy()
  return vec.tolist()

def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
  """Cosine similarity between two embedding vectors. Returns 0.0–1.0."""
  import numpy as np
  a, b = np.array(vec1), np.array(vec2)
  return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))
```

---

## services/matcher.py

```python
from db.firestore import get_all_official_media
from services.fingerprint import phash_similarity
from services.embedding import cosine_similarity

PHASH_THRESHOLD = 12       # Hamming distance — candidates below this advance
PHASH_WEIGHT = 0.4
CNN_WEIGHT = 0.6

def find_best_match(query_phash: str, query_embedding: list[float]) -> dict | None:
  """
  Query Firestore for all registered assets.
  Return the best matching asset dict or None if no match above threshold.
  """
  assets = get_all_official_media()   # returns list of Firestore docs as dicts
  candidates = []

  for asset in assets:
    p_sim = phash_similarity(query_phash, asset["phash"])
    hamming = int((1 - p_sim) * 64)
    if hamming <= PHASH_THRESHOLD:
      candidates.append((asset, p_sim))

  if not candidates:
    return None

  best_asset, best_score = None, -1.0
  for asset, p_sim in candidates:
    c_sim = cosine_similarity(query_embedding, asset["embedding"])
    combined = PHASH_WEIGHT * p_sim + CNN_WEIGHT * c_sim
    if combined > best_score:
      best_score = combined
      best_asset = {**asset, "combined_similarity": combined}

  return best_asset if best_score > 0.4 else None
```

---

## services/scorer.py

```python
def compute_verdict(similarity: float, coverage_ratio: float) -> tuple[str, float]:
  """
  Compute verdict and final confidence score.

  similarity     — combined pHash + CNN score (0.0–1.0)
  coverage_ratio — matched_frames / total_frames (0.0–1.0)

  Returns (verdict, confidence_score)
  """
  # Weighted final score
  score = 0.6 * similarity + 0.3 * coverage_ratio + 0.1   # +0.1 base (no source type data in MVP)

  if score >= 0.85:
    return "Pirated", round(score, 3)
  elif score >= 0.55:
    return "Suspicious", round(score, 3)
  elif score >= 0.35:
    return "Original", round(score, 3)
  else:
    return "Unknown", round(score, 3)
```

---

## services/gemini.py

```python
import google.generativeai as genai
import os
from pathlib import Path

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel("gemini-1.5-flash")

def describe_content(image_path: Path) -> str:
  """
  Send an image frame to Gemini and get a natural-language description
  of the sports content it shows (for use in the evidence report).
  """
  with open(image_path, "rb") as f:
    image_data = f.read()

  prompt = (
    "You are analyzing a frame from a sports media clip. "
    "Describe what you see in detail: identify any visible team logos, "
    "jersey colors, stadium elements, match graphics, or sport type. "
    "This description will be used in an intellectual property evidence report. "
    "Be factual and specific. Keep response under 100 words."
  )

  response = model.generate_content([
    {"mime_type": "image/jpeg", "data": image_data},
    prompt
  ])
  return response.text.strip()
```

---

## services/watermark.py

```python
from imwatermark import WatermarkEncoder, WatermarkDecoder
import cv2
import numpy as np
from pathlib import Path

def embed_watermark(image_path: Path, payload: str, out_path: Path) -> Path:
  """
  Embed invisible DCT-based watermark into an image.
  payload: string like "content_id:owner:timestamp"
  """
  bgr = cv2.imread(str(image_path))
  encoder = WatermarkEncoder()
  encoder.set_watermark('bytes', payload.encode('utf-8')[:32])  # max 32 bytes
  encoded = encoder.encode(bgr, 'dwtDct')
  cv2.imwrite(str(out_path), encoded)
  return out_path

def extract_watermark(image_path: Path) -> str | None:
  """Attempt to extract watermark payload from an image."""
  try:
    bgr = cv2.imread(str(image_path))
    decoder = WatermarkDecoder('bytes', 32 * 8)
    payload = decoder.decode(bgr, 'dwtDct')
    return payload.decode('utf-8').strip('\x00')
  except Exception:
    return None
```

---

## services/report.py

```python
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from pathlib import Path
import datetime

def generate_evidence_report(detection: dict, out_path: Path) -> Path:
  """
  Generate a PDF evidence report for a piracy detection.
  detection: dict with keys: detection_id, verdict, confidence_score,
             matched_owner, similarity_score, gemini_description,
             timestamp_match_start, timestamp_match_end, detection_timestamp
  """
  c = canvas.Canvas(str(out_path), pagesize=A4)
  width, height = A4

  c.setFont("Helvetica-Bold", 18)
  c.drawString(50, height - 60, "Digital Asset Protection — Evidence Report")

  c.setFont("Helvetica", 11)
  c.drawString(50, height - 90, f"Detection ID: {detection['detection_id']}")
  c.drawString(50, height - 108, f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")

  c.setFont("Helvetica-Bold", 13)
  c.drawString(50, height - 140, "Verdict")
  c.setFont("Helvetica", 11)
  c.drawString(50, height - 158, detection["verdict"])
  c.drawString(50, height - 174, f"Confidence Score: {round(detection['confidence_score'] * 100, 1)}%")
  c.drawString(50, height - 190, f"Similarity Score: {round(detection['similarity_score'] * 100, 1)}%")

  c.setFont("Helvetica-Bold", 13)
  c.drawString(50, height - 220, "Matched Official Asset")
  c.setFont("Helvetica", 11)
  c.drawString(50, height - 238, f"Owner: {detection.get('matched_owner', 'N/A')}")
  if detection.get("timestamp_match_start") is not None:
    ts = f"{detection['timestamp_match_start']:.1f}s – {detection['timestamp_match_end']:.1f}s"
    c.drawString(50, height - 254, f"Match Segment: {ts}")

  c.setFont("Helvetica-Bold", 13)
  c.drawString(50, height - 290, "AI Content Analysis (Gemini)")
  c.setFont("Helvetica", 10)
  desc = detection.get("gemini_description", "Not available")
  # Word-wrap description
  words, line, y = desc.split(), "", height - 308
  for word in words:
    test = f"{line} {word}".strip()
    if c.stringWidth(test, "Helvetica", 10) < width - 100:
      line = test
    else:
      c.drawString(50, y, line)
      y -= 15
      line = word
  if line:
    c.drawString(50, y, line)

  c.setFont("Helvetica-Oblique", 9)
  c.drawString(50, 40, "This report is intended for use in DMCA and platform takedown requests.")

  c.save()
  return out_path
```

---

## routers/register.py

```python
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
from firebase_admin import auth as fb_auth
from services.ingest import normalize_image, extract_frames
from services.fingerprint import generate_phash
from services.embedding import generate_embedding
from services.watermark import embed_watermark
from db.firestore import save_official_media
from pathlib import Path
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
    fb_auth.verify_id_token(id_token)
  except Exception:
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

  # Save to Firestore (Storage upload omitted for brevity — use firebase_admin storage)
  save_official_media({
    "content_id": content_id,
    "owner_name": owner_name,
    "sport_category": sport_category,
    "phash": phash,
    "embedding": embedding,
    "watermark_payload": wm_payload,
    "detection_count": 0,
    "file_url": ""   # populate after Firebase Storage upload
  })

  return {"content_id": content_id, "message": "Asset registered successfully"}
```

---

## routers/detect.py

```python
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from services.ingest import fetch_from_url, normalize_image, extract_frames
from services.fingerprint import generate_phash
from services.embedding import generate_embedding
from services.matcher import find_best_match
from services.scorer import compute_verdict
from services.gemini import describe_content
from services.report import generate_evidence_report
from db.firestore import save_detection, increment_detection_count
from pathlib import Path
import uuid, shutil

router = APIRouter()

@router.post("/detect")
async def detect_media(
  file: Optional[UploadFile] = File(None),
  url: Optional[str] = Form(None)
):
  detection_id = str(uuid.uuid4())
  tmp_path = None

  if file:
    tmp_path = Path(f"/tmp/dap/{detection_id}_{file.filename}")
    with open(tmp_path, "wb") as f:
      shutil.copyfileobj(file.file, f)
  elif url:
    tmp_path = fetch_from_url(url)
  else:
    return {"error": "Provide a file or URL"}

  is_video = tmp_path.suffix.lower() in [".mp4", ".mov", ".webm", ".avi"]

  if is_video:
    frames = extract_frames(tmp_path)
    rep_frame = normalize_image(frames[0]) if frames else None
    total_frames = len(frames)
  else:
    rep_frame = normalize_image(tmp_path)
    frames = [rep_frame]
    total_frames = 1

  if not rep_frame:
    return {"error": "Could not process media"}

  query_phash = generate_phash(rep_frame)
  query_embedding = generate_embedding(rep_frame)

  match = find_best_match(query_phash, query_embedding)

  similarity = match["combined_similarity"] if match else 0.0

  # Coverage ratio: for video, check how many frames match
  matched_frames = 1 if match else 0
  if is_video and match and total_frames > 1:
    matched_frames = sum(
      1 for f in frames
      if find_best_match(generate_phash(normalize_image(f)), generate_embedding(normalize_image(f)))
    )
  coverage_ratio = matched_frames / max(total_frames, 1)

  verdict, confidence = compute_verdict(similarity, coverage_ratio)

  # Gemini description (only if match found)
  gemini_desc = None
  if match:
    gemini_desc = describe_content(rep_frame)

  # Increment detection count on matched asset
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
    "timestamp_match_start": None,
    "timestamp_match_end": None,
    "gemini_description": gemini_desc,
  }

  save_detection(result)

  return result


@router.get("/detections/{detection_id}/report")
async def download_report(detection_id: str):
  from fastapi.responses import FileResponse
  from db.firestore import get_detection
  detection = get_detection(detection_id)
  if not detection:
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Detection not found")
  out_path = Path(f"/tmp/dap/report_{detection_id}.pdf")
  generate_evidence_report(detection, out_path)
  return FileResponse(out_path, media_type="application/pdf",
                      filename=f"evidence_{detection_id}.pdf")
```

---

## db/firestore.py

```python
import firebase_admin
from firebase_admin import credentials, firestore
import os

cred = credentials.Certificate(os.environ["FIREBASE_SERVICE_ACCOUNT_PATH"])
firebase_admin.initialize_app(cred)
db = firestore.client()

def save_official_media(data: dict):
  db.collection("official_media").document(data["content_id"]).set(data)

def get_all_official_media() -> list[dict]:
  return [d.to_dict() for d in db.collection("official_media").stream()]

def save_detection(data: dict):
  db.collection("detections").document(data["detection_id"]).set(data)

def get_detection(detection_id: str) -> dict | None:
  doc = db.collection("detections").document(detection_id).get()
  return doc.to_dict() if doc.exists else None

def increment_detection_count(content_id: str):
  ref = db.collection("official_media").document(content_id)
  ref.update({"detection_count": firestore.Increment(1)})
```

---

## Dockerfile

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg libgl1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## Error Handling Rules
- All endpoints return `{"error": "message"}` with appropriate HTTP status on failure
- 401 for missing/invalid Firebase token on protected routes
- 400 for malformed input (no file and no URL, unsupported format)
- 500 for unexpected processing errors — log full traceback, return generic message to client
- Temp files in `/tmp/dap/` are cleaned up after each request using a `finally` block