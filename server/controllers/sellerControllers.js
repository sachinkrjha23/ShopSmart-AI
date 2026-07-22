import database from "../database/db.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { sendEmail } from "../utils/sendEmail.js";
import { v2 as cloudinary } from "cloudinary";
import Razorpay from "razorpay";
import { createPersonalNotification } from "./notificationControllers.js";

const REAPPLY_COOLDOWN_DAYS = 10;
const SUSPENSION_COOLDOWN_DAYS = 30;
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_FRONTEND_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});
const toPaise = (inr) => Math.round(Number(inr) * 100);


// SELLER — APPLY / REAPPLY
export const applyToBecomeSeller = catchAsyncErrors(async (req, res, next) => {
  const { store_name, gstin, description, resolution_notes } = req.body;

  if (!store_name || !store_name.trim()) {
    return next(new ErrorHandler("Store name is required.", 400));
  }

  if (!description || !description.trim()) {
    return next(new ErrorHandler("A description of your store is required.", 400));
  }

  if (gstin && gstin.trim() && !GSTIN_REGEX.test(gstin.trim().toUpperCase())) {
    return next(
      new ErrorHandler(
        "Please provide a valid 15-character GSTIN, or leave it blank.",
        400,
      ),
    );
  }

  const existing = await database.query(
    `SELECT * FROM sellers WHERE user_id = $1`,
    [req.user.id],
  );

  if (existing.rows.length === 0) {
    const result = await database.query(
      `INSERT INTO sellers (user_id, store_name, gstin, description, status)
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING *`,
      [req.user.id, store_name.trim(), gstin || null, description || null],
    );

    return res.status(201).json({
      success: true,
      message: "Seller application submitted. We'll review it shortly.",
      seller: result.rows[0],
    });
  }

  const seller = existing.rows[0];

  if (seller.status === "Pending") {
    return next(
      new ErrorHandler("You already have a pending seller application.", 400),
    );
  }

  if (seller.status === "Approved") {
    return next(new ErrorHandler("You are already an approved seller.", 400));
  }

  if (seller.status === "Rejected") {
    const daysSinceDecision =
      (Date.now() - new Date(seller.updated_at).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceDecision < REAPPLY_COOLDOWN_DAYS) {
      const daysLeft = Math.ceil(REAPPLY_COOLDOWN_DAYS - daysSinceDecision);
      return next(new ErrorHandler(`You can reapply in ${daysLeft} day(s).`, 400));
    }

    const result = await database.query(
      `UPDATE sellers 
       SET store_name = $1, gstin = $2, description = $3, 
           status = 'Pending', rejection_reason = NULL, 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING *`,
      [store_name.trim(), gstin || null, description || null, req.user.id],
    );

    return res.status(200).json({
      success: true,
      message: "Seller application resubmitted. We'll review it shortly.",
      seller: result.rows[0],
    });
  }

  if (seller.status === "Suspended") {
    const daysSinceSuspension = seller.suspended_at
      ? (Date.now() - new Date(seller.suspended_at).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSinceSuspension < SUSPENSION_COOLDOWN_DAYS) {
      const daysLeft = Math.ceil(SUSPENSION_COOLDOWN_DAYS - daysSinceSuspension);
      return next(new ErrorHandler(`You can reapply in ${daysLeft} day(s).`, 400));
    }

    if (!resolution_notes || !resolution_notes.trim()) {
      return next(
        new ErrorHandler(
          "Please describe the changes you've made to resolve the issue that led to your suspension.",
          400,
        ),
      );
    }

    const result = await database.query(
      `UPDATE sellers 
       SET store_name = $1, gstin = $2, description = $3, 
           status = 'Pending', resolution_notes = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5
       RETURNING *`,
      [store_name.trim(), gstin || null, description || null, resolution_notes.trim(), req.user.id],
    );

    return res.status(200).json({
      success: true,
      message: "Seller application resubmitted for review.",
      seller: result.rows[0],
    });
  }

  return next(new ErrorHandler("Unable to process application.", 400));
});

export const getPublicSellerProfile = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    return next(new ErrorHandler("Invalid seller ID.", 400));
  }

  const result = await database.query(
    `SELECT s.id, s.store_name, s.description, s.created_at,
            COALESCE(AVG(sr.rating), 0) AS avg_rating,
            COUNT(sr.id) AS rating_count
     FROM sellers s
     LEFT JOIN seller_ratings sr ON sr.seller_id = s.id
     WHERE s.id = $1 AND s.status = 'Approved'
     GROUP BY s.id`,
    [id],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Seller not found.", 404));
  }

  const seller = result.rows[0];

  res.status(200).json({
    success: true,
    seller: {
      ...seller,
      avg_rating: parseFloat(seller.avg_rating).toFixed(1),
      rating_count: parseInt(seller.rating_count),
    },
  });
});

// SELLER — GET OWN APPLICATION/STATUS
export const getMySellerProfile = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(`SELECT * FROM sellers WHERE user_id = $1`, [
    req.user.id,
  ]);

  res.status(200).json({
    success: true,
    seller: result.rows[0] || null,
  });
});

