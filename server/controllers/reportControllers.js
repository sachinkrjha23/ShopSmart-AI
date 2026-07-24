import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";
import { createPersonalNotification } from "./notificationControllers.js";

const VALID_ENTITY_TYPES = ["product", "review", "seller"];

export const createReport = catchAsyncErrors(async (req, res, next) => {
  const { entityType, entityId, reason, description } = req.body;

  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
    return next(new ErrorHandler("Invalid entity type.", 400));
  }
  if (!entityId || !reason || !reason.trim()) {
    return next(new ErrorHandler("Entity ID and reason are required.", 400));
  }

  let ownerId = null;

  if (entityType === "product") {
    const result = await database.query("SELECT created_by FROM products WHERE id = $1", [entityId]);
    if (result.rows.length === 0) return next(new ErrorHandler("Product not found.", 404));
    ownerId = result.rows[0].created_by;
  } else if (entityType === "review") {
    const result = await database.query("SELECT user_id FROM reviews WHERE id = $1", [entityId]);
    if (result.rows.length === 0) return next(new ErrorHandler("Review not found.", 404));
    ownerId = result.rows[0].user_id;
  } else if (entityType === "seller") {
    const result = await database.query("SELECT user_id FROM sellers WHERE id = $1", [entityId]);
    if (result.rows.length === 0) return next(new ErrorHandler("Seller not found.", 404));
    ownerId = result.rows[0].user_id;
  }

  if (ownerId === req.user.id) {
    return next(new ErrorHandler("You cannot report your own content.", 400));
  }

  try {
    await database.query(
      `INSERT INTO reports (reporter_id, entity_type, entity_id, reason, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, entityType, entityId, reason.trim(), description?.trim() || null],
    );
  } catch (error) {
    if (error.code === "23505") {
      return next(new ErrorHandler("You already have a pending report for this.", 400));
    }
    throw error;
  }

  res.status(201).json({
    success: true,
    message: "Report submitted. Our team will review it shortly.",
  });
});

export const adminGetReports = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  const { status, entityType } = req.query;

  const conditions = [];
  const values = [];
  let idx = 1;

  if (status) {
    conditions.push(`r.status = $${idx++}`);
    values.push(status);
  }
  if (entityType) {
    conditions.push(`r.entity_type = $${idx++}`);
    values.push(entityType);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalResult = await database.query(
    `SELECT COUNT(*) FROM reports r ${whereClause}`,
    values,
  );
  const totalReports = parseInt(totalResult.rows[0].count);

  const reportsResult = await database.query(
    `SELECT r.id, r.entity_type, r.entity_id, r.reason, r.description, r.status,
            r.resolution_notes, r.resolved_at, r.created_at,
            reporter.name AS reporter_name, reporter.email AS reporter_email,
            resolver.name AS resolved_by_name,
            CASE r.entity_type
              WHEN 'product' THEN p.name
              WHEN 'review' THEN LEFT(rv.comment, 120)
              WHEN 'seller' THEN s.store_name
            END AS entity_label
       FROM reports r
       LEFT JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN users resolver ON resolver.id = r.resolved_by
       LEFT JOIN products p ON r.entity_type = 'product' AND p.id = r.entity_id
       LEFT JOIN reviews rv ON r.entity_type = 'review' AND rv.id = r.entity_id
       LEFT JOIN sellers s ON r.entity_type = 'seller' AND s.id = r.entity_id
       ${whereClause}
       ORDER BY CASE r.status WHEN 'Pending' THEN 0 ELSE 1 END, r.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset],
  );

  res.status(200).json({
    success: true,
    totalReports,
    currentPage: page,
    reports: reportsResult.rows,
  });
});

export const adminResolveReport = catchAsyncErrors(async (req, res, next) => {
  const { reportId } = req.params;
  const { status, resolutionNotes } = req.body;

  if (!["Resolved", "Dismissed"].includes(status)) {
    return next(new ErrorHandler("Status must be 'Resolved' or 'Dismissed'.", 400));
  }

  if (status === "Dismissed" && (!resolutionNotes || !resolutionNotes.trim())) {
    return next(new ErrorHandler("A message to the reporter is required when dismissing.", 400));
  }

  const result = await database.query(
    `UPDATE reports
        SET status = $1, resolution_notes = $2, resolved_by = $3, resolved_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND status = 'Pending'
      RETURNING *`,
    [status, resolutionNotes?.trim() || null, req.user.id, reportId],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Report not found or already resolved.", 404));
  }

  const report = result.rows[0];

  await logAdminActivity({
    adminId: req.user.id,
    actionType: "report_resolved",
    entityType: "report",
    entityId: report.id,
    details: { status, entityType: report.entity_type, entityId: report.entity_id, reason: report.reason },
  });

  await createPersonalNotification({
    userId: report.reporter_id,
    type: "report_resolved",
    title: "Your report has been reviewed",
    message:
      report.resolution_notes ||
      (status === "Resolved"
        ? `Your report about this ${report.entity_type} has been reviewed and action was taken.`
        : `Your report about this ${report.entity_type} has been reviewed. No action was needed.`),
  });

  res.status(200).json({
    success: true,
    message: `Report marked as ${status}.`,
    report,
  });
});