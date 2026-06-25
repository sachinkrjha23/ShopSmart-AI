import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import database from "../database/db.js";
import { getAIRecommendation } from "../utils/getAIRecommendation.js";

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

    // ✅ Validate file types and sizes
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 2 * 1024 * 1024;

    for (const image of images) {
      if (!allowedTypes.includes(image.mimetype)) {
        return next(
          new ErrorHandler(
            `Invalid file type: ${image.name}. Only JPEG, PNG, WEBP, and GIF are allowed.`,
            400,
          ),
        );
      }
      if (image.size > maxSize) {
        return next(
          new ErrorHandler(
            `File too large: ${image.name}. Maximum size is 2MB.`,
            400,
          ),
        );
      }
    }

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
      name.trim(),
      description.trim(),
      parsedPrice,
      category.trim(),
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

  // Check if product exists
  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  // ✅ WHITELIST allowed fields
  const allowedFields = ["name", "description", "price", "category", "stock"];
  const updates = [];
  const values = [];
  let index = 1;

  // ✅ Only update whitelisted fields
  if (name && allowedFields.includes("name")) {
    updates.push(`name = $${index}`);
    values.push(name.trim());
    index++;
  }

  if (description && allowedFields.includes("description")) {
    updates.push(`description = $${index}`);
    values.push(description.trim());
    index++;
  }

  if (price && allowedFields.includes("price")) {
    const parsedPrice = parseFloat(String(price).replace(/,/g, ""));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return next(
        new ErrorHandler("Please provide a valid product price.", 400),
      );
    }
    updates.push(`price = $${index}`);
    values.push(parsedPrice);
    index++;
  }

  if (category && allowedFields.includes("category")) {
    updates.push(`category = $${index}`);
    values.push(category.trim());
    index++;
  }

  if (stock !== undefined && allowedFields.includes("stock")) {
    const parsedStock = parseInt(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return next(
        new ErrorHandler("Please provide a valid stock quantity.", 400),
      );
    }
    updates.push(`stock = $${index}`);
    values.push(parsedStock);
    index++;
  }

  // Handle image updates
  let uploadedImages = product.rows[0].images;

  if (req.files && req.files.images) {
    // ✅ Validate images first
    const images = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    // Check file types and sizes
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    for (const image of images) {
      if (!allowedTypes.includes(image.mimetype)) {
        return next(new ErrorHandler(`Invalid file type: ${image.name}`, 400));
      }
      if (image.size > 2 * 1024 * 1024) {
        return next(new ErrorHandler(`File too large: ${image.name}`, 400));
      }
    }

    const newUploadedImages = [];
    for (const image of images) {
      try {
        const result = await cloudinary.uploader.upload(image.tempFilePath, {
          folder: "ShopSmart-AI_Product_Images",
          width: 1000,
          height: 1000,
          crop: "scale",
        });
        newUploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (error) {
        // ✅ If upload fails, old images are still safe
        return next(new ErrorHandler(`Failed to upload ${image.name}`, 500));
      }
    }

    // ✅ Only after successful upload, delete old images
    const oldImages = product.rows[0].images || [];
    if (oldImages.length > 0) {
      for (const image of oldImages) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (error) {
          console.error(`Failed to delete ${image.public_id}:`, error);
        }
      }
    }

    // ✅ Use the new images
    uploadedImages = newUploadedImages;
    updates.push(`images = $${index}`);
    values.push(JSON.stringify(uploadedImages));
    index++;
  }

  if (updates.length === 0) {
    return next(new ErrorHandler("No fields provided to update.", 400));
  }

  // ✅ Now safe because all field names are from whitelist
  values.push(productId);
  const result = await database.query(
    `UPDATE products SET ${updates.join(", ")} WHERE id = $${index} RETURNING *`,
    values,
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    updatedProduct: result.rows[0],
  });
});

export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const client = await database.connect();

  try {
    // Start transaction
    await client.query("BEGIN");

    // Check if product exists
    const product = await client.query("SELECT * FROM products WHERE id = $1", [
      productId,
    ]);

    if (product.rows.length === 0) {
      await client.query("ROLLBACK");
      return next(new ErrorHandler("Product not found.", 404));
    }

    const images = product.rows[0].images || [];

    // Delete product from database
    const deleteResult = await client.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [productId],
    );

    if (deleteResult.rows.length === 0) {
      return next(new ErrorHandler("Failed to delete product.", 500));
    }

    // Commit transaction - product is now permanently deleted
    await client.query("COMMIT");

    // Delete images from Cloudinary (after commit)
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
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
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

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully.",
    product: result.rows[0],
  });
});

