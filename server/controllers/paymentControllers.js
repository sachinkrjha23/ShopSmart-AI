import Razorpay from "razorpay";
import crypto from "crypto";
import database from "../database/db.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { applyPaymentSuccessEffects } from "../utils/applyPaymentSuccessEffects.js";
import { generateInvoiceBuffer } from "../utils/generateInvoice.js";


const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_FRONTEND_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const toPaise = (inr) => Math.round(Number(inr) * 100);

// 1. CREATE ORDER
export const createOrder = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const { cartItems, shippingInfo, addressId, coupon_code } = req.body;
    const buyerId = req.user.id;

    //  Cart Validation
    if (!cartItems || cartItems.length === 0) {
      throw new ErrorHandler("Cart is empty.", 400);
    }

    if (cartItems.length > 20) {
      throw new ErrorHandler("Maximum 20 different items per order.", 400);
    }

    for (const item of cartItems) {
      if (!item.productId) {
        throw new ErrorHandler("Invalid product ID in cart.", 400);
      }
      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        throw new ErrorHandler("Quantity must be a positive number.", 400);
      }
      if (Number(item.quantity) > 100) {
        throw new ErrorHandler("Maximum 100 quantity per product.", 400);
      }
    }

    //  Shipping Info Resolution
    // Either use a saved address (addressId) OR manual shippingInfo
    let resolvedShipping;

    if (addressId) {
      // Security: validate UUID format before hitting DB
      if (!isValidUUID(addressId)) {
        throw new ErrorHandler("Invalid address ID.", 400);
      }

      // Security: user_id check ensures user can't use someone else's address
      const savedAddress = await client.query(
        `SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [addressId, buyerId],
      );

      if (savedAddress.rows.length === 0) {
        throw new ErrorHandler("Saved address not found.", 404);
      }

      resolvedShipping = savedAddress.rows[0];
    } else {
      // Manual shipping info
      if (!shippingInfo) {
        throw new ErrorHandler("Shipping information is required.", 400);
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
        throw new ErrorHandler("All shipping fields are required.", 400);
      }
      if (!/^\d{10}$/.test(phone)) {
        throw new ErrorHandler("Invalid phone number. Must be 10 digits.", 400);
      }
      if (!/^\d{6}$/.test(pincode)) {
        throw new ErrorHandler("Invalid pincode. Must be 6 digits.", 400);
      }
      if (full_name.trim().length < 2 || full_name.trim().length > 100) {
        throw new ErrorHandler(
          "Full name must be between 2 and 100 characters.",
          400,
        );
      }

      resolvedShipping = {
        full_name,
        state,
        city,
        country,
        address,
        pincode,
        phone,
      };
    }

    //  Fetch Real Prices From DB
    const productIds = cartItems.map((item) => item.productId);
    const { rows: products } = await client.query(
      `SELECT id, name, price, stock FROM products WHERE id = ANY($1::uuid[]) AND is_active = TRUE`,
      [productIds],
    );

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));

      const { rows: missingProducts } = await client.query(
        `SELECT name FROM products WHERE id = ANY($1::uuid[])`,
        [missingIds],
      );

      const names = missingProducts.map((p) => p.name);
      const message =
        names.length > 0
          ? `The following item(s) are no longer available: ${names.join(", ")}. Please remove them from your cart to continue.`
          : "One or more items in your cart are no longer available. Please remove them from your cart to continue.";

      throw new ErrorHandler(message, 400);
    }

    //  Calculate Totals
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

    if (itemsPrice <= 0) {
      throw new ErrorHandler("Invalid order amount.", 400);
    }

    //  Coupon Validation — moved before tax so tax is charged on the
    //  post-discount amount, not the original sticker price
    let discountAmount = 0;
    let appliedCouponId = null;

    if (coupon_code) {
      // Security: sanitize input
      const sanitizedCode = coupon_code.trim().toUpperCase();

      if (sanitizedCode.length > 50) {
        throw new ErrorHandler("Invalid coupon code.", 400);
      }

      const couponResult = await client.query(
        `SELECT * FROM coupons WHERE UPPER(code) = $1`,
        [sanitizedCode],
      );

      if (couponResult.rows.length === 0) {
        throw new ErrorHandler("Invalid coupon code.", 400);
      }

      const coupon = couponResult.rows[0];
      const now = new Date();

      if (!coupon.is_active) {
        throw new ErrorHandler("This coupon is no longer active.", 400);
      }

      if (now < new Date(coupon.valid_from)) {
        throw new ErrorHandler("This coupon is not active yet.", 400);
      }

      if (now > new Date(coupon.valid_until)) {
        throw new ErrorHandler("This coupon has expired.", 400);
      }

      // Check against itemsPrice (before shipping) — fairer for users
      if (itemsPrice < parseFloat(coupon.min_order_amount)) {
        throw new ErrorHandler(
          `Minimum order amount of ₹${coupon.min_order_amount} required for this coupon.`,
          400,
        );
      }

      if (
        coupon.usage_limit !== null &&
        coupon.used_count >= coupon.usage_limit
      ) {
        throw new ErrorHandler("This coupon has reached its usage limit.", 400);
      }

      // Check per-user limit — inside transaction for accuracy
      const userUsage = await client.query(
        `SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2`,
        [coupon.id, buyerId],
      );

      if (parseInt(userUsage.rows[0].count) >= coupon.per_user_limit) {
        throw new ErrorHandler(
          `You have already used this coupon ${coupon.per_user_limit} time(s).`,
          400,
        );
      }

      // Calculate discount
      if (coupon.type === "flat") {
        discountAmount = parseFloat(coupon.discount_value);
      } else {
        discountAmount = (itemsPrice * parseFloat(coupon.discount_value)) / 100;
        if (coupon.max_discount !== null) {
          discountAmount = Math.min(
            discountAmount,
            parseFloat(coupon.max_discount),
          );
        }
      }

      // Discount can never exceed the value of the items themselves
      discountAmount = Math.min(discountAmount, itemsPrice);
      discountAmount = Math.round(discountAmount * 100) / 100;
      appliedCouponId = coupon.id;
    }

    const discountedItemsPrice =
      Math.round((itemsPrice - discountAmount) * 100) / 100;

    //  Tax & Shipping — tax on the discounted price; free-shipping
    //  threshold checked against the original cart value (see note above)
    const { rows: settingsRows } = await client.query(
      `SELECT shipping_fee, free_shipping_threshold, tax_rate FROM store_settings WHERE id = 1`,
    );
    const settings = settingsRows[0] || {
      shipping_fee: 50,
      free_shipping_threshold: 500,
      tax_rate: 0,
    };

    const taxPrice =
      Math.round(
        discountedItemsPrice * (parseFloat(settings.tax_rate) / 100) * 100,
      ) / 100;
    const shippingPrice =
      discountedItemsPrice > parseFloat(settings.free_shipping_threshold)
        ? 0
        : parseFloat(settings.shipping_fee);
    const totalPrice =
      Math.round((discountedItemsPrice + taxPrice + shippingPrice) * 100) / 100;

    //  Amount Validation — on the real final amount, after discount/tax/shipping
    if (totalPrice <= 0) {
      throw new ErrorHandler("Invalid order amount.", 400);
    }
    if (totalPrice > 500000) {
      throw new ErrorHandler(
        "Order amount exceeds maximum limit of ₹5,00,000.",
        400,
      );
    }

    //  Insert Order
    const {
      rows: [order],
    } = await client.query(
      `INSERT INTO orders 
       (buyer_id, total_price, tax_price, shipping_price, order_status, coupon_code, discount_amount)
       VALUES ($1, $2, $3, $4, 'Processing', $5, $6)
       RETURNING *`,
      [
        buyerId,
        totalPrice,
        taxPrice,
        shippingPrice,
        coupon_code ? coupon_code.trim().toUpperCase() : null,
        discountAmount,
      ],
    );

    //  Insert Order Items
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

    //  Insert Shipping Info
    await client.query(
      `INSERT INTO shipping_info (order_id, full_name, state, city, country, address, pincode, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        order.id,
        resolvedShipping.full_name.trim(),
        resolvedShipping.state.trim(),
        resolvedShipping.city.trim(),
        resolvedShipping.country.trim(),
        resolvedShipping.address.trim(),
        resolvedShipping.pincode.trim(),
        resolvedShipping.phone.trim(),
      ],
    );

    //  Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: toPaise(totalPrice),
      currency: "INR",
      receipt: order.id.replace(/-/g, "").substring(0, 40),
      notes: {
        orderId: order.id,
        buyerId: buyerId,
      },
    });

    //  Insert Payment Record
    await client.query(
      `INSERT INTO payments (order_id, payment_type, payment_status, razorpay_order_id)
       VALUES ($1, 'Online', 'Pending', $2)`,
      [order.id, razorpayOrder.id],
    );

    await client.query("COMMIT");

    //  Response
    res.status(201).json({
      success: true,
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // raw paise — required by Razorpay's checkout widget
      displayAmount: `₹${(razorpayOrder.amount / 100).toLocaleString("en-IN")}`,
      currency: "INR",
      keyId: process.env.RAZORPAY_FRONTEND_KEY,
      couponApplied: appliedCouponId ? true : false,
      discountAmount: discountAmount > 0 ? `₹${discountAmount}` : null,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(
      new ErrorHandler(
        error.message || "Order creation failed.",
        error.statusCode || 500,
      ),
    );
  } finally {
    client.release();
  }
});

