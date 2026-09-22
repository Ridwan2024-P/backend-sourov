require("dotenv").config();
const app = require("./app");
const { migrate } = require("./db/migrate");
const { ensureSeeded } = require("./seed");

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await migrate();
    await ensureSeeded();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Could not start: failed to reach/prepare the database.");
    // eslint-disable-next-line no-console
    console.error(err.message);
    // eslint-disable-next-line no-console
    console.error("Check DATABASE_URL in backend/.env and that Postgres is running.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Guts Wear API listening on http://localhost:${PORT}`);
  });
}

start();
