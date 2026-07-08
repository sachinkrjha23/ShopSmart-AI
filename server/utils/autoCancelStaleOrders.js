import database from "../database/db.js";

const STALE_MINUTES = 30;

export async function autoCancelStaleOrders() {
  try {
    const { rows } = await database.query(
      `UPDATE orders o
       SET order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
       FROM payments p
       WHERE p.order_id = o.id
         AND o.order_status = 'Processing'
         AND p.payment_status IN ('Pending', 'Failed')
         AND o.created_at < NOW() - INTERVAL '${STALE_MINUTES} minutes'
       RETURNING o.id`
    );

    if (rows.length > 0) {
      console.log(`🧹 Auto-cancelled ${rows.length} stale unpaid order(s).`);
    }
  } catch (error) {
    console.error("❌ Auto-cancel stale orders job failed:", error.message);
  }
}