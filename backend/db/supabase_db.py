import os
from supabase import create_client, Client
from typing import List, Dict, Optional

# Load Supabase credentials from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role for backend writes

supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

"""
SQL SCHEMA FOR SUPABASE (Run this in the SQL Editor):

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Official Media Table
CREATE TABLE IF NOT EXISTS official_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT UNIQUE NOT NULL,
    owner_name TEXT NOT NULL,
    sport_category TEXT NOT NULL,
    file_url TEXT,
    phash TEXT NOT NULL,
    embedding vector(1280), -- MobileNetV2 embedding size
    upload_timestamp TIMESTAMPTZ DEFAULT now(),
    detection_count INTEGER DEFAULT 0
);

-- Detections Table
CREATE TABLE IF NOT EXISTS detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id TEXT UNIQUE NOT NULL,
    url TEXT,
    verdict TEXT NOT NULL,
    confidence_score FLOAT NOT NULL,
    matched_content_id TEXT REFERENCES official_media(content_id),
    similarity_score FLOAT,
    coverage_ratio FLOAT,
    gemini_description TEXT,
    detection_timestamp TIMESTAMPTZ DEFAULT now()
);

-- Index for vector search (Cosine Similarity)
CREATE INDEX ON official_media USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC Function for Vector Search
CREATE OR REPLACE FUNCTION match_assets (
  query_embedding vector(1280),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  content_id text,
  owner_name text,
  sport_category text,
  file_url text,
  phash text,
  embedding vector(1280),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.content_id,
    om.owner_name,
    om.sport_category,
    om.file_url,
    om.phash,
    om.embedding,
    1 - (om.embedding <=> query_embedding) AS similarity
  FROM official_media om
  WHERE 1 - (om.embedding <=> query_embedding) > match_threshold
  ORDER BY om.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RPC Function for Incrementing Detection Count
CREATE OR REPLACE FUNCTION increment_asset_count(cid text)
RETURNS void AS $$
BEGIN
  UPDATE official_media
  SET detection_count = detection_count + 1
  WHERE content_id = cid;
END;
$$ LANGUAGE plpgsql;
"""

def save_official_media(data: Dict):
    """Save registered asset to Supabase."""
    # Convert list embedding to string for Postgres vector
    if "embedding" in data and isinstance(data["embedding"], list):
        # Already handled by the library or needs string format
        pass
    
    res = supabase.table("official_media").insert(data).execute()
    return res.data

def get_all_official_media() -> List[Dict]:
    """Fallback: Get all assets (O(N) search)."""
    res = supabase.table("official_media").select("*").execute()
    return res.data

def vector_search_assets(query_embedding: List[float], limit: int = 5) -> List[Dict]:
    """Perform O(log N) vector search using Supabase RPC."""
    # You need to define a postgres function 'match_assets' for this
    # See Supabase docs on vector search
    rpc_params = {
        'query_embedding': query_embedding,
        'match_threshold': 0.4,
        'match_count': limit,
    }
    res = supabase.rpc('match_assets', rpc_params).execute()
    return res.data

def save_detection(data: Dict):
    """Save detection result to Supabase."""
    res = supabase.table("detections").insert(data).execute()
    return res.data

def increment_detection_count(content_id: str):
    """Increment detection count for an asset."""
    # Supabase doesn't have a direct 'increment' like Firebase without RPC
    # but we can use the 'rpc' or just a manual update
    supabase.rpc('increment_asset_count', {'cid': content_id}).execute()
