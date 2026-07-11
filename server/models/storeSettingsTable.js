import database from "../database/db.js";

export async function createStoreSettingsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS store_settings (
        id                       INT PRIMARY KEY DEFAULT 1,
        shipping_fee             DECIMAL(10,2) NOT NULL DEFAULT 50,
        free_shipping_threshold  DECIMAL(10,2) NOT NULL DEFAULT 500,
        tax_rate                 DECIMAL(5,2) NOT NULL DEFAULT 0,
        low_stock_threshold      INT NOT NULL DEFAULT 5,
        updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT single_row CHECK (id = 1)
      );
    `;
    await database.query(query);

    await database.query(
      `INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`,
    );
  } catch (error) {
    console.error("❌ Failed To Create Store Settings Table.", error);
    process.exit(1);
  }
}