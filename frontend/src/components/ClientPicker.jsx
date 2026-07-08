import { useEffect, useRef, useState } from "react";
import { searchClients, createClient } from "../api.js";

// Controlled by { query, clientId } from the parent, so the parent always
// knows both the display text and the resolved UUID (or null if unresolved).
export default function ClientPicker({ query, clientId, onChange }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2 || clientId) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchClients(query, undefined);
        setResults(r || []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, clientId]);

  function pick(client) {
    onChange({ query: client.name || client.nickname, clientId: client.id });
    setOpen(false);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const created = await createClient({ name: query, nickname: null, phone_number: null, email: null });
      onChange({ query: created.name, clientId: created.id });
      setOpen(false);
    } catch (e) {
      alert(`Couldn't create client: ${e.message}`);
    } finally {
      setCreating(false);
    }
  }

  const showCreateOption = query && query.length >= 2 && !clientId && results.length === 0;

  return (
    <div className="field-group autocomplete-wrap">
      <label className="field-label">Client name</label>
      <input
        className="field-input"
        placeholder="Start typing a client name…"
        value={query}
        onChange={(e) => onChange({ query: e.target.value, clientId: null })}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {clientId && <div className="helper-text">Matched an existing client.</div>}
      {open && (results.length > 0 || showCreateOption) && (
        <div className="autocomplete-list">
          {results.map((c) => (
            <div key={c.id} className="autocomplete-item" onMouseDown={() => pick(c)}>
              <div className="ac-name">{c.name || c.nickname}</div>
              {c.phone_number && <div className="ac-sub">{c.phone_number}</div>}
            </div>
          ))}
          {showCreateOption && (
            <div className="autocomplete-item" onMouseDown={handleCreate}>
              <div className="ac-name">{creating ? "Creating…" : `+ Add "${query}" as a new client`}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
