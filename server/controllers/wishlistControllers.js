import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

//  Add to Wishlist 
export const addToWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    // 1. Check product exists
    const product = await database.query(
        `SELECT id, name, price, images, stock, ratings 
         FROM products WHERE id = $1`,
        [productId]
    );

    if (product.rows.length === 0) {
        return next(new ErrorHandler("Product not found.", 404));
    }

    // 2. Check wishlist limit (max 50 items)
    const count = await database.query(
        `SELECT COUNT(*) FROM wishlists WHERE user_id = $1`,
        [req.user.id]
    );

    if (parseInt(count.rows[0].count) >= 50) {
        return next(new ErrorHandler("Wishlist limit reached. Max 50 items allowed.", 400));
    }

    // 3. Insert — ON CONFLICT DO NOTHING handles already-wishlisted case
    await database.query(
        `INSERT INTO wishlists (user_id, product_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [req.user.id, productId]
    );

    // 4. Get updated count
    const updatedCount = await database.query(
        `SELECT COUNT(*) FROM wishlists WHERE user_id = $1`,
        [req.user.id]
    );

    res.status(200).json({
        success: true,
        message: `"${product.rows[0].name}" added to wishlist.`,
        wishlistCount: parseInt(updatedCount.rows[0].count),
    });
});

//  Remove from Wishlist 
export const removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    const result = await database.query(
        `DELETE FROM wishlists 
         WHERE user_id = $1 AND product_id = $2
         RETURNING id`,
        [req.user.id, productId]
    );

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Product not found in wishlist.", 404));
    }

    const updatedCount = await database.query(
        `SELECT COUNT(*) FROM wishlists WHERE user_id = $1`,
        [req.user.id]
    );

    res.status(200).json({
        success: true,
        message: "Product removed from wishlist.",
        wishlistCount: parseInt(updatedCount.rows[0].count),
    });
});

//  Get Wishlist 
export const getWishlist = catchAsyncErrors(async (req, res, next) => {
    const wishlist = await database.query(
        `SELECT
            w.id AS wishlist_id,
            w.created_at AS added_at,
            p.id AS product_id,
            p.name,
            p.price,
            p.ratings,
            p.images,
            p.stock,
            p.category,
            p.description
         FROM wishlists w
         JOIN products p ON w.product_id = p.id
         WHERE w.user_id = $1
         ORDER BY w.created_at DESC`,
        [req.user.id]
    );

    res.status(200).json({
        success: true,
        wishlistCount: wishlist.rows.length,
        wishlist: wishlist.rows,
    });
});

//  Clear Entire Wishlist 
export const clearWishlist = catchAsyncErrors(async (req, res, next) => {
    await database.query(
        `DELETE FROM wishlists WHERE user_id = $1`,
        [req.user.id]
    );

    res.status(200).json({
        success: true,
        message: "Wishlist cleared successfully.",
        wishlistCount: 0,
    });
});

//  Check if product is in wishlist 
export const checkWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    const result = await database.query(
        `SELECT id FROM wishlists 
         WHERE user_id = $1 AND product_id = $2`,
        [req.user.id, productId]
    );

    res.status(200).json({
        success: true,
        isWishlisted: result.rows.length > 0,
    });
});