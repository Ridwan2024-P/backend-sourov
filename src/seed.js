const bcrypt = require("bcryptjs");
const users = require("./repositories/users");
const products = require("./repositories/products");
const { seedProducts } = require("./lib/seed-products");

const DEMO_ADMIN_EMAIL = "admin@shopco.dev";
const DEMO_ADMIN_PASSWORD = "Admin123!";

async function ensureSeeded() {
  if ((await products.count()) === 0) {
    for (const product of seedProducts()) {
      await products.create(product);
    }
  }

  if (!(await users.hasAdmin())) {
    await users.create({
      id: `u-admin-${Date.now().toString(36)}`,
      firstName: "Shop",
      lastName: "Admin",
      email: DEMO_ADMIN_EMAIL,
      phone: "",
      passwordHash: bcrypt.hashSync(DEMO_ADMIN_PASSWORD, 10),
      role: "admin",
      address: null,
    });
  }
}

if (require.main === module) {
  const pool = require("./db/pool");
  ensureSeeded()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("Seeded database with demo products and admin account.");
      // eslint-disable-next-line no-console
      console.log(`Admin login: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
      return pool.end();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Seeding failed:", err.message);
      process.exit(1);
    });
}

module.exports = { ensureSeeded, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD };
