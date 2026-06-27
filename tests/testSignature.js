import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config({ path: "./config/config.env" });

const razorpay_order_id   = "order_T6mOunmOAcBTNm"; // from create-order
const razorpay_payment_id = "pay_test123456789";     // any fake id

const body = `${razorpay_order_id}|${razorpay_payment_id}`;

const signature = crypto
  .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
  .update(body)
  .digest("hex");

console.log("razorpay_order_id:  ", razorpay_order_id);
console.log("razorpay_payment_id:", razorpay_payment_id);
console.log("razorpay_signature: ", signature);