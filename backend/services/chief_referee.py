"""
chief_referee.py — Agent 3: Chief Referee
==========================================
The final adjudicator. Receives structured evidence from Agent 1
(Forensic Investigator) and Agent 2 (Vision Analyst), applies
chain-of-thought reasoning via the Qwen-72B text model, and
issues a binding verdict.

Verdicts: INFRINGEMENT | SUSPICIOUS | FAIR_USE | NO_MATCH

Exports:
    adjudicate(evidence: dict, vision_analysis: dict) -> dict
"""

import json
import logging
import re
from pathlib import Path

from services.amd_inference import text_inference

logger = logging.getLogger("dar.chief_referee")


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are the Chief Referee for D.A.R. — Digital Asset Referee.
You receive evidence from two forensic agents and issue binding verdicts
on potential intellectual property infringement of sports media content.

Your verdict MUST be exactly one of:
- INFRINGEMENT — Clear unauthorized reproduction of registered content
- SUSPICIOUS — Likely unauthorized but insufficient evidence for certainty
- FAIR_USE — Content appears to be legitimate fair use (commentary, news, etc.)
- NO_MATCH — No registered content matched; cannot determine infringement

Rules:
1. Always provide chain-of-thought reasoning BEFORE your verdict.
2. Consider ALL evidence: hash similarity, watermarks, visual analysis, and modifications.
3. High hash similarity (>80%) with watermark = strong INFRINGEMENT signal.
4. Modified content with moderate similarity = likely SUSPICIOUS.
5. Low similarity (<30%) with no watermark = likely NO_MATCH.
6. Be precise with confidence scores (0.0 to 1.0).

You MUST respond in this exact JSON format:
{
  "verdict": "INFRINGEMENT|SUSPICIOUS|FAIR_USE|NO_MATCH",
  "confidence": 0.95,
  "reasoning": "Your chain-of-thought reasoning here...",
  "recommended_action": "Issue DMCA takedown|Flag for review|Monitor|No action"
}

Respond ONLY with valid JSON. No markdown, no code fences, no extra text."""


# ---------------------------------------------------------------------------
# Build the user prompt from agent evidence
# ---------------------------------------------------------------------------
def _build_user_prompt(evidence: dict, vision_analysis: dict) -> str:
    """Compose the user message with all agent findings."""

    return f"""=== AGENT 1: FORENSIC INVESTIGATOR REPORT ===
{json.dumps(evidence, indent=2, default=str)}

=== AGENT 2: VISION ANALYST REPORT ===
{json.dumps(vision_analysis, indent=2, default=str)}

Based on the above evidence from both agents, issue your final verdict.
Remember: respond ONLY with valid JSON."""


# ---------------------------------------------------------------------------
# Response parser with fallback
# ---------------------------------------------------------------------------
def _parse_verdict(raw_text: str) -> dict:
    """
    Parse the Chief Referee's response into a structured verdict.
    Handles both clean JSON and messy model output gracefully.
    """
    # Try direct JSON parse first
    try:
        parsed = json.loads(raw_text)
        return _validate_verdict(parsed)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON from markdown code fences
    json_patterns = [
        r'```json\s*(.*?)\s*```',
        r'```\s*(.*?)\s*```',
        r'\{[^{}]*"verdict"[^{}]*\}',
    ]
    for pattern in json_patterns:
        match = re.search(pattern, raw_text, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(1) if '```' in pattern else match.group(0))
                return _validate_verdict(parsed)
            except (json.JSONDecodeError, IndexError):
                continue

    # Fallback: extract what we can from free text
    logger.warning("Could not parse JSON from Chief Referee. Falling back to heuristics.")
    return _heuristic_parse(raw_text)


def _validate_verdict(parsed: dict) -> dict:
    """Ensure all required fields exist and values are valid."""
    valid_verdicts = {"INFRINGEMENT", "SUSPICIOUS", "FAIR_USE", "NO_MATCH"}

    verdict = parsed.get("verdict", "SUSPICIOUS").upper().replace(" ", "_")
    if verdict not in valid_verdicts:
        verdict = "SUSPICIOUS"

    confidence = parsed.get("confidence", 0.5)
    if not isinstance(confidence, (int, float)):
        try:
            confidence = float(confidence)
        except (ValueError, TypeError):
            confidence = 0.5
    confidence = max(0.0, min(1.0, confidence))

    return {
        "verdict": verdict,
        "confidence": round(confidence, 4),
        "reasoning": parsed.get("reasoning", "No reasoning provided."),
        "recommended_action": parsed.get("recommended_action", _default_action(verdict)),
    }


def _heuristic_parse(raw_text: str) -> dict:
    """Last-resort parser when JSON extraction fails entirely."""
    text_upper = raw_text.upper()

    if "INFRINGEMENT" in text_upper:
        verdict = "INFRINGEMENT"
        confidence = 0.8
    elif "SUSPICIOUS" in text_upper:
        verdict = "SUSPICIOUS"
        confidence = 0.6
    elif "FAIR_USE" in text_upper or "FAIR USE" in text_upper:
        verdict = "FAIR_USE"
        confidence = 0.6
    elif "NO_MATCH" in text_upper or "NO MATCH" in text_upper:
        verdict = "NO_MATCH"
        confidence = 0.7
    else:
        verdict = "SUSPICIOUS"
        confidence = 0.5

    return {
        "verdict": verdict,
        "confidence": confidence,
        "reasoning": raw_text.strip(),
        "recommended_action": _default_action(verdict),
    }


def _default_action(verdict: str) -> str:
    """Map verdict to a sensible default recommended action."""
    return {
        "INFRINGEMENT": "Issue DMCA takedown",
        "SUSPICIOUS": "Flag for review",
        "FAIR_USE": "No action",
        "NO_MATCH": "No action",
    }.get(verdict, "Monitor")


# ---------------------------------------------------------------------------
# Main adjudication function
# ---------------------------------------------------------------------------
def adjudicate(evidence: dict, vision_analysis: dict) -> dict:
    """
    Run the Chief Referee agent — the final adjudicator.

    Args:
        evidence: Evidence packet from Agent 1 (Forensic Investigator).
        vision_analysis: Analysis from Agent 2 (Vision Analyst).

    Returns:
        Structured verdict dict with reasoning and recommended action.
    """
    logger.info("⚖️  Chief Referee deliberating…")

    result = {
        "agent": "Chief Referee",
        "status": "running",
        "verdict": "SUSPICIOUS",
        "confidence": 0.0,
        "reasoning": "",
        "recommended_action": "Monitor",
    }

    try:
        user_prompt = _build_user_prompt(evidence, vision_analysis)
        logger.info("  → Sending to Qwen-72B text model…")

        raw_response = text_inference(SYSTEM_PROMPT, user_prompt)
        logger.info("  ✓ Chief Referee responded (%d chars)", len(raw_response))

        # Parse the response into a validated verdict
        parsed = _parse_verdict(raw_response)
        result.update(parsed)
        result["status"] = "complete"

    except Exception as e:
        logger.error("  ✗ Chief Referee adjudication failed: %s", e)
        result["status"] = "error"
        result["error"] = str(e)
        result["reasoning"] = f"Adjudication failed: {e}"

    logger.info(
        "⚖️  Chief Referee verdict: %s (confidence=%.2f)",
        result["verdict"],
        result["confidence"],
    )

    return result
