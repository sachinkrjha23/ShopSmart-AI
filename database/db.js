import pkg from "pg";
const { Pool } = pkg;
import dotenv from 'dotenv';

// ✅ Load environment variables from config.env
dotenv.config({ path: "./config/config.env" });

const database = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20,                    // ← NEW: max connections in pool
    idleTimeoutMillis: 30000,   // ← NEW: close idle connections after 30s
    connectionTimeoutMillis: 2000, // ← NEW: timeout if can't connect
});


database.on('connect', () => {
    console.log("✅ Database pool connected successfully");
});

database.on('error', (err) => {
    console.error("❌ Database pool error:", err);
    process.exit(1);
});

export default database;