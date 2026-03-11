const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const API_KEY = import.meta.env.VITE_API_KEY || "dev-key";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

export function searchCarrierServices(params) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/carrier-services?${query}`);
}

export function createDraft(payload) {
  return request("/api/shipments/drafts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function addLeg(shipmentId, payload) {
  return request(`/api/shipments/${shipmentId}/legs`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function submitShipment(shipmentId, idempotencyKey) {
  return request(`/api/shipments/${shipmentId}/submit`, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey
    }
  });
}

export function getShipment(id) {
  return request(`/api/shipments/${id}`);
}

export function getShipments(params) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/shipments?${query}`);
}

export function getDraftPricing(id) {
  return request(`/api/shipments/${id}/pricing`);
}
