import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Forms';
import { Radio, Plus, Edit, Trash2, List, ChevronLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const PodcastsPage = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editSeries, setEditSeries] = useState(null);

  // Episodes sub-panel
  const [currentSeries, setCurrentSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [showAddEpisode, setShowAddEpisode] = useState(false);
  const [editEpisode, setEditEpisode] = useState(null);
  
  // Author data for creation
  const [authors, setAuthors] = useState([]);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/podcast-series', { params: { search } });
      setSeries(res.data || []);
    } catch {
      setSeries([]);
    } finally { setLoading(false); }
  };

  const fetchAuthors = async () => {
    try {
      const res = await api.get('/admin/authors');
      setAuthors(res.data || []);
    } catch { setAuthors([]); }
  };

  const fetchEpisodes = async (seriesId) => {
    setEpisodesLoading(true);
    try {
      const res = await api.get(`/admin/podcast-series/${seriesId}/episodes`);
      setEpisodes(res.data || []);
    } catch {
      setEpisodes([]);
    } finally { setEpisodesLoading(false); }
  };

  useEffect(() => { fetchSeries(); fetchAuthors(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchSeries, 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Series CRUD ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Archive this podcast series?')) return;
    try { await api.delete(`/admin/podcast-series/${id}`); toast.success('Series archived'); fetchSeries(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = { title: f.get('title'), description: f.get('description'), status: f.get('status') };
    try {
      await api.put(`/admin/podcast-series/${editSeries._id}`, data);
      toast.success('Series updated');
      setEditSeries(null);
      fetchSeries();
    } catch (err) { toast.error(err.message || 'Failed to update'); }
  };

  // ── Episode CRUD ─────────────────────────────────────────────────
  const handleAddEpisode = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = {
      title: f.get('title'),
      episodeNumber: Number(f.get('episodeNumber')),
      youtubeUrl: f.get('youtubeUrl'),
      description: f.get('description'),
      isFree: f.get('isFree') === 'true',
      coinCost: Number(f.get('coinCost') || 0),
    };
    try {
      await api.post(`/admin/podcast-series/${currentSeries._id}/episodes`, data);
      toast.success('Episode added');
      setShowAddEpisode(false);
      fetchEpisodes(currentSeries._id);
    } catch (err) { toast.error(err.message || 'Failed to add episode'); }
  };

  const handleEditEpisode = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = {
      title: f.get('title'),
      episodeNumber: Number(f.get('episodeNumber')),
      youtubeUrl: f.get('youtubeUrl'),
      description: f.get('description'),
      isFree: f.get('isFree') === 'true',
      coinCost: Number(f.get('coinCost') || 0),
      status: f.get('status'),
    };
    try {
      await api.put(`/admin/podcast-episodes/${editEpisode._id}`, data);
      toast.success('Episode updated');
      setEditEpisode(null);
      fetchEpisodes(currentSeries._id);
    } catch (err) { toast.error(err.message || 'Failed to update episode'); }
  };

  const handleDeleteEpisode = async (episodeId) => {
    if (!window.confirm('Delete this episode?')) return;
    try {
      await api.delete(`/admin/podcast-episodes/${episodeId}`);
      toast.success('Episode deleted');
      fetchEpisodes(currentSeries._id);
    } catch { toast.error('Failed to delete episode'); }
  };

  const openEpisodes = (s) => {
    setCurrentSeries(s);
    fetchEpisodes(s._id);
  };

  // ── Episodes Panel ──────────────────────────────────────────────
  if (currentSeries) {
    return (
      <div className="space-y-5">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => { setCurrentSeries(null); setEpisodes([]); }} />
            <div>
              <h1 className="flex items-center gap-2.5">
                <Radio className="w-5 h-5" style={{ color: 'var(--success)' }} />
                {currentSeries.title} — Episodes
              </h1>
              <p>{episodes.length} episode{episodes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="page-actions">
            <Button icon={Plus} onClick={() => setShowAddEpisode(true)}>Add Episode</Button>
          </div>
        </div>

        <DataTable
          columns={[
            { header: 'Ep.', key: 'episodeNumber', render: row => <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>{row.episodeNumber}</span> },
            { header: 'Title', key: 'title', render: row => <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.title}</span> },
            { header: 'Status', key: 'status', render: row => <Badge variant={row.status === 'published' ? 'success' : 'neutral'}>{row.status}</Badge> },
            { header: 'Access', key: 'isFree', render: row => row.isFree ? <Badge variant="success">Free</Badge> : <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>{row.coinCost} coins</span> },
            { header: '', key: 'actions', render: row => (
              <div className="flex justify-end gap-0.5">
                <Button variant="ghost" size="sm" icon={Edit} title="Edit episode" onClick={() => setEditEpisode(row)} />
                <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDeleteEpisode(row._id)} />
              </div>
            )},
          ]}
          data={episodes}
          isLoading={episodesLoading}
        />

        {/* Add Episode Modal */}
        <Modal isOpen={showAddEpisode} onClose={() => setShowAddEpisode(false)} title="Add Episode">
          <form className="space-y-4" onSubmit={handleAddEpisode}>
            <Input label="Episode Title" name="title" placeholder="Episode title" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Episode Number" name="episodeNumber" type="number" placeholder="1" required />
              <Select label="Access" name="isFree" options={[{ value: 'true', label: 'Free' }, { value: 'false', label: 'Paid' }]} />
            </div>
            <Input label="YouTube URL" name="youtubeUrl" placeholder="https://youtube.com/..." />
            <Input label="Coin Cost" name="coinCost" type="number" placeholder="0" />
            <Textarea label="Description" name="description" rows={2} placeholder="Episode description..." />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowAddEpisode(false)}>Cancel</Button>
              <Button type="submit">Add Episode</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Episode Modal */}
        {editEpisode && (
          <Modal isOpen={!!editEpisode} onClose={() => setEditEpisode(null)} title="Edit Episode">
            <form className="space-y-4" onSubmit={handleEditEpisode}>
              <Input label="Episode Title" name="title" defaultValue={editEpisode.title} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Episode Number" name="episodeNumber" type="number" defaultValue={editEpisode.episodeNumber} required />
                <Select label="Access" name="isFree" defaultValue={String(editEpisode.isFree)}
                  options={[{ value: 'true', label: 'Free' }, { value: 'false', label: 'Paid' }]} />
              </div>
              <Input label="YouTube URL" name="youtubeUrl" defaultValue={editEpisode.youtubeUrl || ''} placeholder="https://youtube.com/..." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Coin Cost" name="coinCost" type="number" defaultValue={editEpisode.coinCost || 0} />
                <Select label="Status" name="status" defaultValue={editEpisode.status}
                  options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
              </div>
              <Textarea label="Description" name="description" rows={2} defaultValue={editEpisode.description || ''} />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setEditEpisode(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // ── Main Podcasts List ──────────────────────────────────────────
  const columns = [
    {
      header: 'Series', key: 'title', align: 'left',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}>
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.title}</p>
          </div>
        </div>
      ),
    },
    { header: 'Episodes', key: 'totalEpisodes', align: 'center', render: (row) => <span className="text-sm font-semibold inline-block" style={{ color: 'var(--text-primary)' }}>{row.totalEpisodes || 0}</span> },
    { header: 'Status', key: 'status', align: 'center', render: (row) => <Badge variant={row.status === 'published' ? 'success' : 'neutral'}>{row.status}</Badge> },
    {
      header: '', key: 'actions', align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="sm" icon={List} title="Episodes" onClick={() => openEpisodes(row)} />
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => setEditSeries(row)} />
          <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDelete(row._id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5"><Radio className="w-5 h-5" style={{ color: 'var(--success)' }} /> Podcasts</h1>
          <p>{series.length} podcast series</p>
        </div>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Search..." className="w-56" />
          <Button icon={Plus} onClick={() => setShowCreate(true)}>New Series</Button>
        </div>
      </div>

      <DataTable columns={columns} data={series} isLoading={loading} />

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Podcast Series">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.target);
          try {
            await api.post('/admin/podcast-series', { title: f.get('title'), description: f.get('description'), authorId: f.get('authorId') });
            toast.success('Series created');
            setShowCreate(false);
            fetchSeries();
          } catch (err) { toast.error(err.message || 'Failed to create'); }
        }}>
          <Input label="Series Title" name="title" placeholder="Enter title" required />
          <Select label="Author" name="authorId" required options={[
            { value: '', label: 'Select author' },
            ...authors.map(a => ({ value: a._id, label: a.displayName || a.name }))
          ]} />
          <Textarea label="Description" name="description" placeholder="About this podcast..." rows={3} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Series Modal */}
      {editSeries && (
        <Modal isOpen={!!editSeries} onClose={() => setEditSeries(null)} title="Edit Series">
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <Input label="Series Title" name="title" defaultValue={editSeries.title} required />
            <Textarea label="Description" name="description" defaultValue={editSeries.description} rows={3} />
            <Select label="Status" name="status" defaultValue={editSeries.status}
              options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditSeries(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
