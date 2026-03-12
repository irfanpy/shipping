import React from "react";
import { Link } from "react-router-dom";
import Layout from "./Layout.jsx";
import useShipments from "../hooks/useShipments.js";
import { shipmentStatusOptions } from "../constants/trackingDefaults.js";

export default function TrackingPage() {
  const { filter, setFilter, shipments, status } = useShipments();

  return (
    <Layout>
      <section className="panel">
        <h2>Tracking</h2>
        <div className="grid">
          <input
            placeholder="Shipment number"
            value={filter.shipmentNumber}
            onChange={(event) => setFilter({ ...filter, shipmentNumber: event.target.value })}
          />
          <select
            value={filter.status}
            onChange={(event) => setFilter({ ...filter, status: event.target.value })}
          >
            {shipmentStatusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="results">
          {status === "loading" && <p>Loading shipments...</p>}
          {status === "error" && <p className="error">Unable to load shipments.</p>}
          {shipments.map((shipment) => (
            <Link key={shipment.id} className="card" to={`/tracking/${shipment.id}`}>
              <div>
                <h3>{shipment.shipment_number || shipment.id}</h3>
                <p>
                  {shipment.pickup_address} · {shipment.delivery_address}
                </p>
              </div>
              <div>
                <p className="metric">{shipment.status}</p>
                <p>{shipment.total_transit_days_snapshot || "-"} days</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
