import pkg from "pg";
const { Client } = pkg;
import dotenv from 'dotenv';

// ✅ Load environment variables from config.env
dotenv.config({ path: "./config/config.env" });

const database = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

(async () => {
    try {
        await database.connect();
        console.log("✅ Database connected successfully");
    }
    catch(error) {
        console.error("❌ Connection failed: ", error);
        process.exit(1);
    }
})();

export default database;