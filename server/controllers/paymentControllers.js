import Razorpay from "razorpay";
import crypto from "crypto";
import database from "../database/db.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";

const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_FRONTEND_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Helper: INR → paise (Razorpay always works in paise)
const toPaise = (inr) => Math.round(Number(inr) * 100);

// 1. CREATE ORDER
export const createOrder = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const { cartItems, shippingInfo } = req.body;
    const buyerId = req.user.id;

    if (!cartItems || cartItems.length === 0) {
      return next(new ErrorHandler("Cart is empty.", 400));
    }

    if (cartItems.length > 20) {
      return next(
        new ErrorHandler("Maximum 20 different items per order.", 400),
      );
    }

    // Validate each cart item
    for (const item of cartItems) {
      if (!item.productId) {
        return next(new ErrorHandler("Invalid product ID in cart.", 400));
      }
      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        return next(
          new ErrorHandler("Quantity must be a positive number.", 400),
        );
      }
      if (Number(item.quantity) > 100) {
        return next(new ErrorHandler("Maximum 100 quantity per product.", 400));
      }
    }

    if (!shippingInfo) {
      return next(new ErrorHandler("Shipping information is required.", 400));
    }

    const { full_name, state, city, country, address, pincode, phone } =
      shippingInfo;

    if (
      !full_name ||
      !state ||
      !city ||
      !country ||
      !address ||
      !pincode ||
      !phone
    ) {
      return next(new ErrorHandler("All shipping fields are required.", 400));
    }
    if (!/^\d{10}$/.test(phone)) {
      return next(
        new ErrorHandler("Invalid phone number. Must be 10 digits.", 400),
      );
    }
    if (!/^\d{6}$/.test(pincode)) {
      return next(new ErrorHandler("Invalid pincode. Must be 6 digits.", 400));
    }
    if (full_name.trim().length < 2 || full_name.trim().length > 100) {
      return next(
        new ErrorHandler(
          "Full name must be between 2 and 100 characters.",
          400,
        ),
      );
    }

    // Fetch real prices from DB

    const productIds = cartItems.map((item) => item.productId);
    const { rows: products } = await client.query(
      `SELECT id, name, price, stock FROM products WHERE id = ANY($1::uuid[])`,
      [productIds],
    );

    if (products.length !== productIds.length) {
      await client.query("ROLLBACK");
      return next(new ErrorHandler("One or more products not found.", 400));
    }

    // Calculate totals using DB prices
    let itemsPrice = 0;

    const validatedItems = cartItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new ErrorHandler(`Product not found: ${item.productId}`, 404);
      }
      if (product.stock < item.quantity) {
        throw new ErrorHandler(
          `Insufficient stock for "${product.name}".`,
          400,
        );
      }

      const lineTotal = Number(product.price) * item.quantity;
      itemsPrice += lineTotal;

      return {
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        image: item.image || "",
        title: item.title || product.name,
      };
    });

    const taxPrice = 0;
    const shippingPrice = itemsPrice > 500 ? 0 : 50;
    const totalPrice = Math.round((itemsPrice + shippingPrice) * 100) / 100;

    // Amount validation
    if (totalPrice <= 0) {
      return next(new ErrorHandler("Invalid order amount.", 400));
    }
    if (totalPrice > 500000) {
      return next(
        new ErrorHandler(
          "Order amount exceeds maximum limit of ₹5,00,000.",
          400,
        ),
      );
    }

    // Insert order
    const {
      rows: [order],
    } = await client.query(
      `INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price, order_status)
       VALUES ($1, $2, $3, $4, 'Processing')
       RETURNING *`,
      [buyerId, totalPrice, taxPrice, shippingPrice],
    );

    // Insert order items
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, image, title)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          item.productId,
          item.quantity,
          item.price,
          item.image,
          item.title,
        ],
      );
    }

    await client.query(
      `INSERT INTO shipping_info (order_id, full_name, state, city, country, address, pincode, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        order.id,
        full_name.trim(),
        state.trim(),
        city.trim(),
        country.trim(),
        address.trim(),
        pincode.trim(),
        phone.trim(),
      ],
    );

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: toPaise(totalPrice),
      currency: "INR",
      receipt: order.id.replace(/-/g, "").substring(0, 40),
      notes: {
        orderId: order.id,
        buyerId: buyerId,
      },
    });

    // Insert payment record
    await client.query(
      `INSERT INTO payments (order_id, payment_type, payment_status, razorpay_order_id)
       VALUES ($1, 'Online', 'Pending', $2)`,
      [order.id, razorpayOrder.id],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: `₹${(razorpayOrder.amount / 100).toLocaleString("en-IN")}`,
      currency: "INR",
      keyId: process.env.RAZORPAY_FRONTEND_KEY, // safe — public key
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(
      new ErrorHandler(error.message || "Order creation failed.", 500),
    );
  } finally {
    client.release();
  }
});

// 2. VERIFY  PAYMENT
export const verifyPayment = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return next(
        new ErrorHandler("Missing payment verification fields.", 400),
      );
    }

    // Verify HMAC signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      await client.query("ROLLBACK");
      return next(
        new ErrorHandler(
          "Invalid payment signature. Possible tampering detected.",
          400,
        ),
      );
    }

    // Update payment record
    await client.query(
      `UPDATE payments
       SET razorpay_payment_id = $1,
           razorpay_signature  = $2,
           payment_status      = 'Paid',
           webhook_verified    = TRUE,
           updated_at          = CURRENT_TIMESTAMP
       WHERE razorpay_order_id = $3`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id],
    );

    // Mark order as paid
    await client.query(
      `UPDATE orders
       SET paid_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId],
    );

    // Decrease product stock
    const { rows: items } = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId],
    );

    for (const item of items) {
      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2 AND stock >= $1`,
        [item.quantity, item.product_id],
      );
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Payment verified successfully. Order confirmed!",
      orderId,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(
      new ErrorHandler(error.message || "Payment verification failed.", 500),
    );
  } finally {
    client.release();
  }
});

// 3. WEBHOOK — called by Razorpay servers directly
export const handleWebhook = async (req, res) => {
  const client = await database.connect();

  try {
    // Verify webhook signature
    const receivedSig = req.headers["x-razorpay-signature"];
    const rawBody = req.body; // Buffer from express.raw()

    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expectedSig !== receivedSig) {
      console.warn("⚠️  Invalid webhook signature — rejected");
      return res.status(400).json({ error: "Invalid webhook signature." });
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;

    console.log(`📦 Razorpay webhook received: ${event}`);

    switch (event) {
      // payment.captured
      case "payment.captured": {
        const payment = payload.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        const razorpayPayId = payment.id;
        const method = payment.method;

        await client.query("BEGIN");

        await client.query(
          `UPDATE payments
           SET razorpay_payment_id  = $1,
               payment_status       = 'Paid',
               payment_method       = $2,
               webhook_verified     = TRUE,
               raw_webhook_payload  = $3,
               updated_at           = CURRENT_TIMESTAMP
           WHERE razorpay_order_id  = $4`,
          [razorpayPayId, method, JSON.stringify(payload), razorpayOrderId],
        );

        // Also ensure order is marked paid (belt + suspenders with verifyPayment)
        await client.query(
          `UPDATE orders o
           SET paid_at = CURRENT_TIMESTAMP
           FROM payments p
           WHERE p.order_id = o.id
             AND p.razorpay_order_id = $1
             AND o.paid_at IS NULL`,
          [razorpayOrderId],
        );

        await client.query("COMMIT");
        console.log(`✅ payment.captured → ${razorpayPayId}`);
        break;
      }

      // payment.failed
      case "payment.failed": {
        const payment = payload.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        await client.query("BEGIN");

        await client.query(
          `UPDATE payments
           SET payment_status      = 'Failed',
               raw_webhook_payload = $1,
               updated_at          = CURRENT_TIMESTAMP
           WHERE razorpay_order_id  = $2`,
          [JSON.stringify(payload), razorpayOrderId],
        );

        await client.query("COMMIT");
        console.log(`❌ payment.failed → order ${razorpayOrderId}`);
        break;
      }

      // refund.processed
      case "refund.processed": {
        const refund = payload.payload.refund.entity;
        const razorpayPayId = refund.payment_id;

        await client.query("BEGIN");

        await client.query(
          `UPDATE payments
           SET payment_status      = 'Refunded',
               raw_webhook_payload = $1,
               updated_at          = CURRENT_TIMESTAMP
           WHERE razorpay_payment_id = $2`,
          [JSON.stringify(payload), razorpayPayId],
        );

        await client.query("COMMIT");
        console.log(`💰 refund.processed → payment ${razorpayPayId}`);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled webhook event: ${event}`);
    }

    // Always respond 200 quickly — Razorpay retries if you don't
    return res.status(200).json({ received: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Webhook processing error:", error.message);
    // Return 200 anyway so Razorpay doesn't retry a legitimate event
    return res
      .status(200)
      .json({ received: true, warning: "Internal processing error." });
  } finally {
    client.release();
  }
};

