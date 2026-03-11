import { nanoid } from "nanoid";

export function nowIso() {
  return new Date().toISOString();
}

export function newId(prefix) {
  return `${prefix}_${nanoid(10)}`;
}

export function deriveShipmentStatus(legs) {
  if (legs.some((leg) => leg.status === "Exception")) {
    return "Exception";
  }
  if (legs.length === 0) {
    return "Draft";
  }
  if (legs.every((leg) => leg.status === "Delivered")) {
    return "Delivered";
  }
  if (legs.some((leg) => leg.status === "In Transit")) {
    return "In Transit";
  }
  if (legs.some((leg) => leg.status === "Booked")) {
    return "Booked";
  }
  return "Draft";
}

export function computeEta(startIso, transitDays) {
  const start = new Date(startIso);
  const eta = new Date(start.getTime() + transitDays * 24 * 60 * 60 * 1000);
  return eta.toISOString();
}

export function requireApiKey(req, res, next) {
  const apiKey = process.env.API_KEY || "dev-key";
  const incoming = req.header("x-api-key");
  if (!incoming || incoming !== apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}
