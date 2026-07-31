import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { addToCart, updateQuantity } from '../store/slices/cartSlice';

describe('cartSlice', () => {
  it('Test #15: updateQuantity recalculates totalQuantity and totalPrice correctly', () => {
    const store = configureStore({ reducer: { cart: cartReducer } });

    store.dispatch(addToCart({
      productId: 'p1', name: 'Product 1', image: 'img.jpg', price: 250, stock: 10, quantity: 1,
    }));

    store.dispatch(updateQuantity({ productId: 'p1', quantity: 4 }));

    const state = store.getState().cart;
    expect(state.items[0].quantity).toBe(4);
    expect(state.totalQuantity).toBe(4);
    expect(state.totalPrice).toBe(1000); // 250 * 4
  });

  it("caps the quantity at the item's available stock instead of silently overflowing", () => {
    const store = configureStore({ reducer: { cart: cartReducer } });

    store.dispatch(addToCart({
      productId: 'p2', name: 'Product 2', image: 'img.jpg', price: 100, stock: 5, quantity: 1,
    }));

    store.dispatch(updateQuantity({ productId: 'p2', quantity: 999 }));

    const state = store.getState().cart;
    expect(state.items[0].quantity).toBe(5); 
    expect(state.totalPrice).toBe(500); 
  });
});