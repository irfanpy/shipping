import React from "react";
import Layout from "./Layout.jsx";
import useCarrierSearch from "../hooks/useCarrierSearch.js";
import { modeOptions, orderOptions, sortOptions } from "../constants/searchDefaults.js";

export default function SearchPage() {
  const { filters, setFilters, results, status } = useCarrierSearch();

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
            {modeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.order}
            onChange={(event) => setFilters({ ...filters, order: event.target.value })}
          >
            {orderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
