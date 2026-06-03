require("dotenv").config({ path: "./.env" });

console.log("=== Environment Variables ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PASSWORD typeof:", typeof process.env.DB_PASSWORD);
console.log("");

const { Pool } = require("pg");
console.log("=== Creating Pool ===");
try {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  pool.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.error("❌ Connection error:", err.message);
    } else {
      console.log("✅ Connected! Server time:", res.rows[0]);
    }
    pool.end();
  });
} catch (error) {
  console.error("❌ Pool error:", error.message);
}
