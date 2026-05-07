# Digital Asset Protection MVP — Specs

## Overview
A two-sided web application for detecting unauthorized use of sports media.
Rights holders register official content; anyone can submit a suspected pirated link or file.

## Portals

### Admin portal (rights holder)
- Upload official images/videos
- System generates fingerprint + embeds invisible watermark
- Assigns content ID, owner name, and timestamp
- Stores in official media registry

### Detection portal (public/investigator)
- Upload a file or paste a URL (YouTube, Twitter, etc.)
- System fetches, normalizes, and runs detection
- Returns verdict with confidence score

---

## Processing pipeline

### 1. Ingest & normalize
- Accept image/video file or remote URL
- Normalize: resize to standard resolution, convert format
- Video: extract 1 frame/sec using ffmpeg

### 2. Two-layer fingerprinting
- Layer 1 — pHash (fast): generate perceptual hash per frame/image
- Layer 2 — CNN embedding (robust): run MobileNetV2 to generate feature vector
- pHash used as pre-filter (top-50 candidates), CNN used as final matcher

### 3. Matching engine
- Compare against official media registry
- pHash: Hamming distance < threshold → candidate
- CNN: cosine similarity on embedding vectors → final score
- Output: similarity score 0–100%

### 4. Context-aware scoring
Three signals combined:
- Raw similarity score (pHash + CNN)
- Clip coverage ratio: matched frames / total clip length
- Source type: known official account → reduce suspicion score

Decision:
- High match + high coverage + unofficial source → Pirated
- High match + low coverage → Suspicious (fan clip)
- Low match → Unknown / Original

### 5. Outputs
- Verdict: Pirated / Suspicious / Original
- Confidence score
- Side-by-side comparison (matched original vs. submitted)
- Timestamp range of match (for videos: e.g. 00:32–00:47)
- Auto-generated PDF evidence report (for pirated verdicts):
  - Owner metadata
  - Side-by-side screenshot
  - Match score + detection timestamp
  - Download for DMCA use

### 6. Viral anomaly detection
- Log every detection result in a time-series table
- If same content fingerprint flagged 5+ times from distinct sources within 24h → raise alert
- Display on admin dashboard: "This asset is spreading without authorization"

---

## Invisible watermarking (media hardening)
- Embed at registration time using frequency-domain watermarking (DCT-based)
- Payload: content ID + owner ID + timestamp
- Survives: JPEG compression, resize, basic cropping
- Extractor: attempt watermark read on submitted media as secondary confirmation layer

---

## Tech stack
- Frontend: Next.js / React
- Backend: Python + FastAPI
- Media processing: OpenCV, imagehash, ffmpeg, torchvision (MobileNetV2)
- Watermarking: invisible-watermark (Python library)
- Database: PostgreSQL (fingerprint index + detection log)
- PDF generation: ReportLab

---

## MVP limitations (be honest in your pitch)
- Limited official media dataset (demo with 20–30 clips)
- Watermark extraction not guaranteed on heavy edits
- No live scraping (submit-based only)
- CNN inference not optimized for speed (fine for demo)

---

## Success criteria
- Correctly classifies pirated clips with >85% accuracy on test set
- Works for images and short video clips (up to 5 min)
- Generates usable PDF evidence report
- Demonstrates viral anomaly alert with simulated repeat detections

---

## Future phases (pitch, don't build)
- Real-time web scraping + hashtag monitoring (secondary signal)
- Blockchain-based ownership registry
- Platform API integrations (YouTube Content ID, Meta Rights Manager)
- Multi-tenant SaaS for sports orgs