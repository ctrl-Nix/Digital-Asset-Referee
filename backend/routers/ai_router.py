from fastapi import APIRouter
from pydantic import BaseModel

from services.amd_inference import generate_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat(request: ChatRequest):
    return generate_response(request.message)