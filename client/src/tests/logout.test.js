import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout } from '../store/slices/authSlice';
import cartReducer, { addToCart } from '../store/slices/cartSlice';

describe('logout', () => {
  it('Test #17: logout clears both auth state and cart state together', () => {
    const store = configureStore({
      reducer: { auth: authReducer, cart: cartReducer },
    });

    // Simulate: user is logged in, and has something in their cart
    const fakeUser = { id: 'user1', name: 'Test User', role: 'User' };
    store.dispatch(login.fulfilled({ user: fakeUser, success: true }, 'req-1', {}));
    store.dispatch(addToCart({
      productId: 'p1', name: 'Product 1', image: 'img.jpg', price: 300, stock: 5, quantity: 2,
    }));

    // Sanity check before logout: state should actually reflect the logged-in, non-empty-cart setup
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().cart.items.length).toBe(1);

    // Now log out
    store.dispatch(logout.fulfilled(undefined, 'req-2', undefined));

    const authState = store.getState().auth;
    const cartState = store.getState().cart;

    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBeNull();

    expect(cartState.items).toEqual([]);
    expect(cartState.totalQuantity).toBe(0);
    expect(cartState.totalPrice).toBe(0);
  });
});