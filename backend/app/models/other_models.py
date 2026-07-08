from uuid import UUID
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel

# ---------- drivers ----------

class SupplierType(str, Enum):
    driver = "driver"
    airline = "airline"

class SupplierCreate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    supplier_type: SupplierType

class SupplierCreateResponse(SupplierCreate):
    id: UUID

# ---------- addresses ----------

class LegAddress(BaseModel):
    nickname: Optional[str] = None
    client_id: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    suburb: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    is_saved: bool = False
    #country: Optional[str] = None
    
class AddressResponse(LegAddress):
    id: UUID

# ---------- clients ----------

class ClientCreate(BaseModel):
    nickname: Optional[str] = None
    name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None

class ClientCreateResponse(ClientCreate):
    id: UUID
