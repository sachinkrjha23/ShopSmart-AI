import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

//  Validate Coupon (User)
export const validateCoupon = catchAsyncErrors(async (req, res, next) => {
  const { code, cartTotal } = req.body;

  if (!code || !cartTotal) {
    return next(
      new ErrorHandler("Coupon code and cart total are required.", 400),
    );
  }

  // 1. Find coupon (case-insensitive)
  const result = await database.query(
    `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)`,
    [code.trim()],
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Invalid coupon code.", 404));
  }

  const coupon = result.rows[0];

  // 2. Check if active
  if (!coupon.is_active) {
    return next(new ErrorHandler("This coupon is no longer active.", 400));
  }

  // 3. Check validity dates
  const now = new Date();
  if (now < new Date(coupon.valid_from)) {
    return next(new ErrorHandler("This coupon is not active yet.", 400));
  }
  if (now > new Date(coupon.valid_until)) {
    return next(new ErrorHandler("This coupon has expired.", 400));
  }

  // 4. Check min order amount
  if (parseFloat(cartTotal) < parseFloat(coupon.min_order_amount)) {
    return next(
      new ErrorHandler(
        `Minimum order amount of ₹${coupon.min_order_amount} required for this coupon.`,
        400,
      ),
    );
  }

  // 5. Check global usage limit
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return next(
      new ErrorHandler("This coupon has reached its usage limit.", 400),
    );
  }

  // 6. Check per-user usage limit
  const userUsage = await database.query(
    `SELECT COUNT(*) FROM coupon_usage 
         WHERE coupon_id = $1 AND user_id = $2`,
    [coupon.id, req.user.id],
  );

  if (parseInt(userUsage.rows[0].count) >= coupon.per_user_limit) {
    return next(
      new ErrorHandler(
        `You have already used this coupon ${coupon.per_user_limit} time(s).`,
        400,
      ),
    );
  }

  // 7. Calculate discount
  let discountAmount = 0;

  if (coupon.type === "flat") {
    discountAmount = parseFloat(coupon.discount_value);
  } else if (coupon.type === "percentage") {
    discountAmount =
      (parseFloat(cartTotal) * parseFloat(coupon.discount_value)) / 100;
    // Cap at max_discount if set
    if (coupon.max_discount !== null) {
      discountAmount = Math.min(
        discountAmount,
        parseFloat(coupon.max_discount),
      );
    }
  }

  // 8. Discount cannot exceed cart total
  discountAmount = Math.min(discountAmount, parseFloat(cartTotal));
  const finalAmount = parseFloat(cartTotal) - discountAmount;

  res.status(200).json({
    success: true,
    message: "Coupon applied successfully!",
    coupon: {
      code: coupon.code,
      type: coupon.type,
      discountValue: coupon.discount_value,
    },
    discountAmount: discountAmount.toFixed(2),
    finalAmount: finalAmount.toFixed(2),
    cartTotal: parseFloat(cartTotal).toFixed(2),
  });
});

//  Admin — Create Coupon
export const createCoupon = catchAsyncErrors(async (req, res, next) => {
  const {
    code,
    type,
    discount_value,
    min_order_amount,
    max_discount,
    usage_limit,
    per_user_limit,
    valid_from,
    valid_until,
    is_active,
  } = req.body;

  // 1. Validate required fields
  if (!code || !type || !discount_value || !valid_from || !valid_until) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }

  // 2. Validate type
  if (!["percentage", "flat"].includes(type)) {
    return next(new ErrorHandler("Type must be 'percentage' or 'flat'.", 400));
  }

  // 3. Validate percentage range
  if (type === "percentage" && parseFloat(discount_value) > 100) {
    return next(
      new ErrorHandler("Percentage discount cannot exceed 100%.", 400),
    );
  }

  // 4. Validate dates
  if (new Date(valid_from) >= new Date(valid_until)) {
    return next(new ErrorHandler("valid_until must be after valid_from.", 400));
  }

  // 5. Check duplicate code
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
          usage_limit, per_user_limit, is_active, valid_from, valid_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    ],
  );

  res.status(201).json({
    success: true,
    message: "Coupon created successfully.",
    coupon: coupon.rows[0],
  });
});

//  Admin — Get All Coupons
export const getAllCoupons = catchAsyncErrors(async (req, res, next) => {
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
         ORDER BY created_at DESC`,
  );

  res.status(200).json({
    success: true,
    count: coupons.rows.length,
    coupons: coupons.rows,
  });
});

//  Admin — Update Coupon
export const updateCoupon = catchAsyncErrors(async (req, res, next) => {
  if (!isValidUUID(req.params.id)) {
    return next(new ErrorHandler("Invalid coupon ID.", 400));
  }

  const existing = await database.query(`SELECT * FROM coupons WHERE id = $1`, [
    req.params.id,
  ]);

  if (existing.rows.length === 0) {
    return next(new ErrorHandler("Coupon not found.", 404));
  }

  const {
    code,
    type,
    discount_value,
    min_order_amount,
    max_discount,
    usage_limit,
    per_user_limit,
    valid_from,
    valid_until,
    is_active,
  } = req.body;

  // Validate type if provided
  if (type && !["percentage", "flat"].includes(type)) {
    return next(new ErrorHandler("Type must be 'percentage' or 'flat'.", 400));
  }

  // Validate percentage
  if (
    type === "percentage" &&
    discount_value &&
    parseFloat(discount_value) > 100
  ) {
    return next(
      new ErrorHandler("Percentage discount cannot exceed 100%.", 400),
    );
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
         WHERE id = $11
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
      req.params.id,
    ],
  );

  res.status(200).json({
    success: true,
    message: "Coupon updated successfully.",
    coupon: updated.rows[0],
  });
});

//  Admin — Toggle Coupon Active/Inactive
export const toggleCoupon = catchAsyncErrors(async (req, res, next) => {
  if (!isValidUUID(req.params.id)) {
    return next(new ErrorHandler("Invalid coupon ID.", 400));
  }

  const existing = await database.query(`SELECT * FROM coupons WHERE id = $1`, [
    req.params.id,
  ]);

  if (existing.rows.length === 0) {
    return next(new ErrorHandler("Coupon not found.", 404));
  }

  const updated = await database.query(
    `UPDATE coupons SET is_active = NOT is_active 
         WHERE id = $1 RETURNING *`,
    [req.params.id],
  );

  res.status(200).json({
    success: true,
    message: `Coupon ${updated.rows[0].is_active ? "activated" : "deactivated"} successfully.`,
    coupon: updated.rows[0],
  });
});

//  Admin — Delete Coupon
export const deleteCoupon = catchAsyncErrors(async (req, res, next) => {
  if (!isValidUUID(req.params.id)) {
    return next(new ErrorHandler("Invalid coupon ID.", 400));
  }

  const existing = await database.query(`SELECT * FROM coupons WHERE id = $1`, [
    req.params.id,
  ]);

  if (existing.rows.length === 0) {
    return next(new ErrorHandler("Coupon not found.", 404));
  }

  await database.query(`DELETE FROM coupons WHERE id = $1`, [req.params.id]);

  res.status(200).json({
    success: true,
    message: `Coupon "${existing.rows[0].code}" deleted successfully.`,
  });
});
