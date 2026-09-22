const pool = require("../db/pool");

async function get(userId) {
  const { rows } = await pool.query("SELECT items FROM cart_items WHERE user_id = $1", [userId]);
  return rows.length > 0 ? rows[0].items : [];
}

async function set(userId, items) {
  await pool.query(
    `INSERT INTO cart_items (user_id, items, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items, updated_at = now()`,
    [userId, JSON.stringify(items)]
  );
  return items;
}

module.exports = { get, set };
