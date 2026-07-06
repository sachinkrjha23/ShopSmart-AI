import database from "../database/db.js";

export async function createPendingRegistrationsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name               VARCHAR(100) NOT NULL,
        email              VARCHAR(100) NOT NULL,
        password           TEXT NOT NULL,
        verification_token TEXT NOT NULL,
        expires_at         TIMESTAMP NOT NULL,
        created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_pending_reg_email ON pending_registrations(email);
    `);
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_pending_reg_token ON pending_registrations(verification_token);
    `);
  } catch (error) {
    console.error("❌ Failed To Create Pending Registrations Table.", error);
    process.exit(1);
  }
}