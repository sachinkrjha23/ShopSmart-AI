import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const VALID_TARGET_AUDIENCES = ["buyers_and_sellers", "all_including_admins"];
const VALID_LINK_ENTITY_TYPES = ["order", "return", "seller", "product"];

export const createPersonalNotification = async ({
  userId,
  type,
  title,
  message,
  linkEntityType = null,
  linkEntityId = null,
}) => {
  try {
    await database.query(
      `INSERT INTO notifications
         (scope, user_id, type, title, message, link_entity_type, link_entity_id)
       VALUES ('personal', $1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, linkEntityType, linkEntityId],
    );
  } catch (error) {
    console.error("❌ Failed to create personal notification:", error.message);
  }
};

//  Admin — Create Broadcast Notification
export const createBroadcastNotification = catchAsyncErrors(async (req, res, next) => {
  const { target_audience, type, title, message, link_entity_type, link_entity_id, expires_at } = req.body;

  if (!target_audience || !type || !title || !message) {
    return next(new ErrorHandler("target_audience, type, title, and message are required.", 400));
  }

  if (!VALID_TARGET_AUDIENCES.includes(target_audience)) {
    return next(new ErrorHandler(`target_audience must be one of: ${VALID_TARGET_AUDIENCES.join(", ")}`, 400));
  }

  if (link_entity_type && !VALID_LINK_ENTITY_TYPES.includes(link_entity_type)) {
    return next(new ErrorHandler(`link_entity_type must be one of: ${VALID_LINK_ENTITY_TYPES.join(", ")}`, 400));
  }

  if (link_entity_id && !isValidUUID(link_entity_id)) {
    return next(new ErrorHandler("link_entity_id must be a valid UUID.", 400));
  }

  if (expires_at && new Date(expires_at) <= new Date()) {
    return next(new ErrorHandler("expires_at must be a future date/time.", 400));
  }

  const query = expires_at
    ? `INSERT INTO notifications
         (scope, target_audience, type, title, message, link_entity_type, link_entity_id, created_by, expires_at)
       VALUES ('broadcast', $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`
    : `INSERT INTO notifications
         (scope, target_audience, type, title, message, link_entity_type, link_entity_id, created_by)
       VALUES ('broadcast', $1, $2, $3, $4, $5, $6, $7)
       RETURNING *`;

  const params = [target_audience, type, title.trim(), message.trim(), link_entity_type || null, link_entity_id || null, req.user.id];
  if (expires_at) params.push(expires_at);

  const result = await database.query(query, params);

  res.status(201).json({
    success: true,
    message: "Broadcast notification created.",
    notification: result.rows[0],
  });
});

//  Get My Notifications (personal + broadcasts matching my audience tier)
export const getMyNotifications = catchAsyncErrors(async (req, res, next) => {
  const includeRead = req.query.includeRead === "true";

  const audienceTiers = req.user.role === "Admin"
    ? ["all_including_admins"]
    : ["buyers_and_sellers", "all_including_admins"];

  const result = await database.query(
    `SELECT n.*, ns.read_at, ns.dismissed_at
     FROM notifications n
     LEFT JOIN notification_status ns
       ON ns.notification_id = n.id AND ns.user_id = $1
     WHERE n.expires_at > NOW()
       AND (
         (n.scope = 'personal' AND n.user_id = $1)
         OR (n.scope = 'broadcast' AND n.target_audience = ANY($2::varchar[]))
       )
       AND ns.dismissed_at IS NULL
       AND ($3 = TRUE OR ns.read_at IS NULL)
     ORDER BY n.created_at DESC`,
    [req.user.id, audienceTiers, includeRead],
  );

  res.status(200).json({
    success: true,
    count: result.rows.length,
    notifications: result.rows,
  });
});

//  Mark a Notification as Read
export const markNotificationRead = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    return next(new ErrorHandler("Invalid notification id.", 400));
  }

  const visible = await database.query(
    `SELECT id FROM notifications
     WHERE id = $1
       AND expires_at > NOW()
       AND (
         (scope = 'personal' AND user_id = $2)
         OR (scope = 'broadcast')
       )`,
    [id, req.user.id],
  );

  if (visible.rows.length === 0) {
    return next(new ErrorHandler("Notification not found.", 404));
  }

  await database.query(
    `INSERT INTO notification_status (notification_id, user_id, read_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (notification_id, user_id)
     DO UPDATE SET read_at = CURRENT_TIMESTAMP`,
    [id, req.user.id],
  );

  res.status(200).json({ success: true, message: "Marked as read." });
});

//  Dismiss a Notification (per-user, does not delete the underlying row)
export const dismissNotification = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    return next(new ErrorHandler("Invalid notification id.", 400));
  }

  await database.query(
    `INSERT INTO notification_status (notification_id, user_id, dismissed_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (notification_id, user_id)
     DO UPDATE SET dismissed_at = CURRENT_TIMESTAMP`,
    [id, req.user.id],
  );

  res.status(200).json({ success: true, message: "Notification dismissed." });
});