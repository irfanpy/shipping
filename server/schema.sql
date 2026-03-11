PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS carrier_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS carrier_services (
  id TEXT PRIMARY KEY,
  carrier_group_id TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ("air", "sea", "road")),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  max_weight REAL NOT NULL,
  max_volume REAL NOT NULL,
  base_price REAL NOT NULL,
  transit_days INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT "USD",
  last_updated TEXT NOT NULL,
  FOREIGN KEY (carrier_group_id) REFERENCES carrier_groups (id)
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  shipment_number TEXT UNIQUE,
  carrier_group_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ("Draft", "Booked", "In Transit", "Delivered", "Closed", "Exception")),
  shipper_name TEXT NOT NULL,
  shipper_email TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  cargo_type TEXT NOT NULL,
  weight REAL NOT NULL,
  volume REAL NOT NULL,
  required_delivery_date TEXT NOT NULL,
  total_price_snapshot REAL,
  total_transit_days_snapshot INTEGER,
  eta_snapshot TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT,
  FOREIGN KEY (carrier_group_id) REFERENCES carrier_groups (id)
);

CREATE TABLE IF NOT EXISTS shipment_legs (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  carrier_service_id TEXT NOT NULL,
  carrier_group_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ("air", "sea", "road")),
  planned_price REAL NOT NULL,
  planned_transit_days INTEGER NOT NULL,
  price_snapshot REAL,
  transit_days_snapshot INTEGER,
  eta_snapshot TEXT,
  status TEXT NOT NULL CHECK (status IN ("Draft", "Booked", "In Transit", "Delivered", "Exception")),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE,
  FOREIGN KEY (carrier_service_id) REFERENCES carrier_services (id),
  FOREIGN KEY (carrier_group_id) REFERENCES carrier_groups (id),
  UNIQUE (shipment_id, sequence)
);

CREATE TABLE IF NOT EXISTS shipment_status_history (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  status TEXT NOT NULL,
  reason_code TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submission_requests (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_carrier_services_route ON carrier_services (origin, destination, mode);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_number ON shipments (shipment_number);
CREATE INDEX IF NOT EXISTS idx_legs_shipment ON shipment_legs (shipment_id);

CREATE TRIGGER IF NOT EXISTS trg_leg_carrier_group
BEFORE INSERT ON shipment_legs
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN (SELECT carrier_group_id FROM shipments WHERE id = NEW.shipment_id) != NEW.carrier_group_id
      THEN RAISE(ABORT, "carrier_group_mismatch")
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_leg_carrier_group_update
BEFORE UPDATE OF carrier_group_id ON shipment_legs
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN (SELECT carrier_group_id FROM shipments WHERE id = NEW.shipment_id) != NEW.carrier_group_id
      THEN RAISE(ABORT, "carrier_group_mismatch")
    END;
END;
