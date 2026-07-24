import database from "../database/db.js";


export const logAdminActivity = async ({
  adminId,
  actionType,
  entityType,
  entityId = null,
  details = null,
}) => {
  try {
    await database.query(
      `INSERT INTO admin_activity_log (admin_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, actionType, entityType, entityId, details ? JSON.stringify(details) : null],
    );
  } catch (error) {
    console.error("Failed to write admin activity log:", error.message);
  }
};