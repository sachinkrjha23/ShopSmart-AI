import database from "../database/db.js";

export const createReportsTable = async () => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      reporter_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type       VARCHAR(20) NOT NULL CHECK (entity_type IN ('product', 'review', 'seller')),
      entity_id         UUID NOT NULL,
      reason            TEXT NOT NULL,
      description       TEXT,
      status            VARCHAR(20) NOT NULL DEFAULT 'Pending'
                          CHECK (status IN ('Pending', 'Resolved', 'Dismissed')),
      resolution_notes  TEXT DEFAULT NULL,
      resolved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
      resolved_at       TIMESTAMP DEFAULT NULL,
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_one_pending_per_reporter_entity
    ON reports (reporter_id, entity_type, entity_id)
    WHERE status = 'Pending';
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  `);

  console.log("✅ Reports table ready");
};