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

  # Header bar
  c.setFillColorRGB(0.02, 0.027, 0.035) # Dark void color
  c.rect(0, height - 80, width, 80, fill=1)
  
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica-Bold", 18)
  c.drawString(50, height - 45, "DIGITAL ASSET PROTECTION")
  c.setFont("Helvetica", 10)
  c.drawString(50, height - 60, "Official Forensic Evidence Report")

  # Reset fill color
  c.setFillColorRGB(0, 0, 0)
  
  c.setFont("Helvetica-Bold", 11)
  c.drawString(50, height - 110, "REPORT SUMMARY")
  c.setFont("Helvetica", 9)
  c.drawString(50, height - 125, f"Detection ID: {detection['detection_id']}")
  c.drawString(50, height - 138, f"Generated On: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")

  # Verdict Box
  verdict = detection.get("verdict", "UNKNOWN").upper()
  if verdict == "PIRATED":
    c.setFillColorRGB(1, 0.31, 0.31) # #FF4F4F
  elif verdict == "ORIGINAL":
    c.setFillColorRGB(0, 0.9, 0.63) # #00E5A0
  else:
    c.setFillColorRGB(1, 0.7, 0.25) # Warning color

  c.rect(50, height - 200, width - 100, 40, fill=1)
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica-Bold", 14)
  c.drawCentredString(width/2, height - 185, f"VERDICT: {verdict}")

  c.setFillColorRGB(0, 0, 0)
  c.setFont("Helvetica", 11)
  c.drawString(50, height - 220, f"Confidence Score: {round(detection['confidence_score'] * 100, 1)}%")
  c.drawString(50, height - 235, f"Visual Similarity: {round(detection['similarity_score'] * 100, 1)}%")

  # Matched Info
  c.setFont("Helvetica-Bold", 11)
  c.drawString(50, height - 270, "MATCHED SOURCE MATERIAL")
  c.setFont("Helvetica", 10)
  c.drawString(50, height - 285, f"Legal Owner: {detection.get('matched_owner', 'N/A')}")
  if detection.get("timestamp_match_start") is not None:
    ts = f"{detection['timestamp_match_start']:.1f}s – {detection['timestamp_match_end']:.1f}s"
    c.drawString(50, height - 300, f"Match Duration: {ts}")

  # Gemini Analysis
  c.setFont("Helvetica-Bold", 11)
  c.drawString(50, height - 340, "AI CONTENT ANALYSIS (GEMINI)")
  c.setFont("Helvetica-Oblique", 10)
  desc = detection.get("gemini_description", "Not available")
  
  # Word-wrap description
  words, line, y = desc.split(), "", height - 360
  for word in words:
    test = f"{line} {word}".strip()
    if c.stringWidth(test, "Helvetica-Oblique", 10) < width - 100:
      line = test
    else:
      c.drawString(50, y, line)
      y -= 15
      line = word
  if line:
    c.drawString(50, y, line)

  # Footer
  c.setStrokeColorRGB(0.8, 0.8, 0.8)
  c.line(50, 60, width - 50, 60)
  c.setFont("Helvetica-Oblique", 8)
  c.setFillColorRGB(0.5, 0.5, 0.5)
  c.drawString(50, 45, "This document serves as forensic evidence for DMCA and platform takedown requests.")
  c.drawString(50, 35, "Generated automatically by the Digital Asset Protection forensic engine.")

  c.save()
  return out_path
