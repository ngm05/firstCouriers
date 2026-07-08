from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

class JobType(str, Enum):
    scheduled = "scheduled"
    extraordinary = "extraordinary"


class JobStatus(str, Enum):
    details_pending = "details_pending"
    scheduled = "scheduled"
    in_transit = "in_transit"
    completed = "completed"
    cancelled = "cancelled"


class LegStatus(str, Enum):
    unassigned = "unassigned"
    scheduled = "scheduled"
    picked_up = "picked_up"
    delivered = "delivered"


# ---------- Job legs ----------

class JobLegCreate(BaseModel):
    """One leg of a job, as submitted when creating a job."""
    leg_sequence: int
    c_address_id: UUID
    d_address_id: UUID
    supplier_id: Optional[UUID] = None
    c_time: Optional[datetime] = None
    d_time: Optional[datetime] = None


class JobLegResponse(JobLegCreate):
    """A leg as returned from the database, including generated fields."""
    id: UUID
    ref_number: str
    leg_status: LegStatus


# ---------- Jobs ----------

class JobCreate(BaseModel):
    """What the 'new job' form/voice flow submits. A job must have at
    least one leg — for a simple job that's just one pickup -> dropoff."""
    client_id: UUID
    job_type: JobType
    contents: Optional[str] = None
    notes: Optional[str] = None
    c_date: Optional[datetime] = None
    d_date: Optional[datetime] = None
    legs: List[JobLegCreate] = Field(..., min_length=1)


class JobResponse(BaseModel):
    ref_number: str
    client_id: UUID
    job_type: JobType
    contents: Optional[str] = None
    status: JobStatus
    created_at: datetime
    notes: Optional[str] = None


class JobWithLegsResponse(JobResponse):
    """Used for both create and list endpoints so the frontend always
    gets a job together with its legs in one shape."""
    legs: List[JobLegResponse] = []