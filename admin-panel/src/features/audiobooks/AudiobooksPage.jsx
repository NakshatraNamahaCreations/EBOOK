import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Select } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Forms';
import { Headphones, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const formatDuration = (s) => {
  if (!s) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
};

export const AudiobooksPage = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editTrack, setEditTrack] = useState(null);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (bookFilter) params.bookId = bookFilter;
      const res = await api.get('/admin/audiobooks', { params });
      setTracks(res.data || []);
      setPagination(res.pagination || null);
    } catch {
      setTracks([]);
    } finally { setLoading(false); }
  };

  const fetchBooks = async () => {
    try {
      const res = await api.get('/admin/books', { params: { limit: 100, contentType: 'audiobook' } });
      const list =
        res?.data?.books ||
        res?.books ||
        res?.data?.data ||
        res?.data ||
        [];
      const audioOnly = Array.isArray(list) ? list.filter(b => b.contentType === 'audiobook') : [];
      setBooks(audioOnly);
    } catch {
      setBooks([]);
    }
  };

  useEffect(() => { fetchBooks(); }, []);
  useEffect(() => { fetchTracks(); }, [page, bookFilter]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchTracks(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this audiobook track?')) return;
    try { await api.delete(`/admin/audiobooks/${id}`); toast.success('Track deleted'); fetchTracks(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleTogglePublish = async (id) => {
    try { await api.patch(`/admin/audiobooks/${id}/publish`); toast.success('Status updated'); fetchTracks(); }
    catch { toast.error('Failed to update status'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.post('/admin/audiobooks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Track created');
      setShowCreate(false);
      fetchTracks();
    } catch (err) { toast.error(err.message || 'Failed to create track'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const audioFile = formData.get('audioFile');
    const hasFile = audioFile && audioFile instanceof File && audioFile.size > 0;

    try {
      if (hasFile) {
        // Only use multipart when there's actually an audio file to upload
        await api.put(`/admin/audiobooks/${editTrack._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Send as JSON when no file — avoids triggering S3 upload
        const payload = {
          title: formData.get('title'),
          audioUrl: formData.get('audioUrl') || undefined,
          narrator: formData.get('narrator') || '',
          duration: Number(formData.get('duration')) || 0,
          status: formData.get('status'),
        };
        await api.put(`/admin/audiobooks/${editTrack._id}`, payload);
      }
      toast.success('Track updated');
      setEditTrack(null);
      fetchTracks();
    } catch (err) { toast.error(err.message || 'Failed to update'); }
  };

  const bookLabel = (b) => b.bookLanguage ? `${b.title} (${b.bookLanguage})` : b.title;
  const bookOptions = [
    { value: '', label: 'All books' },
    ...books.map(b => ({ value: b._id, label: bookLabel(b) })),
  ];
  const bookSelectOptions = [
    { value: '', label: 'Select book' },
    ...books.map(b => ({ value: b._id, label: bookLabel(b) })),
  ];
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];
  const columns = [
    {
      header: 'Track', key: 'title', align: 'left',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.title}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {row.narrator || 'No narrator'} · {formatDuration(row.duration)}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Book', key: 'bookId', align: 'left',
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.bookId?.title || '—'}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {row.bookId?.authorId?.displayName || row.bookId?.authorId?.name || ''}
          </p>
        </div>
      ),
    },
    { header: 'Language', key: 'bookLanguage', align: 'center', render: (row) => <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.bookId?.bookLanguage || '\u2014'}</span> },
    { header: 'Status', key: 'status', align: 'center', render: (row) => <Badge variant={row.status === 'published' ? 'success' : row.status === 'archived' ? 'danger' : 'neutral'}>{row.status}</Badge> },
    { header: 'Listens', key: 'listenCount', align: 'center', render: (row) => <span className="text-sm inline-block" style={{ color: 'var(--text-secondary)' }}>{(row.listenCount || 0).toLocaleString()}</span> },
    {
      header: '', key: 'actions', align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-0.5">
          <Button
            variant="ghost" size="sm"
            icon={row.status === 'published' ? Pause : Play}
            title={row.status === 'published' ? 'Unpublish' : 'Publish'}
            className={row.status === 'published' ? '!text-green-500' : ''}
            onClick={() => handleTogglePublish(row._id)}
          />
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => setEditTrack(row)} />
          <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDelete(row._id)} />
        </div>
      ),
    },
  ];

  const TrackForm = ({ defaultValues = {}, onSubmit, onCancel, submitLabel = 'Create Track', isEdit = false }) => (
    <form className="space-y-4" onSubmit={onSubmit}>
      {!isEdit && <Select label="Book" name="bookId" required options={bookSelectOptions} defaultValue={defaultValues.bookId?._id || defaultValues.bookId || ''} />}
      <Input label="Track Title" name="title" placeholder="Enter track title" required defaultValue={defaultValues.title || ''} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Upload Audio (MP3)" type="file" name="audioFile" accept="audio/*" />
        <Input label="Or enter Audio URL" name="audioUrl" placeholder="https://..." defaultValue={defaultValues.audioUrl || ''} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Narrator" name="narrator" placeholder="Narrator name" defaultValue={defaultValues.narrator || ''} />
        <Input label="Duration (seconds)" name="duration" type="number" placeholder="0" defaultValue={defaultValues.duration || 0} />
      </div>
      <Select label="Status" name="status" options={statusOptions} defaultValue={defaultValues.status || 'draft'} />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5">
            <Headphones className="w-5 h-5" style={{ color: '#6366f1' }} />
            Audiobooks
          </h1>
          <p>{pagination ? `${pagination.total} tracks` : 'Manage audiobook tracks'}</p>
        </div>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tracks..." className="w-52" />
          <Select value={bookFilter} onChange={e => { setBookFilter(e.target.value); setPage(1); }}
            options={bookOptions} className="!w-44" />
          <Button icon={Plus} onClick={() => setShowCreate(true)}>Add Track</Button>
        </div>
      </div>

      <DataTable columns={columns} data={tracks} isLoading={loading} pagination={pagination} onPageChange={setPage} />

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Audiobook Track" >
        <TrackForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create Track" />
      </Modal>

      {/* Edit Modal */}
      {editTrack && (
        <Modal isOpen={!!editTrack} onClose={() => setEditTrack(null)} title="Edit Audiobook Track" >
          <TrackForm
            defaultValues={editTrack}
            onSubmit={handleEdit}
            onCancel={() => setEditTrack(null)}
            submitLabel="Save Changes"
            isEdit
          />
        </Modal>
      )}
    </div>
  );
};
