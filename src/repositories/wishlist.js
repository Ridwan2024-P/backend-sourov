const pool = require("../db/pool");

async function get(userId) {
  const { rows } = await pool.query("SELECT slugs FROM wishlists WHERE user_id = $1", [userId]);
  return rows.length > 0 ? rows[0].slugs : [];
}

async function set(userId, slugs) {
  await pool.query(
    `INSERT INTO wishlists (user_id, slugs, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE SET slugs = EXCLUDED.slugs, updated_at = now()`,
    [userId, JSON.stringify(slugs)]
  );
  return slugs;
}

module.exports = { get, set };
