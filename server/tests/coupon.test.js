import request from "supertest";
import bcrypt from "bcrypt";
import app from "../app.js";
import database from "../database/db.js";

afterAll(async () => {
  await database.end();
});

describe("POST /api/v1/coupon/validate", () => {
  const buyerEmail = "test.coupon.buyer@example.com";
  const sellerEmail = "test.coupon.seller@example.com";
  const plainPassword = "StrongPass123!";
  let cookie;
  let buyerId, sellerId, productId, couponId, dummyOrderId;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const buyerResult = await database.query(
      `INSERT INTO users (name, email, password, is_email_verified)
       VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ["Coupon Test Buyer", buyerEmail, hashedPassword]
    );
    buyerId = buyerResult.rows[0].id;

    const sellerResult = await database.query(
      `INSERT INTO users (name, email, password, is_email_verified)
       VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ["Coupon Test Seller", sellerEmail, hashedPassword]
    );
    sellerId = sellerResult.rows[0].id;

    const productResult = await database.query(
      `INSERT INTO products (name, description, price, category, stock, created_by)
       VALUES ($1, 'A test product', 500, 'Test Category', 10, $2) RETURNING id`,
      ["Coupon Test Product", sellerId]
    );
    productId = productResult.rows[0].id;

    const couponResult = await database.query(
      `INSERT INTO coupons (code, type, discount_value, per_user_limit, valid_from, valid_until)
       VALUES ('USEDONCE10', 'flat', 100, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day')
       RETURNING id`
    );
    couponId = couponResult.rows[0].id;

    // A dummy paid order, needed only to satisfy coupon_usage's FK to orders
    const orderResult = await database.query(
      `INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price)
       VALUES ($1, 500, 0, 0) RETURNING id`,
      [buyerId]
    );
    dummyOrderId = orderResult.rows[0].id;

    // Simulate: this buyer already used this coupon once (per_user_limit = 1)
    await database.query(
      `INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES ($1, $2, $3)`,
      [couponId, buyerId, dummyOrderId]
    );

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: buyerEmail, password: plainPassword });
    cookie = loginRes.headers["set-cookie"];
  });

  afterAll(async () => {
    await database.query("DELETE FROM coupons WHERE code = 'USEDONCE10'");
    await database.query("DELETE FROM products WHERE id = $1", [productId]);
    await database.query("DELETE FROM users WHERE email = $1", [buyerEmail]);
    await database.query("DELETE FROM users WHERE email = $1", [sellerEmail]);
  });

  it("Test #8: rejects a coupon the user has already used up to their per-user limit", async () => {
    const res = await request(app)
      .post("/api/v1/coupon/validate")
      .set("Cookie", cookie)
      .send({
        code: "USEDONCE10",
        cartItems: [{ productId, quantity: 1 }],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already used this coupon/i);
  });
});