// ADMIN — LIST ALL SELLER APPLICATIONS (paginated, filter by status, search)
export const adminGetAllSellers = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { status, search } = req.query;

  const conditions = [];
  const values = [];
  let index = 1;

  if (status) {
    conditions.push(`s.status = $${index}`);
    values.push(status);
    index++;
  }

  if (search) {
    conditions.push(
      `(s.store_name ILIKE $${index} OR u.name ILIKE $${index} OR u.email ILIKE $${index})`,
    );
    values.push(`%${search.trim()}%`);
    index++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalResult = await database.query(
    `SELECT COUNT(*) FROM sellers s JOIN users u ON u.id = s.user_id ${whereClause}`,
    values,
  );
  const totalSellers = parseInt(totalResult.rows[0].count);

  values.push(limit);
  const limitPlaceholder = `$${index}`;
  index++;
  values.push(offset);
  const offsetPlaceholder = `$${index}`;

  const result = await database.query(
    `SELECT s.*, u.name AS applicant_name, u.email AS applicant_email
     FROM sellers s
     JOIN users u ON u.id = s.user_id
     ${whereClause}
     ORDER BY s.created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values,
  );

  res.status(200).json({
    success: true,
    sellers: result.rows,
    totalSellers,
    currentPage: page,
  });
});

// ADMIN — GET SINGLE SELLER APPLICATION
export const adminGetSingleSeller = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    return next(new ErrorHandler("Invalid seller ID.", 400));
  }

  const result = await database.query(
    `SELECT s.*, u.name AS applicant_name, u.email AS applicant_email
     FROM sellers s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Seller not found.", 404));
  }

  res.status(200).json({
    success: true,
    seller: result.rows[0],
  });
});

// ADMIN — APPROVE
export const adminApproveSeller = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const result = await database.query(
    `UPDATE sellers 
     SET status = 'Approved', rejection_reason = NULL, suspended_at = NULL, 
         resolution_notes = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Seller application not found.", 404));
  }

  const seller = result.rows[0];

  // Only reactivate products WE turned off during suspension — leave the seller's own
  // manually-deactivated products alone
  await database.query(
    `UPDATE products SET is_active = TRUE, auto_deactivated = FALSE
     WHERE seller_id = $1 AND auto_deactivated = TRUE`,
    [seller.id],
  );

  const userResult = await database.query(`SELECT email, name FROM users WHERE id = $1`, [
    seller.user_id,
  ]);
  const user = userResult.rows[0];

  if (user) {
    try {
      await sendEmail({
        email: user.email,
        subject: "ShopSmart-AI - Seller Application Approved",
        message: `<p>Hi ${user.name},</p><p>Congratulations! Your seller application for "${seller.store_name}" has been approved. You can now start listing products.</p>`,
      });
    } catch (error) {
      console.error("Failed to send seller approval email:", error.message);
    }
  }

  await createPersonalNotification({
    userId: seller.user_id,
    type: "seller_approved",
    title: "Seller application approved",
    message: `Your seller application for "${seller.store_name}" has been approved. You can now start listing products.`,
  });

  res.status(200).json({
    success: true,
    message: "Seller approved successfully.",
    seller,
  });
});

// ADMIN — REJECT
export const adminRejectSeller = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return next(new ErrorHandler("A rejection reason is required.", 400));
  }

  const result = await database.query(
    `UPDATE sellers 
     SET status = 'Rejected', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [reason.trim(), id],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Seller application not found.", 404));
  }

  const seller = result.rows[0];

  // Covers the case where an already-Approved seller with live products gets rejected later
  await database.query(
    `UPDATE products SET is_active = FALSE, auto_deactivated = TRUE
     WHERE seller_id = $1 AND is_active = TRUE`,
    [seller.id],
  );

  const userResult = await database.query(`SELECT email, name FROM users WHERE id = $1`, [
    seller.user_id,
  ]);
  const user = userResult.rows[0];

  if (user) {
    try {
      await sendEmail({
        email: user.email,
        subject: "ShopSmart-AI - Seller Application Update",
        message: `<p>Hi ${user.name},</p><p>Your seller application for "${seller.store_name}" was not approved.</p><p><strong>Reason:</strong> ${reason.trim()}</p><p>You may reapply after ${REAPPLY_COOLDOWN_DAYS} days.</p>`,
      });
    } catch (error) {
      console.error("Failed to send seller rejection email:", error.message);
    }
  }

  await createPersonalNotification({
    userId: seller.user_id,
    type: "seller_rejected",
    title: "Seller application update",
    message: `Your seller application for "${seller.store_name}" was not approved. Reason: ${reason.trim()}`,
  });

  res.status(200).json({
    success: true,
    message: "Seller application rejected.",
    seller,
  });
});

