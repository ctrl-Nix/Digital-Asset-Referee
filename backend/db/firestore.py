import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Global DB reference
db = None

def get_db():
    global db
    if db is not None:
        return db
    
    if not firebase_admin._apps:
        # Priority 1: fresh JSON file
        sa_path = Path(__file__).parent.parent / "firebase-service-account-fresh.json"
        
        # Priority 2: env var JSON string
        sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
        
        # Priority 3: env var file path
        sa_env_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()
        
        try:
            if sa_path.exists():
                print(f"Loading Firebase from file: {sa_path}")
                cred = credentials.Certificate(str(sa_path))
                firebase_admin.initialize_app(cred)
            elif sa_json:
                print("Loading Firebase from JSON env var")
                cred = credentials.Certificate(json.loads(sa_json))
                firebase_admin.initialize_app(cred)
            elif sa_env_path and Path(sa_env_path).exists():
                print(f"Loading Firebase from path env var: {sa_env_path}")
                cred = credentials.Certificate(sa_env_path)
                firebase_admin.initialize_app(cred)
            else:
                print("Warning: No Firebase credentials found. Backend may run in limited mode.")
                return None
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            return None

    try:
        db = firestore.client()
        print("Firestore connected successfully")
    except Exception as e:
        print(f"Firestore connection failed: {e}")
        db = None
    
    return db

# Initialize immediately for backward compatibility with scripts that import 'db' directly
db = get_db()

def save_official_media(data: dict):
    _db = get_db()
    if _db is None: return False
    try:
        _db.collection("official_media").document(data["content_id"]).set(data)
        return True
    except Exception as e:
        print(f"Error saving official media: {e}")
        return False

def get_all_official_media() -> list[dict]:
    _db = get_db()
    if _db is None: return []
    try:
        return [d.to_dict() for d in _db.collection("official_media").stream()]
    except Exception as e:
        print(f"Error fetching official media: {e}")
        return []

def save_detection(detection_id_or_data, data=None):
    _db = get_db()
    if _db is None: return False
    try:
        if data is None:
            det_id = detection_id_or_data.get("detection_id")
            _db.collection("detections").document(det_id).set(detection_id_or_data)
        else:
            _db.collection("detections").document(detection_id_or_data).set(data)
        return True
    except Exception as e:
        print(f"Error saving detection: {e}")
        return False

def increment_detection_count(content_id: str):
    _db = get_db()
    if _db is None: return False
    try:
        ref = _db.collection("official_media").document(content_id)
        ref.update({"detection_count": firestore.Increment(1)})
        return True
    except Exception as e:
        print(f"Error incrementing count: {e}")
        return False

def get_detection(detection_id: str):
    _db = get_db()
    if _db is None: return None
    try:
        doc = _db.collection("detections").document(detection_id).get()
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        print(f"Error fetching detection: {e}")
        return None
