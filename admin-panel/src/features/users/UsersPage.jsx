import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Select, Input, Textarea } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Users, Shield, ShieldOff, Eye, Plus, Edit, Trash2,
  X, Mail, Phone, User as UserIcon, Lock, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLE_META = {
  reader: { label: 'Reader', variant: 'info', description: 'App consumer only — can read books, listen to podcasts, watch videos.' },
  author: { label: 'Author', variant: 'warning', description: 'Content creator — can submit books, chapters, and audiobooks.' },
  admin: { label: 'Admin', variant: 'accent', description: 'Full management access to the admin panel.' },
  superadmin: { label: 'Super Admin', variant: 'accent', description: 'Unrestricted platform control.' },
};

const UserDetailDrawer = ({ user, onClose, onEdit, onBlock, onDelete }) => {
  if (!user) return null;
  const meta = ROLE_META[user.role] || { label: user.role, variant: 'neutral', description: '' };
  return (
    <div className="fixed inset-0 z-[70] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
      <div
        className="relative w-full max-w-md flex flex-col h-full overflow-y-auto"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>User Details</h3>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 py-8 px-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent-600), #a78bfa)' }}>
            {(user.name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{user.name || 'Unnamed'}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <Badge variant={user.isBlocked ? 'danger' : 'success'}>{user.isBlocked ? 'Blocked' : 'Active'}</Badge>
            {user.isVerified && <Badge variant="info">Verified</Badge>}
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pb-6 space-y-4">
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Account Info</h4>
            {[
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Phone, label: 'Phone', value: user.phone || '—' },
              { icon: UserIcon, label: 'Role', value: meta.label },
              { icon: CheckCircle, label: 'Joined', value: new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
              { icon: AlertCircle, label: 'Last Active', value: user.lastActive ? new Date(user.lastActive).toLocaleDateString('en-IN') : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-xs font-medium ml-auto" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Role Description</h4>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{meta.description}</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button icon={Edit} onClick={() => onEdit(user)} className="w-full justify-center">Edit User</Button>
            <Button icon={user.isBlocked ? Shield : ShieldOff}
              variant="secondary"
              className={`w-full justify-center ${user.isBlocked ? '!text-emerald-400' : '!text-orange-400'}`}
              onClick={() => onBlock(user)}>
              {user.isBlocked ? 'Unblock User' : 'Block User'}
            </Button>
            {user.role !== 'superadmin' && (
              <Button icon={Trash2} variant="secondary" className="w-full justify-center !text-red-400" onClick={() => onDelete(user)}>
                Delete User
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [viewUser, setViewUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data || []);
      setPagination(res.pagination || null);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      name: f.get('name'),
      email: f.get('email'),
      password: f.get('password'),
      phone: f.get('phone') || undefined,
      role: f.get('role'),
    };
    try {
      await api.post('/admin/users', payload);
      toast.success('User created successfully');
      setShowCreate(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      name: f.get('name'),
      email: f.get('email'),
      phone: f.get('phone') || undefined,
      role: f.get('role'),
    };
    const pw = f.get('password');
    if (pw) payload.password = pw;
    try {
      await api.put(`/admin/users/${editUser._id}`, payload);
      toast.success('User updated successfully');
      setEditUser(null);
      setViewUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleBlock = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/block`);
      toast.success(`User ${user.isBlocked ? 'unblocked' : 'blocked'}`);
      setViewUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update block status');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name || user.email}"? This is permanent.`)) return;
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('User deleted');
      setViewUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const roleColors = { reader: 'info', author: 'warning', admin: 'accent', superadmin: 'accent' };

  // Separate tabs: Admin vs Customer/Reader
  const [activeTab, setActiveTab] = useState('all');
  const tabFilter = activeTab === 'admins' ? 'admin' : activeTab === 'readers' ? 'reader' : '';

  const columns = [
    {
      header: 'User', key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
               style={{ background: `linear-gradient(135deg, var(--accent-600), #a78bfa)`, color: '#fff' }}>
            {(row.name || row.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.name || 'Unnamed'}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Role', key: 'role', render: (row) => <Badge variant={roleColors[row.role] || 'neutral'}>{ROLE_META[row.role]?.label || row.role}</Badge> },
    {
      header: 'Status', key: 'status',
      render: (row) => (
        <div className="flex gap-1.5">
          <Badge variant={row.isBlocked ? 'danger' : 'success'}>{row.isBlocked ? 'Blocked' : 'Active'}</Badge>
          {row.isVerified && <Badge variant="info">Verified</Badge>}
        </div>
      ),
    },
    { header: 'Joined', key: 'createdAt', render: (row) => <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(row.createdAt).toLocaleDateString()}</span> },
    {
      header: '', key: 'actions',
      render: (row) => (
        <div className="flex gap-0.5">
          <Button variant="ghost" size="sm" icon={Eye} data-tooltip="View" onClick={() => setViewUser(row)} />
          <Button variant="ghost" size="sm" icon={Edit} data-tooltip="Edit" onClick={() => setEditUser(row)} />
          <Button variant="ghost" size="sm" icon={row.isBlocked ? Shield : ShieldOff}
                  className={row.isBlocked ? '!text-emerald-400' : '!text-orange-400'}
                  data-tooltip={row.isBlocked ? 'Unblock' : 'Block'}
                  onClick={() => handleBlock(row)} />
          {row.role !== 'superadmin' && (
            <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400"
                    data-tooltip="Delete" onClick={() => handleDelete(row)} />
          )}
        </div>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: 'All Users' },
    { key: 'readers', label: 'Customers / Readers' },
    { key: 'admins', label: 'Admins' },
  ];

  // When tab changes, update roleFilter
  useEffect(() => {
    const newFilter = activeTab === 'admins' ? 'admin' : activeTab === 'readers' ? 'reader' : '';
    setRoleFilter(newFilter);
    setPage(1);
  }, [activeTab]);

  const UserFormFields = ({ user }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" name="name" defaultValue={user?.name} placeholder="John Doe" required />
        <Input label="Email Address" name="email" type="email" defaultValue={user?.email} placeholder="john@example.com" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone (optional)" name="phone" defaultValue={user?.phone} placeholder="+91 98765..." />
        <Select label="Role" name="role" defaultValue={user?.role || 'reader'}
          options={[
            { value: 'reader', label: '👤 Reader / Customer' },
            { value: 'author', label: '✍️ Author' },
            { value: 'admin', label: '🛡️ Admin' },
          ]} />
      </div>
      <Input label={user ? 'New Password (leave blank to keep)' : 'Password'} name="password" type="password"
        placeholder={user ? '••••••••' : 'Min 8 characters'} required={!user} />
    </>
  );

  return (
    <>
      <div className="space-y-5">
        <div className="page-header">
          <div>
            <h1 className="flex items-center gap-2.5"><Users className="w-5 h-5" style={{ color: 'var(--accent-400)' }} /> Users</h1>
            <p>{pagination ? `${pagination.total} total users` : 'Manage platform users'}</p>
          </div>
          <div className="page-actions">
            <SearchInput value={search} onChange={setSearch} placeholder="Search users..." className="w-64" />
            <Button icon={Plus} onClick={() => setShowCreate(true)}>Add User</Button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
          {tabItems.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={users} isLoading={loading} pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Create User Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New User" maxWidth="540px">
        <form className="space-y-4" onSubmit={handleCreate}>
          <UserFormFields />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" icon={Plus}>Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {editUser && (
        <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User" maxWidth="540px">
          <form className="space-y-4" onSubmit={handleEdit}>
            <UserFormFields user={editUser} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* User Detail Side Drawer */}
      {viewUser && (
        <UserDetailDrawer
          user={viewUser}
          onClose={() => setViewUser(null)}
          onEdit={(u) => { setEditUser(u); setViewUser(null); }}
          onBlock={handleBlock}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};
