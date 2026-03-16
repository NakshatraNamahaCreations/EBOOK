import { useState, useEffect } from 'react';
import { Users, BookOpen, PenTool, Clock } from 'lucide-react';
import { StatCard, Card } from '../../components/ui/Cards';
import api from '../../services/api';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

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
          value={loading ? '—' : (stats?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          iconClass="stat-icon-blue"
        />
        <StatCard
          title="Active Authors"
          value={loading ? '—' : (stats?.totalAuthors ?? 0).toLocaleString()}
          icon={PenTool}
          iconClass="stat-icon-amber"
        />
        <StatCard
          title="Published Books"
          value={loading ? '—' : (stats?.totalBooks ?? 0).toLocaleString()}
          icon={BookOpen}
          iconClass="stat-icon-violet"
        />
        <StatCard
          title="Pending Authors"
          value={loading ? '—' : (stats?.pendingAuthors ?? 0).toLocaleString()}
          icon={Clock}
          iconClass="stat-icon-green"
        />
      </div>

      {/* Empty chart area — charts need real time-series data from backend */}
      <Card>
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Charts coming soon</p>
          <p>Connect a time-series analytics endpoint to display revenue and signup trends.</p>
        </div>
      </Card>
    </div>
  );
};
