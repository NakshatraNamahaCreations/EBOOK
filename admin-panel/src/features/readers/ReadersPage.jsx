import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Input } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  BookOpen, Eye, Shield, ShieldOff, Trash2,
  X, Mail, Phone, User as UserIcon, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ReaderDetailDrawer = ({ user, onClose, onBlock, onDelete }) => {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-[70] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
      <div
        className="relative w-full max-w-md flex flex-col h-full overflow-y-auto"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Reader Details</h3>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 py-8 px-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)' }}>
            {(user.name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{user.name || 'Unnamed'}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge variant="info">Reader</Badge>
            <Badge variant={user.isBlocked ? 'danger' : 'success'}>{user.isBlocked ? 'Blocked' : 'Active'}</Badge>
            {user.isVerified && <Badge variant="info">Verified</Badge>}
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Account Info</h4>
            {[
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Phone, label: 'Phone', value: user.phone || '\u2014' },
              { icon: CheckCircle, label: 'Joined', value: new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
              { icon: AlertCircle, label: 'Last Active', value: user.lastActive ? new Date(user.lastActive).toLocaleDateString('en-IN') : '\u2014' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-xs font-medium ml-auto" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button icon={user.isBlocked ? Shield : ShieldOff}
              variant="secondary"
              className={`w-full justify-center ${user.isBlocked ? '!text-emerald-400' : '!text-orange-400'}`}
              onClick={() => onBlock(user)}>
              {user.isBlocked ? 'Unblock Reader' : 'Block Reader'}
            </Button>
            <Button icon={Trash2} variant="secondary" className="w-full justify-center !text-red-400" onClick={() => onDelete(user)}>
              Delete Reader
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReadersPage = () => {
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [viewReader, setViewReader] = useState(null);

  const fetchReaders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, role: 'reader' };
      if (search) params.search = search;
      const res = await api.get('/admin/users', { params });
      setReaders(res.data || []);
      setPagination(res.pagination || null);
    } catch {
      setReaders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReaders(); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchReaders(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleBlock = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/block`);
      toast.success(`Reader ${user.isBlocked ? 'unblocked' : 'blocked'}`);
      setViewReader(null);
      fetchReaders();
    } catch {
      toast.error('Failed to update block status');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete reader "${user.name || user.email}"? This is permanent.`)) return;
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('Reader deleted');
      setViewReader(null);
      fetchReaders();
    } catch (err) {
      toast.error(err.message || 'Failed to delete reader');
    }
  };

  const columns = [
    {
      header: 'Reader', key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
               style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)', color: '#fff' }}>
            {(row.name || row.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.name || 'Unnamed'}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Status', key: 'status',
      render: (row) => (
        <div className="flex gap-1.5">
          <Badge variant={row.isBlocked ? 'danger' : 'success'}>{row.isBlocked ? 'Blocked' : 'Active'}</Badge>
          {row.isVerified && <Badge variant="info">Verified</Badge>}
        </div>
      ),
    },
    { header: 'Phone', key: 'phone', render: (row) => <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.phone || '\u2014'}</span> },
    { header: 'Joined', key: 'createdAt', render: (row) => <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(row.createdAt).toLocaleDateString()}</span> },
    {
      header: '', key: 'actions',
      render: (row) => (
        <div className="flex gap-0.5">
          <Button variant="ghost" size="sm" icon={Eye} onClick={() => setViewReader(row)} />
          <Button variant="ghost" size="sm" icon={row.isBlocked ? Shield : ShieldOff}
                  className={row.isBlocked ? '!text-emerald-400' : '!text-orange-400'}
                  onClick={() => handleBlock(row)} />
          <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDelete(row)} />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-5">
        <div className="page-header">
          <div>
            <h1 className="flex items-center gap-2.5"><BookOpen className="w-5 h-5" style={{ color: 'var(--info)' }} /> Readers</h1>
            <p>{pagination ? `${pagination.total} readers` : 'Manage app readers'}</p>
          </div>
          <div className="page-actions">
            <SearchInput value={search} onChange={setSearch} placeholder="Search readers..." className="w-64" />
          </div>
        </div>

        <DataTable columns={columns} data={readers} isLoading={loading} pagination={pagination} onPageChange={setPage} />
      </div>

      {viewReader && (
        <ReaderDetailDrawer
          user={viewReader}
          onClose={() => setViewReader(null)}
          onBlock={handleBlock}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};
