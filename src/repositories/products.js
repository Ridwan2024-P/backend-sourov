const pool = require("../db/pool");
const { variantKey } = require("../lib/variantKey");

function toProduct(row, stockRows = []) {
  const stock = {};
  for (const s of stockRows) {
    stock[variantKey(s.size, s.color)] = s.qty;
  }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    images: row.images,
    bg: row.bg,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    price: Number(row.price),
    originalPrice: row.original_price === null ? undefined : Number(row.original_price),
    discountPct: row.discount_pct === null ? undefined : Number(row.discount_pct),
    costPrice: row.cost_price === null ? undefined : Number(row.cost_price),
    description: row.description,
    category: row.category,
    type: row.type ?? undefined,
    sizes: row.sizes,
    colors: row.colors,
    custom: row.custom,
    createdAt: Number(row.created_at),
    featured: row.featured,
    isNew: row.is_new,
    stock,
  };
}

async function list() {
  const { rows: productRows } = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  if (productRows.length === 0) return [];

  const { rows: stockRows } = await pool.query("SELECT * FROM product_stock WHERE product_id = ANY($1)", [
    productRows.map((p) => p.id),
  ]);
  const stockByProduct = new Map();
  for (const s of stockRows) {
    if (!stockByProduct.has(s.product_id)) stockByProduct.set(s.product_id, []);
    stockByProduct.get(s.product_id).push(s);
  }

  return productRows.map((row) => toProduct(row, stockByProduct.get(row.id) || []));
}

async function findBySlug(slug) {
  const { rows } = await pool.query("SELECT * FROM products WHERE slug = $1", [slug]);
  if (rows.length === 0) return null;
  const { rows: stockRows } = await pool.query("SELECT * FROM product_stock WHERE product_id = $1", [rows[0].id]);
  return toProduct(rows[0], stockRows);
}

async function existsBySlug(slug) {
  const { rows } = await pool.query("SELECT 1 FROM products WHERE slug = $1", [slug]);
  return rows.length > 0;
}

async function count() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM products");
  return rows[0].n;
}

/** Inserts a product plus its initial per-variant stock rows in one transaction. */
async function create(product) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO products
         (id, slug, name, images, bg, rating, review_count, price, original_price, discount_pct,
          cost_price, description, category, type, sizes, colors, custom, featured, is_new, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        product.id,
        product.slug,
        product.name,
        JSON.stringify(product.images || []),
        product.bg || "#F7F2E1",
        product.rating || 0,
        product.reviewCount || 0,
        product.price,
        product.originalPrice ?? null,
        product.discountPct ?? null,
        product.costPrice ?? null,
        product.description || "",
        product.category,
        product.type ?? null,
        JSON.stringify(product.sizes || []),
        JSON.stringify(product.colors || []),
        product.custom ?? true,
        product.featured ?? false,
        product.isNew ?? false,
        product.createdAt ?? Date.now(),
      ]
    );

    const stockEntries = Object.entries(product.stock || {});
    for (const [key, qty] of stockEntries) {
      const [size, color] = key.split("__");
      await client.query(
        `INSERT INTO product_stock (product_id, size, color, qty) VALUES ($1,$2,$3,$4)
         ON CONFLICT (product_id, size, color) DO UPDATE SET qty = EXCLUDED.qty`,
        [product.id, size, color, Math.max(0, Math.floor(qty) || 0)]
      );
    }

    await client.query("COMMIT");
    const { rows: stockRows } = await pool.query("SELECT * FROM product_stock WHERE product_id = $1", [product.id]);
    return toProduct(rows[0], stockRows);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

const PATCHABLE_COLUMNS = {
  name: "name",
  bg: "bg",
  rating: "rating",
  reviewCount: "review_count",
  price: "price",
  originalPrice: "original_price",
  discountPct: "discount_pct",
  costPrice: "cost_price",
  description: "description",
  category: "category",
  type: "type",
  featured: "featured",
  isNew: "is_new",
};
const JSON_PATCHABLE_COLUMNS = { images: "images", sizes: "sizes", colors: "colors" };

/** Partial update — only known, safe columns can be patched (mirrors the old whitelist-by-deletion behaviour). */
async function updateBySlug(slug, patch) {
  const sets = [];
  const values = [slug];

  for (const [key, column] of Object.entries(PATCHABLE_COLUMNS)) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      values.push(patch[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  for (const [key, column] of Object.entries(JSON_PATCHABLE_COLUMNS)) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      values.push(JSON.stringify(patch[key]));
      sets.push(`${column} = $${values.length}`);
    }
  }

  if (sets.length === 0) return findBySlug(slug);

  const { rows } = await pool.query(`UPDATE products SET ${sets.join(", ")} WHERE slug = $1 RETURNING *`, values);
  if (rows.length === 0) return null;
  const { rows: stockRows } = await pool.query("SELECT * FROM product_stock WHERE product_id = $1", [rows[0].id]);
  return toProduct(rows[0], stockRows);
}

async function removeBySlug(slug) {
  const { rowCount } = await pool.query("DELETE FROM products WHERE slug = $1", [slug]);
  return rowCount > 0;
}

async function setVariantStock(slug, size, color, qty) {
  const { rows: productRows } = await pool.query("SELECT id FROM products WHERE slug = $1", [slug]);
  if (productRows.length === 0) return null;
  const productId = productRows[0].id;

  await pool.query(
    `INSERT INTO product_stock (product_id, size, color, qty) VALUES ($1,$2,$3,$4)
     ON CONFLICT (product_id, size, color) DO UPDATE SET qty = EXCLUDED.qty`,
    [productId, size, color, Math.max(0, Math.floor(qty) || 0)]
  );

  return findBySlug(slug);
}

async function restockVariant(slug, size, color, amount) {
  const { rows: productRows } = await pool.query("SELECT id FROM products WHERE slug = $1", [slug]);
  if (productRows.length === 0) return null;
  const productId = productRows[0].id;
  const delta = Math.floor(amount) || 0;

  await pool.query(
    `INSERT INTO product_stock (product_id, size, color, qty) VALUES ($1,$2,$3,GREATEST(0, $4))
     ON CONFLICT (product_id, size, color)
     DO UPDATE SET qty = GREATEST(0, product_stock.qty + $4)`,
    [productId, size, color, delta]
  );

  return findBySlug(slug);
}

/** Replaces a product's entire variant stock map (e.g. after editing sizes/colors in the admin form). */
async function replaceStock(slug, variants) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: productRows } = await client.query("SELECT id FROM products WHERE slug = $1", [slug]);
    if (productRows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    const productId = productRows[0].id;

    await client.query("DELETE FROM product_stock WHERE product_id = $1", [productId]);
    for (const [key, qty] of Object.entries(variants)) {
      const [size, color] = key.split("__");
      await client.query("INSERT INTO product_stock (product_id, size, color, qty) VALUES ($1,$2,$3,$4)", [
        productId,
        size,
        color,
        Math.max(0, Math.floor(qty) || 0),
      ]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return findBySlug(slug);
}

module.exports = {
  list,
  findBySlug,
  existsBySlug,
  count,
  create,
  updateBySlug,
  removeBySlug,
  setVariantStock,
  restockVariant,
  replaceStock,
};
