import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../database/db.js";
import validator from "validator";
import { sendEmail } from "../utils/sendEmail.js";

export const submitContactMessage = catchAsyncErrors(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return next(new ErrorHandler("Please fill in all fields.", 400));
  }

  const trimmedName = name.trim();
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return next(new ErrorHandler("Name must be between 2 and 100 characters.", 400));
  }
  if (!validator.isEmail(email)) {
    return next(new ErrorHandler("Please provide a valid email address.", 400));
  }
  if (trimmedSubject.length < 3 || trimmedSubject.length > 200) {
    return next(new ErrorHandler("Subject must be between 3 and 200 characters.", 400));
  }
  if (trimmedMessage.length < 10 || trimmedMessage.length > 2000) {
    return next(new ErrorHandler("Message must be between 10 and 2000 characters.", 400));
  }

  await database.query(
    `INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
    [trimmedName, email, trimmedSubject, trimmedMessage],
  );

  try {
    await sendEmail({
      email: process.env.STORE_CONTACT_EMAIL || process.env.SMTP_MAIL,
      subject: `New Contact Message: ${trimmedSubject}`,
      message: `<p><strong>From:</strong> ${trimmedName} (${email})</p><p><strong>Message:</strong></p><p>${trimmedMessage}</p>`,
    });
  } catch (error) {
    console.error("Failed to send contact notification email:", error.message);
  }

  res.status(201).json({
    success: true,
    message: "Thanks for reaching out! We'll get back to you soon.",
  });
});

// ADMIN — GET ALL CONTACT MESSAGES
export const adminGetAllContactMessages = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { search } = req.query;

  const conditions = [];
  const values = [];
  let index = 1;

  if (search) {
    conditions.push(
      `(name ILIKE $${index} OR email ILIKE $${index} OR subject ILIKE $${index})`,
    );
    values.push(`%${search.trim()}%`);
    index++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalResult = await database.query(
    `SELECT COUNT(*) FROM contact_messages ${whereClause}`,
    values,
  );
  const totalMessages = parseInt(totalResult.rows[0].count);

  values.push(limit);
  const limitPlaceholder = `$${index}`;
  index++;
  values.push(offset);
  const offsetPlaceholder = `$${index}`;

  const { rows: messages } = await database.query(
    `SELECT id, name, email, subject, message, created_at FROM contact_messages
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values,
  );

  res.status(200).json({
    success: true,
    totalMessages,
    currentPage: page,
    messages,
  });
});

// ADMIN — DELETE CONTACT MESSAGE
export const adminDeleteContactMessage = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const result = await database.query(
    `DELETE FROM contact_messages WHERE id = $1 RETURNING id`,
    [id],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Message not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Message deleted successfully.",
  });
});