import jwt from "jsonwebtoken";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./errorMiddleware.js";
import database from "../database/db.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const user = await database.query(
    "SELECT * FROM users WHERE id = $1 LIMIT 1",
    [decoded.id],
  );

  if (!user.rows[0] || user.rows[0].is_deleted) {
    res.cookie("token", "", { expires: new Date(Date.now()), httpOnly: true });
    return next(new ErrorHandler("This account no longer exists. Please login again.", 401));
   }

  req.user = user.rows[0];
  next();
});

export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource.`,
          403,
        ),
      );
    }

    next();
  };
};

export const isApprovedSeller = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(
    `SELECT * FROM sellers WHERE user_id = $1 AND status = 'Approved'`,
    [req.user.id],
  );

  if (result.rows.length === 0) {
    return next(
      new ErrorHandler("You must be an approved seller to access this resource.", 403),
    );
  }

  req.seller = result.rows[0];
  next();
});