const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.error(
    "DATABASE_URL is not set. Copy backend/.env.example to backend/.env and point it at your Postgres instance."
  );
  process.exit(1);
}

// Managed Postgres providers (Render, Railway, Supabase, RDS, Neon, etc.) usually
// require SSL and use a self-signed chain, so this is opt-in via PGSSL=true or a
// `sslmode=require` connection string rather than always-on for local dev.
const wantsSsl =
  String(process.env.PGSSL).toLowerCase() === "true" || /sslmode=require/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: wantsSsl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  // A background/idle client emitted an error (e.g. connection dropped). Log it
  // instead of crashing the process — in-flight requests handle their own errors.
  // eslint-disable-next-line no-console
  console.error("Unexpected Postgres error on idle client", err);
});

module.exports = pool;