// 4. GET MY ORDERS
export const getMyOrders = catchAsyncErrors(async (req, res, next) => {
  const buyerId = req.user.id;

  const { rows: orders } = await database.query(
    `SELECT
       o.id, o.total_price, o.tax_price, o.shipping_price,
       o.order_status, o.paid_at, o.created_at,
       p.payment_status, p.razorpay_payment_id, p.payment_method,
       s.full_name, s.address, s.city, s.state, s.pincode, s.phone,
       json_agg(
         json_build_object(
           'productId', oi.product_id,
           'title',     oi.title,
           'image',     oi.image,
           'quantity',  oi.quantity,
           'price',     oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN payments      p  ON p.order_id  = o.id
     LEFT JOIN shipping_info s  ON s.order_id  = o.id
     LEFT JOIN order_items   oi ON oi.order_id = o.id
     WHERE o.buyer_id = $1
     GROUP BY o.id, p.id, s.id
     ORDER BY o.created_at DESC`,
    [buyerId],
  );

  res.status(200).json({
    success: true,
    orders,
  });
});

// 5. GET SINGLE ORDER
export const getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  if (!isValidUUID(orderId)) {
    return next(new ErrorHandler("Invalid order ID.", 400));
  }

  const buyerId = req.user.id;

  const { rows } = await database.query(
    `SELECT
       o.id, o.total_price, o.tax_price, o.shipping_price,
       o.order_status, o.paid_at, o.created_at,
       p.payment_status, p.razorpay_payment_id, p.payment_method,
       s.full_name, s.address, s.city, s.state, s.pincode, s.phone,
       json_agg(
         json_build_object(
           'productId', oi.product_id,
           'title',     oi.title,
           'image',     oi.image,
           'quantity',  oi.quantity,
           'price',     oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN payments      p  ON p.order_id  = o.id
     LEFT JOIN shipping_info s  ON s.order_id  = o.id
     LEFT JOIN order_items   oi ON oi.order_id = o.id
     WHERE o.id = $1 AND o.buyer_id = $2
     GROUP BY o.id, p.id, s.id`,
    [orderId, buyerId],
  );

  if (rows.length === 0) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  res.status(200).json({
    success: true,
    order: rows[0],
  });
});

