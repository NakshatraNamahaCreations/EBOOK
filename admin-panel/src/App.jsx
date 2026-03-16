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
import { AudiobooksPage } from './features/audiobooks/AudiobooksPage';
import { PodcastsPage } from './features/podcasts/PodcastsPage';
import { VideosPage } from './features/videos/VideosPage';
import { WalletPage } from './features/wallet/WalletPage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { BannersPage } from './features/banners/BannersPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { ReviewsPage } from './features/reviews/ReviewsPage';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { SettingsPage } from './features/settings/SettingsPage';

const PlaceholderView = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
    <div className="empty-state">
      <div className="empty-state-icon"><span className="text-2xl">✨</span></div>
      <h3>{title}</h3>
      <p>This module will be built in the next phase.</p>
    </div>
  </div>
);

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
            <Route path="/users" element={<UsersPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/audiobooks" element={<AudiobooksPage />} />
            <Route path="/podcasts" element={<PodcastsPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/banners" element={<BannersPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/releases" element={<PlaceholderView title="Release Planner" />} />
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
