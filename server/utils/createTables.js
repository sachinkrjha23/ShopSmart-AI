import { createUserTable } from "../models/userTable.js";
import { createOrderItemTable } from "../models/orderItemsTable.js";
import { createOrdersTable } from "../models/ordersTable.js";
import { createPaymentsTable } from "../models/paymentsTable.js";
import { createProductReviewsTable } from "../models/productReviewsTable.js";
import { createProductsTable } from "../models/productTable.js";
import { createShippingInfoTable } from "../models/shipping_info.js";
import database from "../database/db.js";
import { createWishlistTable } from "../models/wishlistTable.js";
import { createAddressTable } from "../models/addressTable.js";
import { createCouponTables } from "../models/couponTable.js";
import { createCategoriesTable } from "../models/categoryTable.js"; 
import { createPendingRegistrationsTable } from "../models/pendingRegistrationsTable.js";
import { createStoreSettingsTable } from "../models/storeSettingsTable.js";
import { createContactMessagesTable } from "../models/contactMessagesTable.js";
import { createSellersTable } from "../models/sellersTable.js";
import { createSellerRatingsTable } from "../models/sellerRatingsTable.js";
import { createNotificationTables } from "../models/notificationsTable.js";


export const createTables = async() =>{
    try {
        // ✅ Enable UUID extension FIRST
        await database.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        console.log("✅ UUID-OSSP extension enabled");

        
        await createUserTable();
        await createCategoriesTable(); 
        await createProductsTable();
        await createOrdersTable();
        await createProductReviewsTable();
        await createOrderItemTable();
        await createShippingInfoTable();
        await createPaymentsTable();
        await createWishlistTable();
        await createAddressTable();
        await createCouponTables();
        await createPendingRegistrationsTable();
        await createStoreSettingsTable();
        await createContactMessagesTable();
        await createSellersTable();
        await createSellerRatingsTable();
        await createNotificationTables();


        await database.query(`
            CREATE TABLE IF NOT EXISTS webhook_logs (
                id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                event        VARCHAR(100) NOT NULL,
                payload      JSONB NOT NULL,
                signature    TEXT,
                verified     BOOLEAN DEFAULT FALSE,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("All tables created successfully");
    }
    catch(error)
    {
        console.log("Error creating tables: ",error);
        process.exit(1); // Exit on failure
    }
}