export const postProductReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  // ✅ 1. Rating is REQUIRED
  if (rating === undefined || rating === null || rating === "") {
    return next(
      new ErrorHandler("Please provide a rating between 0 and 5.", 400),
    );
  }

  // ✅ 2. Validate rating
  const parsedRating = parseFloat(rating);
  if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
    return next(new ErrorHandler("Rating must be between 0 and 5.", 400));
  }

  const roundedRating = Math.round(parsedRating * 100) / 100;

  // ✅ 3. Validate comment if provided
  const MAX_COMMENT_LENGTH = 500;
  let cleanComment = null; // ✅ Default to NULL

  if (comment !== undefined && comment !== null) {
    const trimmedComment = comment.trim();
    if (trimmedComment.length > 0) {
      if (trimmedComment.length > MAX_COMMENT_LENGTH) {
        return next(
          new ErrorHandler(
            `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`,
            400,
          ),
        );
      }
      cleanComment = trimmedComment; // ✅ Only set if not empty
    }
  }

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
  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  // 6. Check if already reviewed
  const isAlreadyReviewed = await database.query(
    `SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2`,
    [productId, req.user.id],
  );

  let review;

  if (isAlreadyReviewed.rows.length > 0) {
    review = await database.query(
      "UPDATE reviews SET rating = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *",
      [roundedRating, cleanComment, productId, req.user.id],
    );
  } else {
    review = await database.query(
      "INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [productId, req.user.id, roundedRating, cleanComment],
    );
  }

  // ✅ 7. Update product average rating (rating is always provided)
  const allReviews = await database.query(
    `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1 AND rating IS NOT NULL`,
    [productId],
  );

  const newAvgRating = allReviews.rows[0].avg_rating || 0;

  const updatedProduct = await database.query(
    `UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`,
    [newAvgRating, productId],
  );

  res.status(200).json({
    success: true,
    message: "Review posted successfully.",
    review: review.rows[0],
    product: updatedProduct.rows[0], // ✅ Always available
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

export const fetchAIFilteredProducts = catchAsyncErrors(
  async (req, res, next) => {
    const { userPrompt } = req.body;

    if (!userPrompt || userPrompt.trim().length < 2) {
      return next(
        new ErrorHandler("Please provide a more detailed description.", 400),
      );
    }

    const filterKeywords = (query) => {
      const stopWords = new Set([
        "the", "they", "them", "then", "i", "we", "you", "he", "she",
        "it", "is", "a", "an", "of", "and", "or", "to", "for", "from",
        "on", "who", "whom", "why", "when", "which", "with", "this",
        "that", "in", "at", "by", "be", "not", "was", "were", "has",
        "have", "had", "do", "does", "did", "so", "some", "any", "how",
        "can", "could", "should", "would", "there", "here", "just",
        "than", "because", "but", "its", "it's", "if", "want", "need",
        "looking", "get", "buy", "purchase", "good", "best", "great",
        "nice", "perfect", "ideal",
      ]);

      return query
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 1 && !stopWords.has(word))
        .map((word) => `%${word}%`)
        .slice(0, 10);
    };

    const keywords = filterKeywords(userPrompt);

    if (keywords.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No meaningful keywords found in your prompt.",
        products: [],
      });
    }

    // STEP 1: Basic SQL Filtering
    const result = await database.query(
      `
        SELECT * FROM products
        WHERE (name ILIKE ANY($1)
        OR description ILIKE ANY($1)
        OR category ILIKE ANY($1))
        AND stock > 0
        ORDER BY ratings DESC, created_at DESC
        LIMIT 50;     
        `,
      [keywords],
    );

    const filteredProducts = result.rows;

    if (filteredProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found matching your prompt.",
        products: [],
      });
    }

    // STEP 2: AI FILTERING
    let finalProducts = [];
    let aiSuccess = false;

    try {
      const { success, products } = await getAIRecommendation(
        userPrompt,
        filteredProducts,
      );

      aiSuccess = success;

      // ✅ FIX: Only use AI results if successful
      if (success) {
        // ✅ AI returned results (even if empty array)
        finalProducts = products;
      } else {
        // ✅ AI failed (error), fallback to SQL
        console.log("⚠️ AI failed, falling back to SQL results");
        finalProducts = filteredProducts.slice(0, 10);
      }
    } catch (error) {
      // AI crashed
      console.error("❌ AI crashed:", error.message);
      finalProducts = filteredProducts.slice(0, 10);
    }

    // ✅ Check if AI successfully returned empty
    if (aiSuccess && finalProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found matching your request.",
        products: [],
      });
    }

    res.status(200).json({
      success: true,
      message: finalProducts.length > 0 ? "AI filtered products." : "No products found.",
      products: finalProducts,
    });
  },
);