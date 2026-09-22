const pool = require("../db/pool");

function toOrder(row) {
  return {
    number: row.number,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    items: row.items,
    customer: row.customer,
    address: row.address,
    shippingMethodId: row.shipping_method_id,
    shippingLabel: row.shipping_label,
    etaDays: row.eta_days,
    promoCode: row.promo_code,
    paymentLabel: row.payment_label,
    totals: row.totals,
    status: row.status,
    manualStatus: row.manual_status,
  };
}

function generateOrderNumber() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `SC-${digits}`;
}

/**
 * Places an order: inside a single transaction, locks the stock rows for every
 * line item, checks each has enough quantity, decrements all of them, then
 * inserts the order. If any line is short, the whole transaction rolls back
 * and nothing is decremented or inserted.
 */
async function create({ userId, items, customer, address, shippingMethodId, shippingLabel, etaDays, promoCode, paymentLabel, totals }) {
  const lines = items.map((i) => ({ slug: i.slug, size: i.size, color: i.color, qty: i.qty }));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const shortages = [];
    const resolvedLines = [];
    for (const line of lines) {
      // Locks the matching product_stock row (if any) for the rest of this transaction
      // so two concurrent orders can't both oversell the same variant.
      const { rows } = await client.query(
        `SELECT ps.product_id, ps.qty
           FROM products p
           JOIN product_stock ps ON ps.product_id = p.id
          WHERE p.slug = $1 AND ps.size = $2 AND ps.color = $3
          FOR UPDATE`,
        [line.slug, line.size, line.color]
      );
      const available = rows.length > 0 ? rows[0].qty : 0;
      if (available < line.qty) {
        shortages.push({ slug: line.slug, size: line.size, color: line.color, available });
      } else {
        resolvedLines.push({ ...line, productId: rows[0].product_id });
      }
    }

    if (shortages.length > 0) {
      await client.query("ROLLBACK");
      return { ok: false, shortages };
    }

    for (const line of resolvedLines) {
      await client.query(
        "UPDATE product_stock SET qty = qty - $4 WHERE product_id = $1 AND size = $2 AND color = $3",
        [line.productId, line.size, line.color, line.qty]
      );
    }

    let number = generateOrderNumber();
    // Practically never collides (6 random digits), but retry inside the same
    // transaction rather than trusting a single roll.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { rows } = await client.query("SELECT 1 FROM orders WHERE number = $1", [number]);
      if (rows.length === 0) break;
      number = generateOrderNumber();
    }

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (number, user_id, items, customer, address, shipping_method_id, shipping_label, eta_days, promo_code, payment_label, totals, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'confirmed')
       RETURNING *`,
      [
        number,
        userId ?? null,
        JSON.stringify(items),
        JSON.stringify(customer),
        JSON.stringify(address),
        shippingMethodId ?? null,
        shippingLabel ?? null,
        JSON.stringify(etaDays ?? null),
        promoCode ?? null,
        paymentLabel ?? null,
        JSON.stringify(totals),
      ]
    );

    await client.query("COMMIT");
    return { ok: true, order: toOrder(orderRows[0]) };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function listAll() {
  const { rows } = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
  return rows.map(toOrder);
}

async function listByUser(userId) {
  const { rows } = await pool.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  return rows.map(toOrder);
}

async function findByNumber(number) {
  const { rows } = await pool.query("SELECT * FROM orders WHERE UPPER(number) = UPPER($1)", [number]);
  return rows.length > 0 ? toOrder(rows[0]) : null;
}

async function updateStatus(number, status) {
  const { rows } = await pool.query(
    "UPDATE orders SET status = $2, manual_status = true WHERE number = $1 RETURNING *",
    [number, status]
  );
  return rows.length > 0 ? toOrder(rows[0]) : null;
}

module.exports = { create, listAll, listByUser, findByNumber, updateStatus };
