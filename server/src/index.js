import express from "express";
import cors from "cors";
import { z } from "zod";
import { all, get, initDb, run, transaction } from "./db.js";
import {
  computeEta,
  deriveShipmentStatus,
  newId,
  nowIso,
  requireApiKey
} from "./utils.js";

const app = express();
const port = process.env.PORT || 4000;

await initDb();

app.use(cors());
app.use(express.json());
app.use(requireApiKey);

const shipmentStatusEnum = z.enum([
  "Draft",
  "Booked",
  "In Transit",
  "Delivered",
  "Closed",
  "Exception"
]);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/carrier-services", (req, res) => {
  const {
    origin,
    destination,
    carrier,
    mode,
    sort = "price",
    order = "asc",
    page = "1",
    pageSize = "10"
  } = req.query;

  const params = [];
  const filters = [];
  if (origin) {
    filters.push("origin = ?");
    params.push(origin);
  }
  if (destination) {
    filters.push("destination = ?");
    params.push(destination);
  }
  if (carrier) {
    filters.push("carrier_name = ?");
    params.push(carrier);
  }
  if (mode) {
    filters.push("mode = ?");
    params.push(mode);
  }

  const sortMap = {
    price: "base_price",
    transit: "transit_days",
    carrier: "carrier_name"
  };
  const sortColumn = sortMap[sort] || "base_price";
  const sortOrder = order === "desc" ? "desc" : "asc";
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const limit = Math.min(parseInt(pageSize, 10) || 10, 50);
  const offset = (parseInt(page, 10) - 1) * limit;

  const data = all(
    `SELECT * FROM carrier_services ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({ data, page: Number(page), pageSize: limit });
});

app.post("/api/shipments/drafts", (req, res) => {
  const schema = z.object({
    carrierGroupId: z.string(),
    shipperName: z.string(),
    shipperEmail: z.string().email(),
    pickupAddress: z.string(),
    deliveryAddress: z.string(),
    cargoType: z.string(),
    weight: z.number().positive(),
    volume: z.number().positive(),
    requiredDeliveryDate: z.string()
  });

  const payload = schema.safeParse(req.body);
  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const id = newId("shp");
  const now = nowIso();

  run(
    `INSERT INTO shipments
    (id, carrier_group_id, status, shipper_name, shipper_email, pickup_address, delivery_address, cargo_type, weight, volume, required_delivery_date, created_at, updated_at)
    VALUES (?, ?, "Draft", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.data.carrierGroupId,
      payload.data.shipperName,
      payload.data.shipperEmail,
      payload.data.pickupAddress,
      payload.data.deliveryAddress,
      payload.data.cargoType,
      payload.data.weight,
      payload.data.volume,
      payload.data.requiredDeliveryDate,
      now,
      now
    ]
  );

  run(
    `INSERT INTO shipment_status_history (id, shipment_id, status, created_at)
     VALUES (?, ?, "Draft", ?)`,
    [newId("hist"), id, now]
  );

  const shipment = get("SELECT * FROM shipments WHERE id = ?", [id]);
  res.status(201).json(shipment);
});

app.patch("/api/shipments/:id", (req, res) => {
  const schema = z.object({
    shipperName: z.string().optional(),
    shipperEmail: z.string().email().optional(),
    pickupAddress: z.string().optional(),
    deliveryAddress: z.string().optional(),
    cargoType: z.string().optional(),
    weight: z.number().positive().optional(),
    volume: z.number().positive().optional(),
    requiredDeliveryDate: z.string().optional(),
    version: z.number().int().positive()
  });

  const payload = schema.safeParse(req.body);
  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const updates = [];
  const params = [];
  for (const [key, value] of Object.entries(payload.data)) {
    if (key === "version") {
      continue;
    }
    const column = key
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace("shipper_name", "shipper_name")
      .replace("shipper_email", "shipper_email")
      .replace("pickup_address", "pickup_address")
      .replace("delivery_address", "delivery_address")
      .replace("cargo_type", "cargo_type")
      .replace("required_delivery_date", "required_delivery_date");
    updates.push(`${column} = ?`);
    params.push(value);
  }

  updates.push("updated_at = ?");
  params.push(nowIso());

  const statement = `UPDATE shipments SET ${updates.join(", ")}, version = version + 1 WHERE id = ? AND version = ? AND status = "Draft"`;
  run(statement, [...params, req.params.id, payload.data.version]);

  const updated = get("SELECT * FROM shipments WHERE id = ?", [req.params.id]);
  if (!updated || updated.version === payload.data.version) {
    return res.status(409).json({ error: "Version conflict or not draft" });
  }

  res.json(updated);
});

