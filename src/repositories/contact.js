const pool = require("../db/pool");

function toMessage(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    orderNumber: row.order_number,
    topic: row.topic,
    message: row.message,
    createdAt: row.created_at.toISOString(),
    status: row.status,
  };
}

async function create(entry) {
  const { rows } = await pool.query(
    `INSERT INTO contact_messages (id, name, email, order_number, topic, message, status)
     VALUES ($1,$2,$3,$4,$5,$6,'new') RETURNING *`,
    [entry.id, entry.name, entry.email, entry.orderNumber, entry.topic, entry.message]
  );
  return toMessage(rows[0]);
}

async function list() {
  const { rows } = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
  return rows.map(toMessage);
}

async function updateStatus(id, status) {
  const { rows } = await pool.query("UPDATE contact_messages SET status = $2 WHERE id = $1 RETURNING *", [
    id,
    status,
  ]);
  return rows.length > 0 ? toMessage(rows[0]) : null;
}

module.exports = { create, list, updateStatus };
