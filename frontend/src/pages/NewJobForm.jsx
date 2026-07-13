import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientPicker from "../components/ClientPicker.jsx";
import AddressFields, { emptyAddress, resolveAddressId } from "../components/AddressFields.jsx";
import LegForm from "../components/LegForm.jsx";
import { createJob } from "../api.js";

let legKeySeq = 0;
function newLeg() {
  legKeySeq += 1;
  return {
    key: `leg-${legKeySeq}`,
    supplierQuery: "",
    supplierId: null,
    collectionAddress: emptyAddress(),
    deliveryAddress: emptyAddress(),
    cTime: "",
    dTime: "",
    copyCollection: false,
    copyDelivery: false,
    copyCTime: false,
    copyDTime: false,
  };
}

export default function NewJobForm() {
  const navigate = useNavigate();

  const [clientQuery, setClientQuery] = useState("");
  const [clientId, setClientId] = useState(null);
  const [jobType, setJobType] = useState("scheduled");
  const [contents, setContents] = useState("");
  const [notes, setNotes] = useState("");
  const [cDate, setCDate] = useState("");
  const [dDate, setDDate] = useState("");
  const [collectionAddress, setCollectionAddress] = useState(emptyAddress());
  const [deliveryAddress, setDeliveryAddress] = useState(emptyAddress());
  const [legs, setLegs] = useState([newLeg()]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updateLeg(key, updated) {
    setLegs((prev) => prev.map((l) => (l.key === key ? updated : l)));
  }

  function removeLeg(key) {
    setLegs((prev) => prev.filter((l) => l.key !== key));
  }

  function addLeg() {
    setLegs((prev) => [...prev, newLeg()]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Select a client from the list, or add them as a new client, before saving.");
      return;
    }
    if (!collectionAddress.address_line1 || !deliveryAddress.address_line1) {
      setError("Collection and delivery address line 1 are required for the job.");
      return;
    }

    setSubmitting(true);
    try {
      const cAddressId = await resolveAddressId(collectionAddress, clientId);
      const dAddressId = await resolveAddressId(deliveryAddress, clientId);

      const legPayloads = [];
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const legCollection = leg.copyCollection ? collectionAddress : leg.collectionAddress;
        const legDelivery = leg.copyDelivery ? deliveryAddress : leg.deliveryAddress;

        const legCAddressId = leg.copyCollection ? cAddressId : await resolveAddressId(legCollection, clientId);
        const legDAddressId = leg.copyDelivery ? dAddressId : await resolveAddressId(legDelivery, clientId);

        if (!legCAddressId || !legDAddressId) {
          throw new Error(`Leg ${i + 1} is missing a collection or delivery address.`);
        }

        const legCTime = leg.copyCTime ? cDate : leg.cTime;
        const legDTime = leg.copyDTime ? dDate : leg.dTime;

        legPayloads.push({
          leg_sequence: i + 1,
          c_address_id: legCAddressId,
          d_address_id: legDAddressId,
          supplier_id: leg.supplierId || null,
          c_time: legCTime ? new Date(legCTime).toISOString() : null,
          d_time: legDTime ? new Date(legDTime).toISOString() : null,
        });
      }

      const payload = {
        client_id: clientId,
        job_type: jobType,
        contents: contents || null,
        notes: notes || null,
        c_address_id: cAddressId,
        d_address_id: dAddressId,
        c_date: cDate ? new Date(cDate).toISOString() : null,
        d_date: dDate ? new Date(dDate).toISOString() : null,
        legs: legPayloads,
      };

      await createJob(payload);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="form-page">
      <div className="form-head">
        <h1 className="form-title">New job</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-columns">
          {/* Left column: the job itself */}
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Job details</h2>
            </div>

            <ClientPicker
              query={clientQuery}
              clientId={clientId}
              onChange={({ query, clientId: id }) => {
                setClientQuery(query);
                setClientId(id);
              }}
            />

            <div className="field-group">
              <label className="field-label">Job type</label>
              <select className="field-select" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="extraordinary">Extraordinary</option>
              </select>
            </div>

            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Collection date</label>
                <input
                  type="datetime-local"
                  className="field-input"
                  value={cDate}
                  onChange={(e) => setCDate(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Delivery date</label>
                <input
                  type="datetime-local"
                  className="field-input"
                  value={dDate}
                  onChange={(e) => setDDate(e.target.value)}
                />
              </div>
            </div>

            <AddressFields
              label="Collection address"
              value={collectionAddress}
              onChange={setCollectionAddress}
            />
            <AddressFields
              label="Delivery address"
              value={deliveryAddress}
              onChange={setDeliveryAddress}
            />

            <div className="field-group">
              <label className="field-label">Description of freight</label>
              <textarea
                className="field-textarea"
                placeholder="What's being moved"
                value={contents}
                onChange={(e) => setContents(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Notes</label>
              <textarea
                className="field-textarea"
                placeholder="Anything dispatch should know"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Right column: suppliers / legs */}
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Suppliers</h2>
            </div>
            <div className="legs-list">
              {legs.map((leg, i) => (
                <LegForm
                  key={leg.key}
                  leg={leg}
                  index={i}
                  onChange={(updated) => updateLeg(leg.key, updated)}
                  onRemove={() => removeLeg(leg.key)}
                  canRemove={legs.length > 1}
                  clientId={clientId}
                  mainCollectionAddress={collectionAddress}
                  mainDeliveryAddress={deliveryAddress}
                  mainCTime={cDate}
                  mainDTime={dDate}
                />
              ))}
              <button type="button" className="add-leg-btn" onClick={addLeg}>
                + Add another leg
              </button>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save job"}
          </button>
          {error && <span className="error-text">{error}</span>}
        </div>
      </form>
    </main>
  );
}
