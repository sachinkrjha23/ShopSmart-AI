import request from "supertest";
import bcrypt from "bcrypt";
import app from "../app.js";
import database from "../database/db.js";

afterAll(async () => {
  await database.end();
});

describe("RBAC: customer hitting an Admin-only route", () => {
  const testEmail = "test.rbac.customer@example.com";
  const plainPassword = "StrongPass123!";
  let cookie;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await database.query(
      `INSERT INTO users (name, email, password, role, is_email_verified)
       VALUES ($1, $2, $3, 'User', TRUE)`,
      ["RBAC Test Customer", testEmail, hashedPassword]
    );

    // Log in as this customer to get a real JWT cookie
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testEmail, password: plainPassword });

    cookie = loginRes.headers["set-cookie"];
  });

  afterAll(async () => {
    await database.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  it("returns 403 when a 'User' role tries to access an Admin-only route", async () => {
    const res = await request(app)
      .get("/api/v1/admin/getallusers")
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not allowed/i);
  });
});