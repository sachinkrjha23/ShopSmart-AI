import database from "../database/db.js";

export const createAdminActivityLogTable = async () => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS admin_activity_log (
      id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      admin_id      UUID REFERENCES users(id) ON DELETE SET NULL,
      action_type   VARCHAR(50) NOT NULL,
      entity_type   VARCHAR(30) NOT NULL,
      entity_id     UUID DEFAULT NULL,
      details       JSONB DEFAULT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity ON admin_activity_log(entity_type, entity_id);
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
  `);

  console.log("✅ Admin activity log table ready");
};