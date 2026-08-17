import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models import WorldLore

load_dotenv()

# We use the recommended gemini-3.6-flash model as per the skill instructions
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_world_lore(spark: str) -> WorldLore:
    prompt = f"""
    You are the Master Loremaster of a fantasy world building engine.
    Take the following core concept ("Spark") and expand it into a rich, immersive world lore.
    
    Spark: "{spark}"
    
    Provide the world's name, a detailed core history, an explanation of the magic or technology system, 
    3 major factions, and 3 key points of interest.
    """
    
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=WorldLore,
        )
    )
    
    # Return the parsed Pydantic object
    return WorldLore.model_validate_json(response.text)
