import React, { useEffect, useState } from "react";
import Layout from "./Layout.jsx";
import { getShipment } from "../api.js";

export default function ShipmentDetail({ id }) {
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    getShipment(id)
      .then((data) => {
        setDetail(data);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, [id]);

  if (status === "loading") {
    return (
      <Layout>
        <section className="panel">
          <p>Loading shipment...</p>
        </section>
      </Layout>
    );
  }

  if (status === "error" || !detail) {
    return (
      <Layout>
        <section className="panel">
          <p className="error">Unable to load shipment.</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="panel">
        <h2>Shipment {detail.shipment.shipment_number || detail.shipment.id}</h2>
        <div className="summary">
          <p>Status: {detail.shipment.status}</p>
          <p>Carrier group: {detail.shipment.carrier_group_id}</p>
          <p>Snapshot total: {detail.shipment.total_price_snapshot || "-"}</p>
          <p>ETA: {detail.shipment.eta_snapshot || "-"}</p>
        </div>
      </section>
      <section className="panel">
        <h2>Legs</h2>
        {detail.legs.map((leg) => (
          <article key={leg.id} className="card">
            <div>
              <h3>
                Leg {leg.sequence}  {leg.mode}
              </h3>
              <p>
                {leg.origin}  {leg.destination}
              </p>
            </div>
            <div>
              <p className="metric">{leg.status}</p>
              <p>{leg.transit_days_snapshot || leg.planned_transit_days} days</p>
            </div>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>Timeline</h2>
        {detail.history.map((entry) => (
          <div key={entry.id} className="timeline">
            <p className="metric">{entry.status}</p>
            <p>{entry.created_at}</p>
            {entry.reason_code && <p>Reason: {entry.reason_code}</p>}
          </div>
        ))}
      </section>
    </Layout>
  );
}
