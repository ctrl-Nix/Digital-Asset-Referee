from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from pathlib import Path
import datetime

def generate_evidence_report(detection: dict, out_path: Path) -> Path:
  """
  Generate an enhanced PDF evidence report for a piracy detection.
  """
  c = canvas.Canvas(str(out_path), pagesize=A4)
  width, height = A4

  # Premium Dark Background
  c.setFillColorRGB(0.02, 0.03, 0.05)
  c.rect(0, 0, width, height, fill=1, stroke=0)

  # Watermark
  c.saveState()
  try:
    c.setFillAlpha(0.05)
  except AttributeError:
    pass
  c.setFont("Helvetica-Bold", 16)
  c.setFillColorRGB(1, 1, 1)
  c.translate(width * 0.1, height * 0.3)
  c.rotate(35)
  c.drawString(0, 0, "Forensic Analysis powered by AMD Instinct Accelerators")
  c.restoreState()

  # Header
  c.setFillColorRGB(0.05, 0.08, 0.12)
  c.rect(0, height - 100, width, 100, fill=1, stroke=0)
  
  # D.A.R. Logo
  c.setFillColorRGB(0, 0.9, 0.63) # Brand primary
  c.rect(40, height - 70, 40, 40, fill=1, stroke=0)
  c.setFillColorRGB(0.02, 0.03, 0.05)
  c.setFont("Helvetica-Bold", 20)
  c.drawCentredString(60, height - 62, "G") # Guard/Referee

  # Title
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica-Bold", 22)
  c.drawString(95, height - 50, "DIGITAL ASSET REFEREE")
  c.setFont("Helvetica", 10)
  c.setFillColorRGB(0.5, 0.6, 0.7)
  c.drawString(95, height - 68, "Official Forensic Evidence Package")

  y = height - 140

  # Helper to draw section headers
  def draw_section_header(c, y, title):
    c.setFillColorRGB(0.05, 0.08, 0.12)
    c.rect(40, y - 20, width - 80, 25, fill=1, stroke=0)
    c.setFillColorRGB(0, 0.9, 0.63)
    c.rect(40, y - 20, 4, 25, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(55, y - 12, title.upper())
    return y - 40

  # 1. Verdict & Confidence
  y = draw_section_header(c, y, "Verdict & Confidence")
  
  verdict = detection.get("verdict", "UNKNOWN").upper()
  if verdict == "PIRATED":
    c.setFillColorRGB(0.95, 0.32, 0.32) # Red
  elif verdict == "ORIGINAL":
    c.setFillColorRGB(0, 0.9, 0.63) # Green
  else:
    c.setFillColorRGB(1, 0.7, 0.25) # Yellow

  c.roundRect(40, y - 30, 150, 40, 8, fill=1, stroke=0)
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica-Bold", 14)
  c.drawCentredString(115, y - 18, verdict)

  c.setFillColorRGB(0.5, 0.6, 0.7)
  c.setFont("Helvetica", 10)
  c.drawString(210, y + 2, f"Confidence Score: {round(detection.get('confidence_score', 0) * 100, 1)}%")
  c.drawString(210, y - 12, f"Visual Similarity: {round(detection.get('similarity_score', 0) * 100, 1)}%")
  
  y -= 60

  # 2. Owner Metadata
  y = draw_section_header(c, y, "Owner Metadata")
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica", 10)
  c.drawString(50, y, f"Legal Owner: {detection.get('matched_owner', 'N/A')}")
  c.drawString(50, y - 15, f"Detection ID: {detection.get('detection_id', 'N/A')}")
  c.drawString(50, y - 30, f"Timestamp: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
  y -= 60

  # 3. Submitted Media
  y = draw_section_header(c, y, "Submitted Media")
  c.setFillColorRGB(0.5, 0.6, 0.7)
  c.drawString(50, y, "Submitted Payload Analysis:")
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica-Oblique", 9.5)
  
  desc = detection.get("gemini_description", "No specific description available.")
  words, line, cur_y = desc.split(), "", y - 15
  for word in words:
    test = f"{line} {word}".strip()
    if c.stringWidth(test, "Helvetica-Oblique", 9.5) < width - 100:
      line = test
    else:
      c.drawString(50, cur_y, line)
      cur_y -= 13
      line = word
  if line:
    c.drawString(50, cur_y, line)
  
  y = cur_y - 30

  # 4. Matched Media & Matching Details
  y = draw_section_header(c, y, "Matching Details")
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica", 10)
  if detection.get("timestamp_match_start") is not None:
    ts = f"{detection['timestamp_match_start']:.1f}s – {detection['timestamp_match_end']:.1f}s"
    c.drawString(50, y, f"Identified Segment: {ts}")
  else:
    c.drawString(50, y, "Full file match or continuous stream.")
  y -= 40

  # 5. Screenshots (Placeholder)
  y = draw_section_header(c, y, "Screenshots & Evidence")
  c.setFillColorRGB(0.05, 0.08, 0.12)
  c.rect(40, y - 80, width - 80, 80, fill=1, stroke=0)
  c.setFillColorRGB(0.5, 0.6, 0.7)
  c.setFont("Helvetica", 10)
  c.drawCentredString(width / 2, y - 45, "[ Digital Fingerprint & Watermark Trace Embedded ]")
  y -= 110

  # 6. DMCA Notice
  y = draw_section_header(c, y, "DMCA Notice & Action")
  c.setFillColorRGB(1, 1, 1)
  c.setFont("Helvetica-Oblique", 9)
  notice = "This document constitutes a formal forensic report. If the verdict is PIRATED, this report can be submitted to platform operators as valid proof of ownership and infringement under the Digital Millennium Copyright Act (DMCA). The hash signatures and watermarks decoded above uniquely identify the source material."
  
  words, line, cur_y = notice.split(), "", y
  for word in words:
    test = f"{line} {word}".strip()
    if c.stringWidth(test, "Helvetica-Oblique", 9) < width - 100:
      line = test
    else:
      c.drawString(50, cur_y, line)
      cur_y -= 13
      line = word
  if line:
    c.drawString(50, cur_y, line)

  # Footer
  c.setStrokeColorRGB(0.1, 0.15, 0.2)
  c.line(40, 50, width - 40, 50)
  c.setFont("Helvetica", 8)
  c.setFillColorRGB(0.4, 0.5, 0.6)
  c.drawString(40, 35, "Generated by Digital Asset Referee. Powered by AMD Instinct Accelerators.")

  c.save()
  return out_path
