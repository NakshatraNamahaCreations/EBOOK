import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, PenTool, BookOpen, Headphones, Radio, Video,
  Image as ImageIcon, Wallet, CreditCard, Bell, MessageSquare, CalendarDays,
  Tags, Settings, LogOut, Menu, X, ChevronRight, Sun, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { group: 'Overview', items: [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ]},
  { group: 'People', items: [
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Authors', path: '/authors', icon: PenTool },
  ]},
  { group: 'Content', items: [
    { name: 'Books', path: '/books', icon: BookOpen },
    { name: 'Audiobooks', path: '/audiobooks', icon: Headphones },
    { name: 'Podcasts', path: '/podcasts', icon: Radio },
    { name: 'Videos', path: '/videos', icon: Video },
  ]},
  { group: 'Revenue', items: [
    { name: 'Wallet & Coins', path: '/wallet', icon: Wallet },
    { name: 'Payments', path: '/payments', icon: CreditCard },
  ]},
  { group: 'Engage', items: [
    { name: 'Banners', path: '/banners', icon: ImageIcon },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Reviews', path: '/reviews', icon: MessageSquare },
  ]},
  { group: 'System', items: [
    { name: 'Releases', path: '/releases', icon: CalendarDays },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]}
];

const pageTitles = {
  '/dashboard': 'Dashboard', '/users': 'Users', '/authors': 'Authors',
  '/books': 'Books', '/audiobooks': 'Audiobooks', '/podcasts': 'Podcasts',
  '/videos': 'Videos', '/wallet': 'Wallet & Coins', '/payments': 'Payments',
  '/banners': 'Banners', '/notifications': 'Notifications', '/reviews': 'Reviews',
  '/releases': 'Release Planner', '/categories': 'Categories & Tags', '/settings': 'Settings',
};

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const pageTitle = pageTitles[location.pathname] || 'BookVault';

  const handleLogout = () => {
    localStorage.removeItem('bv_admin_token');
    localStorage.removeItem('bv_admin_user');
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 'var(--sidebar-width)', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white text-xs"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              BV
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>BookVault</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              <p className="px-3 mb-1.5 text-[0.65rem] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-light)' : 'transparent',
                      transition: 'all 0.15s',
                      textDecoration: 'none',
                    })}
                    onMouseEnter={e => {
                      if (!e.currentTarget.classList.contains('active')) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                      }
                    }}
                    onMouseLeave={e => {
                      const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                      e.currentTarget.style.background = isActive ? 'var(--accent-light)' : 'transparent';
                    }}
                  >
                    <item.icon className="w-[17px] h-[17px] flex-shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded" style={{ color: 'var(--text-muted)' }}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>Admin</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{pageTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title={isDark ? 'Switch to light' : 'Switch to dark'}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <button className="relative p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }}></span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>A</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-5 lg:p-7">
          <div className="max-w-[1400px] mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};
