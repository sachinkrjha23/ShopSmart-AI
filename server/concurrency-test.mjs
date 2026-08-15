

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "./config/config.env" });

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 50,
});

const PRODUCT_ID = process.env.TEST_PRODUCT_ID || "<paste a real product id here>";
const CONCURRENT_BUYERS = 200;

async function attemptPurchase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock >= 1`,
      [PRODUCT_ID]
    );
    await client.query("COMMIT");
    return result.rowCount === 1;
  } catch (e) {
    await client.query("ROLLBACK");
    return false;
  } finally {
    client.release();
  }
}

async function run() {
  if (PRODUCT_ID === "<paste a real product id here>") {
    console.error(
      "Set TEST_PRODUCT_ID in config.env (or edit PRODUCT_ID directly in this file) before running."
    );
    await pool.end();
    return;
  }

  const before = await pool.query("SELECT stock FROM products WHERE id = $1", [PRODUCT_ID]);

  if (before.rows.length === 0) {
    console.error("No product found with that id. Double-check TEST_PRODUCT_ID.");
    await pool.end();
    return;
  }

  console.log("Starting stock:", before.rows[0].stock);

  const start = Date.now();
  const results = await Promise.all(
    Array.from({ length: CONCURRENT_BUYERS }, attemptPurchase)
  );
  const elapsed = Date.now() - start;

  const succeeded = results.filter(Boolean).length;
  const rejected = results.length - succeeded;

  const after = await pool.query("SELECT stock FROM products WHERE id = $1", [PRODUCT_ID]);

  console.log("=== Concurrency Test Results ===");
  console.log("Concurrent attempts:", CONCURRENT_BUYERS);
  console.log("Succeeded:", succeeded);
  console.log("Rejected (correctly, sold out):", rejected);
  console.log("Final stock in DB:", after.rows[0].stock);
  console.log("Total time (ms):", elapsed);
  console.log(
    after.rows[0].stock >= 0
      ? "✅ No overselling — stock never went negative"
      : "❌ FAILED — stock went negative, overselling occurred"
  );

  await pool.end();
}

run();
