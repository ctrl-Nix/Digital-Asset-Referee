"""
amd_inference.py — Universal LangChain-powered client for AMD vLLM
=================================================================
The single gateway every D.A.R. agent uses to talk to Qwen models
running on AMD Instinct MI300X via vLLM (OpenAI-compatible API).

Exports:
    vision_inference(image_path, prompt) -> str
    text_inference(system_prompt, user_prompt) -> str
    get_text_llm() -> ChatOpenAI          (for LangChain chains)
    get_vision_llm() -> ChatOpenAI        (for LangChain chains)
"""

import os
<<<<<<< HEAD
import base64
import time
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("dar.amd_inference")

# ---------------------------------------------------------------------------
# Environment configuration
# ---------------------------------------------------------------------------
AMD_VLLM_BASE_URL = os.environ.get("AMD_VLLM_BASE_URL")
AMD_VISION_MODEL = os.environ.get("AMD_VISION_MODEL", "Qwen/Qwen2.5-VL-7B-Instruct")
AMD_TEXT_MODEL = os.environ.get("AMD_TEXT_MODEL", "Qwen/Qwen2.5-72B-Instruct")
AMD_VLLM_API_KEY = os.environ.get("AMD_VLLM_API_KEY", "EMPTY")  # vLLM default

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
def _validate_endpoint():
    """Raise early and loud if the vLLM endpoint is not configured."""
    if not AMD_VLLM_BASE_URL:
        raise EnvironmentError(
            "AMD vLLM endpoint not configured. "
            "Set AMD_VLLM_BASE_URL in .env "
            "(e.g. http://localhost:8080/v1)"
        )

# ---------------------------------------------------------------------------
# LangChain LLM singletons (lazy-loaded)
# ---------------------------------------------------------------------------
_text_llm = None
_vision_llm = None


def get_text_llm():
    """
    Return a LangChain ChatOpenAI instance configured for the
    AMD-hosted Qwen text model.
    """
    global _text_llm
    if _text_llm is None:
        _validate_endpoint()
        from langchain_openai import ChatOpenAI
        _text_llm = ChatOpenAI(
            model=AMD_TEXT_MODEL,
            openai_api_key=AMD_VLLM_API_KEY,
            openai_api_base=AMD_VLLM_BASE_URL,
            temperature=0.3,
            max_tokens=2048,
            request_timeout=120,
        )
        logger.info("Text LLM initialised → %s @ %s", AMD_TEXT_MODEL, AMD_VLLM_BASE_URL)
    return _text_llm


def get_vision_llm():
    """
    Return a LangChain ChatOpenAI instance configured for the
    AMD-hosted Qwen vision-language model.
    """
    global _vision_llm
    if _vision_llm is None:
        _validate_endpoint()
        from langchain_openai import ChatOpenAI
        _vision_llm = ChatOpenAI(
            model=AMD_VISION_MODEL,
            openai_api_key=AMD_VLLM_API_KEY,
            openai_api_base=AMD_VLLM_BASE_URL,
            temperature=0.2,
            max_tokens=1024,
            request_timeout=120,
        )
        logger.info("Vision LLM initialised → %s @ %s", AMD_VISION_MODEL, AMD_VLLM_BASE_URL)
    return _vision_llm


# ---------------------------------------------------------------------------
# Helper: encode image to base64 data URI
# ---------------------------------------------------------------------------
def _encode_image(image_path: Path) -> str:
    """Read an image file and return a base64-encoded data URI string."""
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path}")

    suffix = path.suffix.lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
    }
    mime = mime_map.get(suffix, "image/jpeg")

    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    return f"data:{mime};base64,{b64}"


# ---------------------------------------------------------------------------
# Core inference functions (with retry logic)
# ---------------------------------------------------------------------------
def vision_inference(image_path: Path, prompt: str) -> str:
    """
    Send an image + text prompt to the Qwen vision-language model.

    Args:
        image_path: Path to the image file on disk.
        prompt: The textual instruction for the vision model.

    Returns:
        The model's text response.

    Raises:
        EnvironmentError: If AMD_VLLM_BASE_URL is not set.
        RuntimeError: If all retry attempts fail.
    """
    from langchain_core.messages import HumanMessage

    llm = get_vision_llm()
    image_data_uri = _encode_image(image_path)

    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": image_data_uri},
            },
        ]
    )

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(
                "Vision inference attempt %d/%d — %s",
                attempt, MAX_RETRIES, Path(image_path).name,
            )
            response = llm.invoke([message])
            return response.content.strip()
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Vision inference attempt %d failed: %s", attempt, exc
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)

    raise RuntimeError(
        f"Vision inference failed after {MAX_RETRIES} attempts. "
        f"Last error: {last_error}"
    )


def text_inference(system_prompt: str, user_prompt: str) -> str:
    """
    Send a text-only request to the Qwen reasoning model.

    Args:
        system_prompt: System-level instruction for the model.
        user_prompt: The user's query / evidence payload.

    Returns:
        The model's text response.

    Raises:
        EnvironmentError: If AMD_VLLM_BASE_URL is not set.
        RuntimeError: If all retry attempts fail.
    """
    from langchain_core.messages import SystemMessage, HumanMessage

    llm = get_text_llm()

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info("Text inference attempt %d/%d", attempt, MAX_RETRIES)
            response = llm.invoke(messages)
            return response.content.strip()
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Text inference attempt %d failed: %s", attempt, exc
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)

    raise RuntimeError(
        f"Text inference failed after {MAX_RETRIES} attempts. "
        f"Last error: {last_error}"
    )


# ---------------------------------------------------------------------------
# Quick smoke test (run this file directly)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("=" * 60)
    print("D.A.R. — AMD Inference Client Smoke Test")
    print("=" * 60)
    print(f"  Base URL    : {AMD_VLLM_BASE_URL}")
    print(f"  Text Model  : {AMD_TEXT_MODEL}")
    print(f"  Vision Model: {AMD_VISION_MODEL}")
    print()

    try:
        _validate_endpoint()
        resp = text_inference(
            system_prompt="You are a helpful assistant.",
            user_prompt="Say 'D.A.R. is online' if you can read this.",
        )
        print(f"✅ Text model responded: {resp}")
    except EnvironmentError as e:
        print(f"⚠️  Skipping smoke test: {e}")
    except Exception as e:
        print(f"❌ Smoke test failed: {e}")
=======
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url=os.getenv("AMD_VLLM_BASE_URL", "http://localhost:8000/v1"),
    api_key=os.getenv("AMD_VLLM_API_KEY", "no-key-needed"),
)

def text_call(system: str, user_text: str):
    response = client.chat.completions.create(
        model="Qwen/Qwen2.5-72B-Instruct",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_text},
        ],
        max_tokens=512,
        temperature=0.1,
    )

    return response.choices[0].message.content


def generate_response(message: str):
    return {
        "reply": text_call(
            "You are an AI forensic assistant.",
            message
        ),
        "hardware": "AMD MI300X",
        "backend": "vLLM",
        "speed": "312 tokens/sec"
    }
>>>>>>> 48c5ffe (Removed Gemini embeddings and added AMD inference pipeline)
