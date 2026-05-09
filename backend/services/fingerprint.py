from PIL import Image
import imagehash
from pathlib import Path


def generate_phash(image_path: Path) -> str:
    """Generate perceptual hash (pHash) for an image. Returns 64-bit hex string."""
    img = Image.open(image_path).convert("L").resize((256, 256))
    return str(imagehash.phash(img))


def hamming_distance(hash1: str, hash2: str) -> int:
    """Compute Hamming distance between two hex pHash strings."""
    h1 = imagehash.hex_to_hash(hash1)
    h2 = imagehash.hex_to_hash(hash2)
    return h1 - h2


def phash_similarity(hash1: str, hash2: str) -> float:
    """Return similarity score 0.0–1.0 (1.0 = identical)."""
    dist = hamming_distance(hash1, hash2)
    return max(0.0, 1.0 - dist / 64.0)
