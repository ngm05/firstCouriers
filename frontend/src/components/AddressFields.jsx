import { useEffect, useRef, useState } from "react";
import { searchAddresses, createAddress } from "../api.js";

export const emptyAddress = () => ({
  nickname: "",
  address_line1: "",
  address_line2: "",
  suburb: "",
  state: "",
  postcode: "",
  existingId: null,
});

export default function AddressFields({ label, value, onChange, clientId, disabled }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (disabled) return;
    if (!value.nickname || value.nickname.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(value.nickname, clientId);
        setSuggestions(results || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.nickname, clientId, disabled]);

  function set(field, val) {
    onChange({ ...value, [field]: val, existingId: null });
  }

  function pickSuggestion(addr) {
    onChange({
      nickname: addr.nickname || "",
      address_line1: addr.address_line1 || "",
      address_line2: addr.address_line2 || "",
      suburb: addr.suburb || "",
      state: addr.state || "",
      postcode: addr.postcode || "",
      existingId: addr.id,
    });
    setShowSuggestions(false);
  }

  return (
    <div className="address-block">
      <div className="address-block-label">
        {label}
        {value.existingId && <span className="address-saved-flag">Saved address</span>}
      </div>

      <div className="field-group autocomplete-wrap">
        <label className="field-label">Address nickname</label>
        <input
          className="field-input"
          placeholder="e.g. ABC Warehouse"
          value={value.nickname}
          disabled={disabled}
          onChange={(e) => set("nickname", e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="autocomplete-list">
            {suggestions.map((addr) => (
              <div key={addr.id} className="autocomplete-item" onMouseDown={() => pickSuggestion(addr)}>
                <div className="ac-name">{addr.nickname}</div>
                <div className="ac-sub">
                  {addr.address_line1}, {addr.suburb} {addr.state} {addr.postcode}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="field-group">
        <label className="field-label">Address line 1</label>
        <input
          className="field-input"
          value={value.address_line1}
          disabled={disabled}
          onChange={(e) => set("address_line1", e.target.value)}
        />
      </div>
      <div className="field-group">
        <label className="field-label">Address line 2</label>
        <input
          className="field-input"
          value={value.address_line2}
          disabled={disabled}
          onChange={(e) => set("address_line2", e.target.value)}
        />
      </div>
      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Suburb</label>
          <input
            className="field-input"
            value={value.suburb}
            disabled={disabled}
            onChange={(e) => set("suburb", e.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="field-label">State</label>
          <input
            className="field-input"
            value={value.state}
            disabled={disabled}
            onChange={(e) => set("state", e.target.value)}
          />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label">Postcode</label>
        <input
          className="field-input"
          value={value.postcode}
          disabled={disabled}
          onChange={(e) => set("postcode", e.target.value)}
        />
      </div>
    </div>
  );
}

// Resolves an address value down to a UUID the API can use for
// c_address_id / d_address_id, creating or matching an address as needed.
export async function resolveAddressId(value, clientId) {
  if (value.existingId) return value.existingId;

  const hasAddress = value.address_line1 && value.address_line1.trim().length > 0;
  const hasNickname = value.nickname && value.nickname.trim().length > 0;

  if (!hasAddress) return null;

  if (hasNickname) {
    // Both nickname and full address given: look for an existing saved
    // address with this exact nickname before creating a new one.
    const matches = await searchAddresses(value.nickname, clientId).catch(() => []);
    const exact = (matches || []).find(
      (a) => (a.nickname || "").trim().toLowerCase() === value.nickname.trim().toLowerCase()
    );
    if (exact) return exact.id;

    const created = await createAddressFromValue(value, clientId, true);
    return created.id;
  }

  // Address given with no nickname: one-off, not saved for reuse.
  const created = await createAddressFromValue(value, clientId, false);
  return created.id;
}

async function createAddressFromValue(value, clientId, isSaved) {
  return createAddress({
    nickname: value.nickname || null,
    client_id: clientId || null,
    address_line1: value.address_line1,
    address_line2: value.address_line2 || null,
    suburb: value.suburb || null,
    state: value.state || null,
    postcode: value.postcode || null,
    is_saved: isSaved,
  });
}
