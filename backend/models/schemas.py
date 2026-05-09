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
