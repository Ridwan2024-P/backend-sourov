const express = require("express");
const products = require("../repositories/products");
const { requireAdmin } = require("../middleware/auth");
const { variantKey } = require("../lib/inventory");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ products: await products.list() });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const product = await products.findBySlug(req.params.slug);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json({ product });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const input = req.body || {};
    if (!input.slug || !input.name) {
      return res.status(400).json({ error: "slug and name are required." });
    }

    if (await products.existsBySlug(input.slug)) {
      return res.status(409).json({ error: "A product with that slug already exists." });
    }

    const stock = {};
    for (const size of input.sizes || []) {
      for (const c of input.colors || []) {
        const key = variantKey(size, c.name);
        stock[key] = input.stock?.[key] ?? 0;
      }
    }

    const product = await products.create({
      ...input,
      id: input.id || `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      custom: true,
      createdAt: Date.now(),
      stock,
    });

    res.status(201).json({ product });
  })
);

router.patch(
  "/:slug",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const patch = req.body || {};
    delete patch.slug;
    delete patch.id;
    delete patch.stock; // stock changes go through the dedicated endpoints below

    const updated = await products.updateBySlug(req.params.slug, patch);
    if (!updated) return res.status(404).json({ error: "Product not found." });
    res.json({ product: updated });
  })
);

router.delete(
  "/:slug",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existed = await products.removeBySlug(req.params.slug);
    if (!existed) return res.status(404).json({ error: "Product not found." });
    res.json({ ok: true });
  })
);

// ---- Inventory (admin) ----

/** Set one variant's stock to an exact quantity. */
router.patch(
  "/:slug/stock",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { size, color, qty } = req.body || {};
    if (!size || !color || typeof qty !== "number") {
      return res.status(400).json({ error: "size, color and numeric qty are required." });
    }

    const updated = await products.setVariantStock(req.params.slug, size, color, qty);
    if (!updated) return res.status(404).json({ error: "Product not found." });
    res.json({ product: updated });
  })
);

/** Add (or, with a negative amount, remove) units from a variant. */
router.post(
  "/:slug/restock",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { size, color, amount } = req.body || {};
    if (!size || !color || typeof amount !== "number") {
      return res.status(400).json({ error: "size, color and numeric amount are required." });
    }

    const updated = await products.restockVariant(req.params.slug, size, color, amount);
    if (!updated) return res.status(404).json({ error: "Product not found." });
    res.json({ product: updated });
  })
);

/** Replace a product's entire variant stock map in one go (e.g. after editing sizes/colors). */
router.put(
  "/:slug/stock",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { variants } = req.body || {};
    if (!variants || typeof variants !== "object") {
      return res.status(400).json({ error: "variants object is required." });
    }

    const clean = {};
    for (const [key, qty] of Object.entries(variants)) {
      clean[key] = Math.max(0, Math.floor(qty) || 0);
    }

    const updated = await products.replaceStock(req.params.slug, clean);
    if (!updated) return res.status(404).json({ error: "Product not found." });
    res.json({ product: updated });
  })
);

module.exports = router;
