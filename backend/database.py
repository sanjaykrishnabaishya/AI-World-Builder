import json
import os
from typing import Dict, Any
import threading

DB_FILE = "database.json"
db_lock = threading.Lock()

def _load_db() -> Dict[str, Any]:
    if not os.path.exists(DB_FILE):
        return {"projects": {}}
    with open(DB_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {"projects": {}}

def _save_db(data: Dict[str, Any]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def get_all_projects(email: str) -> list:
    with db_lock:
        db = _load_db()
        return [p for p in db["projects"].values() if p.get("userEmail") == email]

def get_project(project_id: str) -> Dict[str, Any]:
    with db_lock:
        db = _load_db()
        return db["projects"].get(project_id)

def save_project(project: Dict[str, Any]):
    with db_lock:
        db = _load_db()
        db["projects"][project["id"]] = project
        _save_db(db)

def delete_project(project_id: str):
    with db_lock:
        db = _load_db()
        if project_id in db["projects"]:
            del db["projects"][project_id]
            _save_db(db)
