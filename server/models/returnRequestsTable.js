import database from "../database/db.js";

export const createReturnRequestsTable = async () => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS return_requests (
      id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_item_id   UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason          TEXT NOT NULL,
      status          VARCHAR(20) NOT NULL DEFAULT 'Pending'
                        CHECK (status IN ('Pending', 'Approved', 'Rejected')),
      admin_notes     TEXT DEFAULT NULL,
      refund_amount   DECIMAL(10,2) DEFAULT NULL,
      resolved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
      requested_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at     TIMESTAMP DEFAULT NULL
    );
  `);

  await database.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_return_requests_one_pending_per_item
    ON return_requests (order_item_id)
    WHERE status = 'Pending';
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_return_requests_buyer_id ON return_requests(buyer_id);
  `);

  console.log("✅ Return requests table ready");
};