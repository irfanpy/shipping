import React, { useEffect, useState } from "react";
import Layout from "./Layout.jsx";
import { searchCarrierServices } from "../api.js";
import useDebouncedValue from "../hooks/useDebouncedValue.js";

export default function SearchPage() {
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
