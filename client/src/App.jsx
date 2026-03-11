import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import {
  addLeg,
  createDraft,
  getDraftPricing,
  getShipment,
  getShipments,
  searchCarrierServices,
  submitShipment
} from "./api.js";

const emptyDraft = {
  carrierGroupId: "cg_atlas",
  shipperName: "",
  shipperEmail: "",
  pickupAddress: "",
  deliveryAddress: "",
  cargoType: "General",
  weight: 1,
  volume: 1,
  requiredDeliveryDate: ""
};

function Layout({ children }) {
  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Logistics Control</p>
          <h1>Shipment Booking Console</h1>
        </div>
        <nav className="nav">
          <Link to="/">Search</Link>
          <Link to="/booking">Booking</Link>
          <Link to="/tracking">Tracking</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchPage() {
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    carrier: "",
    mode: "",
    sort: "price",
    order: "asc"
  });
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");

  const debounced = useDebouncedValue(filters, 400);

  useEffect(() => {
    const searchParams = new URLSearchParams(debounced);
    window.history.replaceState(null, "", `/?${searchParams.toString()}`);
    setStatus("loading");
    searchCarrierServices(debounced)
      .then((data) => {
        setResults(data.data || []);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, [debounced]);

  return (
    <Layout>
      <section className="panel">
        <h2>Carrier Catalogue</h2>
        <div className="grid">
          <input
            placeholder="Origin"
            value={filters.origin}
            onChange={(event) => setFilters({ ...filters, origin: event.target.value })}
          />
          <input
            placeholder="Destination"
            value={filters.destination}
            onChange={(event) => setFilters({ ...filters, destination: event.target.value })}
          />
          <input
            placeholder="Carrier"
            value={filters.carrier}
            onChange={(event) => setFilters({ ...filters, carrier: event.target.value })}
          />
          <select
            value={filters.mode}
            onChange={(event) => setFilters({ ...filters, mode: event.target.value })}
          >
            <option value="">All modes</option>
            <option value="sea">Sea</option>
            <option value="air">Air</option>
            <option value="road">Road</option>
          </select>
          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
          >
            <option value="price">Sort by price</option>
            <option value="transit">Sort by transit</option>
            <option value="carrier">Sort by carrier</option>
          </select>
          <select
            value={filters.order}
            onChange={(event) => setFilters({ ...filters, order: event.target.value })}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div className="results">
          {status === "loading" && <p>Loading carrier services...</p>}
          {status === "error" && <p className="error">Unable to load services.</p>}
          {status === "done" && results.length === 0 && <p>No services found.</p>}
          {results.map((service) => (
            <article key={service.id} className="card">
              <div>
                <h3>{service.carrier_name}</h3>
                <p>
                  {service.origin} to {service.destination} · {service.mode}
                </p>
              </div>
              <div>
                <p className="metric">${service.base_price.toFixed(2)}</p>
                <p>{service.transit_days} days</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}

function BookingPage() {
  const [draft, setDraft] = useState(emptyDraft);
  const [shipment, setShipment] = useState(null);
  const [legs, setLegs] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [status, setStatus] = useState("idle");
  const navigate = useNavigate();

  const draftReady = useMemo(
    () => draft.shipperName && draft.shipperEmail && draft.pickupAddress && draft.deliveryAddress,
    [draft]
  );

  const handleCreateDraft = async () => {
    setStatus("loading");
    try {
      const created = await createDraft(draft);
      setShipment(created);
      setStatus("drafted");
    } catch (error) {
      setStatus("error");
    }
  };

  const handleAddLeg = async () => {
    if (!shipment) {
      return;
    }
    setStatus("loading");
    try {
      const nextSequence = legs.length + 1;
      const carrierServiceId = prompt("Enter carrier service id for leg");
      if (!carrierServiceId) {
        setStatus("drafted");
        return;
      }
      const newLeg = await addLeg(shipment.id, { carrierServiceId, sequence: nextSequence });
      setLegs([...legs, newLeg]);
      const currentPricing = await getDraftPricing(shipment.id);
      setPricing(currentPricing);
      setStatus("drafted");
    } catch (error) {
      setStatus("error");
    }
  };

  const handleSubmit = async () => {
    if (!shipment) {
      return;
    }
    setStatus("loading");
    try {
      const submitted = await submitShipment(shipment.id, `idem-${Date.now()}`);
      navigate(`/tracking/${submitted.id}`);
    } catch (error) {
      setStatus("error");
    }
  };

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

function TrackingPage() {
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
                <p>{shipment.pickup_address} → {shipment.delivery_address}</p>
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

function ShipmentDetail({ id }) {
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
                Leg {leg.sequence} · {leg.mode}
              </h3>
              <p>
                {leg.origin} → {leg.destination}
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route
        path="/tracking/:id"
        element={<TrackingDetailWrapper />}
      />
    </Routes>
  );
}

function TrackingDetailWrapper() {
  const navigate = useNavigate();
  const id = window.location.pathname.split("/").pop();

  if (!id) {
    navigate("/tracking");
    return null;
  }

  return <ShipmentDetail id={id} />;
}
