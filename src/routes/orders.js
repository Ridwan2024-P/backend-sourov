const express = require("express");
const orders = require("../repositories/orders");
const { optionalAuth, requireAuth, requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

/** Create an order. Works for guests and signed-in users; validates & decrements stock atomically. */
router.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const input = req.body || {};
    const { items, customer, address, shippingMethodId, shippingLabel, etaDays, promoCode, paymentLabel, totals } =
      input;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order must include at least one item." });
    }
    if (!customer || !address || !totals) {
      return res.status(400).json({ error: "customer, address and totals are required." });
    }

    const result = await orders.create({
      userId: req.user ? req.user.id : null,
      items,
      customer,
      address,
      shippingMethodId,
      shippingLabel,
      etaDays,
      promoCode,
      paymentLabel,
      totals,
    });

    if (!result.ok) {
      return res.status(409).json({ error: "Some items are no longer in stock.", shortages: result.shortages });
    }

    res.status(201).json({ order: result.order });
  })
);

/** Signed-in user's own orders, or every order for an admin passing ?all=true. */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.query.all === "true") {
      if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required." });
      return res.json({ orders: await orders.listAll() });
    }
    res.json({ orders: await orders.listByUser(req.user.id) });
  })
);

/** Look up a single order by its order number — no auth required so guests can track orders. */
router.get(
  "/:number",
  asyncHandler(async (req, res) => {
    const order = await orders.findByNumber(req.params.number.trim());
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json({ order });
  })
);

router.patch(
  "/:number/status",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: "status is required." });

    const updated = await orders.updateStatus(req.params.number, status);
    if (!updated) return res.status(404).json({ error: "Order not found." });
    res.json({ order: updated });
  })
);

module.exports = router;
