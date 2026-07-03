import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import bcrypt from "bcrypt";
import { sendToken } from "../utils/jwtToken.js";
import { generateResetPasswordToken } from "../utils/generateResetPasswordToken.js";
import { generateEmailTemplate } from "../utils/generateForgotPasswordEmailTemplate.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import validator from "validator";
import { validatePassword } from "../utils/passwordValidation.js";
import { v2 as cloudinary } from "cloudinary";
import { OAuth2Client } from "google-auth-library";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;

  // 1. Check required fields
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }

  // 2. Validate name
  if (name.length < 3 || name.length > 50) {
    return next(
      new ErrorHandler("Name must be between 2 and 50 characters.", 400),
    );
  }

  // 3. ✅ VALIDATE EMAIL WITH VALIDATOR (NO REGEX NEEDED!)
  if (!validator.isEmail(email)) {
    return next(new ErrorHandler("Please provide a valid email address.", 400));
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return next(new ErrorHandler(passwordErrors[0], 400));
  }

  // 5. Check if email already registered
  const isAlreadyRegistered = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (isAlreadyRegistered.rows.length > 0) {
    return next(
      new ErrorHandler("User already registered with this email.", 400),
    );
  }

  // 6. Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await database.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
    [name, email, hashedPassword],
  );

  sendToken(user.rows[0], 201, "User registered successfully", res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password.", 400));
  }

  const user = await database.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }

  if (!user.rows[0].password) {
    return next(
      new ErrorHandler(
        "This account uses Google Sign-In. Please log in with Google.",
        400,
      ),
    );
  }

  const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }

  sendToken(user.rows[0], 200, "Logged In.", res);
});

const verifyGoogleCredential = async (credential) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

export const googleLogin = catchAsyncErrors(async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return next(new ErrorHandler("Google credential is required.", 400));
  }

  let payload;
  try {
    payload = await verifyGoogleCredential(credential);
  } catch (error) {
    return next(new ErrorHandler("Invalid Google credential.", 401));
  }

  const { email, sub: googleId, email_verified } = payload;

  if (!email || !email_verified) {
    return next(
      new ErrorHandler("Google account email is missing or unverified.", 400),
    );
  }

  // 1. Already linked to this Google account
  let userResult = await database.query(
    `SELECT * FROM users WHERE google_id = $1`,
    [googleId],
  );

  if (userResult.rows.length > 0) {
    return sendToken(userResult.rows[0], 200, "Logged in with Google.", res);
  }

  // 2. Existing email/password account, not yet linked — this IS an existing
  // account, so auto-link + login is correct here, not a violation of "login
  // only works for existing accounts."
  userResult = await database.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  if (userResult.rows.length > 0) {
    const linkedUser = await database.query(
      `UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *`,
      [googleId, userResult.rows[0].id],
    );
    return sendToken(
      linkedUser.rows[0],
      200,
      "Google account linked and logged in.",
      res,
    );
  }

  // 3. No account at all — reject, don't silently create one
  return next(
    new ErrorHandler(
      "No account found with this email. Please sign up first.",
      404,
    ),
  );
});

