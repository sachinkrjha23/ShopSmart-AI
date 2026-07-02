import database from "../database/db.js";

export const createCategoriesTable = async () => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Case-insensitive uniqueness — stops "Electronics" and "electronics"
  // from existing as two separate categories
  await database.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_lower
    ON categories (LOWER(name));
  `);

  const defaultCategories = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Beauty & Personal Care",
    "Books",
    "Sports & Fitness",
    "Toys & Games",
    "Grocery",
    "Health & Wellness",
    "Automotive",
  ];

  for (const category of defaultCategories) {
    await database.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (LOWER(name)) DO NOTHING`,
      [category],
    );
  }

  console.log("✅ Categories table ready");
};