const pool = require("../db/pool");

async function subscribe(email) {
  const { rows } = await pool.query(
    `INSERT INTO newsletter_subscribers (email) VALUES ($1)
     ON CONFLICT (email) DO NOTHING
     RETURNING email`,
    [email]
  );
  // rows is empty when the email already existed (ON CONFLICT DO NOTHING skipped the insert)
  return { alreadySubscribed: rows.length === 0 };
}

async function list() {
  const { rows } = await pool.query("SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC");
  return rows.map((r) => ({ email: r.email, subscribedAt: r.subscribed_at.toISOString() }));
}

module.exports = { subscribe, list };
