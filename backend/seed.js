require("dotenv").config({ path: "./.env" });
const { Pool } = require("pg");
const fs = require("fs");

async function runSeed() {
  console.log("🔄 Connecting to database...");
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("📝 Running seed...");
    const seedSQL = fs.readFileSync(
      "../database/seeds/001_seed_simple.sql",
      "utf8",
    );
    await pool.query(seedSQL);
    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
