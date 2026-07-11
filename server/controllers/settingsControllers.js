import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../database/db.js";

// PUBLIC — cart/checkout pages need this even for logged-out browsing
export const getStoreSettings = catchAsyncErrors(async (req, res, next) => {
  const { rows } = await database.query(
    `SELECT shipping_fee, free_shipping_threshold, tax_rate, low_stock_threshold FROM store_settings WHERE id = 1`,
  );

  res.status(200).json({
    success: true,
    settings: rows[0],
  });
});

// ADMIN — update settings
export const updateStoreSettings = catchAsyncErrors(async (req, res, next) => {
  const { shipping_fee, free_shipping_threshold, tax_rate, low_stock_threshold } = req.body;

  if (
    shipping_fee === undefined ||
    free_shipping_threshold === undefined ||
    tax_rate === undefined ||
    low_stock_threshold === undefined
  ) {
    return next(new ErrorHandler("All settings fields are required.", 400));
  }

  const numShippingFee = parseFloat(shipping_fee);
  const numFreeShippingThreshold = parseFloat(free_shipping_threshold);
  const numTaxRate = parseFloat(tax_rate);
  const numLowStockThreshold = parseInt(low_stock_threshold);

  if (
    isNaN(numShippingFee) || numShippingFee < 0 ||
    isNaN(numFreeShippingThreshold) || numFreeShippingThreshold < 0 ||
    isNaN(numTaxRate) || numTaxRate < 0 || numTaxRate > 100 ||
    isNaN(numLowStockThreshold) || numLowStockThreshold < 0
  ) {
    return next(
      new ErrorHandler(
        "Please provide valid, non-negative values. Tax rate must be between 0 and 100.",
        400,
      ),
    );
  }

  const { rows } = await database.query(
    `UPDATE store_settings
     SET shipping_fee = $1, free_shipping_threshold = $2, tax_rate = $3, low_stock_threshold = $4, updated_at = CURRENT_TIMESTAMP
     WHERE id = 1
     RETURNING shipping_fee, free_shipping_threshold, tax_rate, low_stock_threshold`,
    [numShippingFee, numFreeShippingThreshold, numTaxRate, numLowStockThreshold],
  );

  res.status(200).json({
    success: true,
    message: "Store settings updated successfully.",
    settings: rows[0],
  });
});