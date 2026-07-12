import database from "../database/db.js";

export async function createSellersTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS sellers (
        id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        store_name        VARCHAR(150) NOT NULL,
        gstin             VARCHAR(15),
        description       TEXT,
        status            VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Suspended')),
        rejection_reason  TEXT,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);

    await database.query(
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;`,
    );
  } catch (error) {
    console.error("❌ Failed To Create Sellers Table.", error);
    process.exit(1);
  }
}