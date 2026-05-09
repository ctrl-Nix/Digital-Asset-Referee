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