// ADMIN — SUSPEND
export const adminSuspendSeller = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return next(new ErrorHandler("A suspension reason is required.", 400));
  }

  const result = await database.query(
    `UPDATE sellers 
     SET status = 'Suspended', rejection_reason = $1, suspended_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [reason.trim(), id],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Seller application not found.", 404));
  }

  const seller = result.rows[0];

  // Deactivate only currently-active products, and remember that WE deactivated them
  await database.query(
    `UPDATE products SET is_active = FALSE, auto_deactivated = TRUE
     WHERE seller_id = $1 AND is_active = TRUE`,
    [seller.id],
  );

  const userResult = await database.query(`SELECT email, name FROM users WHERE id = $1`, [
    seller.user_id,
  ]);
  const user = userResult.rows[0];

  if (user) {
    try {
      await sendEmail({
        email: user.email,
        subject: "ShopSmart-AI - Your Seller Account Has Been Suspended",
        message: `<p>Hi ${user.name},</p><p>Your seller account "${seller.store_name}" has been suspended.</p><p><strong>Reason:</strong> ${reason.trim()}</p><p>You may reapply after ${SUSPENSION_COOLDOWN_DAYS} days, and you will need to describe the changes you've made to resolve this issue.</p>`,
      });
    } catch (error) {
      console.error("Failed to send seller suspension email:", error.message);
    }
  }

  await createPersonalNotification({
    userId: seller.user_id,
    type: "seller_suspended",
    title: "Seller account suspended",
    message: `Your seller account "${seller.store_name}" has been suspended. Reason: ${reason.trim()}`,
  });

  res.status(200).json({
    success: true,
    message: "Seller suspended successfully.",
    seller,
  });
});

// SELLER — DASHBOARD STATS (own products/orders only)
export const getSellerDashboardStats = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;

  const settingsResult = await database.query(
    `SELECT low_stock_threshold FROM store_settings WHERE id = 1`,
  );
  const lowStockThreshold = settingsResult.rows[0]?.low_stock_threshold ?? 5;

  const [
    totalRevenueResult,
    fulfillmentStatusResult,
    todayRevenueResult,
    yesterdayRevenueResult,
    monthlySalesResult,
    currentMonthSalesResult,
    lastMonthRevenueResult,
    lowStockResult,
    totalCustomersResult,
    newCustomersResult,
    topSellingResult,
    totalOrdersResult,
    totalProductsResult,
  ] = await Promise.all([
    // Total Revenue — item-level cancellation check, not whole-order status
    database.query(
      `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) AS total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL AND oi.fulfillment_status != 'Cancelled'`,
      [sellerId],
    ),

    // Item Fulfillment Status Counts (Pending / Shipped / Delivered / Cancelled)
    database.query(
      `SELECT oi.fulfillment_status, COUNT(*)
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL
       GROUP BY oi.fulfillment_status`,
      [sellerId],
    ),

    // Today's Revenue
    database.query(
      `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) AS total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.created_at::date = CURRENT_DATE
         AND o.paid_at IS NOT NULL AND oi.fulfillment_status != 'Cancelled'`,
      [sellerId],
    ),

    // Yesterday's Revenue
    database.query(
      `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) AS total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.created_at::date = CURRENT_DATE - INTERVAL '1 day'
         AND o.paid_at IS NOT NULL AND oi.fulfillment_status != 'Cancelled'`,
      [sellerId],
    ),

    // Monthly Sales (chart)
    database.query(
      `SELECT TO_CHAR(o.created_at, 'Mon YYYY') AS month,
              DATE_TRUNC('month', o.created_at) AS date,
              COALESCE(SUM(oi.price * oi.quantity), 0) AS totalsales
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL AND oi.fulfillment_status != 'Cancelled'
       GROUP BY month, date
       ORDER BY date ASC`,
      [sellerId],
    ),

    // Current Month Sales
    database.query(
      `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) AS total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL AND oi.fulfillment_status != 'Cancelled'
         AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)
         AND o.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
      [sellerId],
    ),

    // Last Month Revenue
    database.query(
      `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) AS total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL AND oi.fulfillment_status != 'Cancelled'
         AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
         AND o.created_at < DATE_TRUNC('month', CURRENT_DATE)`,
      [sellerId],
    ),

    // Low Stock — this seller's own products only
    database.query(
      `SELECT name, stock FROM products WHERE seller_id = $1 AND stock <= $2`,
      [sellerId, lowStockThreshold],
    ),

    // Total distinct customers who've bought this seller's items
    database.query(
      `SELECT COUNT(DISTINCT o.buyer_id)
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL`,
      [sellerId],
    ),

    // New customers this month
    database.query(
      `SELECT COUNT(DISTINCT o.buyer_id)
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL
         AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      [sellerId],
    ),

    // Top 5 selling products — this seller's own
    database.query(
      `SELECT p.name, p.images->0->>'url' AS image, p.category, p.ratings,
              COALESCE(SUM(oi.quantity), 0) AS total_sold
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL AND oi.fulfillment_status != 'Cancelled'
       GROUP BY p.id, p.name, p.images, p.category, p.ratings
       ORDER BY total_sold DESC
       LIMIT 5`,
      [sellerId],
    ),

    // Total distinct orders containing this seller's items
    database.query(
      `SELECT COUNT(DISTINCT oi.order_id)
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL`,
      [sellerId],
    ),

    // Total product count for this seller
    database.query(`SELECT COUNT(*) AS total FROM products WHERE seller_id = $1`, [sellerId]),
  ]);

  const totalRevenueAllTime = parseFloat(totalRevenueResult.rows[0].total);

  const fulfillmentStatusCounts = {
    Pending: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };
  fulfillmentStatusResult.rows.forEach((row) => {
    fulfillmentStatusCounts[row.fulfillment_status] = parseInt(row.count);
  });

  const todayRevenue = parseFloat(todayRevenueResult.rows[0].total);
  const yesterdayRevenue = parseFloat(yesterdayRevenueResult.rows[0].total);
  const currentMonthSales = parseFloat(currentMonthSalesResult.rows[0].total);
  const lastMonthRevenue = parseFloat(lastMonthRevenueResult.rows[0].total);
  const totalCustomers = parseInt(totalCustomersResult.rows[0].count);
  const newCustomersThisMonth = parseInt(newCustomersResult.rows[0].count);

  const monthlySales = monthlySalesResult.rows.map((row) => ({
    month: row.month,
    totalsales: parseFloat(row.totalsales),
  }));

  let revenueGrowth = null;
  if (lastMonthRevenue > 0) {
    const growthRate = ((currentMonthSales - lastMonthRevenue) / lastMonthRevenue) * 100;
    revenueGrowth = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(2)}%`;
  } else if (currentMonthSales > 0) {
    revenueGrowth = "New";
  }

  let todayGrowth = null;
  if (yesterdayRevenue > 0) {
    const todayGrowthRate = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    todayGrowth = `${todayGrowthRate >= 0 ? "+" : ""}${todayGrowthRate.toFixed(2)}%`;
  } else if (todayRevenue > 0) {
    todayGrowth = "New";
  }

  res.status(200).json({
    success: true,
    totalRevenueAllTime,
    todayRevenue,
    todayGrowth,
    yesterdayRevenue,
    currentMonthSales,
    revenueGrowth,
    lastMonthRevenue,
    totalOrdersPlaced: parseInt(totalOrdersResult.rows[0].count),
    totalCustomers,
    newCustomersThisMonth,
    fulfillmentStatusCounts,
    monthlySales,
    topSellingProducts: topSellingResult.rows,
    lowStockProducts: lowStockResult.rows,
    totalProducts: parseInt(totalProductsResult.rows[0].total),
  });
});

// SELLER — GET OWN PRODUCTS (paginated, own catalog only)
export const getSellerProducts = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { search } = req.query;

  const conditions = [`p.seller_id = $1`];
  const values = [sellerId];
  let index = 2;

  if (search) {
    conditions.push(`p.name ILIKE $${index}`);
    values.push(`%${search.trim()}%`);
    index++;
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const totalResult = await database.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values,
  );
  const totalProducts = parseInt(totalResult.rows[0].count);

  values.push(limit);
  const limitPlaceholder = `$${index}`;
  index++;
  values.push(offset);
  const offsetPlaceholder = `$${index}`;

  const result = await database.query(
    `SELECT p.* FROM products p ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values,
  );

  res.status(200).json({
    success: true,
    products: result.rows,
    totalProducts,
    currentPage: page,
  });
});