// 6. USER — CANCEL ORDER
// User can only cancel if order is still 'Processing'
export const cancelOrder = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const { orderId } = req.params;

    if (!isValidUUID(orderId)) {
      return next(new ErrorHandler("Invalid order ID.", 400));
    }

    const buyerId = req.user.id;

    // Check order exists and belongs to this user
    const { rows } = await client.query(
      `SELECT o.*, p.payment_status, p.razorpay_payment_id
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1 AND o.buyer_id = $2`,
      [orderId, buyerId],
    );

    if (rows.length === 0) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const order = rows[0];

    // Only allow cancel if Processing
    if (order.order_status !== "Processing") {
      return next(
        new ErrorHandler(
          `Order cannot be cancelled. Current status: ${order.order_status}`,
          400,
        ),
      );
    }

    // Cancel the order
    await client.query(
      `UPDATE orders SET order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId],
    );

    // Restore stock
    const { rows: items } = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId],
    );

    for (const item of items) {
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2`,
        [item.quantity, item.product_id],
      );
    }

    // If already paid, initiate refund automatically
    let refundInitiated = false;
    if (
      order.payment_status === "Paid" &&
      order.razorpay_payment_id &&
      !order.razorpay_payment_id.startsWith("pay_test")
    ) {
      try {
        const refund = await razorpay.payments.refund(
          order.razorpay_payment_id,
          {
            notes: { orderId, reason: "Order cancelled by user" },
          },
        );

        await client.query(
          `UPDATE payments
           SET payment_status = 'Refunded', updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $1`,
          [orderId],
        );

        refundInitiated = true;
      } catch (err) {
        console.error("Auto refund failed:", err.message);
        // Don't block cancellation if refund fails
      }
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: refundInitiated
        ? "Order cancelled and refund initiated successfully."
        : "Order cancelled successfully.",
      refundInitiated,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(
      new ErrorHandler(error.message || "Order cancellation failed.", 500),
    );
  } finally {
    client.release();
  }
});

