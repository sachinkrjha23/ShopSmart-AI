import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import database from "../database/db.js";

export const createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, description, price, category, stock } = req.body;
  const created_by = req.user.id;

  if (!name || !description || !price || !category || !stock) {
    return next(
      new ErrorHandler("Please provide complete product details.", 400),
    );
  }

  // ✅ Parse and validate price (remove commas, convert to number)
  const parsedPrice = parseFloat(String(price).replace(/,/g, ""));
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return next(new ErrorHandler("Please provide a valid product price.", 400));
  }

  // ✅ Parse and validate stock
  const parsedStock = parseInt(stock);
  if (isNaN(parsedStock) || parsedStock < 0) {
    return next(
      new ErrorHandler("Please provide a valid stock quantity.", 400),
    );
  }

  let uploadedImages = [];

  if (req.files && req.files.images) {
    const images = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    for (const image of images) {
      try {
        const result = await cloudinary.uploader.upload(image.tempFilePath, {
          folder: "ShopSmart-AI_Product_Images",
          width: 1000,
          height: 1000,
          crop: "scale",
        });

        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (error) {
        return next(new ErrorHandler(`Failed to upload ${image.name}`, 500));
      }
    }
  }

  const product = await database.query(
    `INSERT INTO products (name, description, price, category, stock, images, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      name,
      description,
      parsedPrice,
      category,
      parsedStock,
      JSON.stringify(uploadedImages),
      created_by,
    ],
  );
  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    product: product.rows[0],
  });
});

export const fetchAllProducts = catchAsyncErrors(async (req, res, next) => {
  const { availability, price, category, ratings, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const conditions = [];
  let values = [];
  let index = 1;

  let paginationPlaceholders = {};

  // Filter products by availability
  if (availability === "in-stock") conditions.push(`stock > 10`);
  else if (availability === "limited")
    conditions.push(`stock > 0 AND stock <= 10`);
  else if (availability === "out-of-stock") conditions.push(`stock = 0`);

  // Filter products by price
  if (price) {
    const [minPrice, maxPrice] = price.split("-");
    if (minPrice && maxPrice) {
      conditions.push(`price BETWEEN $${index} AND $${index + 1}`);
      values.push(minPrice, maxPrice);
      index += 2;
    }
  }

  // Filter products by category
  if (category) {
    conditions.push(`category ILIKE $${index}`); //  ILIKE -> case insesnitive, Like -> case sesnitive
    values.push(`%${category}%`);
    // [Pattern	Meaning	Matches:

    // %Electronics%	Contains "Electronics" anywhere	✅ "Electronics", "Home Electronics", "Electronics Store"
    // Electronics%	Starts with "Electronics"	✅ "Electronics", "Electronics Store"
    // %Electronics	Ends with "Electronics"	✅ "Electronics", "Home Electronics"]

    index++;
  }

  // Filter products by rating
  if (ratings) {
    conditions.push(`ratings >= $${index}`);
    values.push(ratings);
    index++;
  }

  // Add search query
  if (search) {
    conditions.push(
      `(p.name ILIKE $${index} OR p.description ILIKE $${index})`,
    );
    values.push(`%${search}%`);
    index++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Get count of filtered products
  const totalProductsResult = await database.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values,
  );

  const totalProducts = parseInt(totalProductsResult.rows[0].count);

  paginationPlaceholders.limit = `$${index}`;
  values.push(limit);
  index++;

  paginationPlaceholders.offset = `$${index}`;
  values.push(offset);
  index++;

  // FETCH WITH REVIEWS
  const query = `
    SELECT p.*, 
    COUNT(r.id) AS review_count 
    FROM products p 
    LEFT JOIN reviews r ON p.id = r.product_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ${paginationPlaceholders.limit}
    OFFSET ${paginationPlaceholders.offset}
    `;

  const result = await database.query(query, values);

  // QUERY FOR FETCHING NEW PRODUCTS
  const newProductsQuery = `
    SELECT p.*,
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 8
  `;
  const newProductsResult = await database.query(newProductsQuery);

  // QUERY FOR FETCHING TOP RATING PRODUCTS (rating >= 4.5)
  const topRatedQuery = `
    SELECT p.*,
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.ratings >= 4.5
    GROUP BY p.id
    ORDER BY p.ratings DESC, p.created_at DESC
    LIMIT 8
  `;
  const topRatedResult = await database.query(topRatedQuery);

  res.status(200).json({
    success: true,
    products: result.rows,
    totalProducts,
    newProducts: newProductsResult.rows,
    topRatedProducts: topRatedResult.rows,
  });
});

export const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { name, description, price, category, stock } = req.body;

  if (!name || !description || !price || !category || !stock) {
    return next(
      new ErrorHandler("Please provide complete product details.", 400),
    );
  }

  // ✅ Parse and validate price (remove commas, convert to number)
  const parsedPrice = parseFloat(String(price).replace(/,/g, ""));
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return next(new ErrorHandler("Please provide a valid product price.", 400));
  }

  // ✅ Parse and validate stock
  const parsedStock = parseInt(stock);
  if (isNaN(parsedStock) || parsedStock < 0) {
    return next(
      new ErrorHandler("Please provide a valid stock quantity.", 400),
    );
  }

  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const result = await database.query(
    `UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock = $5 WHERE id = $6 RETURNING *`,
    [name, description, parsedPrice, category, parsedStock, productId],
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    updatedProduct: result.rows[0],
  });
});

export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const images = product.rows[0].images || [];

  const deleteResult = await database.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [productId],
  );

  if (deleteResult.rows.length === 0) {
    return next(new ErrorHandler("Failed to delete product.", 500));
  }

  // Delete images from Cloudinary
  if (images && images.length > 0) {
    for (const image of images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
        console.log(`✅ Deleted: ${image.public_id}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${image.public_id}:`, error);
      }
    }
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully.",
  });
});

export const fetchSingleProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const result = await database.query(
    `
      SELECT 
        p.*,
        COALESCE(                 /*  COALESCE is a PostgreSQL function that returns the first non-NULL value from a list of arguments. */
          json_agg(
            json_build_object(
              'review_id', r.id,
              'rating', r.rating,
              'comment', r.comment,
              'reviewer', json_build_object(
                'id', u.id,
                'name', u.name,
                'avatar', u.avatar
              )
            )
          ) FILTER (WHERE r.id IS NOT NULL),'[]'
        ) AS reviews
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id
    `,
    [productId],
  );

  res.status(200).json({
    success: true,
    message: "Product fetched successfully.",
    product: result.rows[0],
  });
});

export const postProductReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  // 1. At least one required (rating OR comment)
  if (!rating && !comment) {
    return next(
      new ErrorHandler("Please provide at least a rating or a comment.", 400)
    );
  }

  // 2. Validate rating if provided
  let roundedRating = null;
  if (rating !== undefined && rating !== null && rating !== '') {

    const parsedRating = parseFloat(rating);

    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      return next(new ErrorHandler("Rating must be between 0 and 5.", 400));
    }

    roundedRating = Math.round(parsedRating * 100) / 100;
  }

  // 3. Comment length limit (only if comment exists)
  const MAX_COMMENT_LENGTH = 500;
  if (comment && comment.length > MAX_COMMENT_LENGTH) {
    return next(
      new ErrorHandler(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`, 400)
    );
  }
  
  const cleanComment = comment ? comment.trim() : '';

  // 4. Check purchase
  const purchaseCheckQuery = `
    SELECT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN payments p ON p.order_id = o.id
    WHERE o.buyer_id = $1
    AND oi.product_id = $2
    AND p.payment_status = 'Paid'
    LIMIT 1 
  `;

  const { rows } = await database.query(purchaseCheckQuery, [
    req.user.id,
    productId,
  ]);

  if (rows.length === 0) {
    return res.status(403).json({
      success: false,
      message: "You can only review a product you've purchased.",
    });
  }

  // 5. Check product exists
  const product = await database.query(
    "SELECT * FROM products WHERE id = $1",
    [productId]
  );

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  // 6. Check if already reviewed
  const isAlreadyReviewed = await database.query(
    `SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2`,
    [productId, req.user.id]
  );

  let review;

  if (isAlreadyReviewed.rows.length > 0) {
    review = await database.query(
      "UPDATE reviews SET rating = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *",
      [roundedRating, cleanComment, productId, req.user.id]
    );
  } else {
    review = await database.query(
      "INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [productId, req.user.id, roundedRating, cleanComment]
    );
  }

  // 7. Update product average rating (only if rating was provided)
  let updatedProduct = null;

  if (roundedRating !== null) {

    const allReviews = await database.query(
      `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1 AND rating IS NOT NULL`,
      [productId]
    );
    
    const newAvgRating = allReviews.rows[0].avg_rating || 0;
    
    updatedProduct = await database.query(
      `UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`,
      [newAvgRating, productId]
    );
  }

  res.status(200).json({
    success: true,
    message: "Review posted successfully.",
    review: review.rows[0],
    product: updatedProduct ? updatedProduct.rows[0] : null
  });
});

export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const review = await database.query(
    "DELETE FROM reviews WHERE product_id = $1 AND user_id = $2 RETURNING *",
    [productId, req.user.id],
  );

  if (review.rows.length === 0) {
    return next(new ErrorHandler("Review not found.", 404));
  }

  const allReviews = await database.query(
    `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
    [productId],
  );

  const newAvgRating = allReviews.rows[0].avg_rating || 0;

  const updatedProduct = await database.query(
    `
        UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *
        `,
    [newAvgRating, productId],
  );

  res.status(200).json({
    success: true,
    message: "Your review has been deleted.",
    review: review.rows[0],
    product: updatedProduct.rows[0],
  });
});
