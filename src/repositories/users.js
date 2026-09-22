const pool = require("../db/pool");

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role,
    address: row.address,
    createdAt: row.created_at.toISOString(),
  };
}

async function findByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return toUser(rows[0]);
}

async function findById(id) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return toUser(rows[0]);
}

async function list() {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
  return rows.map(toUser);
}

async function hasAdmin() {
  const { rows } = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
  return rows.length > 0;
}

async function create(user) {
  const { rows } = await pool.query(
    `INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, address, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      user.phone || "",
      user.passwordHash,
      user.role || "customer",
      user.address ?? null,
      user.createdAt ? new Date(user.createdAt) : new Date(),
    ]
  );
  return toUser(rows[0]);
}

/** Patches editable profile fields only — id/email/passwordHash/role/createdAt are protected in the route. */
async function updateProfile(id, patch) {
  const { rows } = await pool.query(
    `UPDATE users SET
       first_name = COALESCE($2, first_name),
       last_name  = COALESCE($3, last_name),
       phone      = COALESCE($4, phone),
       address    = COALESCE($5, address)
     WHERE id = $1
     RETURNING *`,
    [id, patch.firstName ?? null, patch.lastName ?? null, patch.phone ?? null, patch.address ?? null]
  );
  return toUser(rows[0]);
}

async function updatePasswordHash(id, passwordHash) {
  await pool.query("UPDATE users SET password_hash = $2 WHERE id = $1", [id, passwordHash]);
}

async function updateRole(id, role) {
  const { rows } = await pool.query("UPDATE users SET role = $2 WHERE id = $1 RETURNING *", [id, role]);
  return toUser(rows[0]);
}

module.exports = { findByEmail, findById, list, hasAdmin, create, updateProfile, updatePasswordHash, updateRole };
