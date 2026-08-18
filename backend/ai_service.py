import os
import requests
import base64
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv
from models import WorldLore

load_dotenv()

# Use OpenRouter for access to Gemma 4 31B
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("OPENROUTER_API_KEY"),
)

def generate_world_lore(spark: str, genre: str | None = None) -> WorldLore:
    import random
    seed = random.randint(1, 100000000)
    
    genre_instruction = ""
    if genre:
        genre_instruction = f"""
    CRITICAL GENRE ENFORCEMENT: The user has selected the '{genre}' genre. 
    You MUST perfectly align every single aspect of this world with '{genre}'. 
    The world's name, the history, the environments, the character archetypes, the magic/technology, and the factions MUST be extremely accurate to the '{genre}' genre.
    Do not mix genres unless requested.
    """
    
    prompt = f"""
    You are the Master Loremaster of a world building engine.
    Take the following core concept ("Spark") and expand it into a rich, immersive world lore.
    
    Spark: "{spark}"
    {genre_instruction}
    
    CRITICAL UNIQUENESS SEED: {seed}
    You MUST generate a COMPLETELY UNIQUE AND HIGHLY ORIGINAL world every single time. 
    DO NOT reuse generic plotlines or exact world configurations. Be highly creative and imaginative.
    
    CRITICAL NAMING RULE:
    KEEP NAMES EXTREMELY SIMPLE AND UNDERSTANDABLE. Do NOT invent weird, hard-to-pronounce, or over-complex alien/fantasy syllables (like "Xyloplic", "Agrathon", "Nexon Lumis").
    Use simple, descriptive, and common names (e.g., "Earth Kingdom", "Iron Knights", "Healing Magic", "Super Suits", "Fireball"). The world should feel grounded and instantly understandable.
    
    Provide the world's name, a detailed core history, an explanation of the magic or technology system, 
    3 major factions, and 3 key points of interest.
    
    CRITICAL: Return the response as a pure, valid JSON object matching this schema EXACTLY.
    Do NOT include any markdown blocks (like ```json), no extra text, and DO NOT alter the JSON keys.
    Use EXACTLY these keys:
    {{
        "world_name": "string",
        "core_history": "string",
        "magic_system": "string",
        "factions": [
            {{"name": "string", "description": "string", "motto": "string", "leader": "string"}}
        ],
        "points_of_interest": [
            {{"name": "string", "description": "string", "danger_level": "string"}}
        ]
    }}
    """
    
    response = client.chat.completions.create(
        model="google/gemini-1.5-flash",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=1.0,
        presence_penalty=0.8
    )
    
    try:
        lore_data = response.choices[0].message.content
        # Sometimes models wrap in markdown despite instructions
        if lore_data.startswith("```json"):
            lore_data = lore_data[7:]
        if lore_data.endswith("```"):
            lore_data = lore_data[:-3]
        
        import json
        # Try to sanitize any weird characters in keys if needed, but strict prompt usually fixes it.
        parsed = json.loads(lore_data.strip())
        
        # If the model injected weird characters into keys like '。world_name', sanitize it
        sanitized = {}
        for key in ["world_name", "core_history", "magic_system", "factions", "points_of_interest"]:
            # Find a matching key that ends with the expected key, in case of weird prefix
            matching_key = next((k for k in parsed.keys() if k.endswith(key)), key)
            sanitized[key] = parsed.get(matching_key, "")
            
        return WorldLore.model_validate(sanitized)
    except Exception as e:
        print(f"JSON Parsing Error: {str(e)}")
        print(f"Raw Output: {response.choices[0].message.content}")
        raise ValueError("The AI generated invalid lore data. Please try generating again.")

def chat_with_world(message: str, lore: WorldLore | None, history: List[Dict[str, str]], story_content: str = "") -> str:
    system_instruction = "You are the Story Weaver in Atlas Studio. You assist the user in writing and editing their story."
    if lore:
        system_instruction += f"\n\nYou are writing a story set in: {lore.world_name}\nLore context: {lore.core_history}\nFactions: {[f.name for f in lore.factions]}\n"
    
    if story_content:
        system_instruction += f"\n\nHere is the story written so far:\n{story_content[-4000:]}\n\n"
        
    system_instruction += """
    CRITICAL INSTRUCTIONS:
    1. CONTINUE THE STORY: If the user asks "what happens next", "next part", "continue", "more", etc., you MUST immediately write the next full chapter of the story continuing exactly from where it left off. DO NOT ask the user what should happen, just invent a gripping continuation and write the story text.
    2. CONSISTENCY: Always use the existing characters, world rules, and plot threads. Keep the story highly consistent with what has already happened.
    3. SIMPLE ENGLISH: Always speak in simple English that a child can understand.
    4. USER CONTROL: If they ask to change a character's name, ONLY change that name and reply with the corrected sentence or paragraph.
    5. Be concise unless writing the next story chapter.
    6. SMART IMAGE GENERATION: If the user asks for an image, picture, or portrait of a character, location, or scene, DO NOT describe it in paragraph form. Instead, you MUST respond EXACTLY with a command starting with `/imagine ` followed by a highly detailed, comma-separated visual description of the subject. Example: `/imagine A towering obsidian fortress on a cliff, dark clouds, red lightning, fantasy concept art, highly detailed.`
    """

    messages = [{"role": "system", "content": system_instruction}]
    
    for msg in history:
        role = "assistant" if msg['role'] == "model" else msg['role']
        messages.append({"role": role, "content": msg['content']})
        
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="google/gemini-1.5-flash",
        messages=messages,
        temperature=0.7
    )
    
    return response.choices[0].message.content