export const googleSignup = catchAsyncErrors(async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return next(new ErrorHandler("Google credential is required.", 400));
  }

  let payload;
  try {
    payload = await verifyGoogleCredential(credential);
  } catch (error) {
    return next(new ErrorHandler("Invalid Google credential.", 401));
  }

  const { email, name, picture, sub: googleId, email_verified } = payload;

  if (!email || !email_verified) {
    return next(
      new ErrorHandler("Google account email is missing or unverified.", 400),
    );
  }

  // Reject if this email is already registered in ANY form (password or Google)
  const existing = await database.query(
    `SELECT id FROM users WHERE email = $1 OR google_id = $2`,
    [email, googleId],
  );

  if (existing.rows.length > 0) {
    return next(
      new ErrorHandler(
        "An account with this email already exists. Please login instead.",
        409,
      ),
    );
  }

  const rawName = name || email.split("@")[0];
  const safeName =
    rawName.length >= 3 ? rawName.slice(0, 100) : rawName.padEnd(3, "_").slice(0, 100);

  const newUser = await database.query(
    `INSERT INTO users (name, email, google_id, avatar)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      safeName,
      email,
      googleId,
      picture ? JSON.stringify({ url: picture, public_id: null }) : null,
    ],
  );

  sendToken(newUser.rows[0], 201, "Account created with Google.", res);
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const { password, ...safeUser } = req.user;
  res.status(200).json({
    success: true,
    user: safeUser,
  });
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const { frontendUrl } = req.query;

  // ✅ Validate email format
  if (!email || !validator.isEmail(email)) {
    return next(new ErrorHandler("Please provide a valid email address.", 400));
  }

  // ✅ ADD THIS CHECK
  if (!frontendUrl) {
    return next(new ErrorHandler("Frontend URL is required.", 400));
  }

  let userResult = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (userResult.rows.length === 0) {
    return next(new ErrorHandler("User not found with this email.", 404));
  }

  const user = userResult.rows[0];
  const { hashedToken, resetPasswordExpireTime, resetToken } =
    generateResetPasswordToken();

  await database.query(
    `UPDATE users SET reset_password_token = $1, reset_password_expire = to_timestamp($2) WHERE email = $3`,
    [hashedToken, resetPasswordExpireTime / 1000, email],
  );

  const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}`;

  const message = generateEmailTemplate(resetPasswordUrl);

  try {
    await sendEmail({
      email: user.email,
      subject: "ShopSmart-AI Password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    await database.query(
      `UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE email = $1`,
      [email],
    );
    return next(new ErrorHandler("Email could not be sent.", 500));
  }
});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await database.query(
    "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expire > NOW()",
    [resetPasswordToken],
  );

  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid or expired reset token.", 400));
  }

  const { password, confirmPassword } = req.body;

  // 1. Check if passwords exist
  if (!password || !confirmPassword) {
    return next(
      new ErrorHandler("Both password and confirm password are required.", 400),
    );
  }

  // 2. Check if passwords match
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match.", 400));
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return next(new ErrorHandler(passwordErrors[0], 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await database.query(
    `UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expire = NULL WHERE id = $2 RETURNING *`,
    [hashedPassword, user.rows[0].id],
  );

  sendToken(updatedUser.rows[0], 200, "Password reset successfully", res);
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }

  const isPasswordMatch = await bcrypt.compare(
    currentPassword,
    req.user.password,
  );

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Current password is incorrect.", 401));
  }

  if (newPassword !== confirmNewPassword) {
    return next(new ErrorHandler("New passwords do not match.", 400));
  }

  const passwordErrors = validatePassword(newPassword);

  if (passwordErrors.length > 0) {
    return next(new ErrorHandler(passwordErrors[0], 400));
  }

  const isSamePassword = await bcrypt.compare(newPassword, req.user.password);
  if (isSamePassword) {
    return next(
      new ErrorHandler(
        "New password cannot be the same as current password.",
        400,
      ),
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await database.query("UPDATE users SET password = $1 WHERE id = $2", [
    hashedPassword,
    req.user.id,
  ]);

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, email, removeAvatar } = req.body;

  // 1. Validate user exists
  if (!req.user?.id) {
    return next(new ErrorHandler("User not authenticated.", 401));
  }

  // 2. Validate required fields
  if (!name || !email) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }

  // 3. Trim and validate
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (trimmedName.length === 0 || trimmedEmail.length === 0) {
    return next(new ErrorHandler("Name and email cannot be empty.", 400));
  }

  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return next(
      new ErrorHandler("Name must be between 2 and 50 characters.", 400),
    );
  }

  if (!validator.isEmail(trimmedEmail)) {
    return next(new ErrorHandler("Please provide a valid email address.", 400));
  }

  // 4. Check if email is taken by another user
  const emailExists = await database.query(
    "SELECT id FROM users WHERE email = $1 AND id != $2",
    [trimmedEmail, req.user.id],
  );

  if (emailExists.rows.length > 0) {
    return next(
      new ErrorHandler("Email is already registered by another user.", 400),
    );
  }

  // 5. Handle avatar operations
  const shouldRemoveAvatar = removeAvatar === "true" || removeAvatar === true;
  const hasNewAvatar = req.files?.avatar;
  let newAvatarData = null; // null = no change, 'remove' = remove, object = new avatar

  // 5a. Validate new avatar if present
  if (hasNewAvatar) {
    const { avatar } = req.files;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(avatar.mimetype)) {
      return next(
        new ErrorHandler(
          "Please upload a valid image file (JPEG, PNG, WEBP).",
          400,
        ),
      );
    }

    const maxSize = 600 * 1024;
    if (avatar.size > maxSize) {
      return next(new ErrorHandler("Image size must be less than 600KB.", 400));
    }
  }

  // 6. Perform database update with transaction
  const client = await database.connect();

  try {
    await client.query("BEGIN");

    let user;
    let oldAvatarPublicId = req.user?.avatar?.public_id || null;

    // 6a. Upload new avatar if provided (outside transaction but before DB update)
    if (hasNewAvatar) {
      try {
        const { avatar } = req.files;
        const newProfileImage = await cloudinary.uploader.upload(
          avatar.tempFilePath,
          {
            folder: "ShopSmart-AI Avatars",
            width: 150,
            height: 150,
            crop: "scale",
          },
        );

        newAvatarData = {
          public_id: newProfileImage.public_id,
          url: newProfileImage.secure_url,
        };
      } catch (error) {
        await client.query("ROLLBACK");
        return next(
          new ErrorHandler("Failed to upload avatar. Please try again.", 500),
        );
      }
    }

    // 6b. Determine avatar operation for DB
    let avatarOperation;
    if (shouldRemoveAvatar) {
      avatarOperation = "REMOVE";
    } else if (newAvatarData) {
      avatarOperation = "UPDATE";
    } else {
      avatarOperation = "KEEP";
    }

    // 6c. Update database
    let query, params;

    switch (avatarOperation) {
      case "REMOVE":
        query = `
          UPDATE users 
          SET name = $1, email = $2, avatar = NULL 
          WHERE id = $3 
          RETURNING *
        `;
        params = [trimmedName, trimmedEmail, req.user.id];
        break;

      case "UPDATE":
        query = `
          UPDATE users 
          SET name = $1, email = $2, avatar = $3 
          WHERE id = $4 
          RETURNING *
        `;
        params = [trimmedName, trimmedEmail, newAvatarData, req.user.id];
        break;

      case "KEEP":
      default:
        query = `
          UPDATE users 
          SET name = $1, email = $2 
          WHERE id = $3 
          RETURNING *
        `;
        params = [trimmedName, trimmedEmail, req.user.id];
        break;
    }

    const result = await client.query(query, params);
    user = result.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return next(new ErrorHandler("User not found.", 404));
    }

    await client.query("COMMIT");

    // 7. Clean up old avatar files (after successful transaction)
    if (shouldRemoveAvatar && oldAvatarPublicId) {
      try {
        await cloudinary.uploader.destroy(oldAvatarPublicId);
        console.log(`✅ Avatar deleted: ${oldAvatarPublicId}`);
      } catch (error) {
        console.error("Error deleting avatar:", error);
      }
    } else if (newAvatarData && oldAvatarPublicId) {
      try {
        await cloudinary.uploader.destroy(oldAvatarPublicId);
        console.log(`✅ Old avatar deleted: ${oldAvatarPublicId}`);
      } catch (error) {
        console.error("Error deleting old avatar:", error);
      }
    }

    // 8. Send response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: user,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    // Clean up newly uploaded avatar if transaction failed
    if (newAvatarData) {
      try {
        await cloudinary.uploader.destroy(newAvatarData.public_id);
        console.log(
          `✅ Cleaned up uploaded avatar: ${newAvatarData.public_id}`,
        );
      } catch (cleanupError) {
        console.error("Error cleaning up avatar:", cleanupError);
      }
    }

    throw error;
  } finally {
    client.release();
  }
});