// SELLER — TOGGLE OWN PRODUCT ACTIVE STATE
export const toggleSellerProduct = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const { productId } = req.params;

  const product = await database.query(
    `SELECT * FROM products WHERE id = $1 AND seller_id = $2`,
    [productId, sellerId],
  );

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const updated = await database.query(
    `UPDATE products SET is_active = NOT is_active WHERE id = $1 AND seller_id = $2 RETURNING *`,
    [productId, sellerId],
  );

  const resultProduct = updated.rows[0];

  res.status(200).json({
    success: true,
    message: resultProduct.is_active
      ? "Product reactivated successfully."
      : "Product deactivated successfully.",
    product: resultProduct,
  });
});

// SELLER — GET OWN ORDERS (summary list, paginated)
export const getSellerOrders = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const totalResult = await database.query(
    `SELECT COUNT(DISTINCT oi.order_id) AS count
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL`,
    [sellerId],
  );
  const totalOrders = parseInt(totalResult.rows[0].count);

  const result = await database.query(
    `SELECT
      o.id, o.created_at,
      u.name AS buyer_name, u.email AS buyer_email,
      COUNT(oi.id) AS item_count,
      SUM(oi.price * oi.quantity) AS seller_subtotal,
      ARRAY_AGG(DISTINCT oi.fulfillment_status) AS fulfillment_statuses
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    JOIN users u ON u.id = o.buyer_id
    WHERE p.seller_id = $1 AND o.paid_at IS NOT NULL
    GROUP BY o.id, u.name, u.email
    ORDER BY o.created_at DESC
    LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset],
  );

  res.status(200).json({
    success: true,
    totalOrders,
    currentPage: page,
    orders: result.rows,
  });
});

// SELLER — GET SINGLE ORDER (own items only, within this order)
export const getSellerOrderDetail = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const { orderId } = req.params;

  if (!isValidUUID(orderId)) {
    return next(new ErrorHandler("Invalid order ID.", 400));
  }

  const orderResult = await database.query(
    `SELECT o.id, o.created_at, o.order_status, o.paid_at,
            u.name AS buyer_name, u.email AS buyer_email,
            s.full_name, s.address, s.city, s.state, s.pincode, s.phone
     FROM orders o
     JOIN users u ON u.id = o.buyer_id
     LEFT JOIN shipping_info s ON s.order_id = o.id
     WHERE o.id = $1 AND o.paid_at IS NOT NULL`,
    [orderId],
  );

  if (orderResult.rows.length === 0) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  const itemsResult = await database.query(
    `SELECT oi.id, oi.quantity, oi.price, oi.image, oi.title, oi.fulfillment_status,
            oi.cancellation_reason, oi.refund_amount
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = $1 AND p.seller_id = $2
    ORDER BY oi.created_at ASC`,
    [orderId, sellerId],
  );

  if (itemsResult.rows.length === 0) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  res.status(200).json({
    success: true,
    order: {
      ...orderResult.rows[0],
      items: itemsResult.rows,
    },
  });
});

// SELLER — CREATE OWN PRODUCT
export const createSellerProduct = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const { name, description, price, category, stock } = req.body;

  if (!name || !description || !price || !category || !stock) {
    return next(new ErrorHandler("Please provide complete product details.", 400));
  }

  const parsedPrice = parseFloat(String(price).replace(/,/g, ""));
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return next(new ErrorHandler("Please provide a valid product price.", 400));
  }

  const parsedStock = parseInt(stock);
  if (isNaN(parsedStock) || parsedStock < 0) {
    return next(new ErrorHandler("Please provide a valid stock quantity.", 400));
  }

  const categoryCheck = await database.query(
    `SELECT name FROM categories WHERE LOWER(name) = LOWER($1)`,
    [category.trim()],
  );

  if (categoryCheck.rows.length === 0) {
    return next(
      new ErrorHandler(
        `"${category}" is not a valid category. Please choose an existing category or add it first.`,
        400,
      ),
    );
  }

  const canonicalCategory = categoryCheck.rows[0].name;

  let uploadedImages = [];

  if (req.files && req.files.images) {
    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 2 * 1024 * 1024;

    for (const image of images) {
      if (!allowedTypes.includes(image.mimetype)) {
        return next(
          new ErrorHandler(
            `Invalid file type: ${image.name}. Only JPEG, PNG, WEBP, and GIF are allowed.`,
            400,
          ),
        );
      }
      if (image.size > maxSize) {
        return next(
          new ErrorHandler(`File too large: ${image.name}. Maximum size is 2MB.`, 400),
        );
      }
    }

    for (const image of images) {
      try {
        const result = await cloudinary.uploader.upload(image.tempFilePath, {
          folder: "ShopSmart-AI_Product_Images",
          width: 1000,
          height: 1000,
          crop: "scale",
        });

        uploadedImages.push({ url: result.secure_url, public_id: result.public_id });
      } catch (error) {
        console.error(`Cloudinary upload failed for ${image.name}:`, error.message); // ← added
        return next(new ErrorHandler(`Failed to upload ${image.name}`, 500));
      }
    }
  }

  const product = await database.query(
    `INSERT INTO products (name, description, price, category, stock, images, created_by, seller_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      name.trim(),
      description.trim(),
      parsedPrice,
      canonicalCategory,
      parsedStock,
      JSON.stringify(uploadedImages),
      req.user.id,
      sellerId,
    ],
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    product: product.rows[0],
  });
});

