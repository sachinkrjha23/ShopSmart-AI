import Razorpay from "razorpay";
import database from "../database/db.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { createPersonalNotification } from "./notificationControllers.js";
import { sendEmail } from "../utils/sendEmail.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

const syncOrderPaymentStatusIfFullyRefunded = async (orderId) => {
  const { rows } = await database.query(
    `SELECT
        COALESCE(SUM(oi.price * oi.quantity), 0) AS items_total,
        COALESCE(SUM(rr.refund_amount) FILTER (WHERE rr.status = 'Approved'), 0) AS refunded_total
       FROM order_items oi
       LEFT JOIN return_requests rr ON rr.order_item_id = oi.id
      WHERE oi.order_id = $1`,
    [orderId],
  );

  const { items_total, refunded_total } = rows[0];

  if (Number(items_total) > 0 && Number(refunded_total) >= Number(items_total)) {
    await database.query(
      `UPDATE payments SET payment_status = 'Refunded', updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $1 AND payment_status != 'Refunded'`,
      [orderId],
    );
  }
};

const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_FRONTEND_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const toPaise = (inr) => Math.round(Number(inr) * 100);
const RETURN_WINDOW_DAYS = 7;

// 1. BUYER — CREATE RETURN REQUEST
export const createReturnRequest = catchAsyncErrors(async (req, res, next) => {
  const { orderItemId, reason } = req.body;

  if (!orderItemId || !isValidUUID(orderItemId)) {
    return next(new ErrorHandler("Invalid order item ID.", 400));
  }
  if (!reason || !reason.trim()) {
    return next(new ErrorHandler("A return reason is required.", 400));
  }

  const itemResult = await database.query(
    `SELECT oi.id, oi.fulfillment_status, oi.delivered_at, oi.product_id, oi.quantity, oi.price,
            o.buyer_id, p.seller_id, p.name AS product_name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE oi.id = $1`,
    [orderItemId],
  );

  if (itemResult.rows.length === 0 || itemResult.rows[0].buyer_id !== req.user.id) {
    return next(new ErrorHandler("Order item not found.", 404));
  }

  const item = itemResult.rows[0];

  if (item.fulfillment_status !== "Delivered") {
    return next(new ErrorHandler("Only delivered items can be returned.", 400));
  }

  if (!item.delivered_at) {
    return next(new ErrorHandler("Delivery date unavailable for this item.", 400));
  }

  const daysSinceDelivery = (Date.now() - new Date(item.delivered_at).getTime()) / 86400000;
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    return next(new ErrorHandler(`The ${RETURN_WINDOW_DAYS}-day return window for this item has expired.`, 400));
  }

  const pendingCheck = await database.query(
    `SELECT id FROM return_requests WHERE order_item_id = $1 AND status = 'Pending'`,
    [orderItemId],
  );
  if (pendingCheck.rows.length > 0) {
    return next(new ErrorHandler("A return request is already pending for this item.", 400));
  }

  const result = await database.query(
    `INSERT INTO return_requests (order_item_id, buyer_id, reason)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [orderItemId, req.user.id, reason.trim()],
  );

  if (item.seller_id) {
    const sellerResult = await database.query(
      `SELECT user_id FROM sellers WHERE id = $1`,
      [item.seller_id],
    );
    if (sellerResult.rows.length > 0) {
      await createPersonalNotification({
        userId: sellerResult.rows[0].user_id,
        type: "return_requested",
        title: "New return request",
        message: `A return has been requested for "${item.product_name}".`,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: "Return request submitted.",
    returnRequest: result.rows[0],
  });
});

// 2. SELLER — GET RETURN REQUESTS
export const getSellerReturnRequests = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const { status } = req.query;

  const params = [sellerId];
  let statusFilter = "";
  if (status) {
    params.push(status);
    statusFilter = `AND rr.status = $${params.length}`;
  }

  const { rows } = await database.query(
    `SELECT rr.*, oi.order_id, oi.product_id, oi.quantity, oi.price,
            p.name AS product_name, u.name AS buyer_name, u.email AS buyer_email
     FROM return_requests rr
     JOIN order_items oi ON oi.id = rr.order_item_id
     JOIN products p ON p.id = oi.product_id
     JOIN users u ON u.id = rr.buyer_id
     WHERE p.seller_id = $1 ${statusFilter}
     ORDER BY rr.requested_at DESC`,
    params,
  );

  res.status(200).json({ success: true, returnRequests: rows });
});

// 3. SELLER — RESOLVE RETURN REQUEST
export const resolveReturnRequestBySeller = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const sellerId = req.seller.id;
    const { returnId } = req.params;
    const { action, admin_notes } = req.body;

    if (!isValidUUID(returnId)) {
      throw new ErrorHandler("Invalid return request ID.", 400);
    }
    if (!["Approve", "Reject"].includes(action)) {
      throw new ErrorHandler("Action must be 'Approve' or 'Reject'.", 400);
    }
    if (action === "Reject" && (!admin_notes || !admin_notes.trim())) {
      throw new ErrorHandler("A reason is required when rejecting a return.", 400);
    }

    const rrResult = await client.query(
      `SELECT rr.id, rr.status, oi.id AS order_item_id, oi.product_id, oi.quantity, oi.price, oi.order_id,
              o.buyer_id, u.name AS buyer_name, u.email AS buyer_email,
              pay.payment_status, pay.razorpay_payment_id, p.name AS product_name
       FROM return_requests rr
       JOIN order_items oi ON oi.id = rr.order_item_id
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       JOIN users u ON u.id = o.buyer_id
       LEFT JOIN payments pay ON pay.order_id = o.id
       WHERE rr.id = $1 AND p.seller_id = $2`,
      [returnId, sellerId],
    );

    if (rrResult.rows.length === 0) {
      throw new ErrorHandler("Return request not found.", 404);
    }

    const rr = rrResult.rows[0];

    if (rr.status !== "Pending") {
      throw new ErrorHandler(`This return request has already been ${rr.status.toLowerCase()}.`, 400);
    }

    let refundAmount = null;
    let refundInitiated = false;

    if (action === "Approve") {
      await client.query(`UPDATE products SET stock = stock + $1 WHERE id = $2`, [rr.quantity, rr.product_id]);

      refundAmount = Number(rr.price) * rr.quantity;

      if (rr.payment_status === "Paid" && rr.razorpay_payment_id && !rr.razorpay_payment_id.startsWith("pay_test")) {
        try {
          await razorpay.payments.refund(rr.razorpay_payment_id, {
            amount: toPaise(refundAmount),
            notes: { orderId: rr.order_id, returnId, initiatedBy: "seller" },
          });
          refundInitiated = true;
        } catch (err) {
          console.error("Return-approval refund failed:", err.message);
        }
      }
    }

    await client.query(
      `UPDATE return_requests
       SET status = $1, admin_notes = $2, refund_amount = $3, resolved_by = $4, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        action === "Approve" ? "Approved" : "Rejected",
        admin_notes ? admin_notes.trim() : null,
        action === "Approve" && refundInitiated ? refundAmount : null,
        req.user.id,
        returnId,
      ],
    );

    await client.query("COMMIT");

    if (refundInitiated) {
      await syncOrderPaymentStatusIfFullyRefunded(rr.order_id);
    }

    await createPersonalNotification({
      userId: rr.buyer_id,
      type: action === "Approve" ? "return_approved" : "return_rejected",
      title: action === "Approve" ? "Return approved" : "Return request update",
      message: action === "Approve"
        ? `Your return for "${rr.product_name}" was approved.${refundInitiated ? ` A refund of ₹${refundAmount.toLocaleString("en-IN")} has been issued.` : ""}`
        : `Your return for "${rr.product_name}" was not approved. Reason: ${admin_notes.trim()}`,
      linkEntityType: "order",
      linkEntityId: rr.order_id,
    });

    try {
      await sendEmail({
        email: rr.buyer_email,
        subject: action === "Approve" ? "ShopSmart-AI - Return Approved" : "ShopSmart-AI - Return Request Update",
        message: action === "Approve"
          ? `<p>Hi ${rr.buyer_name},</p><p>Your return for "${rr.product_name}" was approved.${refundInitiated ? ` A refund of ₹${refundAmount.toLocaleString("en-IN")} has been issued.` : ""}</p>`
          : `<p>Hi ${rr.buyer_name},</p><p>Your return for "${rr.product_name}" was not approved.</p><p><strong>Reason:</strong> ${admin_notes.trim()}</p>`,
      });
    } catch (error) {
      console.error("Failed to send return-resolution email:", error.message);
    }

    res.status(200).json({
      success: true,
      message: `Return request ${action === "Approve" ? "approved" : "rejected"}.`,
      refundInitiated,
      refundAmount: action === "Approve" && refundInitiated ? refundAmount : null,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(new ErrorHandler(error.message || "Failed to resolve return request.", error.statusCode || 500));
  } finally {
    client.release();
  }
});

