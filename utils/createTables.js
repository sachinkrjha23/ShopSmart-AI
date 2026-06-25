import { createUserTable } from "../models/userTable.js";
import { createOrderItemTable } from "../models/orderItemsTable.js";
import { createOrdersTable } from "../models/ordersTable.js";
import { createPaymentsTable } from "../models/paymentsTable.js";
import { createProductReviewsTable } from "../models/productReviewsTable.js";
import { createProductsTable } from "../models/productTable.js";
import { createShippingInfoTable } from "../models/shipping_info.js";
import database from "../database/db.js";


export const createTables = async() =>{
    try {
        // ✅ Enable UUID extension FIRST
        await database.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        console.log("✅ UUID-OSSP extension enabled");

        
        await createUserTable();
        await createProductsTable();
        await createOrdersTable();
        await createProductReviewsTable();
        await createOrderItemTable();
        await createShippingInfoTable();
        await createPaymentsTable();
        console.log("All tables created successfully");
    }
    catch(error)
    {
        console.log("Error creating tables: ",error);
        process.exit(1); // Exit on failure
    }
}