// SELLER — UPDATE OWN PRODUCT
export const updateSellerProduct = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const { productId } = req.params;
  const { name, description, price, category, stock } = req.body || {};

  const product = await database.query(
    `SELECT * FROM products WHERE id = $1 AND seller_id = $2`,
    [productId, sellerId],
  );

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const updates = [];
  const values = [];
  let index = 1;

  if (name !== undefined && name !== null && name.trim() !== "") {
    updates.push(`name = $${index}`);
    values.push(name.trim());
    index++;
  }

  if (description !== undefined && description !== null && description.trim() !== "") {
    updates.push(`description = $${index}`);
    values.push(description.trim());
    index++;
  }

  if (price !== undefined && price !== null && price !== "") {
    const parsedPrice = parseFloat(String(price).replace(/,/g, ""));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return next(new ErrorHandler("Please provide a valid product price.", 400));
    }
    updates.push(`price = $${index}`);
    values.push(parsedPrice);
    index++;
  }

  if (category !== undefined && category !== null && category.trim() !== "") {
    const categoryCheck = await database.query(
      `SELECT name FROM categories WHERE LOWER(name) = LOWER($1)`,
      [category.trim()],
    );

    if (categoryCheck.rows.length === 0) {
      return next(
        new ErrorHandler(
          `"${category}" is not a valid category. Please choose an existing category or add it first.`,
          400,
        ),
      );
    }

    updates.push(`category = $${index}`);
    values.push(categoryCheck.rows[0].name);
    index++;
  }

  if (stock !== undefined && stock !== null && stock !== "") {
    const parsedStock = parseInt(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return next(new ErrorHandler("Please provide a valid stock quantity.", 400));
    }
    updates.push(`stock = $${index}`);
    values.push(parsedStock);
    index++;
  }

  let uploadedImages = product.rows[0].images || [];

  if (req.files && req.files.images) {
    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 2 * 1024 * 1024;

    for (const image of images) {
      if (!allowedTypes.includes(image.mimetype)) {
        return next(
          new ErrorHandler(
            `Invalid file type: ${image.name}. Only JPEG, PNG, WEBP, and GIF are allowed.`,
            400,
          ),
        );
      }
      if (image.size > maxSize) {
        return next(
          new ErrorHandler(`File too large: ${image.name}. Maximum size is 2MB.`, 400),
        );
      }
    }

    const newUploadedImages = [];
    for (const image of images) {
      try {
        const result = await cloudinary.uploader.upload(image.tempFilePath || image.data, {
          folder: "ShopSmart-AI_Product_Images",
          width: 1000,
          height: 1000,
          crop: "scale",
        });
        newUploadedImages.push({ url: result.secure_url, public_id: result.public_id });
      } catch (error) {
        return next(new ErrorHandler(`Failed to upload ${image.name}`, 500));
      }
    }

    const oldImages = product.rows[0].images || [];
    if (oldImages.length > 0) {
      for (const image of oldImages) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (error) {
          console.error(`Failed to delete ${image.public_id}:`, error);
        }
      }
    }

    uploadedImages = newUploadedImages;
    updates.push(`images = $${index}`);
    values.push(JSON.stringify(uploadedImages));
    index++;
  }

  if (updates.length === 0) {
    return next(new ErrorHandler("No fields provided to update.", 400));
  }

  values.push(productId);
  const result = await database.query(
    `UPDATE products SET ${updates.join(", ")} WHERE id = $${index} RETURNING *`,
    values,
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    updatedProduct: result.rows[0],
  });
});

