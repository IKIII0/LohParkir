require("dotenv").config({ path: "./.env" });
const { Pool } = require("pg");
const fs = require("fs");

async function runMigration() {
  console.log("🔄 Connecting to database...");
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("📝 Running migration...");
    const migrationSQL = fs.readFileSync(
      "../database/migrations/001_init.sql",
      "utf8",
    );
    await pool.query(migrationSQL);
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
