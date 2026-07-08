from fastapi import FastAPI, HTTPException
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

from backend.app.models.job_models import JobCreate, JobWithLegsResponse
from backend.app.models.other_models import LegAddress, AddressResponse, SupplierCreate, SupplierCreateResponse, ClientCreate, ClientCreateResponse
from backend.app.services.jobs import create_job, list_jobs
from backend.app.services.other import _create_address, _search_addresses, _create_supplier, _search_suppliers
from backend.other.job_helpers import _create_client, _search_clients
from backend.app.services.db import origin

app = FastAPI(title="First")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://firstcouriers.onrender.com/"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Jobs ----------

@app.get("/dashboard", response_model=List[JobWithLegsResponse], status_code=201)
def get_jobs():
    try:
        return list_jobs()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/new_job", response_model=JobWithLegsResponse, status_code=201)
def add_job(job: JobCreate):
    try:
        return create_job(job)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ---------- Addresses ----------
    
@app.post("/addresses", response_model=AddressResponse, status_code=201)
def create_address(address: LegAddress):
    try:
        return _create_address(address)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/addresses", response_model=List[AddressResponse])
def search_addresses(q: str, client_id: Optional[str] = None):
    """Powers the nickname autocomplete: GET /addresses?q=abc"""
    return _search_addresses(q, client_id)

# ---------- Suppliers ----------

@app.post("/suppliers", response_model=SupplierCreateResponse, status_code=201)
def create_suppliers(supplier: SupplierCreate):
    try:
        return _create_supplier(supplier)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/suppliers", response_model=List[SupplierCreateResponse])
def search_suppliers(name: Optional[str] = None, nickname:  Optional[str] = None):
    return _search_suppliers(name, nickname)

# ---------- Clients ----------

@app.post("/clients", response_model=ClientCreateResponse, status_code=201)
def create_client(client: ClientCreate):
    try:
        return _create_client(client)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/clients", response_model=List[ClientCreateResponse])
def search_client(name: Optional[str] = None, nickname:  Optional[str] = None):
    return _search_clients(name, nickname)