import database from "../database/db.js";

export async function createPaymentsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS payments (
        id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id              UUID NOT NULL UNIQUE,
        payment_type          VARCHAR(20) NOT NULL DEFAULT 'Online'
                              CHECK (payment_type IN ('Online')),
        payment_status        VARCHAR(20) NOT NULL DEFAULT 'Pending'
                              CHECK (payment_status IN ('Paid', 'Pending', 'Failed', 'Refunded')),
        razorpay_order_id     VARCHAR(100) UNIQUE,
        razorpay_payment_id   VARCHAR(100) UNIQUE,
        razorpay_signature    TEXT,
        webhook_verified      BOOLEAN DEFAULT FALSE,
        payment_method        VARCHAR(50),
        raw_webhook_payload   JSONB,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `;

    await database.query(query);

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
        ON payments(razorpay_order_id);
    `);

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
        ON payments(razorpay_payment_id);
    `);

  } catch (error) {
    console.error("❌ Failed To Create Payments Table.", error);
    process.exit(1);
  }
}