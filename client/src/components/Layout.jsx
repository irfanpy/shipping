import React from "react";
import { Link } from "react-router-dom";

export default function Layout({ children }) {
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
