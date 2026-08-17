from pydantic import BaseModel
from typing import List

class Faction(BaseModel):
    name: str
    description: str
    motto: str
    leader: str

class PointOfInterest(BaseModel):
    name: str
    description: str
    danger_level: str

class WorldLore(BaseModel):
    world_name: str
    core_history: str
    magic_system: str
    factions: List[Faction]
    points_of_interest: List[PointOfInterest]
