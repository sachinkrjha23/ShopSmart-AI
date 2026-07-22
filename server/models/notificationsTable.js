import database from "../database/db.js";

export const createNotificationTables = async () => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      scope             VARCHAR(20) NOT NULL CHECK (scope IN ('personal', 'broadcast')),
      user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
      target_audience   VARCHAR(30) CHECK (target_audience IN ('buyers_only', 'buyers_and_sellers', 'all_including_admins')),
      type              VARCHAR(50) NOT NULL,
      title             VARCHAR(200) NOT NULL,
      message           TEXT NOT NULL,
      link_entity_type  VARCHAR(30) CHECK (link_entity_type IN ('order', 'return', 'seller')),
      link_entity_id    UUID DEFAULT NULL,
      created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at        TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
      CONSTRAINT notifications_scope_shape CHECK (
        (scope = 'personal'  AND user_id IS NOT NULL AND target_audience IS NULL)
        OR
        (scope = 'broadcast' AND user_id IS NULL AND target_audience IS NOT NULL)
      )
    );
  `);

  await database.query(`
    CREATE TABLE IF NOT EXISTS notification_status (
      id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      notification_id  UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      read_at          TIMESTAMP DEFAULT NULL,
      dismissed_at     TIMESTAMP DEFAULT NULL,
      UNIQUE (notification_id, user_id)
    );
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON notifications(target_audience);
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_notification_status_user_id ON notification_status(user_id);
  `);

  console.log("✅ Notification tables ready");
};