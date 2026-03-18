import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Features
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { UsersPage } from './features/users/UsersPage';
import { AuthorsPage } from './features/authors/AuthorsPage';
import { BooksPage } from './features/books/BooksPage';
import { PodcastsPage } from './features/podcasts/PodcastsPage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { BannersPage } from './features/banners/BannersPage';
import { ReviewsPage } from './features/reviews/ReviewsPage';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ReadersPage } from './features/readers/ReadersPage';
import { CouponsPage } from './features/coupons/CouponsPage';
import { ReferralsPage } from './features/referrals/ReferralsPage';

export const App = () => {
  return (
    <ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', fontSize: '0.85rem', boxShadow: 'var(--shadow-md)' },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/readers" element={<ReadersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/podcasts" element={<PodcastsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/banners" element={<BannersPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
