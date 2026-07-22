import database from "../database/db.js";

export async function autoExpireNotifications() {
  try {
    const { rows } = await database.query(
      `DELETE FROM notifications
       WHERE expires_at < NOW()
       RETURNING id`
    );

    if (rows.length > 0) {
      console.log(`🧹 Auto-expired ${rows.length} notification(s).`);
    }
  } catch (error) {
    console.error("❌ Auto-expire notifications job failed:", error.message);
  }
}