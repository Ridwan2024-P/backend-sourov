const express = require("express");
const bcrypt = require("bcryptjs");
const users = require("../repositories/users");
const { signToken, stripUser, requireAuth, requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

function passwordProblem(password) {
  if (!password || password.length < 8) return "Use at least 8 characters";
  if (!/[a-zA-Z]/.test(password)) return "Include at least one letter";
  if (!/\d/.test(password)) return "Include at least one number";
  return null;
}

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body || {};
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const problem = passwordProblem(password);
    if (problem) return res.status(400).json({ error: problem });

    const normalized = String(email).trim().toLowerCase();

    if (await users.findByEmail(normalized)) {
      return res.status(409).json({ error: "An account already exists with that email address." });
    }

    const user = await users.create({
      id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalized,
      phone: String(phone || "").trim(),
      passwordHash: bcrypt.hashSync(password, 10),
      role: "customer",
      address: null,
    });

    res.status(201).json({ token: signToken(user), user: stripUser(user) });
  })
);

router.post(
  "/signin",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const normalized = String(email).trim().toLowerCase();
    const user = await users.findByEmail(normalized);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    res.json({ token: signToken(user), user: stripUser(user) });
  })
);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: stripUser(req.user) });
});

router.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const patch = req.body || {};
    delete patch.id;
    delete patch.email;
    delete patch.passwordHash;
    delete patch.role;
    delete patch.createdAt;

    const updated = await users.updateProfile(req.user.id, patch);
    if (!updated) return res.status(404).json({ error: "Account not found." });
    res.json({ user: stripUser(updated) });
  })
);

router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { current, next } = req.body || {};
    if (!bcrypt.compareSync(current || "", req.user.passwordHash)) {
      return res.status(400).json({ error: "Your current password is incorrect." });
    }
    const problem = passwordProblem(next);
    if (problem) return res.status(400).json({ error: problem });

    await users.updatePasswordHash(req.user.id, bcrypt.hashSync(next, 10));
    res.json({ ok: true });
  })
);

// ---- Admin: user management ----

router.get(
  "/users",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const all = await users.list();
    res.json({ users: all.map(stripUser) });
  })
);

router.patch(
  "/users/:id/role",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { role } = req.body || {};
    if (role !== "admin" && role !== "customer") {
      return res.status(400).json({ error: "role must be 'admin' or 'customer'." });
    }

    const updated = await users.updateRole(req.params.id, role);
    if (!updated) return res.status(404).json({ error: "User not found." });
    res.json({ user: stripUser(updated) });
  })
);

module.exports = router;
