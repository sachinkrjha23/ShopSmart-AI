import database from "../database/db.js";

export async function createUserTable() {
  try {
    const query = `
            CREATE TABLE IF NOT EXISTS users(
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 3),
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role VARCHAR(10) DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
                avatar JSONB DEFAULT NULL,
                reset_password_token TEXT DEFAULT NULL,
                reset_password_expire TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    await database.query(query);

    await database.query(
      `ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`,
    );
    await database.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`,
    );

    // Password required unless it's a Google account
    await database.query(`
      DO $$
      BEGIN
        ALTER TABLE users ADD CONSTRAINT users_password_required_unless_google
          CHECK (google_id IS NOT NULL OR password IS NOT NULL);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // NEW — email verification columns
    await database.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;`,
    );
    await database.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT DEFAULT NULL;`,
    );
    await database.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expire TIMESTAMP DEFAULT NULL;`,
    );
    await database.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_nonce TEXT DEFAULT NULL;`,
    );

    await database.query(`
      UPDATE users SET is_email_verified = TRUE 
      WHERE is_email_verified = FALSE AND email_verification_token IS NULL;
    `);
  } catch (error) {
    console.log("❌ Failed To Create Users Table.", error);
    process.exit(1);
  }
}