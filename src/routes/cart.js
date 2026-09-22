const express = require("express");
const cart = require("../repositories/cart");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ items: await cart.get(req.user.id) });
  })
);

/** Replaces the whole cart — simplest way to stay in sync with client-side optimistic updates. */
router.put(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { items } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: "items array is required." });

    await cart.set(req.user.id, items);
    res.json({ items });
  })
);

module.exports = router;
