import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Forms';
import { Video, Plus, Edit, Trash2, Play, Youtube } from 'lucide-react';
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

export const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  
  // Author data for creation
  const [authors, setAuthors] = useState([]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/videos', { params: { search } });
      setVideos(res.data || []);
    } catch {
      setVideos([]);
    } finally { setLoading(false); }
  };

  const fetchAuthors = async () => {
    try {
      const res = await api.get('/admin/authors');
      setAuthors(res.data || []);
    } catch { setAuthors([]); }
  };

  useEffect(() => { fetchVideos(); fetchAuthors(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchVideos, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    try { await api.delete(`/admin/videos/${id}`); toast.success('Video deleted'); fetchVideos(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = {
      title: f.get('title'),
      sourceType: f.get('sourceType'),
      youtubeUrl: f.get('youtubeUrl'),
      isFree: f.get('isFree') === 'true',
      coinCost: Number(f.get('coinCost') || 0),
      status: f.get('status'),
    };
    try {
      await api.put(`/admin/videos/${editVideo._id}`, data);
      toast.success('Video updated');
      setEditVideo(null);
      fetchVideos();
    } catch (err) { toast.error(err.message || 'Failed to update'); }
  };

  const columns = [
    {
      header: 'Video', key: 'title', align: 'left',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded-md flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #ef4444, #ec4899)', boxShadow: '0 2px 8px rgba(239,68,68,0.2)' }}>
            <Play className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              {row.title}
              {row.sourceType === 'youtube_link' && <Youtube className="w-3 h-3 text-red-400" />}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDuration(row.duration)}</p>
          </div>
        </div>
      ),
    },
    { header: 'Source', key: 'sourceType', align: 'center', render: (row) => <Badge variant={row.sourceType === 'youtube_link' ? 'danger' : 'info'}>{row.sourceType === 'youtube_link' ? 'YouTube' : 'Upload'}</Badge> },
    { header: 'Price', key: 'isFree', align: 'center', render: (row) => row.isFree ? <Badge variant="success">Free</Badge> : <span className="text-sm font-semibold inline-block" style={{ color: '#f59e0b' }}>{row.coinCost} coins</span> },
    { header: 'Views', key: 'viewCount', align: 'center', render: (row) => <span className="text-sm inline-block" style={{ color: 'var(--text-secondary)' }}>{(row.viewCount || 0).toLocaleString()}</span> },
    { header: 'Status', key: 'status', align: 'center', render: (row) => <Badge variant={row.status === 'published' ? 'success' : 'neutral'}>{row.status || 'draft'}</Badge> },
    {
      header: '', key: 'actions', align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => setEditVideo(row)} />
          <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDelete(row._id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5"><Video className="w-5 h-5" style={{ color: '#ef4444' }} /> Videos</h1>
          <p>{videos.length} videos</p>
        </div>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Search..." className="w-56" />
          <Button icon={Plus} onClick={() => setShowCreate(true)}>Add Video</Button>
        </div>
      </div>

      <DataTable columns={columns} data={videos} isLoading={loading} />

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Video" >
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.target);
          const data = {
            title: f.get('title'),
            authorId: f.get('authorId'),
            sourceType: f.get('sourceType'),
            youtubeUrl: f.get('youtubeUrl'),
            isFree: f.get('isFree') === 'true',
            coinCost: Number(f.get('coinCost') || 0),
          };
          try {
            await api.post('/admin/videos', data);
            toast.success('Video added');
            setShowCreate(false);
            fetchVideos();
          } catch (err) { toast.error(err.message || 'Failed to add video'); }
        }}>
          <Input label="Title" name="title" placeholder="Video title" required />
          <Select label="Author" name="authorId" required options={[
            { value: '', label: 'Select author' },
            ...authors.map(a => ({ value: a._id, label: a.displayName || a.name }))
          ]} />
          <Select label="Source" name="sourceType" required options={[{ value: 'youtube_link', label: 'YouTube Link' }, { value: 'uploaded_video', label: 'Upload' }]} />
          <Input label="YouTube URL" name="youtubeUrl" placeholder="https://youtube.com/..." />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Pricing" name="isFree" required options={[{ value: 'true', label: 'Free' }, { value: 'false', label: 'Paid' }]} />
            <Input label="Coin Cost" name="coinCost" type="number" placeholder="0" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editVideo && (
        <Modal isOpen={!!editVideo} onClose={() => setEditVideo(null)} title="Edit Video" >
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <Input label="Title" name="title" defaultValue={editVideo.title} required />
            <Select label="Source" name="sourceType" defaultValue={editVideo.sourceType}
              options={[{ value: 'youtube_link', label: 'YouTube Link' }, { value: 'uploaded_video', label: 'Upload' }]} />
            <Input label="YouTube URL" name="youtubeUrl" defaultValue={editVideo.youtubeUrl || editVideo.youtubeMeta?.url || ''} placeholder="https://youtube.com/..." />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Pricing" name="isFree" defaultValue={editVideo.isFree ? 'true' : 'false'}
                options={[{ value: 'true', label: 'Free' }, { value: 'false', label: 'Paid' }]} />
              <Input label="Coin Cost" name="coinCost" type="number" defaultValue={editVideo.coinCost || 0} />
            </div>
            <Select label="Status" name="status" defaultValue={editVideo.status || 'draft'}
              options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditVideo(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