// SELLER — GET SINGLE OWN PRODUCT (for edit form prefill)
export const getSellerSingleProduct = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const { productId } = req.params;

  if (!isValidUUID(productId)) {
    return next(new ErrorHandler("Invalid product ID.", 400));
  }

  const result = await database.query(
    `SELECT * FROM products WHERE id = $1 AND seller_id = $2`,
    [productId, sellerId],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  res.status(200).json({
    success: true,
    product: result.rows[0],
  });
});

// SELLER — UPDATE FULFILLMENT STATUS (own line item only)
const FORWARD_TRANSITIONS = {
  Pending: ["Shipped"],
  Shipped: ["Delivered"],
};

export const updateFulfillmentStatus = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const { itemId } = req.params;
  const { status } = req.body;

  if (!isValidUUID(itemId)) {
    return next(new ErrorHandler("Invalid item ID.", 400));
  }

  const validStatuses = ["Pending", "Shipped", "Delivered"];
  if (!validStatuses.includes(status)) {
    return next(
      new ErrorHandler(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400),
    );
  }

  const itemResult = await database.query(
    `SELECT oi.id, oi.fulfillment_status, oi.order_id, o.buyer_id, p.name AS product_name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.id = $1 AND p.seller_id = $2 AND o.paid_at IS NOT NULL`,
    [itemId, sellerId],
  );

  if (itemResult.rows.length === 0) {
    return next(new ErrorHandler("Order item not found.", 404));
  }

  const { fulfillment_status: currentStatus, order_id, buyer_id, product_name } = itemResult.rows[0];

  if (currentStatus === "Delivered") {
    return next(new ErrorHandler("This item is already Delivered and cannot be changed further.", 400));
  }

  if (!FORWARD_TRANSITIONS[currentStatus]?.includes(status)) {
    return next(
      new ErrorHandler(`Cannot move item from "${currentStatus}" to "${status}".`, 400),
    );
  }

  const updated = await database.query(
    `UPDATE order_items SET fulfillment_status = $1 WHERE id = $2 RETURNING *`,
    [status, itemId],
  );

  if (status === "Shipped" || status === "Delivered") {
    await createPersonalNotification({
      userId: buyer_id,
      type: status === "Shipped" ? "item_shipped" : "item_delivered",
      title: status === "Shipped" ? "An item has shipped" : "An item was delivered",
      message: status === "Shipped"
        ? `"${product_name}" from order #${order_id.slice(0, 8).toUpperCase()} is on its way.`
        : `"${product_name}" from order #${order_id.slice(0, 8).toUpperCase()} has been delivered.`,
      linkEntityType: "order",
      linkEntityId: order_id,
    });
  }

  res.status(200).json({
    success: true,
    message: `Item marked as "${status}".`,
    item: updated.rows[0],
  });
});


