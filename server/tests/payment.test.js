import request from "supertest";
import crypto from "crypto";
import bcrypt from "bcrypt";
import app from "../app.js";
import database from "../database/db.js";

afterAll(async () => {
  await database.end();
});

describe("POST /api/v1/payment/verify", () => {
  const testEmail = "test.payment.buyer@example.com";
  const plainPassword = "StrongPass123!";
  let cookie;
  let buyerId;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const userResult = await database.query(
      `INSERT INTO users (name, email, password, is_email_verified)
       VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ["Payment Test Buyer", testEmail, hashedPassword]
    );
    buyerId = userResult.rows[0].id;

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testEmail, password: plainPassword });
    cookie = loginRes.headers["set-cookie"];
  });

  afterAll(async () => {
    await database.query("DELETE FROM users WHERE email = $1", [testEmail]);
    // orders/payments rows cascade-delete automatically (ON DELETE CASCADE on buyer_id/order_id)
  });

  // Helper: creates an "orders" + "payments" row pair, as createOrder() would have left them
  async function makeUnpaidOrder(razorpayOrderId) {
    const orderResult = await database.query(
      `INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price)
       VALUES ($1, 1000, 50, 0) RETURNING id`,
      [buyerId]
    );
    const orderId = orderResult.rows[0].id;

    await database.query(
      `INSERT INTO payments (order_id, razorpay_order_id, payment_status)
       VALUES ($1, $2, 'Pending')`,
      [orderId, razorpayOrderId]
    );

    return orderId;
  }

  it("Test #6: valid signature marks payment Paid and sets orders.paid_at", async () => {
    const razorpayOrderId = "order_test_valid_001";
    const razorpayPaymentId = "pay_test_valid_001";
    const orderId = await makeUnpaidOrder(razorpayOrderId);

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
    expect(res.body.success).toBe(true);

    const payment = await database.query(
      "SELECT payment_status, webhook_verified FROM payments WHERE order_id = $1",
      [orderId]
    );
    expect(payment.rows[0].payment_status).toBe("Paid");
    expect(payment.rows[0].webhook_verified).toBe(true);

    const order = await database.query(
      "SELECT paid_at FROM orders WHERE id = $1",
      [orderId]
    );
    expect(order.rows[0].paid_at).not.toBeNull();
  });

  it("Test #7: tampered signature is rejected — no order marked paid", async () => {
    const razorpayOrderId = "order_test_tampered_002";
    const razorpayPaymentId = "pay_test_tampered_002";
    const orderId = await makeUnpaidOrder(razorpayOrderId);

    const res = await request(app)
      .post("/api/v1/payment/verify")
      .set("Cookie", cookie)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: "this_is_a_fake_tampered_signature",
        orderId,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/tampering|invalid/i);

    // The critical security assertion: nothing got marked paid
    const payment = await database.query(
      "SELECT payment_status FROM payments WHERE order_id = $1",
      [orderId]
    );
    expect(payment.rows[0].payment_status).toBe("Pending");

    const order = await database.query(
      "SELECT paid_at FROM orders WHERE id = $1",
      [orderId]
    );
    expect(order.rows[0].paid_at).toBeNull();
  });
});