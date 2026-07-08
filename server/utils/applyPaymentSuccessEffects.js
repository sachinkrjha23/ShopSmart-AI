export async function applyPaymentSuccessEffects(client, orderId, buyerId) {
  // Decrease product stock
  const { rows: items } = await client.query(
    `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
    [orderId],
  );

  for (const item of items) {
    await client.query(
      `UPDATE products
       SET stock = stock - $1
       WHERE id = $2 AND stock >= $1`,
      [item.quantity, item.product_id],
    );
  }

  // Record coupon usage
  const { rows: orderRows } = await client.query(
    `SELECT coupon_code FROM orders WHERE id = $1`,
    [orderId],
  );
  const couponCode = orderRows[0]?.coupon_code;

  if (couponCode) {
    const { rows: couponRows } = await client.query(
      `SELECT id FROM coupons WHERE UPPER(code) = $1`,
      [couponCode],
    );

    if (couponRows.length > 0) {
      const couponId = couponRows[0].id;

      const { rows: insertedUsage } = await client.query(
        `INSERT INTO coupon_usage (coupon_id, user_id, order_id) 
         VALUES ($1, $2, $3)
         ON CONFLICT (coupon_id, user_id, order_id) DO NOTHING
         RETURNING id`,
        [couponId, buyerId, orderId],
      );

      if (insertedUsage.length > 0) {
        await client.query(
          `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
          [couponId],
        );
      }
    }
  }
}