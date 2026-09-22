const jwt = require("jsonwebtoken");
const users = require("../repositories/users");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "30d" });
}

function stripUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

/** Attaches req.user (full stored user incl. passwordHash) if a valid token is present; never rejects. */
async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await users.findById(payload.sub);
    if (user) req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      // invalid/expired token — treated as unauthenticated
      return next();
    }
    next(err);
  }
}

/** Requires a valid token; 401s otherwise. */
function requireAuth(req, res, next) {
  optionalAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.user) return res.status(401).json({ error: "Sign in required." });
    next();
  });
}

/** Requires a valid token AND an admin role; 401/403s otherwise. */
function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }
    next();
  });
}

module.exports = { signToken, stripUser, optionalAuth, requireAuth, requireAdmin, JWT_SECRET };
