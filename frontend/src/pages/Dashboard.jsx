import { useEffect, useMemo, useState } from "react";
import { getDashboardJobs, searchClients } from "../api.js";

const STATUS_ORDER = ["details_pending", "scheduled", "in_transit", "completed", "cancelled"];

const STATUS_META = {
  details_pending: { label: "Missing details", dot: "var(--st-pending)" },
  scheduled: { label: "Scheduled", dot: "var(--st-scheduled)" },
  in_transit: { label: "In transit", dot: "var(--st-transit)" },
  completed: { label: "Completed", dot: "var(--st-completed)" },
  cancelled: { label: "Cancelled", dot: "var(--st-cancelled)" },
};

const LEG_STATUS_STYLE = {
  unassigned: { bg: "var(--st-pending-bg)", fg: "var(--st-pending)" },
  scheduled: { bg: "var(--st-scheduled-bg)", fg: "var(--st-scheduled)" },
  picked_up: { bg: "var(--st-transit-bg)", fg: "var(--st-transit)" },
  delivered: { bg: "var(--st-completed-bg)", fg: "var(--st-completed)" },
};

const WINDOWS = [
  { key: "all", label: "Last 30 days" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "next7", label: "Next 7 days" },
  { key: "nextMonth", label: "Next month" },
];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getJobDateRange(job) {
  const start = toDateOnly(job.c_date);
  const end = toDateOnly(job.d_date);

  if (!start) return { start: null, end: null };
  if (!end) return { start, end: start };
  if (end < start) return { start, end: start };
  return { start, end };
}

function inWindow(job, windowKey) {
  if (windowKey === "all") return true;

  const { start, end } = getJobDateRange(job);
  if (!start || !end) return false;

  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (windowKey === "today") return start <= today0 && end >= today0;
  if (windowKey === "tomorrow") {
    const tmrw = new Date(today0);
    tmrw.setDate(tmrw.getDate() + 1);
    return start <= tmrw && end >= tmrw;
  }
  if (windowKey === "next7") {
    const windowEnd = new Date(today0);
    windowEnd.setDate(windowEnd.getDate() + 7);
    return start <= windowEnd && end >= today0;
  }
  if (windowKey === "nextMonth") {
    const windowEnd = new Date(today0);
    windowEnd.setDate(windowEnd.getDate() + 30);
    return start <= windowEnd && end >= today0;
  }
  return true;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [clientsById, setClientsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowKey, setWindowKey] = useState("all");
  const [openGroups, setOpenGroups] = useState(() => new Set(STATUS_ORDER));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [jobsData, clientsData] = await Promise.all([
          getDashboardJobs(),
          searchClients(undefined, undefined).catch(() => []),
        ]);
        if (cancelled) return;
        setJobs(jobsData || []);
        const map = {};
        (clientsData || []).forEach((c) => {
          map[c.id] = c.name || c.nickname || "Unnamed client";
        });
        setClientsById(map);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => inWindow(job, windowKey));
  }, [jobs, windowKey]);

  const grouped = useMemo(() => {
    const groups = {};
    STATUS_ORDER.forEach((s) => (groups[s] = []));
    filteredJobs.forEach((j) => {
      if (!groups[j.status]) groups[j.status] = [];
      groups[j.status].push(j);
    });
    return groups;
  }, [filteredJobs]);

  function toggleGroup(key) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <h1 className="dashboard-title">Jobs, last 30 days</h1>
          <div className="dashboard-sub">
            {filteredJobs.length} job{filteredJobs.length === 1 ? "" : "s"} in view
          </div>
        </div>
        <div className="window-tabs">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              className={`window-tab ${windowKey === w.key ? "active" : ""}`}
              onClick={() => setWindowKey(w.key)}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="state-banner">Loading jobs…</div>}
      {error && (
        <div className="state-banner error">
          Couldn't reach the API: {error}. Confirm the backend is running and VITE_API_BASE_URL
          points to it.
        </div>
      )}

      {!loading &&
        !error &&
        STATUS_ORDER.map((statusKey) => {
          const meta = STATUS_META[statusKey];
          const list = grouped[statusKey] || [];
          const open = openGroups.has(statusKey);
          return (
            <section className="status-group" key={statusKey}>
              <button className="status-group-head" onClick={() => toggleGroup(statusKey)}>
                <div className="status-group-left">
                  <span className="status-dot" style={{ background: meta.dot }} />
                  <span className="status-name">{meta.label}</span>
                  <span className="status-count">{list.length}</span>
                </div>
                <span className={`status-chevron ${open ? "open" : ""}`}>›</span>
              </button>
              {open && (
                <div className="status-group-body">
                  {list.length === 0 && (
                    <div className="status-empty">Nothing here for this window.</div>
                  )}
                  {list.map((job) => (
                    <JobCard key={job.ref_number} job={job} clientName={clientsById[job.client_id]} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
    </main>
  );
}

function JobCard({ job, clientName }) {
  return (
    <article className="job-card">
      <div className="waybill-tag">{job.ref_number}</div>
      <div className="job-main">
        <div className="job-row1">
          <span className="job-client">{clientName || "Unnamed client"}</span>
          <span className="job-type-chip">{job.job_type.replace("_", " ")}</span>
        </div>
        {job.contents && <div className="job-contents">{job.contents}</div>}
        {job.legs && job.legs.length > 0 && (
          <div className="job-legs">
            {job.legs
              .slice()
              .sort((a, b) => a.leg_sequence - b.leg_sequence)
              .map((leg) => {
                const style = LEG_STATUS_STYLE[leg.leg_status] || LEG_STATUS_STYLE.unassigned;
                return (
                  <div className="job-leg" key={leg.id}>
                    <span>Leg {leg.leg_sequence}</span>
                    <span
                      className="leg-status-pill"
                      style={{ background: style.bg, color: style.fg }}
                    >
                      {leg.leg_status.replace("_", " ")}
                    </span>
                    {leg.c_time && <span>collect {new Date(leg.c_time).toLocaleString()}</span>}
                    {leg.d_time && <span>deliver {new Date(leg.d_time).toLocaleString()}</span>}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </article>
  );
}
