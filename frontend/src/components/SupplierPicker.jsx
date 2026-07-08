import { useEffect, useRef, useState } from "react";
import { searchSuppliers } from "../api.js";

// Only existing suppliers can be selected — no create-new here, since a
// leg's supplier must already be on file.
export default function SupplierPicker({ query, supplierId, onChange, disabled }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (disabled) return;
    if (!query || query.length < 2 || supplierId) {
      setResults([]);
      setSearched(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        let r = await searchSuppliers(query, undefined);
        if (!r || r.length === 0) {
          r = await searchSuppliers(undefined, query);
        }
        setResults(r || []);
      } catch {
        setResults([]);
      } finally {
        setSearched(true);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, supplierId, disabled]);

  function pick(s) {
    onChange({ query: s.name || s.nickname, supplierId: s.id });
    setOpen(false);
  }

  return (
    <div className="field-group autocomplete-wrap">
      <label className="field-label">Supplier</label>
      <input
        className="field-input"
        placeholder="Search existing suppliers…"
        value={query}
        disabled={disabled}
        onChange={(e) => onChange({ query: e.target.value, supplierId: null })}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {supplierId && <div className="helper-text">Matched an existing supplier.</div>}
      {!supplierId && searched && results.length === 0 && query.length >= 2 && (
        <div className="helper-text">No matching supplier on file. Add suppliers separately first.</div>
      )}
      {open && results.length > 0 && (
        <div className="autocomplete-list">
          {results.map((s) => (
            <div key={s.id} className="autocomplete-item" onMouseDown={() => pick(s)}>
              <div className="ac-name">{s.name || s.nickname}</div>
              <div className="ac-sub">{s.supplier_type}{s.nickname ? ` · ${s.nickname}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
