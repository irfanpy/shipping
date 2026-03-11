# Logistics Shipment Booking & Tracking System

## Overview
This workspace contains a full-stack implementation of the logistics booking and tracking system with a React front-end, Express API, and SQLite database.

## Architecture
- Client: React + Vite UI for search, booking, and tracking.
- Server: Express API with SQLite persistence.
- Carrier Catalogue and Shipment Service are implemented as dedicated API domains in one server for demo purposes.

## Key Decisions
- Optimistic concurrency via `version` on draft updates.
- Idempotent submission via `Idempotency-Key` header stored in `submission_requests`.
- Carrier group enforcement via application checks and SQLite triggers.
- Snapshot pricing and transit times captured on submit.

## Running the Project
1. Install dependencies: `npm install`
2. Start the server: `npm run dev:server`
3. Start the client: `npm run dev:client`

Default API key: `dev-key` (override with `API_KEY`).
Client reads `VITE_API_KEY` and `VITE_API_BASE` from env.

## Data
The SQLite database file is created at `server/data.sqlite` by default.
Use `server/schema.sql` for the database schema.

## Limitations
- Shipment number generation is time-based and not globally ordered.
- Carrier service seed data should be added before use.
- Multi-user UI workflows are simplified for demonstration.
