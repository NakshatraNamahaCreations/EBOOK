import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Input, Select } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatCard } from '../../components/ui/Cards';
import { Share2, Plus, Edit, Trash2, Users, Gift, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const ReferralsPage = () => {
  const [referrals, setReferrals] = useState([]);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ total: 0, successful: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/admin/referrals', { params });
      setReferrals(res?.data?.referrals || []);
      setSettings(res?.data?.settings || null);
      setStats(res?.data?.stats || { total: 0, successful: 0, pending: 0 });
    } catch {
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReferrals(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchReferrals, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const f = new FormData(e.target);
      const data = {
        referrerReward: Number(f.get('referrerReward') || 0),
        refereeReward: Number(f.get('refereeReward') || 0),
        rewardType: f.get('rewardType'),
        maxReferrals: Number(f.get('maxReferrals') || 0),
        isActive: f.get('isActive') === 'true',
      };
      await api.put('/admin/referrals/settings', data);
      toast.success('Referral settings updated');
      setShowSettings(false);
      fetchReferrals();
    } catch (err) {
      toast.error(err?.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const { total: totalReferrals, successful: successfulReferrals, pending: pendingReferrals } = stats;

  const columns = [
    {
      header: 'Referrer', key: 'referrer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {(row.referrerId?.name || row.referrerId?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.referrerId?.name || 'Unknown'}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.referrerId?.email || ''}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Referred User', key: 'referee',
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.refereeId?.name || 'Unknown'}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.refereeId?.email || ''}</p>
        </div>
      ),
    },
    {
      header: 'Code', key: 'referralCode',
      render: (row) => (
        <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>{row.referralCode || '\u2014'}</span>
      ),
    },
    {
      header: 'Status', key: 'status',
      render: (row) => (
        <Badge variant={row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'neutral'}>
          {row.status || 'pending'}
        </Badge>
      ),
    },
    {
      header: 'Reward', key: 'reward',
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
          {row.rewardAmount ? `₹${row.rewardAmount}` : '—'}
        </span>
      ),
    },
    {
      header: 'Date', key: 'createdAt',
      render: (row) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
            Referrals
          </h1>
          <p>Manage referral program</p>
        </div>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Search referrals..." className="w-56" />
          <Button variant="secondary" icon={Edit} onClick={() => setShowSettings(true)}>Settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Referrals" value={totalReferrals.toString()} icon={Users} iconClass="stat-icon-blue" />
        <StatCard title="Successful" value={successfulReferrals.toString()} icon={Gift} iconClass="stat-icon-green" />
        <StatCard title="Pending" value={pendingReferrals.toString()} icon={TrendingUp} iconClass="stat-icon-amber" />
      </div>

      <DataTable columns={columns} data={referrals} isLoading={loading} />

      <Modal isOpen={showSettings} onClose={() => { if (!submitting) setShowSettings(false); }} title="Referral Settings">
        <form className="space-y-4" onSubmit={handleUpdateSettings}>
          <Select label="Reward Type" name="rewardType" defaultValue={settings?.rewardType || 'discount'}
            options={[
              { value: 'discount', label: 'Discount (%)' },
              { value: 'cashback', label: 'Cashback (₹)' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Referrer Reward" name="referrerReward" type="number" placeholder="e.g. 10" defaultValue={settings?.referrerReward || ''} />
            <Input label="Referee Reward" name="refereeReward" type="number" placeholder="e.g. 5" defaultValue={settings?.refereeReward || ''} />
          </div>
          <Input label="Max Referrals Per User (0 = unlimited)" name="maxReferrals" type="number" placeholder="0" defaultValue={settings?.maxReferrals || ''} />
          <Select label="Status" name="isActive" defaultValue={String(settings?.isActive ?? true)}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" disabled={submitting} onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Settings'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
