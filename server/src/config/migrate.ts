import { initDB } from "./db";

(async () => {
  try {
    await initDB();
    console.log("Database migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();
