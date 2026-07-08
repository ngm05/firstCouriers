# Manifest — Dispatch Console (frontend)

A React + Vite front end for the FastAPI backend you shared (`main.py`, `jobs.py`, `other.py`, etc).

## Run it

```bash
npm install
cp .env.example .env   # edit if your API isn't on localhost:8000
npm run dev
```

Then start your FastAPI backend (it already allows CORS from `http://localhost:5173`, which is Vite's default dev port).

## What's here

- **Dashboard** (`/`) — pulls `GET /dashboard`, lets you filter by Today / Tomorrow / Next 7 days / Next month,
  and groups jobs under collapsible status toggles (Missing details, Scheduled, In transit, Completed, Cancelled).
  Each group scrolls independently once it gets tall.
- **New job** (`/new-job`) — client lookup, one collection + one delivery address for the job itself, freight
  description, notes, and a right-hand "Suppliers" panel where you add one leg per supplier with a `+` button.
  Each leg has a checkbox next to its address and time fields to copy the job's own values instead of retyping them.

## Address save behaviour

Per your spec: an address is only written back as a *saved* address (`is_saved: true`) when both a nickname and
the full address are provided. Before creating anything, the form checks `GET /addresses?q=<nickname>` for an
existing saved address with that exact nickname and reuses its id if found. If only the address fields are filled
in with no nickname, it's saved as a one-off (`is_saved: false`).

## Two things worth knowing about the current backend

1. **`c_date` / `d_date` aren't persisted or returned.** `JobCreate` accepts them and the form sends them, but
   `create_job()` in `jobs.py` never writes them into `job_row`, and `JobResponse` doesn't include them either. So
   the dashboard's date-window filter (Today/Tomorrow/etc.) currently falls back to each job's **earliest leg
   collection time** (`c_time`) instead, since that's the only date data actually returned. If you'd like the
   window filter to reflect the job-level dates instead, add `c_date`/`d_date` to `job_row` in `create_job()` and
   to `JobResponse`, and I can switch the dashboard to use those directly.
2. **There's no `GET /addresses/{id}` endpoint.** The dashboard currently can't show readable collection/delivery
   addresses for a job's legs (only ids are stored on the leg). Adding a lookup endpoint (the `get_address_by_id`
   helper in `other.py` already exists, it's just not wired up to a route) would let me show real addresses instead
   of leg status/timing only.

## Project layout

```
src/
  api.js                 – fetch wrapper for every backend endpoint
  App.jsx                – top bar + router outlet
  pages/Dashboard.jsx
  pages/NewJobForm.jsx
  components/AddressFields.jsx   – reusable address block + nickname autocomplete + resolve-to-id logic
  components/ClientPicker.jsx    – client autocomplete with "add as new client"
  components/SupplierPicker.jsx  – supplier autocomplete, existing suppliers only
  components/LegForm.jsx         – one leg: supplier + addresses + times + copy-from-job checkboxes
```
