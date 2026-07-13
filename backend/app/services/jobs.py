from datetime import datetime, timedelta, timezone
from typing import Dict, List

from backend.app.services.db import supabase
from backend.app.models.job_models import JobCreate, JobStatus, LegStatus
from backend.other.job_helpers import _generate_ref_number


def create_job(job: JobCreate) -> Dict:
    ref_number = _generate_ref_number()
    job_row = {
        "ref_number": ref_number,
        "client_id": str(job.client_id),
        "job_type": job.job_type.value,
        "contents": job.contents,
        "status": JobStatus.details_pending.value,
        "notes": job.notes,
        "c_address": str(job.c_address_id) if job.c_address_id else None,
        "d_address": str(job.d_address_id) if job.d_address_id else None,
        "c_date": job.c_date.isoformat(),
        "d_date": job.d_date.isoformat(),
    }
    job_result = supabase.table("jobs").insert(job_row).execute()
    if not job_result.data:
        raise RuntimeError("Failed to create job")

    suppliers_missing = False
    has_c_address = False
    has_d_address = False

    leg_rows = []
    for leg in job.legs:
        leg_status = LegStatus.scheduled if leg.supplier_id else LegStatus.unassigned
        if not leg.supplier_id:
            suppliers_missing = True
        if leg.c_address_id == job.c_address_id:
            has_c_address = True
        if leg.d_address_id == job.d_address_id:
            has_d_address = True
        leg_rows.append({
            "ref_number": ref_number,
            "leg_sequence": leg.leg_sequence,
            "c_address_id": str(leg.c_address_id),
            "d_address_id": str(leg.d_address_id),
            "supplier_id": str(leg.supplier_id) if leg.supplier_id else None,
            "leg_status": leg_status.value,
            "c_time": leg.c_time.isoformat() if leg.c_time else None,
            "d_time": leg.d_time.isoformat() if leg.d_time else None,
        })

    legs_result = supabase.table("job_legs").insert(leg_rows).execute() 
    if not suppliers_missing and has_c_address and has_d_address:
        supabase.table("jobs").update({"status": JobStatus.scheduled.value}).eq("ref_number", ref_number).execute()

    if not legs_result.data:
        # Roll back the job row so we don't leave an orphaned job with no legs
        supabase.table("jobs").delete().eq("ref_number", ref_number).execute()
        raise RuntimeError("Failed to create job legs")

    job_data = job_result.data[0]
    job_data["legs"] = legs_result.data
    return job_data


def list_jobs() -> List[Dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    jobs_result = (
        supabase.table("jobs")
        .select("*")
        .gte("created_at", cutoff)
        .order("created_at", desc=True)
        .execute()
    )
    jobs = jobs_result.data or []
    if not jobs:
        return []

    # One extra query to grab every leg for these jobs, then stitch
    # them together in Python rather than firing a query per job.
    ref_numbers = [j["ref_number"] for j in jobs]
    legs_result = (
        supabase.table("job_legs")
        .select("*")
        .in_("ref_number", ref_numbers)
        .order("leg_sequence")
        .execute()
    )
    legs = legs_result.data or []

    legs_by_ref: Dict[str, List[Dict]] = {}
    for leg in legs:
        legs_by_ref.setdefault(leg["ref_number"], []).append(leg)

    for job in jobs:
        job["legs"] = legs_by_ref.get(job["ref_number"], [])

    return jobs