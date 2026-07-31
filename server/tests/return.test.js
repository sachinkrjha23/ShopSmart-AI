import request from "supertest";
import bcrypt from "bcrypt";
import app from "../app.js";
import database from "../database/db.js";

afterAll(async () => {
  await database.end();
});

describe("POST /api/v1/return/request", () => {
  const buyerEmail = "test.return.buyer@example.com";
  const plainPassword = "StrongPass123!";
  let cookie;
  let buyerId, productId, orderId, orderItemId;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const buyerResult = await database.query(
      `INSERT INTO users (name, email, password, is_email_verified)
       VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ["Return Test Buyer", buyerEmail, hashedPassword]
    );
    buyerId = buyerResult.rows[0].id;

    const productResult = await database.query(
      `INSERT INTO products (name, description, price, category, stock, created_by)
       VALUES ($1, 'A test product', 500, 'Test Category', 10, $2) RETURNING id`,
      ["Return Test Product", buyerId]
    );
    productId = productResult.rows[0].id;

    const orderResult = await database.query(
      `INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price)
       VALUES ($1, 500, 0, 0) RETURNING id`,
      [buyerId]
    );
    orderId = orderResult.rows[0].id;

    // Item delivered 10 days ago — outside the 7-day return window
    const itemResult = await database.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price, image, title, fulfillment_status, delivered_at)
       VALUES ($1, $2, 1, 500, 'placeholder.jpg', 'Return Test Product', 'Delivered', NOW() - INTERVAL '10 days')
       RETURNING id`,
      [orderId, productId]
    );
    orderItemId = itemResult.rows[0].id;

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: buyerEmail, password: plainPassword });
    cookie = loginRes.headers["set-cookie"];
  });

  afterAll(async () => {
    await database.query("DELETE FROM products WHERE id = $1", [productId]);
    await database.query("DELETE FROM users WHERE email = $1", [buyerEmail]);
  });

  it("Test #10: rejects a return request after the 7-day return window has expired", async () => {
    const res = await request(app)
      .post("/api/v1/return/request")
      .set("Cookie", cookie)
      .send({
        orderItemId,
        reason: "Changed my mind",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/return window.*expired/i);

    // Confirm no return_requests row was actually created
    const returnRows = await database.query(
      "SELECT * FROM return_requests WHERE order_item_id = $1",
      [orderItemId]
    );
    expect(returnRows.rows.length).toBe(0);
  });
});