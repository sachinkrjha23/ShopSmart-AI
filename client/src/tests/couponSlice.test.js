import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import couponReducer, { applyCoupon } from '../store/slices/couponSlice';

describe('couponSlice', () => {
  it('Test #16: an invalid/expired coupon sets an error and does NOT apply a discount', () => {
    const store = configureStore({ reducer: { coupon: couponReducer } });

    store.dispatch(
      applyCoupon.fulfilled(
        { coupon: { code: 'OLD10', type: 'flat' }, discountAmount: 50, finalAmount: 450, cartTotal: 500, eligibleAmount: 500 },
        'req-1',
        {}
      )
    );

    store.dispatch(applyCoupon.rejected(null, 'req-2', {}, 'This coupon has expired.'));

    const state = store.getState().coupon;
    expect(state.error).toBe('This coupon has expired.');
    expect(state.coupon).toBeNull();
    expect(state.discount).toBe(0);
    expect(state.finalAmount).toBeNull();
  });
});