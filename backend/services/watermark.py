from imwatermark import WatermarkEncoder, WatermarkDecoder
import cv2
import numpy as np
from pathlib import Path


def embed_watermark(image_path: Path, payload: str, out_path: Path) -> Path:
  """
  Embed invisible DCT-based watermark into an image.
  payload: string like "content_id:owner:timestamp"
  """
  try:
    bgr = cv2.imread(str(image_path))
    if bgr is None:
        raise ValueError("Could not read image")
    
    # DCT watermarking is sensitive to resolution. 
    # We ensure a minimum size for stability.
    h, w = bgr.shape[:2]
    if h < 400 or w < 400:
        bgr = cv2.resize(bgr, (800, 800))

    encoder = WatermarkEncoder()
    # Payload must be exactly 32 bytes for 'bytes' mode in imwatermark
    clean_payload = payload.encode('utf-8')
    padded_payload = clean_payload.ljust(32, b'\0')
    
    encoder.set_watermark('bytes', padded_payload)
    encoded = encoder.encode(bgr, 'dwtDct')
    
    cv2.imwrite(str(out_path), encoded)
    return out_path
  except Exception as e:
    print(f"Watermark Embedding Error: {e}")
    # Fallback: copy original if embedding fails
    import shutil
    shutil.copy(image_path, out_path)
    return out_path


def extract_watermark(image_path: Path) -> str | None:
  """Attempt to extract watermark payload from an image."""
  try:
    bgr = cv2.imread(str(image_path))
    if bgr is None:
        return None
        
    h, w = bgr.shape[:2]
    if h < 400 or w < 400:
        bgr = cv2.resize(bgr, (800, 800))

    decoder = WatermarkDecoder('bytes', 32 * 8)
    payload = decoder.decode(bgr, 'dwtDct')
    
    # Cleanup null bytes
    decoded = payload.decode('utf-8', errors='ignore').strip('\x00')
    return decoded if decoded else None
  except Exception as e:
    print(f"Watermark Extraction Error: {e}")
    return None
