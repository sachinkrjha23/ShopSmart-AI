import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect } from 'vitest';
import AdminRoute from '../routes/AdminRoute';

function renderWithAuthState(authState) {
  const store = configureStore({
    reducer: { auth: (state = authState) => state },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Dashboard</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('AdminRoute', () => {
  it('Test #13: redirects a logged-in customer (role "User") away from admin pages', () => {
    renderWithAuthState({
      isAuthenticated: true,
      sessionChecked: true,
      user: { role: 'User' },
    });

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('renders the admin content when the user actually has role "Admin"', () => {
    renderWithAuthState({
      isAuthenticated: true,
      sessionChecked: true,
      user: { role: 'Admin' },
    });

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});