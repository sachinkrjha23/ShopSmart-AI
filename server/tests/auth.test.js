import { jest } from "@jest/globals";
import crypto from "crypto";
import bcrypt from "bcrypt";

jest.unstable_mockModule("../utils/sendEmail.js", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../app.js");
const { default: database } = await import("../database/db.js");

afterAll(async () => {
  await database.end();
});

describe("POST /api/v1/auth/register", () => {
  const testEmail = "test.register.user@example.com";

  afterAll(async () => {
    await database.query("DELETE FROM pending_registrations WHERE email = $1", [testEmail]);
    await database.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  it("creates a pending_registrations row, and does NOT create a users row", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register?frontendUrl=http://localhost:5173")
      .send({
        name: "Test User",
        email: testEmail,
        password: "StrongPass123!",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    const pending = await database.query(
      "SELECT * FROM pending_registrations WHERE email = $1",
      [testEmail]
    );
    expect(pending.rows.length).toBe(1);
    expect(pending.rows[0].name).toBe("Test User");

    const users = await database.query(
      "SELECT * FROM users WHERE email = $1",
      [testEmail]
    );
    expect(users.rows.length).toBe(0);
  });
});

describe("GET /api/v1/auth/verify-email/:token", () => {
  const testEmail = "test.verify.user@example.com";
  const rawToken = "test-raw-verification-token-123";
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  beforeAll(async () => {
    await database.query(
      `INSERT INTO pending_registrations (name, email, password, verification_token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 day')`,
      ["Verify Test User", testEmail, "hashed_password_placeholder", hashedToken]
    );
  });

  afterAll(async () => {
    await database.query("DELETE FROM pending_registrations WHERE email = $1", [testEmail]);
    await database.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  it("moves the pending row into a real users row, and removes it from pending_registrations", async () => {
    const res = await request(app).get(`/api/v1/auth/verify-email/${rawToken}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    const users = await database.query("SELECT * FROM users WHERE email = $1", [testEmail]);
    expect(users.rows.length).toBe(1);
    expect(users.rows[0].is_email_verified).toBe(true);

    const pending = await database.query(
      "SELECT * FROM pending_registrations WHERE email = $1",
      [testEmail]
    );
    expect(pending.rows.length).toBe(0);
  });
});

describe("POST /api/v1/auth/login", () => {
  const testEmail = "test.login.user@example.com";
  const plainPassword = "StrongPass123!";

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await database.query(
      `INSERT INTO users (name, email, password, is_email_verified)
       VALUES ($1, $2, $3, TRUE)`,
      ["Login Test User", testEmail, hashedPassword]
    );
  });

  afterAll(async () => {
    await database.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  it("logs in with correct credentials and sets a JWT cookie", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testEmail, password: plainPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testEmail);

    // Response should NOT leak the password hash back to the client
    expect(res.body.user.password).toBeUndefined();

    // Cookie assertion — the actual point of this test
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c) => c.startsWith("token="));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain("HttpOnly");
  });

  it("rejects login with an incorrect password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testEmail, password: "TotallyWrongPassword123!" });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);

    // No cookie should be set on a failed login
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});


describe("GET /api/v1/auth/me (protected route)", () => {
  it("returns 401 when no token cookie is sent", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/login/i);
  });
});