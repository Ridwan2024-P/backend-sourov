const express = require("express");
const contact = require("../repositories/contact");
const { requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function generateId() {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Submit a contact form message. Public — no auth required. */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, orderNumber, topic, message } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    if (!message || String(message).trim().length < 10) {
      return res.status(400).json({ error: "Message must be at least 10 characters." });
    }

    const entry = await contact.create({
      id: generateId(),
      name: String(name).trim(),
      email: String(email).trim(),
      orderNumber: orderNumber ? String(orderNumber).trim() : null,
      topic: topic ? String(topic).trim() : "Something else",
      message: String(message).trim(),
    });

    res.status(201).json({ ok: true, message: entry });
  })
);

/** List contact messages — admin only. */
router.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ messages: await contact.list() });
  })
);

/** Mark a message as read/resolved — admin only. */
router.patch(
  "/:id/status",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!["new", "read", "resolved"].includes(status)) {
      return res.status(400).json({ error: "status must be new, read or resolved." });
    }

    const updated = await contact.updateStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Message not found." });
    res.json({ message: updated });
  })
);

module.exports = router;
