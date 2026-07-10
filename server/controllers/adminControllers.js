import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";
import { anonymizeUser } from "../utils/anonymizeUser.js";
import bcrypt from "bcrypt";

export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;

  const totalUsersResult = await database.query(
    "SELECT COUNT(*) FROM users WHERE role = $1 AND is_deleted = FALSE",
    ["User"],
  );

  const totalUsers = parseInt(totalUsersResult.rows[0].count);

  const offset = (page - 1) * 10;

  const users = await database.query(
    "SELECT * FROM users WHERE role = $1 AND is_deleted = FALSE ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    ["User", 10, offset],
  );

  const safeUsers = users.rows.map(({ password, ...safeUser }) => safeUser);

  res.status(200).json({
    success: true,
    totalUsers,
    currentPage: page,
    users: safeUsers,
  });
});

export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { adminSecret } = req.body;

  if (id === req.user.id) {
    return next(
      new ErrorHandler(
        "You cannot delete your own account through admin panel.",
        400,
      ),
    );
  }

  const userResult = await database.query("SELECT * FROM users WHERE id = $1", [
    id,
  ]);

  if (userResult.rows.length === 0) {
    return next(new ErrorHandler("User not found", 404));
  }

  const targetUser = userResult.rows[0];

  if (targetUser.role === "Admin") {
    const adminCountResult = await database.query(
      "SELECT COUNT(*) FROM users WHERE role = 'Admin' AND is_deleted = FALSE",
    );
    const adminCount = parseInt(adminCountResult.rows[0].count);

    if (adminCount <= 1) {
      return next(
        new ErrorHandler(
          "Cannot delete the only remaining admin account.",
          400,
        ),
      );
    }

    if (!req.user.admin_secret_hash) {
      return next(
        new ErrorHandler(
          "Please set your admin security secret in Settings before performing this action.",
          400,
        ),
      );
    }

    if (!adminSecret) {
      return next(
        new ErrorHandler(
          "Please enter your admin security secret to confirm.",
          400,
        ),
      );
    }

    const isSecretMatch = await bcrypt.compare(
      adminSecret,
      req.user.admin_secret_hash,
    );
    if (!isSecretMatch) {
      return next(new ErrorHandler("Incorrect admin security secret.", 401));
    }
  }

  await anonymizeUser(id, targetUser.avatar?.public_id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

export const setAdminSecret = catchAsyncErrors(async (req, res, next) => {
  const { secret, confirmSecret } = req.body;

  if (!secret || !confirmSecret) {
    return next(
      new ErrorHandler("Please provide and confirm your admin secret.", 400),
    );
  }

  if (secret !== confirmSecret) {
    return next(new ErrorHandler("Secrets do not match.", 400));
  }

  if (secret.length < 8) {
    return next(
      new ErrorHandler("Admin secret must be at least 8 characters.", 400),
    );
  }

  const hashedSecret = await bcrypt.hash(secret, 10);

  await database.query(
    `UPDATE users SET admin_secret_hash = $1 WHERE id = $2`,
    [hashedSecret, req.user.id],
  );

  res.status(200).json({
    success: true,
    message: "Admin secret set successfully.",
  });
});

export const dashboardStats = catchAsyncErrors(async (req, res, next) => {
  const today = new Date();
  const todayDate = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split("T")[0];

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const currentMonthEnd = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  );

  const previousMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  );

  const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // ✅ Run ALL independent queries in parallel with COALESCE
  const [
    totalRevenueResult,
    totalUsersResult,
    orderStatusResult,
    todayRevenueResult,
    yesterdayRevenueResult,
    monthlySalesResult,
    currentMonthSalesResult,
    lowStockResult,
    lastMonthRevenueResult,
    newUsersResult,
    topSellingResult,
    totalOrdersResult,
  ] = await Promise.all([
    // Total Revenue
    database.query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE paid_at IS NOT NULL`,
    ),

    // Total Users
    database.query(`SELECT COUNT(*) FROM users WHERE role = 'User'`),

    // Order Status Counts
    database.query(
      `SELECT order_status, COUNT(*) FROM orders WHERE paid_at IS NOT NULL GROUP BY order_status`,
    ),

    // Today's Revenue
    database.query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE created_at::date = $1 AND paid_at IS NOT NULL`,
      [todayDate],
    ),

    // Yesterday's Revenue
    database.query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE created_at::date = $1 AND paid_at IS NOT NULL`,
      [yesterdayDate],
    ),

    // Monthly Sales
    database.query(`
      SELECT TO_CHAR(created_at, 'Mon YYYY') AS month,
      DATE_TRUNC('month', created_at) as date,
      COALESCE(SUM(total_price), 0) as totalsales
      FROM orders WHERE paid_at IS NOT NULL
      GROUP BY month, date
      ORDER BY date ASC
    `),

    // Current Month Sales
    database.query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE paid_at IS NOT NULL AND created_at BETWEEN $1 AND $2`,
      [currentMonthStart, currentMonthEnd],
    ),

    // Low Stock Products
    database.query(`SELECT name, stock FROM products WHERE stock <= 5`),

    // Last Month Revenue
    database.query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE paid_at IS NOT NULL AND created_at BETWEEN $1 AND $2`,
      [previousMonthStart, previousMonthEnd],
    ),

    // New Users This Month
    database.query(
      `SELECT COUNT(*) FROM users WHERE created_at >= $1 AND role = 'User'`,
      [currentMonthStart],
    ),

    // Top 5 Selling Products
    database.query(`
      SELECT p.name,
             p.images->0->>'url' AS image,
             p.category,
             p.ratings,
             COALESCE(SUM(oi.quantity), 0) AS total_sold
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.paid_at IS NOT NULL
      GROUP BY p.name, p.images, p.category, p.ratings
      ORDER BY total_sold DESC
      LIMIT 5
    `),

    // Total Orders Placed (counting only successfully paid orders)
    database.query(`SELECT COUNT(*) FROM orders WHERE paid_at IS NOT NULL`),
  ]);

  // Process results (no need for || 0 fallbacks anymore!)
  const totalRevenueAllTime = parseFloat(totalRevenueResult.rows[0].total);
  const totalUsersCount = parseInt(totalUsersResult.rows[0].count);

  // Order Status Counts
  const orderStatusCounts = {
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  orderStatusResult.rows.forEach((row) => {
    orderStatusCounts[row.order_status] = parseInt(row.count);
  });

  const todayRevenue = parseFloat(todayRevenueResult.rows[0].total);
  const yesterdayRevenue = parseFloat(yesterdayRevenueResult.rows[0].total);
  const currentMonthSales = parseFloat(currentMonthSalesResult.rows[0].total);
  const lastMonthRevenue = parseFloat(lastMonthRevenueResult.rows[0].total);
  const newUsersThisMonth = parseInt(newUsersResult.rows[0].count);

  const monthlySales = monthlySalesResult.rows.map((row) => ({
    month: row.month,
    totalsales: parseFloat(row.totalsales),
  }));

  const topSellingProducts = topSellingResult.rows;
  const lowStockProducts = lowStockResult.rows;
  const totalOrdersPlaced = parseInt(totalOrdersResult.rows[0].count);

  // Calculate Revenue Growth
  let revenueGrowth = null;
  if (lastMonthRevenue > 0) {
    const growthRate =
      ((currentMonthSales - lastMonthRevenue) / lastMonthRevenue) * 100;
    revenueGrowth = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(2)}%`;
  } else if (currentMonthSales > 0) {
    revenueGrowth = "New";
  }

  // Calculate Today vs Yesterday Growth
  let todayGrowth = null;
  if (yesterdayRevenue > 0) {
    const todayGrowthRate =
      ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    todayGrowth = `${todayGrowthRate >= 0 ? "+" : ""}${todayGrowthRate.toFixed(2)}%`;
  } else if (todayRevenue > 0) {
    todayGrowth = "New";
  }

  res.status(200).json({
    success: true,
    message: "Dashboard Stats Fetched Successfully",
    totalRevenueAllTime,
    todayRevenue,
    yesterdayRevenue,
    totalUsersCount,
    orderStatusCounts,
    monthlySales,
    currentMonthSales,
    lastMonthRevenue,
    topSellingProducts,
    lowStockProducts,
    revenueGrowth,
    todayGrowth,
    newUsersThisMonth,
    totalOrdersPlaced,
  });
});
