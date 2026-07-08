import uuid
from backend.app.services.db import supabase
from backend.app.models.other_models import ClientCreate

def _search_clients(name: str | None, nickname: str | None):
    result = supabase.table("clients").select("*")
    
    if name is not None:
        result = result.ilike("name", f"%{name}%")
    if nickname is not None:
        result = result.ilike("name", f"%{nickname}%")

    result = result.execute()
    return result.data or []

def _create_client(c: ClientCreate):
    row = {
        "nickname": c.nickname, 
        "name": c.name, 
        "number": c.phone_number, 
        "email": c.email, 
    }
    result = supabase.table("clients").insert(row).execute()
    if not result.data:
        raise RuntimeError("Failed to add supplier")
    return result.data[0]

def _generate_ref_number() -> str:
    """Simple human-readable ref number. Swap for a nicer scheme
    (e.g. sequential JB-2026-0001) once you land on a format."""
    return f"JB-{uuid.uuid4().hex[:8].upper()}"
