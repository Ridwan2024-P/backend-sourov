-- Guts Wear — Postgres schema
-- Applied automatically on boot (server.js -> migrate.js) and via `npm run migrate`.
-- Every statement is idempotent so it's safe to run repeatedly.

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  phone          TEXT NOT NULL DEFAULT '',
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  address        JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  images          JSONB NOT NULL DEFAULT '[]',
  bg              TEXT NOT NULL DEFAULT '#F7F2E1',
  rating          NUMERIC NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  price           NUMERIC NOT NULL,
  original_price  NUMERIC,
  discount_pct    NUMERIC,
  cost_price      NUMERIC,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL,
  type            TEXT,
  sizes           JSONB NOT NULL DEFAULT '[]',
  colors          JSONB NOT NULL DEFAULT '[]',
  custom          BOOLEAN NOT NULL DEFAULT false,
  featured        BOOLEAN NOT NULL DEFAULT false,
  is_new          BOOLEAN NOT NULL DEFAULT false,
  -- kept as epoch-millis (bigint) to match the frontend's Product.createdAt: number
  created_at      BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);

-- Per-variant stock, keyed by (product, size, color) — mirrors the frontend's
-- `${size}__${color}` stock map but as real rows so quantities can be locked
-- and decremented atomically when an order is placed.
CREATE TABLE IF NOT EXISTS product_stock (
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        TEXT NOT NULL,
  color       TEXT NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (product_id, size, color)
);

CREATE TABLE IF NOT EXISTS orders (
  number               TEXT PRIMARY KEY,
  user_id              TEXT REFERENCES users(id) ON DELETE SET NULL,
  items                JSONB NOT NULL,
  customer             JSONB NOT NULL,
  address              JSONB NOT NULL,
  shipping_method_id   TEXT,
  shipping_label       TEXT,
  eta_days             JSONB,
  promo_code           TEXT,
  payment_label        TEXT,
  totals               JSONB NOT NULL,
  status               TEXT NOT NULL DEFAULT 'confirmed',
  manual_status        BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- One row per user; the API replaces the array wholesale (PUT /cart, PUT
-- /wishlist), so a JSONB column matches that contract without extra joins.
CREATE TABLE IF NOT EXISTS cart_items (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items       JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlists (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slugs       JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  order_number  TEXT,
  topic         TEXT,
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email           TEXT PRIMARY KEY,
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
