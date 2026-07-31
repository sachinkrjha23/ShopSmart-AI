import request from "supertest";
import crypto from "crypto";
import bcrypt from "bcrypt";
import app from "../app.js";
import database from "../database/db.js";

afterAll(async () => {
  await database.end();
});

describe("Order stock decrement on payment success", () => {
  const buyerEmail = "test.order.buyer@example.com";
  const sellerEmail = "test.order.seller@example.com";
  const plainPassword = "StrongPass123!";
  let cookie;
  let buyerId, sellerId, productId;
  const startingStock = 10;
  const purchaseQuantity = 3;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const buyerResult = await database.query(
      `INSERT INTO users (name, email, password, is_email_verified)
       VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ["Order Test Buyer", buyerEmail, hashedPassword]
    );
    buyerId = buyerResult.rows[0].id;

    const sellerResult = await database.query(
      `INSERT INTO users (name, email, password, is_email_verified)
       VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ["Order Test Seller", sellerEmail, hashedPassword]
    );
    sellerId = sellerResult.rows[0].id;

    const productResult = await database.query(
      `INSERT INTO products (name, description, price, category, stock, created_by)
       VALUES ($1, 'A test product', 500, 'Test Category', $2, $3) RETURNING id`,
      ["Order Test Product", startingStock, sellerId]
    );
    productId = productResult.rows[0].id;

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: buyerEmail, password: plainPassword });
    cookie = loginRes.headers["set-cookie"];
  });

  afterAll(async () => {
    await database.query("DELETE FROM products WHERE id = $1", [productId]);
    await database.query("DELETE FROM users WHERE email = $1", [buyerEmail]);
    await database.query("DELETE FROM users WHERE email = $1", [sellerEmail]);
  });

  it("Test #9: decrements product stock by the ordered quantity after payment verifies", async () => {
    // Simulate what createOrder() would have left behind: an unpaid order + its line item
    const orderResult = await database.query(
      `INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price)
       VALUES ($1, 1500, 0, 0) RETURNING id`,
      [buyerId]
    );
    const orderId = orderResult.rows[0].id;

    await database.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price, image, title)
       VALUES ($1, $2, $3, 500, 'placeholder.jpg', 'Order Test Product')`,
      [orderId, productId, purchaseQuantity]
    );

    const razorpayOrderId = "order_test_stock_003";
    const razorpayPaymentId = "pay_test_stock_003";

    await database.query(
      `INSERT INTO payments (order_id, razorpay_order_id, payment_status)
       VALUES ($1, $2, 'Pending')`,
      [orderId, razorpayOrderId]
    );

    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const res = await request(app)
      .post("/api/v1/payment/verify")
      .set("Cookie", cookie)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: validSignature,
        orderId,
      });

    expect(res.statusCode).toBe(200);

    const product = await database.query(
      "SELECT stock FROM products WHERE id = $1",
      [productId]
    );
    expect(product.rows[0].stock).toBe(startingStock - purchaseQuantity);
  });
});