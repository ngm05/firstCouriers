import AddressFields from "./AddressFields.jsx";
import SupplierPicker from "./SupplierPicker.jsx";

export default function LegForm({
  leg,
  index,
  onChange,
  onRemove,
  canRemove,
  clientId,
  mainCollectionAddress,
  mainDeliveryAddress,
  mainCTime,
  mainDTime,
}) {
  function patch(fields) {
    onChange({ ...leg, ...fields });
  }

  return (
    <div className="leg-panel">
      <div className="leg-panel-head">
        <span className="leg-number">Leg {index + 1}</span>
        {canRemove && (
          <button type="button" className="remove-leg-btn" onClick={onRemove}>
            Remove leg
          </button>
        )}
      </div>

      <SupplierPicker
        query={leg.supplierQuery}
        supplierId={leg.supplierId}
        onChange={({ query, supplierId }) => patch({ supplierQuery: query, supplierId })}
      />

      <label className="copy-check">
        <input
          type="checkbox"
          checked={leg.copyCollection}
          onChange={(e) => patch({ copyCollection: e.target.checked })}
        />
        Same collection address as the job
      </label>
      <AddressFields
        label="Collection address"
        value={leg.copyCollection ? mainCollectionAddress : leg.collectionAddress}
        onChange={(v) => patch({ collectionAddress: v })}
        clientId={clientId}
        disabled={leg.copyCollection}
      />

      <label className="copy-check">
        <input
          type="checkbox"
          checked={leg.copyDelivery}
          onChange={(e) => patch({ copyDelivery: e.target.checked })}
        />
        Same delivery address as the job
      </label>
      <AddressFields
        label="Delivery address"
        value={leg.copyDelivery ? mainDeliveryAddress : leg.deliveryAddress}
        onChange={(v) => patch({ deliveryAddress: v })}
        clientId={clientId}
        disabled={leg.copyDelivery}
      />

      <label className="copy-check">
        <input
          type="checkbox"
          checked={leg.copyCTime}
          onChange={(e) => patch({ copyCTime: e.target.checked })}
        />
        Same collection date/time as the job
      </label>
      <div className="field-group">
        <label className="field-label">Collection time</label>
        <input
          type="datetime-local"
          className="field-input"
          value={leg.copyCTime ? mainCTime : leg.cTime}
          disabled={leg.copyCTime}
          onChange={(e) => patch({ cTime: e.target.value })}
        />
      </div>

      <label className="copy-check">
        <input
          type="checkbox"
          checked={leg.copyDTime}
          onChange={(e) => patch({ copyDTime: e.target.checked })}
        />
        Same delivery date/time as the job
      </label>
      <div className="field-group">
        <label className="field-label">Delivery time</label>
        <input
          type="datetime-local"
          className="field-input"
          value={leg.copyDTime ? mainDTime : leg.dTime}
          disabled={leg.copyDTime}
          onChange={(e) => patch({ dTime: e.target.value })}
        />
      </div>
    </div>
  );
}
