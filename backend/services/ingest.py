import yt_dlp, requests, cv2, uuid, os, base64
from pathlib import Path

TEMP_DIR = Path("/tmp/dap")
TEMP_DIR.mkdir(exist_ok=True)


def fetch_from_url(url: str) -> Path:
  """Download media or tap into a live stream. Returns local file path."""
  dest = TEMP_DIR / f"{uuid.uuid4()}"
  
  # Configuration for yt-dlp
  # If it's a live stream, we only want a small chunk
  ydl_opts = {
    'outtmpl': str(dest) + '.%(ext)s',
    'format': 'best[ext=mp4]/best',
    'quiet': True,
    'no_warnings': True,
  }

  is_live = "youtube.com" in url or "youtu.be" in url or "twitch.tv" in url

  if is_live:
    # Tap into live stream: only download the first 5 seconds
    ydl_opts['download_ranges'] = lambda info_dict, ydl: [{'start_time': 0, 'end_time': 5}]
    ydl_opts['force_keyframes_at_cuts'] = True
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
      try:
        ydl.download([url])
      except Exception as e:
        # Fallback if download_ranges isn't supported by the extractor
        print(f"Live tap error: {e}. Attempting full download (capped).")
        ydl_opts.pop('download_ranges')
        ydl_opts['max_filesize'] = 50 * 1024 * 1024 # 50MB cap
        ydl.download([url])

    return next(TEMP_DIR.glob(f"{dest.name}.*"))
  else:
    # Direct File Download
    r = requests.get(url, timeout=30, stream=True)
    suffix = ".mp4" if "video" in r.headers.get("content-type","") else ".jpg"
    p = Path(str(dest) + suffix)
    with open(p, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    return p


def extract_frames(video_path: Path, max_frames: int = 10) -> list[Path]:
  """Extract up to max_frames from a video using seeking to save RAM."""
  cap = cv2.VideoCapture(str(video_path))
  total_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
  if total_count <= 0:
    cap.release()
    return []
  
  # Calculate interval to get max_frames evenly spread
  interval = max(1, total_count // max_frames)
  frame_paths = []
  
  for i in range(0, total_count, interval):
    if len(frame_paths) >= max_frames:
      break
    cap.set(cv2.CAP_PROP_POS_FRAMES, i)
    ret, frame = cap.read()
    if not ret:
      break
    
    p = TEMP_DIR / f"{video_path.stem}_f{i}.jpg"
    cv2.imwrite(str(p), frame)
    frame_paths.append(p)
    
  cap.release()
  return frame_paths


def normalize_image(img_path: Path) -> Path:
  """Resize to 256x256 grayscale for hashing."""
  img = cv2.imread(str(img_path))
  img = cv2.resize(img, (256, 256))
  out = TEMP_DIR / f"norm_{img_path.name}"
  cv2.imwrite(str(out), img)
  return out


def generate_preview_url(image_path: Path) -> str:
  """Generate a base64 data URL preview from an image file."""
  try:
    # Read image in color for preview (not grayscale)
    img = cv2.imread(str(image_path))
    if img is None:
      return None
    
    # Resize to reasonable preview size (max 400x400)
    height, width = img.shape[:2]
    if width > 400 or height > 400:
      scale = min(400/width, 400/height)
      new_width = int(width * scale)
      new_height = int(height * scale)
      img = cv2.resize(img, (new_width, new_height))
    
    # Encode to JPG
    _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{jpg_as_text}"
  except Exception as e:
    print(f"Error generating preview: {e}")
    return None
