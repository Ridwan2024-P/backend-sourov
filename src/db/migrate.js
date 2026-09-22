const fs = require("fs");
const path = require("path");
const pool = require("./pool");

const SCHEMA_PATH = path.join(__dirname, "schema.sql");

/** Applies schema.sql. Every statement in it is idempotent (CREATE ... IF NOT EXISTS). */
async function migrate() {
  const sql = fs.readFileSync(SCHEMA_PATH, "utf-8");
  await pool.query(sql);
}

if (require.main === module) {
  migrate()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("Database schema is up to date.");
      return pool.end();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Migration failed:", err.message);
      process.exit(1);
    });
}

module.exports = { migrate };