export const cancelOrderItemBySeller = catchAsyncErrors(async (req, res, next) => {
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const sellerId = req.seller.id;
    const { itemId } = req.params;
    const { reason } = req.body;

    if (!isValidUUID(itemId)) {
      throw new ErrorHandler("Invalid item ID.", 400);
    }

    if (!reason || !reason.trim()) {
      throw new ErrorHandler("A cancellation reason is required.", 400);
    }

    const itemResult = await client.query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.price, oi.fulfillment_status, oi.order_id,
              pay.payment_status, pay.razorpay_payment_id,
              u.name AS buyer_name, u.email AS buyer_email, o.buyer_id, p.name AS product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       JOIN users u ON u.id = o.buyer_id
       LEFT JOIN payments pay ON pay.order_id = o.id
       WHERE oi.id = $1 AND p.seller_id = $2 AND o.paid_at IS NOT NULL`,
      [itemId, sellerId],
    );

    if (itemResult.rows.length === 0) {
      throw new ErrorHandler("Order item not found.", 404);
    }

    const item = itemResult.rows[0];

    if (item.fulfillment_status === "Delivered") {
      throw new ErrorHandler("Delivered items cannot be cancelled.", 400);
    }

    if (item.fulfillment_status === "Cancelled") {
      throw new ErrorHandler("This item has already been cancelled.", 400);
    }

    await client.query(
      `UPDATE products SET stock = stock + $1 WHERE id = $2`,
      [item.quantity, item.product_id],
    );

    const refundAmount = Number(item.price) * item.quantity;
    let refundInitiated = false;

    if (
      item.payment_status === "Paid" &&
      item.razorpay_payment_id &&
      !item.razorpay_payment_id.startsWith("pay_test")
    ) {
      try {
        await razorpay.payments.refund(item.razorpay_payment_id, {
          amount: toPaise(refundAmount),
          notes: { orderId: item.order_id, itemId, reason: reason.trim(), initiatedBy: "seller" },
        });
        refundInitiated = true;
      } catch (err) {
        console.error("Seller item-cancel refund failed:", err.message);
      }
    }

    const updated = await client.query(
      `UPDATE order_items 
       SET fulfillment_status = 'Cancelled', cancellation_reason = $1, refund_amount = $2
       WHERE id = $3
       RETURNING *`,
      [reason.trim(), refundInitiated ? refundAmount : null, itemId],
    );
    
    const remainingActive = await client.query(
      `SELECT COUNT(*) FROM order_items 
      WHERE order_id = $1 AND fulfillment_status != 'Cancelled'`,
      [item.order_id],
    );

    if (parseInt(remainingActive.rows[0].count) === 0) {
      await client.query(
        `UPDATE orders SET order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [item.order_id],
      );
    }

    await client.query("COMMIT");

    try {
      await sendEmail({
        email: item.buyer_email,
        subject: "ShopSmart-AI - An Item In Your Order Was Cancelled",
        message: `<p>Hi ${item.buyer_name},</p><p>An item in your order #${item.order_id.slice(0, 8).toUpperCase()} had to be cancelled due to an internal operational issue on the seller's side.</p><p><strong>Reason:</strong> ${reason.trim()}</p>${refundInitiated ? `<p>₹${refundAmount.toLocaleString("en-IN")} has been refunded to your original payment method.</p>` : `<p>Our team will follow up on your refund shortly.</p>`}<p>We apologize for the inconvenience.</p>`,
      });
    } catch (error) {
      console.error("Failed to send item-cancellation email:", error.message);
    }

    await createPersonalNotification({
      userId: item.buyer_id,
      type: "item_cancelled",
      title: "An item in your order was cancelled",
      message: `"${item.product_name}" from order #${item.order_id.slice(0, 8).toUpperCase()} was cancelled. ${refundInitiated ? `₹${refundAmount.toLocaleString("en-IN")} has been refunded.` : "Our team will follow up on your refund shortly."}`,
      linkEntityType: "order",
      linkEntityId: item.order_id,
    });

    res.status(200).json({
      success: true,
      message: refundInitiated
        ? "Item cancelled and buyer refunded."
        : "Item cancelled. Refund could not be processed automatically — please follow up.",
      item: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(
      new ErrorHandler(error.message || "Item cancellation failed.", error.statusCode || 500),
    );
  } finally {
    client.release();
  }
});

