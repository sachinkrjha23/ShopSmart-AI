import database from "../database/db.js";

export const createWishlistTable = async () => {
    await database.query(`
        CREATE TABLE IF NOT EXISTS wishlists (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_id)
        );
    `);
    console.log("✅ Wishlist table ready");
};