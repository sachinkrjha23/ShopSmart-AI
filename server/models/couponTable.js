import database from "../database/db.js";

export const createCouponTables = async () => {
    // Main coupons table
    await database.query(`
        CREATE TABLE IF NOT EXISTS coupons (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'flat')),
            discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
            min_order_amount DECIMAL(10,2) DEFAULT 0,
            max_discount DECIMAL(10,2) DEFAULT NULL,
            usage_limit INT DEFAULT NULL,
            used_count INT DEFAULT 0,
            per_user_limit INT DEFAULT 1,
            is_active BOOLEAN DEFAULT TRUE,
            valid_from TIMESTAMP NOT NULL,
            valid_until TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Coupon usage tracker
    await database.query(`
        CREATE TABLE IF NOT EXISTS coupon_usage (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(coupon_id, user_id, order_id)
        );
    `);

    console.log("✅ Coupon tables ready");
};