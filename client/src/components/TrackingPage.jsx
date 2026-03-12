import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "./Layout.jsx";
import { getShipments } from "../api.js";

export default function TrackingPage() {
  const [filter, setFilter] = useState({ status: "", shipmentNumber: "" });
  const [shipments, setShipments] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    setStatus("loading");
    getShipments(filter)
      .then((data) => {
        setShipments(data.data || []);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, [filter]);

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
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Booked">Booked</option>
            <option value="In Transit">In Transit</option>
            <option value="Exception">Exception</option>
            <option value="Delivered">Delivered</option>
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
                  {shipment.pickup_address}  {shipment.delivery_address}
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
