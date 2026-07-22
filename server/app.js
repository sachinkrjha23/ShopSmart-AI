import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import {createTables} from "./utils/createTables.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import  authRouter from "./router/authRoutes.js";
import productRouter from "./router/productRoutes.js";
import adminRouter from "./router/adminRoutes.js";
import paymentRouter from "./router/paymentRoutes.js"; 
import wishlistRouter from "./router/wishlistRoutes.js";
import addressRouter from "./router/addressRoutes.js";
import couponRouter from "./router/couponRoutes.js";
import settingsRouter from "./router/settingsRoutes.js";
import contactRouter from "./router/contactRoutes.js";
import sellerRouter from "./router/sellerRoutes.js";
import notificationRouter from "./router/notificationRoutes.js";


const app = express();

config({path: "./config/config.env"});

app.use(cookieParser());
app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}))

app.use("/api/v1/payment", paymentRouter); 

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "./uploads",
        limits: { fileSize: 5 * 1024 * 1024 }
    })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/address", addressRouter);
app.use("/api/v1/coupon", couponRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/notification", notificationRouter);


await createTables();

app.use(errorMiddleware);

export default app;