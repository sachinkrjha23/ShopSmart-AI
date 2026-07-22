import database from "../database/db.js";

export async function createSellerRatingsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS seller_ratings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        seller_id UUID NOT NULL,
        buyer_id UUID NOT NULL,
        rating DECIMAL(3,2) NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (seller_id, buyer_id),
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await database.query(query);
    console.log("✅ Seller Ratings Table ready.");
  } catch (error) {
    console.error("❌ Failed To Create Seller Ratings Table.", error);
    process.exit(1);
  }
}