// 4. ADMIN — GET RETURN REQUESTS
export const getAdminReturnRequests = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.query;

  const params = [];
  let statusFilter = "";
  if (status) {
    params.push(status);
    statusFilter = `AND rr.status = $${params.length}`;
  }

  const { rows } = await database.query(
    `SELECT rr.*, oi.order_id, oi.product_id, oi.quantity, oi.price,
            p.name AS product_name, u.name AS buyer_name, u.email AS buyer_email
     FROM return_requests rr
     JOIN order_items oi ON oi.id = rr.order_item_id
     JOIN products p ON p.id = oi.product_id
     JOIN users u ON u.id = rr.buyer_id
     WHERE p.seller_id IS NULL ${statusFilter}
     ORDER BY rr.requested_at DESC`,
    params,
  );

  res.status(200).json({ success: true, returnRequests: rows });
});

// 5. ADMIN — RESOLVE RETURN REQUEST
export const resolveReturnRequestByAdmin = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const { returnId } = req.params;
    const { action, admin_notes } = req.body;

    if (!isValidUUID(returnId)) {
      throw new ErrorHandler("Invalid return request ID.", 400);
    }
    if (!["Approve", "Reject"].includes(action)) {
      throw new ErrorHandler("Action must be 'Approve' or 'Reject'.", 400);
    }
    if (action === "Reject" && (!admin_notes || !admin_notes.trim())) {
      throw new ErrorHandler("A reason is required when rejecting a return.", 400);
    }

    const rrResult = await client.query(
      `SELECT rr.id, rr.status, oi.id AS order_item_id, oi.product_id, oi.quantity, oi.price, oi.order_id,
              o.buyer_id, u.name AS buyer_name, u.email AS buyer_email,
              pay.payment_status, pay.razorpay_payment_id, p.name AS product_name
       FROM return_requests rr
       JOIN order_items oi ON oi.id = rr.order_item_id
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       JOIN users u ON u.id = o.buyer_id
       LEFT JOIN payments pay ON pay.order_id = o.id
       WHERE rr.id = $1 AND p.seller_id IS NULL`,
      [returnId],
    );

    if (rrResult.rows.length === 0) {
      throw new ErrorHandler("Return request not found.", 404);
    }

    const rr = rrResult.rows[0];

    if (rr.status !== "Pending") {
      throw new ErrorHandler(`This return request has already been ${rr.status.toLowerCase()}.`, 400);
    }

    let refundAmount = null;
    let refundInitiated = false;

    if (action === "Approve") {
      await client.query(`UPDATE products SET stock = stock + $1 WHERE id = $2`, [rr.quantity, rr.product_id]);

      refundAmount = Number(rr.price) * rr.quantity;

      if (rr.payment_status === "Paid" && rr.razorpay_payment_id && !rr.razorpay_payment_id.startsWith("pay_test")) {
        try {
          await razorpay.payments.refund(rr.razorpay_payment_id, {
            amount: toPaise(refundAmount),
            notes: { orderId: rr.order_id, returnId, initiatedBy: "admin" },
          });
          refundInitiated = true;
        } catch (err) {
          console.error("Return-approval refund failed:", err.message);
        }
      }
    }

    await client.query(
      `UPDATE return_requests
       SET status = $1, admin_notes = $2, refund_amount = $3, resolved_by = $4, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        action === "Approve" ? "Approved" : "Rejected",
        admin_notes ? admin_notes.trim() : null,
        action === "Approve" && refundInitiated ? refundAmount : null,
        req.user.id,
        returnId,
      ],
    );

    await client.query("COMMIT");

    if (refundInitiated) {
      await syncOrderPaymentStatusIfFullyRefunded(rr.order_id);
    }

    await logAdminActivity({
      adminId: req.user.id,
      actionType: action === "Approve" ? "return_approved" : "return_rejected",
      entityType: "return",
      entityId: returnId,
      details: {
        productName: rr.product_name,
        adminNotes: admin_notes ? admin_notes.trim() : null,
        refundInitiated,
      },
    });

    await createPersonalNotification({
      userId: rr.buyer_id,
      type: action === "Approve" ? "return_approved" : "return_rejected",
      title: action === "Approve" ? "Return approved" : "Return request update",
      message: action === "Approve"
        ? `Your return for "${rr.product_name}" was approved.${refundInitiated ? ` A refund of ₹${refundAmount.toLocaleString("en-IN")} has been issued.` : ""}`
        : `Your return for "${rr.product_name}" was not approved. Reason: ${admin_notes.trim()}`,
      linkEntityType: "order",
      linkEntityId: rr.order_id,
    });

    try {
      await sendEmail({
        email: rr.buyer_email,
        subject: action === "Approve" ? "ShopSmart-AI - Return Approved" : "ShopSmart-AI - Return Request Update",
        message: action === "Approve"
          ? `<p>Hi ${rr.buyer_name},</p><p>Your return for "${rr.product_name}" was approved.${refundInitiated ? ` A refund of ₹${refundAmount.toLocaleString("en-IN")} has been issued.` : ""}</p>`
          : `<p>Hi ${rr.buyer_name},</p><p>Your return for "${rr.product_name}" was not approved.</p><p><strong>Reason:</strong> ${admin_notes.trim()}</p>`,
      });
    } catch (error) {
      console.error("Failed to send return-resolution email:", error.message);
    }

    res.status(200).json({
      success: true,
      message: `Return request ${action === "Approve" ? "approved" : "rejected"}.`,
      refundInitiated,
      refundAmount: action === "Approve" && refundInitiated ? refundAmount : null,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(new ErrorHandler(error.message || "Failed to resolve return request.", error.statusCode || 500));
  } finally {
    client.release();
  }
});

export const retryReturnRefundByAdmin = catchAsyncErrors(async (req, res, next) => {
  const { returnId } = req.params;

  if (!isValidUUID(returnId)) {
    return next(new ErrorHandler("Invalid return request ID.", 400));
  }

  const { rows } = await database.query(
    `SELECT rr.id, rr.status, rr.refund_amount, oi.quantity, oi.price, oi.order_id, o.buyer_id,
            p.name AS product_name, pay.payment_status, pay.razorpay_payment_id
       FROM return_requests rr
       JOIN order_items oi ON oi.id = rr.order_item_id
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN payments pay ON pay.order_id = o.id
      WHERE rr.id = $1 AND p.seller_id IS NULL`,
    [returnId],
  );

  if (rows.length === 0) {
    return next(new ErrorHandler("Return request not found.", 404));
  }

  const rr = rows[0];

  if (rr.status !== "Approved") {
    return next(new ErrorHandler("Only approved returns can be refunded.", 400));
  }
  if (rr.refund_amount) {
    return next(new ErrorHandler("This return has already been refunded.", 400));
  }
  if (rr.payment_status !== "Paid" || !rr.razorpay_payment_id || rr.razorpay_payment_id.startsWith("pay_test")) {
    return next(new ErrorHandler("There's nothing to refund for this order (unpaid or test payment).", 400));
  }

  const refundAmount = Number(rr.price) * rr.quantity;

  let payment;
  try {
    payment = await razorpay.payments.fetch(rr.razorpay_payment_id);
  } catch (error) {
    return next(new ErrorHandler("Could not verify payment status with Razorpay.", 500));
  }

  const alreadyRefundedAmount = Number(payment.amount_refunded || 0) / 100;

  if (alreadyRefundedAmount > 0) {
    await database.query(`UPDATE return_requests SET refund_amount = $1 WHERE id = $2`, [alreadyRefundedAmount, returnId]);

    await syncOrderPaymentStatusIfFullyRefunded(rr.order_id);

    await createPersonalNotification({
      userId: rr.buyer_id,
      type: "return_refund_issued",
      title: "Refund issued",
      message: `A refund of ₹${alreadyRefundedAmount.toLocaleString("en-IN")} has been issued for your return of "${rr.product_name}".`,
      linkEntityType: "order",
      linkEntityId: rr.order_id,
    });

    return res.status(200).json({
      success: true,
      message: "This payment was already refunded — records have been updated to match.",
      refundAmount: alreadyRefundedAmount,
    });
  }

  try {
    await razorpay.payments.refund(rr.razorpay_payment_id, {
      amount: toPaise(refundAmount),
      notes: { orderId: rr.order_id, returnId, initiatedBy: "admin-retry" },
    });
  } catch (error) {
    console.error("Return refund retry failed:", error.error?.description || error.message);
    return next(new ErrorHandler(error.error?.description || error.message || "Refund retry failed.", error.statusCode || 500));
  }

  await database.query(`UPDATE return_requests SET refund_amount = $1 WHERE id = $2`, [refundAmount, returnId]);

  await syncOrderPaymentStatusIfFullyRefunded(rr.order_id);

  await logAdminActivity({
    adminId: req.user.id,
    actionType: "return_refund_retried",
    entityType: "return",
    entityId: returnId,
    details: { productName: rr.product_name, amount: refundAmount },
  });

  await createPersonalNotification({
    userId: rr.buyer_id,
    type: "return_refund_issued",
    title: "Refund issued",
    message: `A refund of ₹${refundAmount.toLocaleString("en-IN")} has been issued for your return of "${rr.product_name}".`,
    linkEntityType: "order",
    linkEntityId: rr.order_id,
  });

  res.status(200).json({ success: true, message: "Refund issued successfully.", refundAmount });
});

export const retryReturnRefundBySeller = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const { returnId } = req.params;

  if (!isValidUUID(returnId)) {
    return next(new ErrorHandler("Invalid return request ID.", 400));
  }

  const { rows } = await database.query(
    `SELECT rr.id, rr.status, rr.refund_amount, oi.quantity, oi.price, oi.order_id, o.buyer_id,
            p.name AS product_name, pay.payment_status, pay.razorpay_payment_id
       FROM return_requests rr
       JOIN order_items oi ON oi.id = rr.order_item_id
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN payments pay ON pay.order_id = o.id
      WHERE rr.id = $1 AND p.seller_id = $2`,
    [returnId, sellerId],
  );

  if (rows.length === 0) {
    return next(new ErrorHandler("Return request not found.", 404));
  }

  const rr = rows[0];

  if (rr.status !== "Approved") {
    return next(new ErrorHandler("Only approved returns can be refunded.", 400));
  }
  if (rr.refund_amount) {
    return next(new ErrorHandler("This return has already been refunded.", 400));
  }
  if (rr.payment_status !== "Paid" || !rr.razorpay_payment_id || rr.razorpay_payment_id.startsWith("pay_test")) {
    return next(new ErrorHandler("There's nothing to refund for this order (unpaid or test payment).", 400));
  }

  const refundAmount = Number(rr.price) * rr.quantity;

  let payment;
  try {
    payment = await razorpay.payments.fetch(rr.razorpay_payment_id);
  } catch (error) {
    return next(new ErrorHandler("Could not verify payment status with Razorpay.", 500));
  }

  const alreadyRefundedAmount = Number(payment.amount_refunded || 0) / 100;

  if (alreadyRefundedAmount > 0) {
    await database.query(`UPDATE return_requests SET refund_amount = $1 WHERE id = $2`, [alreadyRefundedAmount, returnId]);

    await syncOrderPaymentStatusIfFullyRefunded(rr.order_id);

    await createPersonalNotification({
      userId: rr.buyer_id,
      type: "return_refund_issued",
      title: "Refund issued",
      message: `A refund of ₹${alreadyRefundedAmount.toLocaleString("en-IN")} has been issued for your return of "${rr.product_name}".`,
      linkEntityType: "order",
      linkEntityId: rr.order_id,
    });

    return res.status(200).json({
      success: true,
      message: "This payment was already refunded — records have been updated to match.",
      refundAmount: alreadyRefundedAmount,
    });
  }

  try {
    await razorpay.payments.refund(rr.razorpay_payment_id, {
      amount: toPaise(refundAmount),
      notes: { orderId: rr.order_id, returnId, initiatedBy: "seller-retry" },
    });
  } catch (error) {
    console.error("Return refund retry failed:", error.error?.description || error.message);
    return next(new ErrorHandler(error.error?.description || error.message || "Refund retry failed.", error.statusCode || 500));
  }

  await database.query(`UPDATE return_requests SET refund_amount = $1 WHERE id = $2`, [refundAmount, returnId]);

  await syncOrderPaymentStatusIfFullyRefunded(rr.order_id);

  await createPersonalNotification({
    userId: rr.buyer_id,
    type: "return_refund_issued",
    title: "Refund issued",
    message: `A refund of ₹${refundAmount.toLocaleString("en-IN")} has been issued for your return of "${rr.product_name}".`,
    linkEntityType: "order",
    linkEntityId: rr.order_id,
  });

  res.status(200).json({ success: true, message: "Refund issued successfully.", refundAmount });
});