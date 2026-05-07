import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

def describe_content(image_path: Path) -> str:
    try:
        print(f"DEBUG: Gemini analysis requested for {image_path}")
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        # Using gemini-flash-latest as it is the most stable reference in this environment
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=[
                types.Part.from_bytes(
                    data=image_data,
                    mime_type="image/jpeg"
                ),
                "Describe this sports media content in under 100 words for an IP evidence report. Focus on identifying teams, players, or event details if visible."
            ]
        )
        
        if not response or not response.text:
            print("Gemini warning: Empty response from model")
            return "AI analysis unavailable"
            
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error during description: {type(e).__name__}: {e}")
        return "AI analysis unavailable"
