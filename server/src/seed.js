import { all, initDb, run } from "./db.js";
import { newId, nowIso } from "./utils.js";

await initDb();

const now = nowIso();
const groupId = "cg_atlas";

const existing = all("SELECT id FROM carrier_groups WHERE id = ?", [groupId])[0];
if (!existing) {
  run("INSERT INTO carrier_groups (id, name) VALUES (?, ?)", [groupId, "Atlas Logistics"]);
}

const services = [
  {
    id: "svc_sea_kar_jeb",
    carrier_group_id: groupId,
    carrier_name: "Atlas Sea",
    mode: "sea",
    origin: "Karachi",
    destination: "Jebel Ali",
    max_weight: 50000,
    max_volume: 120,
    base_price: 2400,
    transit_days: 7,
    currency: "USD"
  },
  {
    id: "svc_road_jeb_riy",
    carrier_group_id: groupId,
    carrier_name: "Atlas Road",
    mode: "road",
    origin: "Jebel Ali",
    destination: "Riyadh",
    max_weight: 30000,
    max_volume: 80,
    base_price: 1200,
    transit_days: 3,
    currency: "USD"
  },
  {
    id: "svc_air_kar_riy",
    carrier_group_id: groupId,
    carrier_name: "Atlas Air",
    mode: "air",
    origin: "Karachi",
    destination: "Riyadh",
    max_weight: 12000,
    max_volume: 40,
    base_price: 5200,
    transit_days: 2,
    currency: "USD"
  }
];

services.forEach((service) => {
  run(
    `INSERT OR REPLACE INTO carrier_services
    (id, carrier_group_id, carrier_name, mode, origin, destination, max_weight, max_volume, base_price, transit_days, currency, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      service.id,
      service.carrier_group_id,
      service.carrier_name,
      service.mode,
      service.origin,
      service.destination,
      service.max_weight,
      service.max_volume,
      service.base_price,
      service.transit_days,
      service.currency,
      now
    ]
  );
});

console.log("Seeded carrier services");
