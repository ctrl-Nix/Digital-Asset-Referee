import json
import os
from pathlib import Path
from services.fingerprint import phash_similarity
from services.embedding import cosine_similarity
from db.firestore import get_all_official_media

PHASH_THRESHOLD = 25       # Hamming distance — candidates below this advance
PHASH_WEIGHT = 0.4
CNN_WEIGHT = 0.6

def get_local_assets():
    path = Path("local_registry.json")
    if path.exists():
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading local registry: {e}")
    return []

def find_best_match(query_phash: str, query_embedding: list[float]) -> dict | None:
    """
    Query for all registered assets (Local Registry + Firestore).
    Return the best matching asset dict or None if no match above threshold.
    """
    # 1. Combine assets from local registry and Firestore
    local_assets = get_local_assets()
    remote_assets = get_all_official_media()
    
    # Merge based on content_id to avoid duplicates
    assets_map = {a["content_id"]: a for a in local_assets}
    for a in remote_assets:
        assets_map[a["content_id"]] = a
        
    assets = list(assets_map.values())
    
    candidates = []

    # 2. Fast Phash filtering
    for asset in assets:
        if "phash" not in asset: continue
        p_sim = phash_similarity(query_phash, asset["phash"])
        hamming = int((1 - p_sim) * 64)
        if hamming <= PHASH_THRESHOLD:
            candidates.append((asset, p_sim))

    if not candidates:
        return None

    # 3. Deep Embedding refinement
    best_asset, best_score = None, -1.0
    for asset, p_sim in candidates:
        if "embedding" not in asset: continue
        c_sim = cosine_similarity(query_embedding, asset["embedding"])
        combined = PHASH_WEIGHT * p_sim + CNN_WEIGHT * c_sim
        if combined > best_score:
            best_score = combined
            best_asset = {**asset, "combined_similarity": combined}

    # 4. Final threshold check
    return best_asset if best_score > 0.4 else None
