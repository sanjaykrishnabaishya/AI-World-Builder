from typing import List, Dict, Any
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_service import generate_world_lore, chat_with_world, generate_image_from_prompt, generate_story_stream
from models import WorldLore

app = FastAPI(title="Atlas Studio API")

# Allow the Next.js frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SparkInput(BaseModel):
    spark: str

class ChatInput(BaseModel):
    message: str
    lore: WorldLore | None = None
    history: List[Dict[str, str]] = []

class ImageInput(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Atlas Studio API!"}

@app.post("/api/generate/world")
def create_world(input_data: SparkInput):
    lore = generate_world_lore(input_data.spark)
    return lore

@app.post("/api/chat")
def chat_with_weaver(input_data: ChatInput):
    reply = chat_with_world(input_data.message, input_data.lore, input_data.history)
    return {"reply": reply}

@app.post("/api/generate/image")
def create_image(input_data: ImageInput):
    image_b64 = generate_image_from_prompt(input_data.prompt)
    return {"image_url": image_b64}

class StoryInput(BaseModel):
    lore: WorldLore

@app.post("/api/generate/story")
def create_story(input_data: StoryInput):
    return StreamingResponse(generate_story_stream(input_data.lore), media_type="text/plain")