app.post("/api/shipments/:id/legs", (req, res) => {
  const schema = z.object({
    carrierServiceId: z.string(),
    sequence: z.number().int().positive()
  });
  const payload = schema.safeParse(req.body);
  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const shipment = get("SELECT * FROM shipments WHERE id = ?", [req.params.id]);
  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  if (shipment.status !== "Draft") {
    return res.status(409).json({ error: "Shipment not in draft" });
  }

  const service = get("SELECT * FROM carrier_services WHERE id = ?", [payload.data.carrierServiceId]);
  if (!service) {
    return res.status(404).json({ error: "Carrier service not found" });
  }
  if (service.carrier_group_id !== shipment.carrier_group_id) {
    return res.status(409).json({ error: "Carrier group mismatch" });
  }

  if (shipment.weight > service.max_weight || shipment.volume > service.max_volume) {
    return res.status(400).json({
      error: "Capacity exceeded",
      detail: "Weight or volume exceeds carrier service limits"
    });
  }

  const now = nowIso();
  const legId = newId("leg");

  try {
    run(
      `INSERT INTO shipment_legs
      (id, shipment_id, carrier_service_id, carrier_group_id, sequence, origin, destination, mode, planned_price, planned_transit_days, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "Draft", ?, ?)`,
      [
        legId,
        shipment.id,
        service.id,
        service.carrier_group_id,
        payload.data.sequence,
        service.origin,
        service.destination,
        service.mode,
        service.base_price,
        service.transit_days,
        now,
        now
      ]
    );
  } catch (error) {
    if (String(error).includes("carrier_group_mismatch")) {
      return res.status(409).json({ error: "Carrier group mismatch" });
    }
    throw error;
  }

  const leg = get("SELECT * FROM shipment_legs WHERE id = ?", [legId]);
  res.status(201).json(leg);
});

