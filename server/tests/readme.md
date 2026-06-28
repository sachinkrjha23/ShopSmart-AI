# Payment Testing Utilities

These files were used to manually test and verify the Razorpay payment integration during development.

---

## Folder Structure
tests/

├── README.md          ← you are here

├── testSignature.js   ← HMAC signature generator for verify endpoint

└── test.html          ← Razorpay modal tester for real payments

---

## 1. testSignature.js — Signature Generator

Generates a valid HMAC-SHA256 signature for testing the verify endpoint without a real frontend. Used to simulate a payment locally and test the signature verification logic.

### How to use:
1. Create an order via Postman:
POST /api/v1/payment/create-order
2. Copy `razorpayOrderId` from response
3. Paste it as `razorpay_order_id` in `testSignature.js`
4. Run:
```bash
node tests/testSignature.js
```
5. Copy all 3 output values:
razorpay_order_id

razorpay_payment_id

razorpay_signature
6. Paste into Postman:
POST /api/v1/payment/verify

---

## 2. test.html — Razorpay Modal Tester

Opens a real Razorpay checkout modal in the browser to simulate an actual payment and get real `payment_id`, `order_id` and `signature` values. Used to test the full payment → verify → refund flow end to end.

### How to use:
1. Create an order via Postman, copy `razorpayOrderId` and `amount` (in paise)
2. Paste them into `test.html`:
```js
amount:   880000,              // amount in paise from create-order response
order_id: "order_xxxxxxxxxx",  // razorpayOrderId from create-order response
```
3. Open `test.html` directly in browser
4. Click **Pay Now**
5. Complete payment using any test method below
6. Copy the 3 values shown on page after payment success
7. Paste into Postman verify request:
POST /api/v1/payment/verify

### Test Payment Methods:
── Test Card ──────────────────────────────

Card Number : 4111 1111 1111 1111

Expiry      : 12/26

CVV         : 123

Name        : Any name

OTP         : 1234
── UPI ────────────────────────────────────

UPI ID      : success@razorpay
── Net Banking ────────────────────────────

Select any bank → use test credentials

shown by Razorpay modal

---

## Full Payment Testing Flow

POST /api/v1/payment/create-order     → get razorpayOrderId + orderId

↓
Open test.html → Pay Now → complete payment

↓
Copy payment_id + order_id + signature from page

↓
POST /api/v1/payment/verify           → order marked as Paid

↓
POST /api/v1/payment/admin/refund     → real refund processed ✅


---

## Notes
- These files are for **development/testing only**
- `testSignature.js` reads `RAZORPAY_SECRET_KEY` from `config/config.env` which is gitignored — no secrets are exposed
- Test payments are free and don't charge real money
- All test transactions appear in Razorpay Dashboard under Test Mode