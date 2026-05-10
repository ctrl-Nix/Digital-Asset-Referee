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

  # Background
  c.setFillColorRGB(0.04, 0.06, 0.09)
  c.rect(0, 0, width, height, fill=1, stroke=0)

  # Watermark
  c.saveState()
  try:
    c.setFillAlpha(0.08)
  except Exception:
    # setFillAlpha is not available in older reportlab builds; continue without transparency.
    pass
  c.setFont("Helvetica-Bold", 22)
  c.setFillColorRGB(0.7, 0.78, 0.9)
  c.translate(width * 0.18, height * 0.35)
  c.rotate(25)
  c.drawString(0, 0, "Forensic Analysis powered by AMD Instinct Accelerators")
  c.restoreState()

  # Header bar
  c.setFillColorRGB(0.07, 0.1, 0.15)
  c.rect(0, height - 90, width, 90, fill=1, stroke=0)

  # Logo badge
  c.setFillColorRGB(0.12, 0.62, 1)
  c.circle(55, height - 45, 20, fill=1, stroke=0)
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica-Bold", 10)
  c.drawCentredString(55, height - 48, "D.A.R.")

  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica-Bold", 18)
  c.drawString(85, height - 42, "Digital Asset Referee")
  c.setFont("Helvetica", 10)
  c.setFillColorRGB(0.8, 0.85, 0.92)
  c.drawString(85, height - 60, "Premium Forensic Evidence Report")

  # Summary block
  c.setFillColorRGB(0.12, 0.16, 0.22)
  c.roundRect(40, height - 180, width - 80, 70, 14, fill=1, stroke=0)
  c.setFillColorRGB(0.92, 0.95, 1)
  c.setFont("Helvetica-Bold", 11)
  c.drawString(60, height - 135, "REPORT SUMMARY")
  c.setFont("Helvetica", 9)
  c.setFillColorRGB(0.72, 0.78, 0.88)
  c.drawString(60, height - 152, f"Detection ID: {detection['detection_id']}")
  c.drawString(60, height - 165, f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")

  # Verdict strip
  verdict = detection.get("verdict", "UNKNOWN").upper()
  if verdict == "PIRATED":
    c.setFillColorRGB(0.95, 0.32, 0.32)
  elif verdict == "ORIGINAL":
    c.setFillColorRGB(0, 0.9, 0.63)
  elif verdict == "SUSPICIOUS":
    c.setFillColorRGB(1, 0.7, 0.25)
  else:
    c.setFillColorRGB(0.55, 0.6, 0.7)
  c.roundRect(40, height - 235, width - 80, 40, 12, fill=1, stroke=0)
  c.setFillColorRGB(0.06, 0.08, 0.12)
  c.setFont("Helvetica-Bold", 14)
  c.drawCentredString(width / 2, height - 220, f"VERDICT: {verdict}")

  # Metrics row
  c.setFont("Helvetica", 10)
  c.setFillColorRGB(0.85, 0.9, 1)
  c.drawString(50, height - 260, f"Confidence Score: {round(detection['confidence_score'] * 100, 1)}%")
  c.drawString(280, height - 260, f"Visual Similarity: {round(detection['similarity_score'] * 100, 1)}%")

  # Matched source section
  y_cursor = height - 300
  c.setFillColorRGB(0.2, 0.26, 0.36)
  c.roundRect(40, y_cursor - 70, width - 80, 70, 14, fill=1, stroke=0)
  c.setFillColorRGB(0.95, 0.97, 1)
  c.setFont("Helvetica-Bold", 11)
  c.drawString(60, y_cursor - 28, "MATCHED SOURCE MATERIAL")
  c.setFont("Helvetica", 10)
  c.setFillColorRGB(0.78, 0.84, 0.94)
  c.drawString(60, y_cursor - 45, f"Legal Owner: {detection.get('matched_owner', 'N/A')}")
  if detection.get("timestamp_match_start") is not None:
    ts = f"{detection['timestamp_match_start']:.1f}s – {detection['timestamp_match_end']:.1f}s"
    c.drawString(280, y_cursor - 45, f"Match Segment: {ts}")

  # AI Content Analysis
  y_cursor -= 120
  c.setFillColorRGB(0.12, 0.16, 0.22)
  c.roundRect(40, y_cursor - 140, width - 80, 140, 14, fill=1, stroke=0)
  c.setFillColorRGB(0.95, 0.97, 1)
  c.setFont("Helvetica-Bold", 11)
  c.drawString(60, y_cursor - 20, "AI CONTENT ANALYSIS")
  c.setFont("Helvetica-Oblique", 9.5)
  c.setFillColorRGB(0.78, 0.84, 0.94)
  desc = detection.get("gemini_description", "Not available")

  words, line, y = desc.split(), "", y_cursor - 40
  for word in words:
    test = f"{line} {word}".strip()
    if c.stringWidth(test, "Helvetica-Oblique", 9.5) < width - 120:
      line = test
    else:
      c.drawString(60, y, line)
      y -= 13
      line = word
  if line:
    c.drawString(60, y, line)

  # Footer
  c.setStrokeColorRGB(0.4, 0.45, 0.55)
  c.line(40, 70, width - 40, 70)
  c.setFont("Helvetica-Oblique", 8)
  c.setFillColorRGB(0.6, 0.65, 0.75)
  c.drawString(40, 52, "This document serves as forensic evidence for DMCA and platform takedown requests.")
  c.drawString(40, 40, "Generated automatically by Digital Asset Referee with AMD Instinct accelerators.")

  c.save()
  return out_path
