import database from "../database/db.js";

export async function createContactMessagesTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS contact_messages (
        id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        subject    VARCHAR(200) NOT NULL,
        message    TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);
  } catch (error) {
    console.error("❌ Failed To Create Contact Messages Table.", error);
    process.exit(1);
  }
}