import React from "react";
import { Route, Routes } from "react-router-dom";
import BookingPage from "./components/BookingPage.jsx";
import SearchPage from "./components/SearchPage.jsx";
import TrackingPage from "./components/TrackingPage.jsx";
import TrackingDetailWrapper from "./wrappers/TrackingDetailWrapper.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/tracking/:id" element={<TrackingDetailWrapper />} />
    </Routes>
  );
}
