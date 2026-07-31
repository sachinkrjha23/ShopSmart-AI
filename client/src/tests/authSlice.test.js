import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login } from '../store/slices/authSlice';

describe('authSlice', () => {
  it('Test #14: login.fulfilled stores the user and sets isAuthenticated to true', () => {
    const store = configureStore({ reducer: { auth: authReducer } });

    const fakeUser = {
      id: 'abc123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'User',
    };

    store.dispatch(login.fulfilled({ user: fakeUser, success: true }, 'fake-request-id', {}));

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(fakeUser);
    expect(state.loading).toBe(false);
  });
});
