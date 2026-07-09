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
import jwt from "jsonwebtoken";

const generateVerificationToken = () => {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  const expireTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return { verificationToken, hashedToken, expireTime };
};

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  const { frontendUrl } = req.query;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }
  if (!frontendUrl) {
    return next(new ErrorHandler("Frontend URL is required.", 400));
  }
  if (name.length < 3 || name.length > 50) {
    return next(
      new ErrorHandler("Name must be between 2 and 50 characters.", 400),
    );
  }
  if (!validator.isEmail(email)) {
    return next(new ErrorHandler("Please provide a valid email address.", 400));
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return next(new ErrorHandler(passwordErrors[0], 400));
  }

  const isAlreadyRegistered = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (isAlreadyRegistered.rows.length > 0) {
    return next(
      new ErrorHandler("User already registered with this email.", 400),
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const { verificationToken, hashedToken, expireTime } =
    generateVerificationToken();

  await database.query(`DELETE FROM pending_registrations WHERE email = $1`, [
    email,
  ]);

  await database.query(
    `INSERT INTO pending_registrations (name, email, password, verification_token, expires_at)
     VALUES ($1, $2, $3, $4, to_timestamp($5))`,
    [name, email, hashedPassword, hashedToken, expireTime / 1000],
  );

  const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

  try {
    await sendEmail({
      email,
      subject: "ShopSmart-AI - Verify Your Email",
      message: `<p>Welcome to ShopSmart-AI! Please verify your email to complete registration:</p><a href="${verifyUrl}">${verifyUrl}</a><p>This link expires in 24 hours.</p>`,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
  }

  res.status(201).json({
    success: true,
    message: `Almost there! Please check ${email} to verify your email and complete registration.`,
  });
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

export const verifyEmail = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const pending = await database.query(
    `SELECT * FROM pending_registrations WHERE verification_token = $1 AND expires_at > NOW()`,
    [hashedToken],
  );

  if (pending.rows.length === 0) {
    return next(new ErrorHandler("Invalid or expired verification link.", 400));
  }

  const { name, email, password } = pending.rows[0];

  const alreadyExists = await database.query(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );
  if (alreadyExists.rows.length > 0) {
    await database.query(`DELETE FROM pending_registrations WHERE id = $1`, [
      pending.rows[0].id,
    ]);
    return next(
      new ErrorHandler("This email is already registered. Please login.", 400),
    );
  }

  const newUser = await database.query(
    `INSERT INTO users (name, email, password, is_email_verified)
     VALUES ($1, $2, $3, TRUE)
     RETURNING *`,
    [name, email, password],
  );

  await database.query(`DELETE FROM pending_registrations WHERE id = $1`, [
    pending.rows[0].id,
  ]);

  sendToken(
    newUser.rows[0],
    201,
    "Email verified! Your account is ready.",
    res,
  );
});

export const resendVerification = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const { frontendUrl } = req.query;

  if (!email || !validator.isEmail(email)) {
    return next(new ErrorHandler("Please provide a valid email address.", 400));
  }
  if (!frontendUrl) {
    return next(new ErrorHandler("Frontend URL is required.", 400));
  }

  const alreadyVerified = await database.query(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );
  if (alreadyVerified.rows.length > 0) {
    return next(
      new ErrorHandler("This email is already verified. Please login.", 400),
    );
  }

  const pending = await database.query(
    `SELECT * FROM pending_registrations WHERE email = $1`,
    [email],
  );
  if (pending.rows.length === 0) {
    return next(
      new ErrorHandler(
        "No pending registration found for this email. Please register first.",
        404,
      ),
    );
  }

  const { verificationToken, hashedToken, expireTime } =
    generateVerificationToken();

  await database.query(
    `UPDATE pending_registrations SET verification_token = $1, expires_at = to_timestamp($2) WHERE email = $3`,
    [hashedToken, expireTime / 1000, email],
  );

  const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

  await sendEmail({
    email,
    subject: "ShopSmart-AI - Verify Your Email",
    message: `<p>Please verify your email to complete registration:</p><a href="${verifyUrl}">${verifyUrl}</a><p>This link expires in 24 hours.</p>`,
  });

  res
    .status(200)
    .json({ success: true, message: `Verification email resent to ${email}.` });
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

  let userResult = await database.query(
    `SELECT * FROM users WHERE google_id = $1`,
    [googleId],
  );

  if (userResult.rows.length > 0) {
    return sendToken(userResult.rows[0], 200, "Logged in with Google.", res);
  }

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
    rawName.length >= 3
      ? rawName.slice(0, 100)
      : rawName.padEnd(3, "_").slice(0, 100);

  const newUser = await database.query(
    `INSERT INTO users (name, email, google_id, avatar, is_email_verified)
     VALUES ($1, $2, $3, $4, TRUE)
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

  if (!email || !validator.isEmail(email)) {
    return next(new ErrorHandler("Please provide a valid email address.", 400));
  }

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

  const resetPasswordUrl = `${frontendUrl}/reset-password/${resetToken}`;

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

  if (!password || !confirmPassword) {
    return next(
      new ErrorHandler("Both password and confirm password are required.", 400),
    );
  }

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

  if (!req.user.password) {
    return next(
      new ErrorHandler(
        "This account uses Google Sign-In and has no password to update.",
        400,
      ),
    );
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
  const { frontendUrl } = req.query;

  if (!req.user?.id) {
    return next(new ErrorHandler("User not authenticated.", 401));
  }

  if (!name || !email) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }

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

  const emailChanged = trimmedEmail !== req.user.email;

  if (emailChanged && !frontendUrl) {
    return next(new ErrorHandler("Frontend URL is required.", 400));
  }

  if (emailChanged) {
    const emailTakenByUser = await database.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [trimmedEmail, req.user.id],
    );

    if (emailTakenByUser.rows.length > 0) {
      return next(
        new ErrorHandler("Email is already registered by another user.", 400),
      );
    }
  }

  const shouldRemoveAvatar = removeAvatar === "true" || removeAvatar === true;
  const hasNewAvatar = req.files?.avatar;
  let newAvatarData = null;

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

  const client = await database.connect();

  try {
    await client.query("BEGIN");

    let user;
    let oldAvatarPublicId = req.user?.avatar?.public_id || null;

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

    let avatarOperation;
    if (shouldRemoveAvatar) {
      avatarOperation = "REMOVE";
    } else if (newAvatarData) {
      avatarOperation = "UPDATE";
    } else {
      avatarOperation = "KEEP";
    }

    let query, params;

    switch (avatarOperation) {
      case "REMOVE":
        query = `
          UPDATE users 
          SET name = $1, avatar = NULL 
          WHERE id = $2 
          RETURNING *
        `;
        params = [trimmedName, req.user.id];
        break;

      case "UPDATE":
        query = `
          UPDATE users 
          SET name = $1, avatar = $2 
          WHERE id = $3 
          RETURNING *
        `;
        params = [trimmedName, newAvatarData, req.user.id];
        break;

      case "KEEP":
      default:
        query = `
          UPDATE users 
          SET name = $1 
          WHERE id = $2 
          RETURNING *
        `;
        params = [trimmedName, req.user.id];
        break;
    }

    const result = await client.query(query, params);
    user = result.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return next(new ErrorHandler("User not found.", 404));
    }

    await client.query("COMMIT");

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

    let message = "Profile updated successfully.";

    if (emailChanged) {
      const nonce = crypto.randomBytes(16).toString("hex");

      await database.query(
        `UPDATE users SET email_change_nonce = $1 WHERE id = $2`,
        [nonce, req.user.id],
      );

      const emailChangeToken = jwt.sign(
        { purpose: "email-change", userId: req.user.id, newEmail: trimmedEmail, nonce },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "10m" },
      );

      const verifyUrl = `${frontendUrl}/verify-email-change/${emailChangeToken}`;

      try {
        await sendEmail({
          email: trimmedEmail,
          subject: "ShopSmart-AI - Confirm Your New Email",
          message: `<p>Please confirm this email address to complete your email change:</p><a href="${verifyUrl}">${verifyUrl}</a><p>This link expires in 10 minutes and can only be used once.</p>`,
        });
      } catch (error) {
        console.error("Failed to send email-change verification email:", error.message);
      }

      message = `Profile updated. Please check ${trimmedEmail} to confirm your email change.`;
    }

    const { password, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message,
      user: safeUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");

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

export const confirmEmailChange = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired email change link.", 400));
  }

  if (
    decoded.purpose !== "email-change" ||
    !decoded.userId ||
    !decoded.newEmail ||
    !decoded.nonce
  ) {
    return next(new ErrorHandler("Invalid email change link.", 400));
  }

  const userResult = await database.query(
    `SELECT email_change_nonce FROM users WHERE id = $1`,
    [decoded.userId],
  );

  if (userResult.rows.length === 0) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (userResult.rows[0].email_change_nonce !== decoded.nonce) {
    return next(
      new ErrorHandler(
        "This link has already been used or a newer request was made.",
        400,
      ),
    );
  }

  const emailTaken = await database.query(
    `SELECT id FROM users WHERE email = $1 AND id != $2`,
    [decoded.newEmail, decoded.userId],
  );

  if (emailTaken.rows.length > 0) {
    await database.query(`UPDATE users SET email_change_nonce = NULL WHERE id = $1`, [
      decoded.userId,
    ]);
    return next(
      new ErrorHandler(
        "This email has since been registered by another account.",
        400,
      ),
    );
  }

  const updatedUser = await database.query(
    `UPDATE users 
     SET email = $1, is_email_verified = TRUE, email_change_nonce = NULL 
     WHERE id = $2 
     RETURNING *`,
    [decoded.newEmail, decoded.userId],
  );

  const { password, ...safeUser } = updatedUser.rows[0];

  res.status(200).json({
    success: true,
    message: "Email updated successfully!",
    user: safeUser,
  });
});