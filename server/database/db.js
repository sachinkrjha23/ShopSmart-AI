import pkg from "pg";
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: "./config/config.env" });

const database = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20,                   
    idleTimeoutMillis: 30000,   
    connectionTimeoutMillis: 2000, 
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});


database.on('connect', () => {
    console.log("✅ Database pool connected successfully");
});

database.on('error', (err) => {
    console.error("❌ Database pool error:", err);
    process.exit(1);
});

export default database;