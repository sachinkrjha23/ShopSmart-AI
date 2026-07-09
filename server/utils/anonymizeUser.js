import database from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function anonymizeUser(userId, avatarPublicId) {
  if (avatarPublicId) {
    try {
      await cloudinary.uploader.destroy(avatarPublicId);
    } catch (error) {
      console.error("Error deleting avatar during account anonymization:", error);
    }
  }

  const anonymizedEmail = `deleted-${userId}@removed.local`;
  const unusablePassword = await bcrypt.hash(
    crypto.randomBytes(32).toString("hex"),
    10,
  );

  await database.query(
    `UPDATE users 
     SET name = 'Deleted User', 
         email = $1, 
         password = $2, 
         avatar = NULL, 
         google_id = NULL,
         reset_password_token = NULL,
         reset_password_expire = NULL,
         email_verification_token = NULL,
         email_verification_expire = NULL,
         email_change_nonce = NULL,
         is_email_verified = FALSE,
         is_deleted = TRUE
     WHERE id = $3`,
    [anonymizedEmail, unusablePassword, userId],
  );
}