def generate_story_stream(lore: WorldLore, genre: str | None = None):
    import random
    seed = random.randint(1, 100000000)
    genre_prompt = f" in the {genre} genre. Ensure the tone perfectly matches {genre}." if genre else "."
    prompt = f"""
    You are an expert bestselling author{genre_prompt}
    Write a gripping, immersive opening section based on the following world lore.
    
    World Name: {lore.world_name}
    History: {lore.core_history}
    Magic/Tech: {lore.magic_system}
    
    CRITICAL UNIQUENESS SEED: {seed}
    
    CRITICAL INSTRUCTIONS:
    1. EXTREME GENRE ACCURACY: The plot, environment, characters, and tone MUST flawlessly match the genre implied by the lore.
    2. BE COMPLETELY ORIGINAL: Do not write a generic story. Invent completely new, unique characters with unique names and completely original, unpredictable plotlines. DO NOT reuse any plots.
    3. STRUCTURAL VARIATION: You MUST NOT use repetitive opening hooks like "The sky over [City] was not blue..." or "That storm changed everything." Begin the story in a completely unique way every single time. Start with dialogue, or an intense action scene, or a mysterious character observation.
    4. CRITICAL NAMING RULE: KEEP NAMES EXTREMELY SIMPLE AND UNDERSTANDABLE. Do NOT invent weird, hard-to-pronounce, or over-complex alien/fantasy syllables. Use simple, descriptive, and common names.
    5. SIMPLE ENGLISH: You must write in extremely simple English. Use basic vocabulary and short sentences so a child can understand it perfectly.
    6. LENGTH & PACING: Write about 2000 to 3000 words (approx 2 or 3 chapters). DO NOT try to write 6000 words at once because you will hit the token limit and cut off mid-sentence. Write expansive dialogue and deep descriptions.
    7. NO EPILOGUE: You are strictly forbidden from writing an Epilogue or a conclusive ending.
    8. THE CLIFFHANGER: You MUST end this generation smoothly on a massive, suspenseful cliffhanger. Ensure you finish your final sentence completely.
    9. THE NOTE: At the very end of the text, on a new line, you MUST append exactly this note:
       "For what is going to happen next, Type next part or 2nd part or second part to generate."
    
    START IMMEDIATELY: Do not output any meta-text, titles, or planning. Just begin the story right now.
    """
    
    response = client.chat.completions.create(
        model="google/gemini-1.5-flash",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=8192,
        temperature=1.0,
        presence_penalty=0.6,
        stream=True
    )
    
    for chunk in response:
        if chunk.choices and len(chunk.choices) > 0:
            if chunk.choices[0].delta and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

import urllib.parse

def generate_image_from_prompt(prompt: str) -> str:
    # Switching to Pollinations.ai for lightning fast, keyless, highly reliable image generation
    encoded_prompt = urllib.parse.quote(prompt + ", masterpiece, high quality, highly detailed, stunning lighting")
    
    # We add a cache-busting random seed parameter so repeated prompts don't return the exact same cached image
    import random
    seed = random.randint(1, 1000000)
    
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={seed}&model=flux"
    
    try:
        response = requests.get(image_url, timeout=45)
        if response.status_code == 200:
            image_bytes = response.content
            base64_encoded = base64.b64encode(image_bytes).decode('utf-8')
            return f"data:image/jpeg;base64,{base64_encoded}"
        else:
            raise Exception(f"Pollinations API returned status {response.status_code}")
    except Exception as e:
        # Fallback to the default (faster) model if flux times out or fails
        fallback_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={seed}"
        try:
            fallback_response = requests.get(fallback_url, timeout=30)
            if fallback_response.status_code == 200:
                image_bytes = fallback_response.content
                base64_encoded = base64.b64encode(image_bytes).decode('utf-8')
                return f"data:image/jpeg;base64,{base64_encoded}"
            else:
                raise Exception(f"Fallback API returned status {fallback_response.status_code}")
        except Exception as fallback_e:
            raise Exception(f"Image generation failed after fallback: {str(fallback_e)}")
