import { useState, useEffect } from 'react';
import { Users, BookOpen, PenTool, Clock, IndianRupee, TrendingUp, BarChart3, Globe } from 'lucide-react';
import { StatCard, Card } from '../../components/ui/Cards';
import { Badge } from '../../components/ui/DataDisplay';
import api from '../../services/api';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));

    api.get('/admin/dashboard/analytics')
      .then(res => {
        setAnalytics(res?.data || null);
        setRecentPayments(res?.data?.recentPayments || []);
      })
      .catch(() => {
        setAnalytics(null);
        setRecentPayments([]);
      });
  }, []);

  const languageStats = analytics?.booksByLanguage || [];
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalBookPurchases = analytics?.totalBookPurchases || 0;

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', border: 'none' }}>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Welcome back, Admin</h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Here is your platform overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={loading ? '\u2014' : (stats?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          iconClass="stat-icon-blue"
        />
        <StatCard
          title="Active Authors"
          value={loading ? '\u2014' : (stats?.totalAuthors ?? 0).toLocaleString()}
          icon={PenTool}
          iconClass="stat-icon-amber"
        />
        <StatCard
          title="Published Books"
          value={loading ? '\u2014' : (stats?.totalBooks ?? 0).toLocaleString()}
          icon={BookOpen}
          iconClass="stat-icon-violet"
        />
        <StatCard
          title="Total Revenue"
          value={loading ? '\u2014' : `\u20B9${totalRevenue.toLocaleString()}`}
          icon={IndianRupee}
          iconClass="stat-icon-green"
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Book Analytics by Language */}
        <Card>
          <div style={{ padding: '20px' }}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Book Purchases by Language</h3>
            </div>
            {languageStats.length > 0 ? (
              <div className="space-y-3">
                {languageStats.map((lang, i) => {
                  const maxCount = Math.max(...languageStats.map(l => l.count || 0), 1);
                  const percentage = ((lang.count || 0) / maxCount) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{lang.language || 'Unknown'}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{(lang.count || 0).toLocaleString()} readers</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="h-2 rounded-full transition-all" style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, var(--accent), #8b5cf6)`,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <BarChart3 className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.4 }} />
                <p>No analytics data yet</p>
                <p className="text-xs mt-1">Book purchase data will appear here once available.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card>
          <div style={{ padding: '20px' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--success)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Payments</h3>
            </div>
            {recentPayments.length > 0 ? (
              <div className="space-y-2.5">
                {recentPayments.slice(0, 8).map((payment, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        {(payment.userName || 'N').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{payment.userName || 'N/A'}</p>
                        <p className="text-[0.65rem]" style={{ color: 'var(--text-muted)' }}>{payment.bookTitle || 'Book purchase'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: 'var(--success)' }}>{'\u20B9'}{(payment.amount || 0).toLocaleString()}</p>
                      <p className="text-[0.6rem]" style={{ color: 'var(--text-muted)' }}>
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <IndianRupee className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.4 }} />
                <p>No recent payments</p>
                <p className="text-xs mt-1">Payment activity will appear here.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Book Purchase Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Book Purchases"
          value={totalBookPurchases.toLocaleString()}
          icon={BookOpen}
          iconClass="stat-icon-blue"
        />
        <StatCard
          title="Pending Authors"
          value={loading ? '\u2014' : (stats?.pendingAuthors ?? 0).toLocaleString()}
          icon={Clock}
          iconClass="stat-icon-amber"
        />
      </div>
    </div>
  );
};
