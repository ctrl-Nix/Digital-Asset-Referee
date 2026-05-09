# Architecture — Digital Asset Protection MVP

## Folder Structure

```text
root/
├── frontend/                         # React app
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminRegister.jsx     # Register new official asset
│   │   │   ├── DetectionPortal.jsx   # Public detection page
│   │   │   └── DetectionResult.jsx   # Result display page
│   │   ├── components/
│   │   │   ├── UploadZone.jsx        # Drag-and-drop file input
│   │   │   ├── ComparisonView.jsx    # Side-by-side original vs detected
│   │   │   ├── AssetTable.jsx        # Paginated registered assets table
│   │   │   └── Navbar.jsx
│   │   ├── services/
│   │   │   ├── firebase.js           # Firebase init + exports
│   │   │   ├── api.js                # All calls to FastAPI backend
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                          # VITE_API_URL, Firebase config keys
│   └── package.json
├── backend/                          # Python FastAPI app
│   ├── main.py                       # App entry, route registration
│   ├── routers/
│   │   ├── register.py               # POST /register
│   │   ├── detect.py                 # POST /detect
│   │   ├── assets.py                 # GET /assets, GET /detections
│   │   └── batch.py                  # POST /batch-detect
│   ├── services/
│   │   ├── fingerprint.py            # pHash generation
│   │   ├── embedding.py              # MobileNetV2 CNN embedding
│   │   ├── matcher.py                # Hamming + cosine matching logic
│   │   ├── scorer.py                 # Context-aware verdict scoring
│   │   ├── gemini.py                 # Gemini API calls
│   │   ├── watermark.py              # DCT watermark embed + extract
│   │   ├── ingest.py                 # URL fetch + media normalization
│   │   └── report.py                 # PDF evidence report generation
│   ├── db/
│   │   └── firestore.py              # Firestore client + helpers
│   ├── requirements.txt
│   └── .env                          # GOOGLE_API_KEY, Firebase creds, etc.
├── Specs.md
├── architecture.md
├── frontend_specs.md
└── backend_specs.md
```

---

## Firestore Collections

### `official_media`
```json
{
  "content_id": "string (uuid)",
  "owner_name": "string",
  "sport_category": "string",
  "file_url": "string",
  "phash": "string",
  "embedding": "array<float>",
  "watermark_payload": "string",
  "upload_timestamp": "timestamp",
  "detection_count": "number"
}
```

### `detections`
```json
{
  "detection_id": "string (uuid)",
  "submitted_url": "string | null",
  "verdict": "string",
  "confidence_score": "number",
  "matched_content_id": "string | null",
  "similarity_score": "number",
  "coverage_ratio": "number",
  "timestamp_match_start": "number | null",
  "timestamp_match_end": "number | null",
  "gemini_description": "string | null",
  "detection_timestamp": "timestamp"
}
```

---

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | Firebase ID token | Register official media asset |
| POST | `/detect` | None | Run detection on uploaded file or URL |
| POST | `/batch-detect` | None | Run detection on multiple URLs |
| GET | `/assets` | Firebase ID token | List all assets for authenticated owner |
| GET | `/detections/{id}` | None | Get specific detection result |
| GET | `/detections/{id}/report` | None | Download PDF evidence report |
| GET | `/health` | None | System health check |

---

## Environment Variables

### Backend `.env`
- `GOOGLE_API_KEY`: Gemini API key
- `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to service account JSON
- `GCP_PROJECT_ID`: Project ID

### Frontend `.env`
- `VITE_BACKEND_URL`: URL to backend API
- `VITE_FIREBASE_API_KEY`: Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite | UI for both portals |
| Database | Firestore | Fingerprint registry + detection log |
| Backend | FastAPI (Python) | Detection pipeline API |
| Embedding | MobileNetV2 (PyTorch) | Robust CNN feature vector |
| AI Reasoning | Gemini 1.5 Flash | Content description |
| Watermarking | invisible-watermark | DCT-based embed/extract |
| PDF Generation | ReportLab | Evidence report |