const express = require("express");
const newsletter = require("../repositories/newsletter");
const { requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Subscribe an email to the newsletter. Public — no auth required. Idempotent. */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { email } = req.body || {};

    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const normalized = String(email).trim().toLowerCase();
    const { alreadySubscribed } = await newsletter.subscribe(normalized);

    res.status(201).json({ ok: true, alreadySubscribed });
  })
);

/** List subscribers — admin only. */
router.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ subscribers: await newsletter.list() });
  })
);

module.exports = router;