// 2. VERIFY PAYMENT
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
      throw new ErrorHandler("Missing payment verification fields.", 400);
    }

    if (!isValidUUID(orderId)) {
      throw new ErrorHandler("Invalid order ID.", 400);
    }

    // Security: confirm this order belongs to the requesting user before
    // touching payment/order rows tied to it.
    const orderOwnerCheck = await client.query(
      `SELECT id FROM orders WHERE id = $1 AND buyer_id = $2`,
      [orderId, req.user.id],
    );

    if (orderOwnerCheck.rows.length === 0) {
      throw new ErrorHandler("Order not found.", 404);
    }

    // Verify HMAC signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      throw new ErrorHandler(
        "Invalid payment signature. Possible tampering detected.",
        400,
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

    const { rows: paidRows } = await client.query(
      `UPDATE orders
       SET paid_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND paid_at IS NULL
       RETURNING id`,
      [orderId],
    );

    if (paidRows.length > 0) {
      await applyPaymentSuccessEffects(client, orderId, req.user.id);
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
      new ErrorHandler(
        error.message || "Payment verification failed.",
        error.statusCode || 500,
      ),
    );
  } finally {
    client.release();
  }
});

// 3. WEBHOOK — called by Razorpay servers directly
export const handleWebhook = async (req, res) => {
  const client = await database.connect();
  let transactionStarted = false;

  try {
    const receivedSig = req.headers["x-razorpay-signature"];
    const rawBody = req.body;

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
      case "payment.captured": {
        const payment = payload.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        const razorpayPayId = payment.id;
        const method = payment.method;

        await client.query("BEGIN");
        transactionStarted = true;

        const paymentUpdate = await client.query(
          `UPDATE payments
           SET razorpay_payment_id  = $1,
               payment_status       = 'Paid',
               payment_method       = $2,
               webhook_verified     = TRUE,
               raw_webhook_payload  = $3,
               updated_at           = CURRENT_TIMESTAMP
           WHERE razorpay_order_id  = $4
           RETURNING order_id`,
          [razorpayPayId, method, JSON.stringify(payload), razorpayOrderId],
        );

        if (paymentUpdate.rows.length === 0) {
          throw new Error(
            `Payment record not found for order: ${razorpayOrderId}`,
          );
        }

        const orderId = paymentUpdate.rows[0].order_id;

        const { rows: paidRows } = await client.query(
          `UPDATE orders o
           SET paid_at = CURRENT_TIMESTAMP
           FROM payments p
           WHERE p.order_id = o.id
             AND p.razorpay_order_id = $1
             AND o.paid_at IS NULL
           RETURNING o.id, o.buyer_id`,
          [razorpayOrderId],
        );

        if (paidRows.length > 0) {
          const { id: paidOrderId, buyer_id: buyerId } = paidRows[0];
          await applyPaymentSuccessEffects(client, paidOrderId, buyerId);
        }

        await client.query("COMMIT");
        transactionStarted = false;
        console.log(`✅ payment.captured → ${razorpayPayId}`);
        break;
      }

      case "payment.failed": {
        const payment = payload.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        await client.query("BEGIN");
        transactionStarted = true;

        await client.query(
          `UPDATE payments
           SET payment_status      = 'Failed',
               raw_webhook_payload = $1,
               updated_at          = CURRENT_TIMESTAMP
           WHERE razorpay_order_id  = $2`,
          [JSON.stringify(payload), razorpayOrderId],
        );

        await client.query("COMMIT");
        transactionStarted = false;
        console.log(`❌ payment.failed → order ${razorpayOrderId}`);
        break;
      }

      case "refund.processed": {
        const refund = payload.payload.refund.entity;
        const razorpayPayId = refund.payment_id;

        await client.query("BEGIN");
        transactionStarted = true;

        await client.query(
          `UPDATE payments
           SET payment_status      = 'Refunded',
               raw_webhook_payload = $1,
               updated_at          = CURRENT_TIMESTAMP
           WHERE razorpay_payment_id = $2`,
          [JSON.stringify(payload), razorpayPayId],
        );

        await client.query("COMMIT");
        transactionStarted = false;
        console.log(`💰 refund.processed → payment ${razorpayPayId}`);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled webhook event: ${event}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
        console.log("🔄 Webhook transaction rolled back");
      } catch (rollbackError) {
        console.error(
          "❌ Failed to rollback transaction:",
          rollbackError.message,
        );
      }
    }

    console.error("❌ Webhook processing error:", error.message);
    return res.status(200).json({
      received: true,
      warning: "Internal processing error.",
    });
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
      o.order_status, o.coupon_code, o.discount_amount, o.paid_at, o.created_at,      
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
      o.order_status, o.coupon_code, o.discount_amount, o.paid_at, o.created_at,       
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
export const cancelOrder = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const { orderId } = req.params;

    if (!isValidUUID(orderId)) {
      throw new ErrorHandler("Invalid order ID.", 400);
    }

    const buyerId = req.user.id;

    const { rows } = await client.query(
      `SELECT o.*, p.payment_status, p.razorpay_payment_id
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1 AND o.buyer_id = $2`,
      [orderId, buyerId],
    );

    if (rows.length === 0) {
      throw new ErrorHandler("Order not found.", 404);
    }

    const order = rows[0];

    if (order.order_status !== "Processing") {
      throw new ErrorHandler(
        `Order cannot be cancelled. Current status: ${order.order_status}`,
        400,
      );
    }

    await client.query(
      `UPDATE orders SET order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId],
    );

    if (order.payment_status === "Paid") {
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
    }

    let refundInitiated = false;
    if (
      order.payment_status === "Paid" &&
      order.razorpay_payment_id &&
      !order.razorpay_payment_id.startsWith("pay_test")
    ) {
      try {
        await razorpay.payments.refund(order.razorpay_payment_id, {
          notes: { orderId, reason: "Order cancelled by user" },
        });

        await client.query(
          `UPDATE payments
           SET payment_status = 'Refunded', updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $1`,
          [orderId],
        );

        refundInitiated = true;
      } catch (err) {
        console.error("Auto refund failed:", err.message);
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
      new ErrorHandler(
        error.message || "Order cancellation failed.",
        error.statusCode || 500,
      ),
    );
  } finally {
    client.release();
  }
});

// 7. ADMIN — GET ALL ORDERS
export const adminGetAllOrders = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { status, search } = req.query;

  const conditions = [];
  const values = [];
  let index = 1;

  if (status) {
    conditions.push(`o.order_status = $${index}`);
    values.push(status);
    index++;
  }

  if (search) {
    conditions.push(
      `(o.id::text ILIKE $${index} OR u.name ILIKE $${index} OR u.email ILIKE $${index})`,
    );
    values.push(`%${search.trim()}%`);
    index++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const totalResult = await database.query(
    `SELECT COUNT(*) FROM orders o
     LEFT JOIN users u ON u.id = o.buyer_id
     ${whereClause}`,
    values,
  );
  const totalOrders = parseInt(totalResult.rows[0].count);

  values.push(limit);
  const limitPlaceholder = `$${index}`;
  index++;
  values.push(offset);
  const offsetPlaceholder = `$${index}`;

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
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values,
  );

  res.status(200).json({
    success: true,
    totalOrders,
    currentPage: page,
    orders,
  });
});

// 7B. ADMIN — GET SINGLE ORDER (any buyer)
export const adminGetSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  if (!isValidUUID(orderId)) {
    return next(new ErrorHandler("Invalid order ID.", 400));
  }

  const { rows } = await database.query(
    `SELECT
      o.id, o.buyer_id, o.total_price, o.tax_price, o.shipping_price,
      o.order_status, o.coupon_code, o.discount_amount, o.paid_at, o.created_at,
      u.name AS buyer_name, u.email AS buyer_email,
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
     LEFT JOIN users         u  ON u.id = o.buyer_id
     LEFT JOIN payments      p  ON p.order_id  = o.id
     LEFT JOIN shipping_info s  ON s.order_id  = o.id
     LEFT JOIN order_items   oi ON oi.order_id = o.id
     WHERE o.id = $1
     GROUP BY o.id, u.id, p.id, s.id`,
    [orderId],
  );

  if (rows.length === 0) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  res.status(200).json({
    success: true,
    order: rows[0],
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

    const { rows: existingRows } = await database.query(
      `SELECT order_status FROM orders WHERE id = $1`,
      [orderId],
    );

    if (existingRows.length === 0) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const currentStatus = existingRows[0].order_status;

    if (currentStatus === "Delivered" || currentStatus === "Cancelled") {
      return next(
        new ErrorHandler(
          `Order is already ${currentStatus} and cannot be changed further.`,
          400,
        ),
      );
    }

    if (status === "Cancelled") {
      return next(
        new ErrorHandler(
          "Use the cancel-order endpoint to cancel an order — it also handles stock restock and refund.",
          400,
        ),
      );
    }

    const FORWARD_TRANSITIONS = {
      Processing: ["Shipped"],
      Shipped: ["Delivered"],
    };

    if (!FORWARD_TRANSITIONS[currentStatus]?.includes(status)) {
      return next(
        new ErrorHandler(
          `Cannot move order from "${currentStatus}" to "${status}".`,
          400,
        ),
      );
    }

    const { rows } = await database.query(
      `UPDATE orders
     SET order_status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
      [status, orderId],
    );

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
      throw new ErrorHandler("Order ID is required.", 400);
    }

    if (!isValidUUID(orderId)) {
      throw new ErrorHandler("Invalid order ID.", 400);
    }

    const { rows } = await client.query(
      `SELECT p.razorpay_payment_id, p.payment_status, o.total_price
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.order_id = $1`,
      [orderId],
    );

    if (rows.length === 0) {
      throw new ErrorHandler("Payment record not found.", 404);
    }

    const { razorpay_payment_id, payment_status, total_price } = rows[0];

    if (payment_status === "Refunded") {
      throw new ErrorHandler("This order has already been refunded.", 400);
    }

    if (payment_status !== "Paid") {
      throw new ErrorHandler("Only paid orders can be refunded.", 400);
    }

    if (!razorpay_payment_id) {
      throw new ErrorHandler(
        "No Razorpay payment ID found for this order.",
        400,
      );
    }

    const refundAmountPaise = amount ? toPaise(amount) : toPaise(total_price);

    const refund = await razorpay.payments.refund(razorpay_payment_id, {
      amount: refundAmountPaise,
      notes: { orderId, reason: "Admin initiated refund" },
    });

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
    return next(
      new ErrorHandler(
        error.message || "Refund failed.",
        error.statusCode || 500,
      ),
    );
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
      throw new ErrorHandler("Invalid order ID.", 400);
    }

    const { rows } = await client.query(
      `SELECT o.*, p.payment_status, p.razorpay_payment_id
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1`,
      [orderId],
    );

    if (rows.length === 0) {
      throw new ErrorHandler("Order not found.", 404);
    }

    const order = rows[0];

    if (order.order_status === "Delivered") {
      throw new ErrorHandler("Delivered orders cannot be cancelled.", 400);
    }

    if (order.order_status === "Cancelled") {
      throw new ErrorHandler("Order is already cancelled.", 400);
    }

    await client.query(
      `UPDATE orders SET order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId],
    );

    if (order.payment_status === "Paid") {
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
    }

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
    return next(
      new ErrorHandler(
        error.message || "Cancellation failed.",
        error.statusCode || 500,
      ),
    );
  } finally {
    client.release();
  }
});


// GET ORDER INVOICE (PDF)
export const getOrderInvoice = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  if (!isValidUUID(orderId)) {
    return next(new ErrorHandler("Invalid order ID.", 400));
  }

  try {
    const { rows } = await database.query(
      `SELECT
        o.id, o.total_price, o.tax_price, o.shipping_price,
        o.order_status, o.coupon_code, o.discount_amount, o.paid_at, o.created_at,
        u.name AS buyer_name, u.email AS buyer_email,
        p.payment_status,
        s.full_name, s.address, s.city, s.state, s.pincode, s.phone,
        json_agg(
          json_build_object(
            'title', oi.title,
            'quantity', oi.quantity,
            'price', oi.price,
            'image', oi.image
          )
        ) AS items
       FROM orders o
       LEFT JOIN users         u  ON u.id = o.buyer_id
       LEFT JOIN payments      p  ON p.order_id  = o.id
       LEFT JOIN shipping_info s  ON s.order_id  = o.id
       LEFT JOIN order_items   oi ON oi.order_id = o.id
       WHERE o.id = $1 AND o.buyer_id = $2
       GROUP BY o.id, u.id, p.id, s.id`,
      [orderId, req.user.id],
    );


    if (rows.length === 0) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const order = rows[0];

    if (order.payment_status !== "Paid") {
      return next(new ErrorHandler("Invoice is only available for paid orders.", 400));
    }

    const pdfBuffer = await generateInvoiceBuffer(order);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${order.id.slice(0, 8)}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Error in getOrderInvoice:", error.message);
    console.error("Stack:", error.stack);
    return next(new ErrorHandler(error.message || "Failed to generate invoice", 500));
  }
});