app.patch("/api/shipments/:id/legs/:legId/status", (req, res) => {
  const schema = z.object({
    status: shipmentStatusEnum,
    reasonCode: z.string().optional(),
    note: z.string().optional()
  });
  const payload = schema.safeParse(req.body);
  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  if (payload.data.status === "Exception" && !payload.data.reasonCode) {
    return res.status(400).json({ error: "reasonCode is required for Exception" });
  }

  const leg = get(
    "SELECT * FROM shipment_legs WHERE id = ? AND shipment_id = ?",
    [req.params.legId, req.params.id]
  );
  if (!leg) {
    return res.status(404).json({ error: "Leg not found" });
  }

  const now = nowIso();
  run(
    "UPDATE shipment_legs SET status = ?, updated_at = ? WHERE id = ?",
    [payload.data.status, now, leg.id]
  );

  const legs = all("SELECT status FROM shipment_legs WHERE shipment_id = ?", [req.params.id]);
  const derivedStatus = deriveShipmentStatus(legs);

  run("UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?", [
    derivedStatus,
    now,
    req.params.id
  ]);

  run(
    `INSERT INTO shipment_status_history (id, shipment_id, status, reason_code, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      newId("hist"),
      req.params.id,
      derivedStatus,
      payload.data.reasonCode || null,
      payload.data.note || null,
      now
    ]
  );

  const updated = get("SELECT * FROM shipments WHERE id = ?", [req.params.id]);
  res.json(updated);
});

app.post("/api/shipments/:id/submit", (req, res) => {
  const idempotencyKey = req.header("idempotency-key");
  if (!idempotencyKey) {
    return res.status(400).json({ error: "Idempotency-Key header required" });
  }

  const shipment = get("SELECT * FROM shipments WHERE id = ?", [req.params.id]);
  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  if (shipment.status !== "Draft") {
    return res.status(409).json({ error: "Shipment not in draft" });
  }

  const existing = get(
    "SELECT shipment_id FROM submission_requests WHERE idempotency_key = ?",
    [idempotencyKey]
  );
  if (existing) {
    const existingShipment = get("SELECT * FROM shipments WHERE id = ?", [existing.shipment_id]);
    return res.json(existingShipment);
  }

  const legs = all("SELECT * FROM shipment_legs WHERE shipment_id = ? ORDER BY sequence", [
    req.params.id
  ]);
  if (legs.length === 0) {
    return res.status(400).json({ error: "Shipment must include at least one leg" });
  }

  const serviceIds = legs.map((leg) => leg.carrier_service_id);
  const placeholders = serviceIds.map(() => "?").join(",");
  const services = all(`SELECT * FROM carrier_services WHERE id IN (${placeholders})`, serviceIds);

  const now = nowIso();
  const shipmentNumber =
    shipment.shipment_number ||
    `SHP-${now.slice(0, 10).replace(/-/g, "")}-${newId("num").slice(-4).toUpperCase()}`;

  const result = transaction(() => {
    let totalPrice = 0;
    let totalTransit = 0;
    let eta = now;

    for (const leg of legs) {
      const service = services.find((svc) => svc.id === leg.carrier_service_id);
      totalPrice += service.base_price;
      totalTransit += service.transit_days;
      eta = computeEta(eta, service.transit_days);
      run(
        `UPDATE shipment_legs
         SET price_snapshot = ?, transit_days_snapshot = ?, eta_snapshot = ?, status = "Booked", updated_at = ?
         WHERE id = ?`,
        [service.base_price, service.transit_days, eta, now, leg.id]
      );
    }

    run(
      `UPDATE shipments
       SET status = "Booked", shipment_number = ?, total_price_snapshot = ?, total_transit_days_snapshot = ?, eta_snapshot = ?, submitted_at = ?, updated_at = ?
       WHERE id = ?`,
      [shipmentNumber, totalPrice, totalTransit, eta, now, now, shipment.id]
    );

    run(
      `INSERT INTO shipment_status_history (id, shipment_id, status, created_at)
       VALUES (?, ?, "Booked", ?)`,
      [newId("hist"), shipment.id, now]
    );

    run(
      `INSERT INTO submission_requests (id, shipment_id, idempotency_key, created_at)
       VALUES (?, ?, ?, ?)`,
      [newId("sub"), shipment.id, idempotencyKey, now]
    );

    return get("SELECT * FROM shipments WHERE id = ?", [shipment.id]);
  });

  res.json(result);
});

app.get("/api/shipments", (req, res) => {
  const { status, shipmentNumber } = req.query;
  const filters = [];
  const params = [];
  if (status) {
    filters.push("status = ?");
    params.push(status);
  }
  if (shipmentNumber) {
    filters.push("shipment_number = ?");
    params.push(shipmentNumber);
  }
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const data = all(`SELECT * FROM shipments ${whereClause} ORDER BY created_at DESC`, params);
  res.json({ data });
});

app.get("/api/shipments/:id", (req, res) => {
  const shipment = get("SELECT * FROM shipments WHERE id = ?", [req.params.id]);
  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  const legs = all(
    "SELECT * FROM shipment_legs WHERE shipment_id = ? ORDER BY sequence",
    [req.params.id]
  );
  const history = all(
    "SELECT * FROM shipment_status_history WHERE shipment_id = ? ORDER BY created_at",
    [req.params.id]
  );
  res.json({ shipment, legs, history });
});

app.get("/api/shipments/:id/pricing", (req, res) => {
  const shipment = get("SELECT * FROM shipments WHERE id = ?", [req.params.id]);
  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  const legs = all(
    "SELECT * FROM shipment_legs WHERE shipment_id = ? ORDER BY sequence",
    [req.params.id]
  );
  const serviceIds = legs.map((leg) => leg.carrier_service_id);
  if (serviceIds.length === 0) {
    return res.json({ totalPrice: 0, totalTransitDays: 0, eta: null, legs: [] });
  }

  const placeholders = serviceIds.map(() => "?").join(",");
  const services = all(`SELECT * FROM carrier_services WHERE id IN (${placeholders})`, serviceIds);

  let totalPrice = 0;
  let totalTransit = 0;
  let eta = nowIso();

  const detailedLegs = legs.map((leg) => {
    const service = services.find((svc) => svc.id === leg.carrier_service_id);
    totalPrice += service.base_price;
    totalTransit += service.transit_days;
    eta = computeEta(eta, service.transit_days);
    return {
      ...leg,
      current_price: service.base_price,
      current_transit_days: service.transit_days,
      current_eta: eta
    };
  });

  res.json({ totalPrice, totalTransitDays: totalTransit, eta, legs: detailedLegs });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
