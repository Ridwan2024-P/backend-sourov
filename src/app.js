const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const pool = require("./db/pool");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const wishlistRoutes = require("./routes/wishlist");
const orderRoutes = require("./routes/orders");
const contactRoutes = require("./routes/contact");
const newsletterRoutes = require("./routes/newsletter");

const app = express();

const corsOrigin =
  process.env.CORS_ORIGIN || "https://e-commerce-sourove-r4ep.vercel.app";

app.use(
  cors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res
      .status(503)
      .json({ ok: false, db: "unreachable", error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

module.exports = app;
