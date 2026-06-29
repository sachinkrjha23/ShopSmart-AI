import database from "../database/db.js";

export const createAddressTable = async () => {
    await database.query(`
        CREATE TABLE IF NOT EXISTS user_addresses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            full_name VARCHAR(100) NOT NULL,
            phone VARCHAR(15) NOT NULL,
            address TEXT NOT NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            country VARCHAR(100) NOT NULL,
            pincode VARCHAR(10) NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("✅ Address table ready");
};