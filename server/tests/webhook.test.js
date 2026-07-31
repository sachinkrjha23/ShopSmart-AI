import request from "supertest";
import crypto from "crypto";
import bcrypt from "bcrypt";
import app from "../app.js";
import database from "../database/db.js";

afterAll(async () => {
  await database.end();
});

describe("POST /api/v1/payment/webhook", () => {
  const buyerEmail = "test.webhook.buyer@example.com";
  let buyerId, orderId;
  const razorpayOrderId = "order_test_webhook_004";
  const razorpayPaymentId = "pay_test_webhook_004";

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("StrongPass123!", 10);
    const buyerResult = await database.query(
      `INSERT INTO users (name, email, password, is_email_verified)
       VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ["Webhook Test Buyer", buyerEmail, hashedPassword]
    );
    buyerId = buyerResult.rows[0].id;

    const orderResult = await database.query(
      `INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price)
       VALUES ($1, 800, 0, 0) RETURNING id`,
      [buyerId]
    );
    orderId = orderResult.rows[0].id;

    await database.query(
      `INSERT INTO payments (order_id, razorpay_order_id, payment_status)
       VALUES ($1, $2, 'Pending')`,
      [orderId, razorpayOrderId]
    );
  });

  afterAll(async () => {
    await database.query("DELETE FROM users WHERE email = $1", [buyerEmail]);
  });

  function buildPayload() {
    return JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: razorpayPaymentId,
            order_id: razorpayOrderId,
            method: "card",
          },
        },
      },
    });
  }

  it("Test #18: rejects a webhook call with a forged/tampered signature — no payment gets marked Paid", async () => {
    const rawBody = buildPayload();

    const res = await request(app)
      .post("/api/v1/payment/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", "totally_forged_signature")
      .send(rawBody);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid webhook signature/i);

    const payment = await database.query(
      "SELECT payment_status FROM payments WHERE order_id = $1",
      [orderId]
    );
    expect(payment.rows[0].payment_status).toBe("Pending");
  });

  it("accepts the webhook when the signature is genuinely valid", async () => {
    const rawBody = buildPayload();
    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const res = await request(app)
      .post("/api/v1/payment/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", validSignature)
      .send(rawBody);

    expect(res.statusCode).toBe(200);
    expect(res.body.received).toBe(true);

    const payment = await database.query(
      "SELECT payment_status, webhook_verified FROM payments WHERE order_id = $1",
      [orderId]
    );
    expect(payment.rows[0].payment_status).toBe("Paid");
    expect(payment.rows[0].webhook_verified).toBe(true);
  });
});