// 7. ADMIN — GET ALL ORDERS
export const adminGetAllOrders = catchAsyncErrors(async (req, res, next) => {
  const { rows: orders } = await database.query(
    `SELECT
       o.id, o.total_price, o.order_status, o.paid_at, o.created_at,
       u.name AS buyer_name, u.email AS buyer_email,
       p.payment_status, p.payment_method,
       s.city, s.state, s.phone
     FROM orders o
     LEFT JOIN users         u  ON u.id = o.buyer_id
     LEFT JOIN payments      p  ON p.order_id = o.id
     LEFT JOIN shipping_info s  ON s.order_id = o.id
     ORDER BY o.created_at DESC`,
  );

  res.status(200).json({
    success: true,
    totalOrders: orders.length,
    orders,
  });
});

// 8. ADMIN — UPDATE ORDER STATUS
export const adminUpdateOrderStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { orderId } = req.params;

    if (!isValidUUID(orderId)) {
      return next(new ErrorHandler("Invalid order ID.", 400));
    }

    const { status } = req.body;

    const validStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return next(
        new ErrorHandler(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          400,
        ),
      );
    }

    const { rows } = await database.query(
      `UPDATE orders
     SET order_status = $1
     WHERE id = $2
     RETURNING *`,
      [status, orderId],
    );

    if (rows.length === 0) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      order: rows[0],
    });
  },
);

// 9. ADMIN — INITIATE REFUND
export const adminInitiateRefund = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const { orderId, amount } = req.body;

    if (!orderId) {
      return next(new ErrorHandler("Order ID is required.", 400));
    }

    if (!isValidUUID(orderId)) {
      return next(new ErrorHandler("Invalid order ID.", 400));
    }

    const { rows } = await client.query(
      `SELECT p.razorpay_payment_id, p.payment_status, o.total_price
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.order_id = $1`,
      [orderId],
    );

    if (rows.length === 0) {
      return next(new ErrorHandler("Payment record not found.", 404));
    }

    const { razorpay_payment_id, payment_status, total_price } = rows[0];

    if (payment_status === "Refunded") {
      return next(
        new ErrorHandler("This order has already been refunded.", 400),
      );
    }

    if (payment_status !== "Paid") {
      return next(new ErrorHandler("Only paid orders can be refunded.", 400));
    }

    if (!razorpay_payment_id) {
      return next(
        new ErrorHandler("No Razorpay payment ID found for this order.", 400),
      );
    }

    const refundAmountPaise = amount ? toPaise(amount) : toPaise(total_price); // full refund if no amount given

    const refund = await razorpay.payments.refund(razorpay_payment_id, {
      amount: refundAmountPaise,
      notes: { orderId, reason: "Admin initiated refund" },
    });

    // Webhook will confirm, but optimistically update DB
    await client.query(
      `UPDATE payments
       SET payment_status = 'Refunded', updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1`,
      [orderId],
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Refund initiated successfully.",
      refundId: refund.id,
      amount: (refundAmountPaise / 100).toFixed(2),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(new ErrorHandler(error.message || "Refund failed.", 500));
  } finally {
    client.release();
  }
});

// 10. ADMIN — CANCEL ANY ORDER
export const adminCancelOrder = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const { orderId } = req.params;

    if (!isValidUUID(orderId)) {
      return next(new ErrorHandler("Invalid order ID.", 400));
    }

    const { rows } = await client.query(
      `SELECT o.*, p.payment_status, p.razorpay_payment_id
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1`,
      [orderId],
    );

    if (rows.length === 0) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const order = rows[0];

    // Admin cannot cancel already Delivered orders
    if (order.order_status === "Delivered") {
      return next(
        new ErrorHandler("Delivered orders cannot be cancelled.", 400),
      );
    }

    if (order.order_status === "Cancelled") {
      return next(new ErrorHandler("Order is already cancelled.", 400));
    }

    // Cancel order
    await client.query(
      `UPDATE orders SET order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId],
    );

    // Restore stock
    const { rows: items } = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId],
    );

    for (const item of items) {
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2`,
        [item.quantity, item.product_id],
      );
    }

    // Auto refund if paid
    let refundInitiated = false;
    if (
      order.payment_status === "Paid" &&
      order.razorpay_payment_id &&
      !order.razorpay_payment_id.startsWith("pay_test")
    ) {
      try {
        await razorpay.payments.refund(order.razorpay_payment_id, {
          notes: { orderId, reason: "Order cancelled by admin" },
        });

        await client.query(
          `UPDATE payments
           SET payment_status = 'Refunded', updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $1`,
          [orderId],
        );

        refundInitiated = true;
      } catch (err) {
        console.error("Admin auto refund failed:", err.message);
      }
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: refundInitiated
        ? "Order cancelled and refund initiated."
        : "Order cancelled successfully.",
      refundInitiated,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(new ErrorHandler(error.message || "Cancellation failed.", 500));
  } finally {
    client.release();
  }
});
