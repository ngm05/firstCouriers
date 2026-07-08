from typing import Dict, List, Optional

from backend.app.services.db import supabase
from backend.app.models.other_models import LegAddress, SupplierCreate, SupplierType


def _create_address(address: LegAddress) -> Dict:
    """Insert a new saved address. Postgres generates the UUID"""
    row = {
        "client_id": str(address.client_id) if address.client_id else None,
        "nickname": address.nickname,
        "is_saved": address.is_saved,
        "address_line1": address.address_line1,
        "address_line2": address.address_line2,
        "suburb": address.suburb,
        "state": address.state,
        "postcode": address.postcode,
    }
    result = supabase.table("addresses").insert(row).execute()
    if not result.data:
        raise RuntimeError("Failed to create address")
    return result.data[0]


def _search_addresses(query: str, client_id: Optional[str] = None) -> List[Dict]:
    """Used for the nickname autocomplete on the add-job form.
    e.g. typing 'abc' should surface 'ABC Warehouse'."""
    q = (
        supabase.table("addresses")
        .select("*")
        .eq("is_saved", True)
        .ilike("nickname", f"%{query}%")
    )
    if client_id:
        q = q.eq("client_id", client_id)
    result = q.limit(10).execute()
    return result.data or []


def get_address_by_id(address_id: str) -> Optional[Dict]:
    result = supabase.table("addresses").select("*").eq("id", address_id).execute()
    return result.data[0] if result.data else None

def _create_supplier(s: SupplierCreate):
    row = {
        "name": s.name,
        "nickname": s.nickname,
        "contact_number": s.contact_number,
        "email": s.email,
        "supplier_type": s.supplier_type.value,
    }

    result = supabase.table("suppliers").insert(row).execute()
    if not result.data:
        raise RuntimeError("Failed to add supplier")
    return result.data[0]
    
def _search_suppliers(name, nickname):
    result = supabase.table("suppliers").select("*")

    if name is not None:
        result = result.ilike("name", f"%{name}%")                     
    if nickname is not None:
        result = result.ilike("nickname", f"%{nickname}%")
    
    result = result.execute()
    return result.data or []