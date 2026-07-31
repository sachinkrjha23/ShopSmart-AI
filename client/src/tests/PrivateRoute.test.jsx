import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect } from 'vitest';
import PrivateRoute from '../routes/PrivateRoute';

function renderWithAuthState(authState) {
  const store = configureStore({
    reducer: { auth: (state = authState) => state },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <div>Secret Content</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('PrivateRoute', () => {
  it('Test #12: redirects an unauthenticated user to the home page', () => {
    renderWithAuthState({ isAuthenticated: false, sessionChecked: true, user: null });

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders the protected content when the user is authenticated', () => {
    renderWithAuthState({ isAuthenticated: true, sessionChecked: true, user: { role: 'User' } });

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});