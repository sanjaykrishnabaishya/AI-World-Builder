from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_service import generate_world_lore

app = FastAPI(title="AI World Builder API")

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI World Builder API!"}

@app.post("/api/generate/world")
def create_world(input_data: SparkInput):
    lore = generate_world_lore(input_data.spark)
    return lore
