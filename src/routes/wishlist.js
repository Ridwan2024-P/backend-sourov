const express = require("express");
const wishlist = require("../repositories/wishlist");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ slugs: await wishlist.get(req.user.id) });
  })
);

router.put(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { slugs } = req.body || {};
    if (!Array.isArray(slugs)) return res.status(400).json({ error: "slugs array is required." });

    await wishlist.set(req.user.id, slugs);
    res.json({ slugs });
  })
);

module.exports = router;
