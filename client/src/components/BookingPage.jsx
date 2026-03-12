import React from "react";
import Layout from "./Layout.jsx";
import useBookingWorkflow from "../hooks/useBookingWorkflow.js";

export default function BookingPage() {
  const {
    draft,
    setDraft,
    shipment,
    legs,
    pricing,
    status,
    draftReady,
    handleCreateDraft,
    handleAddLeg,
    handleSubmit
  } = useBookingWorkflow();

  return (
    <Layout>
      <section className="panel">
        <h2>Booking Workflow</h2>
        <div className="grid two">
          <div className="stack">
            <label>Shipper name</label>
            <input
              value={draft.shipperName}
              onChange={(event) => setDraft({ ...draft, shipperName: event.target.value })}
            />
          </div>
          <div className="stack">
            <label>Shipper email</label>
            <input
              value={draft.shipperEmail}
              onChange={(event) => setDraft({ ...draft, shipperEmail: event.target.value })}
            />
          </div>
          <div className="stack">
            <label>Pickup address</label>
            <input
              value={draft.pickupAddress}
              onChange={(event) => setDraft({ ...draft, pickupAddress: event.target.value })}
            />
          </div>
          <div className="stack">
            <label>Delivery address</label>
            <input
              value={draft.deliveryAddress}
              onChange={(event) => setDraft({ ...draft, deliveryAddress: event.target.value })}
            />
          </div>
          <div className="stack">
            <label>Required delivery date</label>
            <input
              type="date"
              value={draft.requiredDeliveryDate}
              onChange={(event) => setDraft({ ...draft, requiredDeliveryDate: event.target.value })}
            />
          </div>
          <div className="stack">
            <label>Weight</label>
            <input
              type="number"
              min="1"
              value={draft.weight}
              onChange={(event) => setDraft({ ...draft, weight: Number(event.target.value) })}
            />
          </div>
          <div className="stack">
            <label>Volume</label>
            <input
              type="number"
              min="1"
              value={draft.volume}
              onChange={(event) => setDraft({ ...draft, volume: Number(event.target.value) })}
            />
          </div>
        </div>
        <div className="actions">
          <button disabled={!draftReady || status === "loading"} onClick={handleCreateDraft}>
            Create draft
          </button>
          <button disabled={!shipment || status === "loading"} onClick={handleAddLeg}>
            Add leg
          </button>
          <button disabled={!shipment || status === "loading"} onClick={handleSubmit}>
            Submit booking
          </button>
        </div>
        {status === "error" && <p className="error">Action failed. Check API logs.</p>}
      </section>
      <section className="panel">
        <h2>Draft summary</h2>
        {shipment ? (
          <div className="summary">
            <p>Shipment ID: {shipment.id}</p>
            <p>Status: {shipment.status}</p>
            <p>Carrier group: {shipment.carrier_group_id}</p>
            <p>Legs: {legs.length}</p>
          </div>
        ) : (
          <p>No draft created yet.</p>
        )}
        {pricing && (
          <div className="summary">
            <p>Current total: ${pricing.totalPrice.toFixed(2)}</p>
            <p>Estimated transit: {pricing.totalTransitDays} days</p>
            <p>ETA: {pricing.eta}</p>
          </div>
        )}
      </section>
    </Layout>
  );
}
