import { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Select } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Forms';
import { PenTool, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AuthorsPage = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editAuthor, setEditAuthor] = useState(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/authors', { params });
      setAuthors(res?.data || []);
      setPagination(res?.pagination || null);
    } catch {
      setAuthors([]);
      toast.error('Failed to fetch authors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuthors(); }, [page, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchAuthors(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/authors/${id}/approve`);
      toast.success('Author approved');
      fetchAuthors();
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleRevoke = async (id) => {
    try {
      await api.patch(`/admin/authors/${id}/revoke`);
      toast.success('Approval revoked');
      fetchAuthors();
    } catch {
      toast.error('Failed to revoke');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete author "${name}"? This will also delete their user account.`)) return;
    try {
      await api.delete(`/admin/authors/${id}`);
      toast.success('Author deleted');
      fetchAuthors();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const f = new FormData(e.target);
      await api.post('/admin/authors', {
        displayName: f.get('displayName'),
        email: f.get('email'),
        password: f.get('password'),
        bio: f.get('bio') || '',
        authorType: f.get('authorType') || 'self',
      });
      toast.success('Author created');
      setShowCreate(false);
      e.target.reset();
      fetchAuthors();
    } catch (err) {
      toast.error(err?.message || 'Failed to create author');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const f = new FormData(e.target);
      await api.put(`/admin/authors/${editAuthor._id}`, {
        displayName: f.get('displayName'),
        bio: f.get('bio') || '',
        socialLinks: {
          website: f.get('website') || '',
          twitter: f.get('twitter') || '',
          instagram: f.get('instagram') || '',
        },
        contentPermissions: {
          canUploadBooks: f.get('canUploadBooks') === 'true',
          canUploadPodcasts: f.get('canUploadPodcasts') === 'true',
          canUploadVideos: f.get('canUploadVideos') === 'true',
          canUseYoutubeLinks: f.get('canUseYoutubeLinks') === 'true',
        },
      });
      toast.success('Author updated');
      setEditAuthor(null);
      fetchAuthors();
    } catch (err) {
      toast.error(err?.message || 'Failed to update author');
    } finally {
      setEditSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Author',
      key: 'displayName',
      align: 'left',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: row.authorType === 'third_party' ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
          >
            {(row.displayName || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {row.displayName}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'authorType',
      align: 'center',
      render: (row) => (
        <Badge variant={row.authorType === 'third_party' ? 'info' : 'accent'}>
          {row.authorType === 'third_party' ? 'Third Party' : 'Self'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      key: 'isApproved',
      align: 'center',
      render: (row) => (
        <Badge variant={row.isApproved ? 'success' : 'warning'}>
          {row.isApproved ? 'Approved' : 'Pending'}
        </Badge>
      ),
    },
    {
      header: 'Earnings',
      key: 'totalEarnings',
      align: 'center',
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
          ₹{(row.totalEarnings || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Joined',
      key: 'createdAt',
      align: 'center',
      render: (row) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: '',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-0.5">
          {row.isApproved ? (
            <Button
              variant="ghost"
              size="sm"
              icon={XCircle}
              title="Revoke approval"
              className="!text-amber-400"
              onClick={() => handleRevoke(row._id)}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={CheckCircle}
              title="Approve"
              className="!text-emerald-400"
              onClick={() => handleApprove(row._id)}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={() => setEditAuthor(row)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="!text-red-400"
            onClick={() => handleDelete(row._id, row.displayName)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5">
            <PenTool className="w-5 h-5" style={{ color: '#f59e0b' }} />
            Authors
          </h1>
          <p>{pagination ? `${pagination.total} authors` : 'Manage all authors'}</p>
        </div>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Search authors..." className="w-56" />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'approved', label: 'Approved' },
              { value: 'pending', label: 'Pending' },
            ]}
            className="!w-36"
          />
          <Button icon={Plus} onClick={() => setShowCreate(true)}>Add Author</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={authors}
        isLoading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      {/* ── Create Modal ── */}
      <Modal
        isOpen={showCreate}
        onClose={() => { if (!createSubmitting) setShowCreate(false); }}
        title="Add New Author"
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <Input label="Display Name" name="displayName" placeholder="e.g. Salil Javeri" required />
          <Input label="Email" name="email" type="email" placeholder="author@example.com" required />
          <Input label="Password" name="password" type="password" placeholder="Min 6 characters" required />
          <Select label="Author Type" name="authorType"
            options={[
              { value: 'self', label: 'Self (In-house)' },
              { value: 'third_party', label: 'Third Party' },
            ]}
          />
          <Textarea label="Bio" name="bio" placeholder="Short bio about the author" rows={3} />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={createSubmitting}
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSubmitting}>
              {createSubmitting ? 'Creating...' : 'Create Author'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      {editAuthor && (
        <Modal
          isOpen={!!editAuthor}
          onClose={() => { if (!editSubmitting) setEditAuthor(null); }}
          title="Edit Author"
        >
          <form className="space-y-4" onSubmit={handleEdit}>
            <Input label="Display Name" name="displayName" defaultValue={editAuthor.displayName} required />
            <Textarea label="Bio" name="bio" defaultValue={editAuthor.bio || ''} rows={3} />

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Social Links
              </p>
              <div className="space-y-2">
                <Input label="Website" name="website" placeholder="https://..." defaultValue={editAuthor.socialLinks?.website || ''} />
                <Input label="Twitter" name="twitter" placeholder="@handle" defaultValue={editAuthor.socialLinks?.twitter || ''} />
                <Input label="Instagram" name="instagram" placeholder="@handle" defaultValue={editAuthor.socialLinks?.instagram || ''} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Content Permissions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'canUploadBooks', label: 'Upload Books' },
                  { key: 'canUploadPodcasts', label: 'Upload Podcasts' },
                  { key: 'canUploadVideos', label: 'Upload Videos' },
                  { key: 'canUseYoutubeLinks', label: 'YouTube Links' },
                ].map(({ key, label }) => (
                  <Select
                    key={key}
                    label={label}
                    name={key}
                    defaultValue={String(editAuthor.contentPermissions?.[key] ?? false)}
                    options={[
                      { value: 'true', label: 'Allowed' },
                      { value: 'false', label: 'Not Allowed' },
                    ]}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={editSubmitting}
                onClick={() => setEditAuthor(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
