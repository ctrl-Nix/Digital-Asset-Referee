from fastapi import APIRouter, Header
from db.firestore import get_db
from services.matcher import get_local_assets

router = APIRouter()

@router.get("/assets")
async def list_assets():
  db = get_db()
  
  # Fetch from local registry
  local = get_local_assets()
  
  # Fetch from Firestore
  remote = []
  if db is not None:
      try:
          remote = [doc.to_dict() for doc in db.collection("official_media").stream()]
      except Exception as e:
          print(f"Error fetching remote assets: {e}")
  
  # Merge
  assets_map = {a["content_id"]: a for a in local}
  for a in remote:
      assets_map[a["content_id"]] = a
      
  return {"assets": list(assets_map.values())}

@router.get("/detections")
async def list_detections():
  db = get_db()
  if db is None:
      return {"detections": []}
  try:
      detections = [doc.to_dict() for doc in db.collection("detections").stream()]
      # Sort by timestamp descending
      detections.sort(key=lambda x: x.get("detection_timestamp", ""), reverse=True)
      return {"detections": detections}
  except Exception as e:
      print(f"Error fetching detections: {e}")
      return {"detections": []}
