// Thin wrapper around the FastAPI backend.
// Set VITE_API_BASE_URL in a .env file if your backend isn't on localhost:8000.

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ? JSON.stringify(body.detail) : detail;
    } catch {
      // ignore body parse errors
    }
    throw new Error(`${res.status} ${path}: ${detail}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

// ---------- Jobs ----------
export const getDashboardJobs = () => request("/dashboard");
export const createJob = (job) => request("/new_job", { method: "POST", body: JSON.stringify(job) });

// ---------- Addresses ----------
export const searchAddresses = (q, clientId) =>
  request(`/addresses${qs({ q, client_id: clientId })}`);
export const createAddress = (address) =>
  request("/addresses", { method: "POST", body: JSON.stringify(address) });

// ---------- Suppliers ----------
export const searchSuppliers = (name, nickname) =>
  request(`/suppliers${qs({ name, nickname })}`);
export const createSupplier = (supplier) =>
  request("/suppliers", { method: "POST", body: JSON.stringify(supplier) });

// ---------- Clients ----------
export const searchClients = (name, nickname) =>
  request(`/clients${qs({ name, nickname })}`);
export const createClient = (client) =>
  request("/clients", { method: "POST", body: JSON.stringify(client) });
