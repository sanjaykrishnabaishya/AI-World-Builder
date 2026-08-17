import os
from typing import List, Dict, Any
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
    
    return WorldLore.model_validate_json(response.text)

def chat_with_world(message: str, lore: WorldLore | None, history: List[Dict[str, str]]) -> str:
    system_instruction = "You are the Story Weaver, an AI assistant in Atlas Studio helping an author write a story."
    if lore:
        system_instruction += f"\n\nYou are writing a story set in: {lore.world_name}\nLore context: {lore.core_history}\nFactions: {[f.name for f in lore.factions]}\n"
    
    system_instruction += "\nIf the user is just starting, ask them for their main character details, setting, and tone. Give them explicit control: ask if they want to provide the details manually or if they want you to auto-generate them. Keep your responses engaging, collaborative, and concise."

    contents = []
    for msg in history:
        # The frontend uses 'model' or 'user' roles, which maps perfectly to Gemini
        contents.append({"role": msg['role'], "parts": [{"text": msg['content']}]})
        
    contents.append({"role": "user", "parts": [{"text": message}]})

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction
        )
    )
    
    return response.text
