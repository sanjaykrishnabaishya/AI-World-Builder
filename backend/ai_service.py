import os
import requests
import base64
from typing import List, Dict, Any
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models import WorldLore
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
    system_instruction = "You are the Story Weaver in Atlas Studio. You assist the user in writing and editing their story."
    if lore:
        system_instruction += f"\n\nYou are writing a story set in: {lore.world_name}\nLore context: {lore.core_history}\nFactions: {[f.name for f in lore.factions]}\n"
    
    system_instruction += """
    CRITICAL INSTRUCTIONS:
    1. SIMPLE ENGLISH: Always speak in simple English that a child can understand.
    2. USER CONTROL: The control is 100% with the user. If they ask to change a character's name, ONLY change that name and reply with the corrected sentence or paragraph. DO NOT rewrite the entire story or context unless they explicitly ask you to change everything.
    3. Be concise and confirm exactly what you altered.
    """

    contents = []
    for msg in history:
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

def generate_story_stream(lore: WorldLore):
    prompt = f"""
    You are the Atlas Studio Master Weaver. 
    Using simple English that a child can understand, write a massive, incredibly detailed story based on the following world lore.
    Your goal is to write a very long story (aiming for over 6,000 words).
    
    World Lore:
    Name: {lore.world_name}
    History: {lore.core_history}
    Magic/Tech: {lore.magic_system}
    
    Requirements:
    1. SIMPLE ENGLISH: Use simple words, short sentences, and clear descriptions so a 5th grader can read it easily.
    2. LENGTH: Write as much as you possibly can. Build deep character arcs, intense dialogue, and long descriptions of the locations. Do not summarize.
    3. CHARACTERS: Invent multiple interesting characters.
    
    Begin writing the story now:
    """
    
    response = client.models.generate_content_stream(
        model="gemini-3.6-flash",
        contents=prompt
    )
    
    for chunk in response:
        yield chunk.text

import time

def generate_image_from_prompt(prompt: str) -> str:
    API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
    headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}"}
    
    # We add a style prefix to ensure high quality results based on the Atlas Studio aesthetic
    full_prompt = f"digital art, highly detailed, cinematic lighting, masterpiece, concept art, {prompt}"
    
    max_retries = 3
    for attempt in range(max_retries):
        response = requests.post(API_URL, headers=headers, json={"inputs": full_prompt})
        
        if response.status_code == 200:
            image_bytes = response.content
            base64_encoded = base64.b64encode(image_bytes).decode('utf-8')
            return f"data:image/jpeg;base64,{base64_encoded}"
            
        error_json = response.json() if response.content else {}
        error_msg = str(error_json.get("error", response.text))
        
        if "currently loading" in error_msg.lower() or response.status_code == 503:
            if attempt < max_retries - 1:
                # Provide time for the free tier model to wake up and load into memory
                time.sleep(15)
                continue
                
        raise Exception(f"Hugging Face API Error: {error_msg}")
        
    raise Exception("Image generation failed after multiple retries. The model may be offline.")
