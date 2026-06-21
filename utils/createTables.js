import { createUserTable } from "../models/userTable.js";
import { createOrderItemTable } from "../models/orderItemsTable.js";
import { createOrdersTable } from "../models/ordersTable.js";
import { createPaymentsTable } from "../models/paymentsTable.js";
import { createProductReviewsTable } from "../models/productReviewsTable.js";
import { createProductsTable } from "../models/productTable.js";
import { createShippingInfoTable } from "../models/shipping_info.js";

export const createTables = async() =>{
    try {
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
    }
}