// SELLER — CREATE COUPON
export const createSellerCoupon = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;
  const {
    code, type, discount_value, min_order_amount, max_discount,
    usage_limit, per_user_limit, valid_from, valid_until, is_active,
  } = req.body;

  if (!code || !type || !discount_value || !valid_from || !valid_until) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }
  if (!["percentage", "flat"].includes(type)) {
    return next(new ErrorHandler("Type must be 'percentage' or 'flat'.", 400));
  }
  if (type === "percentage" && parseFloat(discount_value) > 100) {
    return next(new ErrorHandler("Percentage discount cannot exceed 100%.", 400));
  }
  if (new Date(valid_from) >= new Date(valid_until)) {
    return next(new ErrorHandler("valid_until must be after valid_from.", 400));
  }

  const existing = await database.query(
    `SELECT id FROM coupons WHERE UPPER(code) = UPPER($1)`,
    [code.trim()],
  );
  if (existing.rows.length > 0) {
    return next(new ErrorHandler("Coupon code already exists.", 400));
  }

  const coupon = await database.query(
    `INSERT INTO coupons 
     (code, type, discount_value, min_order_amount, max_discount, 
      usage_limit, per_user_limit, is_active, valid_from, valid_until, seller_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      code.trim().toUpperCase(),
      type,
      discount_value,
      min_order_amount || 0,
      max_discount || null,
      usage_limit || null,
      per_user_limit || 1,
      is_active !== undefined ? is_active : true,
      valid_from,
      valid_until,
      sellerId,
    ],
  );

  res.status(201).json({
    success: true,
    message: "Coupon created successfully.",
    coupon: coupon.rows[0],
  });
});

// SELLER — GET MY COUPONS
export const getSellerCoupons = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;

  const coupons = await database.query(
    `SELECT *,
            CASE
                WHEN NOT is_active THEN 'Inactive'
                WHEN NOW() < valid_from THEN 'Upcoming'
                WHEN NOW() > valid_until THEN 'Expired'
                WHEN usage_limit IS NOT NULL AND used_count >= usage_limit THEN 'Exhausted'
                ELSE 'Active'
            END AS status
         FROM coupons
         WHERE seller_id = $1
         ORDER BY created_at DESC`,
    [sellerId],
  );

  res.status(200).json({
    success: true,
    count: coupons.rows.length,
    coupons: coupons.rows,
  });
});

// SELLER — UPDATE MY COUPON
export const updateSellerCoupon = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;

  if (!isValidUUID(req.params.couponId)) {
    return next(new ErrorHandler("Invalid coupon ID.", 400));
  }

  const existing = await database.query(`SELECT * FROM coupons WHERE id = $1`, [
    req.params.couponId,
  ]);

  if (existing.rows.length === 0) {
    return next(new ErrorHandler("Coupon not found.", 404));
  }
  if (existing.rows[0].seller_id !== sellerId) {
    return next(new ErrorHandler("You do not own this coupon.", 403));
  }

  const {
    code, type, discount_value, min_order_amount, max_discount,
    usage_limit, per_user_limit, valid_from, valid_until, is_active,
  } = req.body;

  if (type && !["percentage", "flat"].includes(type)) {
    return next(new ErrorHandler("Type must be 'percentage' or 'flat'.", 400));
  }
  if (type === "percentage" && discount_value && parseFloat(discount_value) > 100) {
    return next(new ErrorHandler("Percentage discount cannot exceed 100%.", 400));
  }

  const updated = await database.query(
    `UPDATE coupons SET
            code             = COALESCE($1, code),
            type             = COALESCE($2, type),
            discount_value   = COALESCE($3, discount_value),
            min_order_amount = COALESCE($4, min_order_amount),
            max_discount     = COALESCE($5, max_discount),
            usage_limit      = COALESCE($6, usage_limit),
            per_user_limit   = COALESCE($7, per_user_limit),
            valid_from       = COALESCE($8, valid_from),
            valid_until      = COALESCE($9, valid_until),
            is_active        = COALESCE($10, is_active)
         WHERE id = $11 AND seller_id = $12
         RETURNING *`,
    [
      code?.trim().toUpperCase() || null,
      type || null,
      discount_value || null,
      min_order_amount !== undefined ? min_order_amount : null,
      max_discount !== undefined ? max_discount : null,
      usage_limit !== undefined ? usage_limit : null,
      per_user_limit || null,
      valid_from || null,
      valid_until || null,
      is_active !== undefined ? is_active : null,
      req.params.couponId,
      sellerId,
    ],
  );

  res.status(200).json({
    success: true,
    message: "Coupon updated successfully.",
    coupon: updated.rows[0],
  });
});

// SELLER — TOGGLE MY COUPON
export const toggleSellerCoupon = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;

  if (!isValidUUID(req.params.couponId)) {
    return next(new ErrorHandler("Invalid coupon ID.", 400));
  }

  const existing = await database.query(`SELECT * FROM coupons WHERE id = $1`, [
    req.params.couponId,
  ]);

  if (existing.rows.length === 0) {
    return next(new ErrorHandler("Coupon not found.", 404));
  }
  if (existing.rows[0].seller_id !== sellerId) {
    return next(new ErrorHandler("You do not own this coupon.", 403));
  }

  const updated = await database.query(
    `UPDATE coupons SET is_active = NOT is_active 
         WHERE id = $1 AND seller_id = $2 RETURNING *`,
    [req.params.couponId, sellerId],
  );

  res.status(200).json({
    success: true,
    message: `Coupon ${updated.rows[0].is_active ? "activated" : "deactivated"} successfully.`,
    coupon: updated.rows[0],
  });
});

// SELLER — DELETE MY COUPON
export const deleteSellerCoupon = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.seller.id;

  if (!isValidUUID(req.params.couponId)) {
    return next(new ErrorHandler("Invalid coupon ID.", 400));
  }

  const existing = await database.query(`SELECT * FROM coupons WHERE id = $1`, [
    req.params.couponId,
  ]);

  if (existing.rows.length === 0) {
    return next(new ErrorHandler("Coupon not found.", 404));
  }
  if (existing.rows[0].seller_id !== sellerId) {
    return next(new ErrorHandler("You do not own this coupon.", 403));
  }

  await database.query(`DELETE FROM coupons WHERE id = $1`, [req.params.couponId]);

  res.status(200).json({
    success: true,
    message: `Coupon "${existing.rows[0].code}" deleted successfully.`,
  });
});

// SELLER — RATE (CREATE OR UPDATE, upsert)
export const rateSeller = catchAsyncErrors(async (req, res, next) => {
  const buyerId = req.user.id;
  const { sellerId } = req.params;
  const { rating, review } = req.body;

  if (!isValidUUID(sellerId)) {
    return next(new ErrorHandler("Invalid seller ID.", 400));
  }
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorHandler("Rating must be between 1 and 5.", 400));
  }

  const eligibility = await database.query(
    `SELECT COUNT(*) FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.buyer_id = $1 AND p.seller_id = $2 AND oi.fulfillment_status = 'Delivered'`,
    [buyerId, sellerId],
  );

  if (parseInt(eligibility.rows[0].count) === 0) {
    return next(
      new ErrorHandler(
        "You can only rate sellers after an item from them has been delivered to you.",
        403,
      ),
    );
  }

  const result = await database.query(
    `INSERT INTO seller_ratings (seller_id, buyer_id, rating, review)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (seller_id, buyer_id)
     DO UPDATE SET rating = EXCLUDED.rating, review = EXCLUDED.review, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [sellerId, buyerId, rating, review || null],
  );

  res.status(200).json({
    success: true,
    message: "Rating submitted successfully.",
    rating: result.rows[0],
  });
});

export const getMySellerRating = catchAsyncErrors(async (req, res, next) => {
  const buyerId = req.user.id;
  const { sellerId } = req.params;

  if (!isValidUUID(sellerId)) {
    return next(new ErrorHandler("Invalid seller ID.", 400));
  }

  const result = await database.query(
    `SELECT * FROM seller_ratings WHERE seller_id = $1 AND buyer_id = $2`,
    [sellerId, buyerId],
  );

  res.status(200).json({
    success: true,
    rating: result.rows[0] || null,
  });
});