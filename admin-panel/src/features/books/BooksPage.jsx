import { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Select } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Forms';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Star,
  X,
  ChevronLeft,
  List,
  Image as ImageIcon,
  Play,
  Pause,
  Layers,
  FileText,
  Headphones,
  Music,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Gujarati', label: 'Gujarati' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Punjabi', label: 'Punjabi' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Odia', label: 'Odia' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'ebook', label: 'eBook (Text/PDF chapters)' },
  { value: 'audiobook', label: 'Audiobook (MP3 chapters)' },
];

const newBulkRow = (order = 1) => ({
  id: Date.now() + Math.random(),
  title: '',
  orderNumber: order,
  estimatedReadTime: '',
  status: 'published',
  pdfFile: null,
});

const newAudioBulkRow = (order = 1) => ({
  id: Date.now() + Math.random(),
  title: '',
  orderNumber: order,
  duration: '',
  narrator: '',
  status: 'published',
  audioFile: null,
});

export const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);

  const [typeFilter, setTypeFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [chaptersBook, setChaptersBook] = useState(null);

  // Ebook chapters
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [readChapter, setReadChapter] = useState(null);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editChapter, setEditChapter] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkRows, setBulkRows] = useState([newBulkRow(1)]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Audio chapters
  const [audioChapters, setAudioChapters] = useState([]);
  const [audioChaptersLoading, setAudioChaptersLoading] = useState(false);
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [editAudio, setEditAudio] = useState(null);
  const [showBulkAddAudio, setShowBulkAddAudio] = useState(false);
  const [audioBulkRows, setAudioBulkRows] = useState([newAudioBulkRow(1)]);
  const [audioBulkSubmitting, setAudioBulkSubmitting] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);

  const [createImagePreview, setCreateImagePreview] = useState('');
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  // For controlled selects inside modals (avoid re-mount reset)
  const [createContentType, setCreateContentType] = useState('ebook');
  const [createIsFree, setCreateIsFree] = useState(true);
  const [editContentType, setEditContentType] = useState('ebook');
  const [editIsFree, setEditIsFree] = useState(true);

  const getImageUrl = (row) =>
    row?.coverImage || row?.image || row?.thumbnail || row?.coverUrl || '';

  // ── Fetch books ───────────────────────────────────────────────
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.contentType = typeFilter;
      if (languageFilter) params.bookLanguage = languageFilter;
      const res = await api.get('/admin/books', { params });
      const booksList = res?.data?.books || res?.books || res?.data?.data || res?.data || [];
      const paginationData = res?.data?.pagination || res?.pagination || null;
      setBooks(Array.isArray(booksList) ? booksList : []);
      setPagination(paginationData);
    } catch (error) {
      console.error('Fetch books error:', error);
      setBooks([]);
      setPagination(null);
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [categoriesRes, authorsRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/authors'),
      ]);
      setCategories(categoriesRes?.data?.data || categoriesRes?.data || []);
      setAuthors(authorsRes?.data?.data || authorsRes?.data || []);
    } catch (error) {
      console.error('Fetch meta error:', error);
    }
  };

  // ── Ebook chapters ────────────────────────────────────────────
  const fetchChapters = async (bookId) => {
    try {
      setChaptersLoading(true);
      const res = await api.get(`/admin/books/${bookId}/chapters`);
      setChapters(res?.data?.data || res?.data || []);
    } catch (error) {
      console.error('Fetch chapters error:', error);
      setChapters([]);
    } finally {
      setChaptersLoading(false);
    }
  };

  // ── Audio chapters ────────────────────────────────────────────
  const fetchAudioChapters = async (bookId) => {
    try {
      setAudioChaptersLoading(true);
      const res = await api.get('/admin/audiobooks', { params: { bookId } });
      setAudioChapters(res?.data?.data || res?.data || []);
    } catch (error) {
      console.error('Fetch audio chapters error:', error);
      setAudioChapters([]);
    } finally {
      setAudioChaptersLoading(false);
    }
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchBooks(); }, [page, statusFilter, typeFilter, languageFilter]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchBooks(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Image preview ─────────────────────────────────────────────
  const handleCreateImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) { setCreateImagePreview(''); return; }
    setCreateImagePreview(URL.createObjectURL(file));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) { setEditImagePreview(getImageUrl(editBook)); return; }
    setEditImagePreview(URL.createObjectURL(file));
  };

  // ── Book actions ──────────────────────────────────────────────
  const toggleFeatured = async (id) => {
    try {
      await api.patch(`/admin/books/${id}/feature`);
      toast.success('Updated');
      fetchBooks();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this book and all its chapters? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/books/${id}`);
      toast.success('Book and chapters deleted');
      fetchBooks();
    } catch { toast.error('Failed to delete'); }
  };

  const buildBookPayload = (f, imageFile, contentType, isFree) => {
    const payload = new FormData();
    payload.append('title', f.get('title') || '');
    payload.append('authorId', f.get('authorId') || '');
    payload.append('categoryId', f.get('categoryId') || '');
    payload.append('genres', JSON.stringify((f.get('genres') || '').split(',').map((s) => s.trim()).filter(Boolean)));
    payload.append('description', f.get('description') || '');
    payload.append('bookLanguage', f.get('bookLanguage') || 'English');
    payload.append('status', f.get('status') || 'draft');
    payload.append('contentType', contentType || 'ebook');
    payload.append('isFree', String(isFree));

    if (contentType === 'audiobook') {
      payload.append('audiobookPrice', f.get('audiobookPrice') || '0');
    } else {
      payload.append('ebookPrice', f.get('ebookPrice') || '0');
    }

    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      payload.append('coverImage', imageFile);
    }
    return payload;
  };

  const handleCreate = async (e) => {
    try {
      e.preventDefault();
      setCreateSubmitting(true);
      const f = new FormData(e.target);
      const payload = buildBookPayload(f, f.get('coverImage'), createContentType, createIsFree);
      await api.post('/admin/books', payload);
      toast.success('Book created');
      setShowCreate(false);
      setCreateImagePreview('');
      setCreateContentType('ebook');
      setCreateIsFree(true);
      fetchBooks();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    try {
      e.preventDefault();
      setEditSubmitting(true);
      const f = new FormData(e.target);
      const payload = buildBookPayload(f, f.get('coverImage'), editContentType, editIsFree);
      await api.put(`/admin/books/${editBook._id}`, payload);
      toast.success('Book updated');
      setEditBook(null);
      setEditImagePreview('');
      fetchBooks();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Ebook chapter actions ─────────────────────────────────────
  const handleAddChapter = async (e) => {
    try {
      e.preventDefault();
      const f = new FormData(e.target);
      const payload = new FormData();
      payload.append('title', f.get('title') || '');
      payload.append('orderNumber', f.get('orderNumber') || '');
      payload.append('estimatedReadTime', f.get('estimatedReadTime') || '0');
      payload.append('status', f.get('status') || 'published');
      const file = f.get('pdfFile');
      if (file && file instanceof File && file.size > 0) payload.append('pdfFile', file);
      await api.post(`/admin/books/${chaptersBook._id}/chapters`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Chapter added');
      setShowAddChapter(false);
      fetchChapters(chaptersBook._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add chapter');
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm('Delete this chapter?')) return;
    try {
      await api.delete(`/admin/chapters/${chapterId}`);
      toast.success('Chapter deleted');
      fetchChapters(chaptersBook._id);
    } catch { toast.error('Failed to delete chapter'); }
  };

  const handleEditChapter = async (e) => {
    try {
      e.preventDefault();
      const f = new FormData(e.target);
      const payload = new FormData();
      payload.append('title', f.get('title') || '');
      payload.append('orderNumber', f.get('orderNumber') || '');
      payload.append('estimatedReadTime', f.get('estimatedReadTime') || '0');
      payload.append('status', f.get('status') || 'draft');
      const file = f.get('pdfFile');
      if (file && file instanceof File && file.size > 0) payload.append('pdfFile', file);
      await api.put(`/admin/chapters/${editChapter._id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Chapter updated');
      setEditChapter(null);
      fetchChapters(chaptersBook._id);
    } catch (err) {
      toast.error(err?.message || 'Failed to update chapter');
    }
  };

  const handleBulkAddChapters = async () => {
    const valid = bulkRows.every((r) => r.title.trim() && r.orderNumber);
    if (!valid) { toast.error('Each chapter must have a title and order number'); return; }
    try {
      setBulkSubmitting(true);
      for (const row of bulkRows) {
        const payload = new FormData();
        payload.append('title', row.title);
        payload.append('orderNumber', String(row.orderNumber));
        payload.append('estimatedReadTime', String(row.estimatedReadTime || 0));
        payload.append('status', row.status || 'draft');
        if (row.pdfFile instanceof File) payload.append('pdfFile', row.pdfFile);
        await api.post(`/admin/books/${chaptersBook._id}/chapters`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(`${bulkRows.length} chapter${bulkRows.length > 1 ? 's' : ''} added`);
      setShowBulkAdd(false);
      setBulkRows([newBulkRow(1)]);
      fetchChapters(chaptersBook._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add chapters');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleTogglePublishChapter = async (chapter) => {
    try {
      const newStatus = chapter.status === 'published' ? 'draft' : 'published';
      await api.patch(`/admin/chapters/${chapter._id}/publish`, { status: newStatus });
      toast.success(`Chapter ${newStatus}`);
      fetchChapters(chaptersBook._id);
    } catch { toast.error('Failed to update status'); }
  };

  // ── Audio chapter actions ─────────────────────────────────────
  const handleAddAudioChapter = async (e) => {
    try {
      e.preventDefault();
      const f = new FormData(e.target);
      const payload = new FormData();
      payload.append('bookId', chaptersBook._id);
      payload.append('title', f.get('title') || '');
      payload.append('orderNumber', f.get('orderNumber') || '1');
      payload.append('duration', f.get('duration') || '0');
      payload.append('narrator', f.get('narrator') || '');
      payload.append('status', f.get('status') || 'published');
      const file = f.get('audioFile');
      if (file && file instanceof File && file.size > 0) payload.append('audioFile', file);
      await api.post('/admin/audiobooks', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Audio chapter added');
      setShowAddAudio(false);
      fetchAudioChapters(chaptersBook._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add audio chapter');
    }
  };

  const handleEditAudioChapter = async (e) => {
    try {
      e.preventDefault();
      const f = new FormData(e.target);
      const payload = new FormData();
      payload.append('title', f.get('title') || '');
      payload.append('orderNumber', f.get('orderNumber') || '1');
      payload.append('duration', f.get('duration') || '0');
      payload.append('narrator', f.get('narrator') || '');
      payload.append('status', f.get('status') || 'draft');
      const file = f.get('audioFile');
      if (file && file instanceof File && file.size > 0) payload.append('audioFile', file);
      await api.put(`/admin/audiobooks/${editAudio._id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Audio chapter updated');
      setEditAudio(null);
      fetchAudioChapters(chaptersBook._id);
    } catch (err) {
      toast.error(err?.message || 'Failed to update audio chapter');
    }
  };

  const handleDeleteAudioChapter = async (id) => {
    if (!window.confirm('Delete this audio chapter?')) return;
    try {
      await api.delete(`/admin/audiobooks/${id}`);
      toast.success('Audio chapter deleted');
      fetchAudioChapters(chaptersBook._id);
    } catch { toast.error('Failed to delete audio chapter'); }
  };

  const handleTogglePublishAudio = async (track) => {
    try {
      await api.patch(`/admin/audiobooks/${track._id}/publish`);
      toast.success(`Track ${track.status === 'published' ? 'unpublished' : 'published'}`);
      fetchAudioChapters(chaptersBook._id);
    } catch { toast.error('Failed to update status'); }
  };

  const handleBulkAddAudio = async () => {
    const valid = audioBulkRows.every((r) => r.title.trim() && r.orderNumber);
    if (!valid) { toast.error('Each track must have a title and order number'); return; }
    try {
      setAudioBulkSubmitting(true);
      for (const row of audioBulkRows) {
        const payload = new FormData();
        payload.append('bookId', chaptersBook._id);
        payload.append('title', row.title);
        payload.append('orderNumber', String(row.orderNumber));
        payload.append('duration', String(row.duration || 0));
        payload.append('narrator', row.narrator || '');
        payload.append('status', row.status || 'draft');
        if (row.audioFile instanceof File) payload.append('audioFile', row.audioFile);
        await api.post('/admin/audiobooks', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(`${audioBulkRows.length} audio chapter${audioBulkRows.length > 1 ? 's' : ''} added`);
      setShowBulkAddAudio(false);
      setAudioBulkRows([newAudioBulkRow(1)]);
      fetchAudioChapters(chaptersBook._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add audio chapters');
    } finally {
      setAudioBulkSubmitting(false);
    }
  };

  const updateAudioBulkRow = (id, field, value) =>
    setAudioBulkRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const updateBulkRow = (id, field, value) =>
    setBulkRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const openChapters = (book) => {
    setChaptersBook(book);
    if (book.contentType === 'audiobook') {
      fetchAudioChapters(book._id);
    } else {
      fetchChapters(book._id);
    }
  };

  const openEditBook = (book) => {
    setEditBook(book);
    setEditImagePreview(getImageUrl(book));
    setEditContentType(book.contentType || 'ebook');
    setEditIsFree(book.isFree ?? true);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const contentTypeBadgeColor = { ebook: 'info', audiobook: 'warning' };
  const statusColors = { draft: 'neutral', published: 'success', archived: 'danger' };

  const categoryOptions = [{ value: '', label: 'Select category' }, ...categories.map((c) => ({ value: c._id, label: c.name }))];
  const authorOptions = [{ value: '', label: 'Select author' }, ...authors.map((a) => ({ value: a._id, label: a.displayName || a.name }))];
  const statusOptions = [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }];

  // ── Price fields component ────────────────────────────────────
  const PriceFields = ({ contentType, defaults = {} }) => {
    if (contentType === 'audiobook') {
      return <Input label="Audiobook Price (₹)" name="audiobookPrice" type="number" placeholder="0" defaultValue={defaults.audiobookPrice ?? 0} />;
    }
    return <Input label="eBook Price (₹)" name="ebookPrice" type="number" placeholder="0" defaultValue={defaults.ebookPrice ?? 0} />;
  };


  // ── Columns ───────────────────────────────────────────────────
  const columns = [
    {
      header: 'Book',
      key: 'title',
      align: 'left',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 rounded-md overflow-hidden flex items-center justify-center text-white"
            style={{ background: getImageUrl(row) ? 'transparent' : 'linear-gradient(135deg, var(--accent-600), #7c3aed)', boxShadow: 'var(--shadow-sm)' }}>
            {getImageUrl(row) ? (
              <img src={getImageUrl(row)} alt={row?.title || 'Book'} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              {row.title}
              {row.isFeatured && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {row.authorId?.displayName || row.authorId?.name || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'contentType',
      align: 'center',
      render: (row) => (
        <Badge variant={contentTypeBadgeColor[row.contentType] || 'neutral'}>
          {row.contentType === 'audiobook' ? '🎧 Audiobook' : '📖 eBook'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => <Badge variant={statusColors[row.status] || 'neutral'}>{row.status}</Badge>,
    },
    {
      header: 'Chapters',
      key: 'totalChapters',
      align: 'center',
      render: (row) => <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.totalChapters || 0}</span>,
    },
    {
      header: 'Language',
      key: 'bookLanguage',
      align: 'center',
      render: (row) => <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.bookLanguage || '—'}</span>,
    },
    {
      header: 'Pricing',
      key: 'pricing',
      align: 'center',
      render: (row) =>
        row.isFree ? (
          <Badge variant="success">Free</Badge>
        ) : (
          <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
            ₹{row.contentType === 'audiobook' ? row.audiobookPrice : row.ebookPrice || 0}
          </span>
        ),
    },
    {
      header: '',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="sm" icon={List} title="Manage chapters" onClick={() => openChapters(row)} />
          <Button variant="ghost" size="sm" icon={Star} className={row.isFeatured ? '!text-amber-400' : ''} onClick={() => toggleFeatured(row._id)} />
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => openEditBook(row)} />
          <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDelete(row._id)} />
        </div>
      ),
    },
  ];

  // ── Chapters view ─────────────────────────────────────────────
  if (chaptersBook) {
    const ct = chaptersBook.contentType || 'ebook';
    const isEbook = ct === 'ebook';
    const isAudio = ct === 'audiobook';
    const currentTab = ct === 'audiobook' ? 'audiobook' : 'ebook';

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" icon={ChevronLeft}
              onClick={() => { setChaptersBook(null); setChapters([]); setAudioChapters([]); }} />
            <div>
              <h1 className="flex items-center gap-2.5">
                {ct === 'audiobook' ? <Headphones className="w-5 h-5" style={{ color: 'var(--accent-400)' }} /> : <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-400)' }} />}
                {chaptersBook.title}
                <Badge variant={contentTypeBadgeColor[ct] || 'neutral'} className="text-xs">
                  {ct === 'audiobook' ? 'Audiobook' : 'eBook'}
                </Badge>
              </h1>
            </div>
          </div>

          <div className="page-actions">
            {isEbook && (
              <>
                <Button variant="secondary" icon={Layers} onClick={() => { setBulkRows([newBulkRow(chapters.length + 1)]); setShowBulkAdd(true); }}>Bulk Add</Button>
                <Button icon={Plus} onClick={() => setShowAddChapter(true)}>Add Chapter</Button>
              </>
            )}
            {isAudio && (
              <>
                <Button variant="secondary" icon={Layers} onClick={() => { setAudioBulkRows([newAudioBulkRow(audioChapters.length + 1)]); setShowBulkAddAudio(true); }}>Bulk Add</Button>
                <Button icon={Plus} onClick={() => setShowAddAudio(true)}>Add Audio Chapter</Button>
              </>
            )}
          </div>
        </div>


        {/* eBook chapters table */}
        {currentTab === 'ebook' && (
          <DataTable
            columns={[
              { header: '#', key: '_seq', render: (row) => <span className="text-sm font-bold" style={{ color: 'var(--accent-400)' }}>{row._seq}</span> },
              { header: 'Title', key: 'title', render: (row) => <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.title}</span> },
              { header: 'Status', key: 'status', render: (row) => <Badge variant={row.status === 'published' ? 'success' : 'neutral'}>{row.status}</Badge> },
              { header: 'Read Time', key: 'estimatedReadTime', render: (row) => <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.estimatedReadTime ? `${row.estimatedReadTime} min` : '—'}</span> },
              {
                header: '', key: 'actions', align: 'right', render: (row) => (
                  <div className="flex justify-end gap-0.5">
                    {(row.rawPdfUrl || row.contentHtml) && <Button variant="ghost" size="sm" icon={FileText} className="!text-blue-500" onClick={() => setReadChapter(row)} />}
                    <Button variant="ghost" size="sm" icon={row.status === 'published' ? Pause : Play}
                      className={row.status === 'published' ? '!text-green-500' : ''}
                      onClick={() => handleTogglePublishChapter(row)} />
                    <Button variant="ghost" size="sm" icon={Edit} onClick={() => setEditChapter(row)} />
                    <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDeleteChapter(row._id)} />
                  </div>
                )
              },
            ]}
            data={chapters.map((ch, i) => ({ ...ch, _seq: i + 1 }))}
            isLoading={chaptersLoading}
          />
        )}

        {/* Audio chapters table */}
        {currentTab === 'audiobook' && (
          <DataTable
            columns={[
              { header: '#', key: '_seq', render: (row) => <span className="text-sm font-bold" style={{ color: 'var(--accent-400)' }}>{row._seq}</span> },
              {
                header: 'Title', key: 'title', render: (row) => (
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.title}</p>
                    {row.narrator && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>🎙 {row.narrator}</p>}
                  </div>
                )
              },
              { header: 'Duration', key: 'duration', render: (row) => <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDuration(row.duration)}</span> },
              {
                header: 'Audio', key: 'audioUrl', render: (row) => row.audioUrl ? (
                  <button
                    onClick={() => setPlayingAudio(playingAudio === row._id ? null : row._id)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--accent-400)' }}
                  >
                    {playingAudio === row._id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {playingAudio === row._id ? 'Stop' : 'Play'}
                  </button>
                ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No file</span>
              },
              { header: 'Status', key: 'status', render: (row) => <Badge variant={row.status === 'published' ? 'success' : 'neutral'}>{row.status}</Badge> },
              {
                header: '', key: 'actions', align: 'right', render: (row) => (
                  <div className="flex justify-end gap-0.5">
                    <Button variant="ghost" size="sm" icon={row.status === 'published' ? Pause : Play}
                      className={row.status === 'published' ? '!text-green-500' : ''}
                      onClick={() => handleTogglePublishAudio(row)} />
                    <Button variant="ghost" size="sm" icon={Edit} onClick={() => setEditAudio(row)} />
                    <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDeleteAudioChapter(row._id)} />
                  </div>
                )
              },
            ]}
            data={audioChapters.map((ch, i) => ({ ...ch, _seq: i + 1 }))}
            isLoading={audioChaptersLoading}
          />
        )}

        {/* Hidden audio player */}
        {playingAudio && (() => {
          const track = audioChapters.find((t) => t._id === playingAudio);
          return track?.audioUrl ? <audio key={playingAudio} src={track.audioUrl} autoPlay onEnded={() => setPlayingAudio(null)} style={{ display: 'none' }} /> : null;
        })()}

        {/* Add eBook Chapter Modal */}
        <Modal isOpen={showAddChapter} onClose={() => setShowAddChapter(false)} title="Add Chapter">
          <form className="space-y-4" onSubmit={handleAddChapter}>
            <Input label="Chapter Title" name="title" placeholder="Enter chapter title" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Order Number" name="orderNumber" type="number" placeholder="1" defaultValue={chapters.length + 1} required />
              <Input label="Est. Read Time (min)" name="estimatedReadTime" type="number" placeholder="10" />
            </div>
            <Select label="Status" name="status" defaultValue="published"
              options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />
            <div className="w-full">
              <label className="block text-[0.75rem] font-semibold mb-1 text-gray-600">Chapter PDF</label>
              <input type="file" name="pdfFile" accept="application/pdf" className="input-field" />
              <p className="text-xs text-gray-500 mt-1">Upload a PDF to automatically generate chapter text.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddChapter(false)}>Cancel</Button>
              <Button type="submit">Add Chapter</Button>
            </div>
          </form>
        </Modal>

        {/* Edit eBook Chapter Modal */}
        {editChapter && (
          <Modal isOpen={!!editChapter} onClose={() => setEditChapter(null)} title="Edit Chapter">
            <form className="space-y-4" onSubmit={handleEditChapter}>
              <Input label="Chapter Title" name="title" defaultValue={editChapter.title} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Order Number" name="orderNumber" type="number" defaultValue={editChapter.orderNumber} required />
                <Input label="Est. Read Time (min)" name="estimatedReadTime" type="number" defaultValue={editChapter.estimatedReadTime || 0} />
              </div>
              <Select label="Status" name="status" defaultValue={editChapter.status}
                options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
              <div className="w-full">
                <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Replace PDF (optional)</label>
                <input type="file" name="pdfFile" accept="application/pdf" className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditChapter(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Audio Chapter Modal */}
        <Modal isOpen={showAddAudio} onClose={() => setShowAddAudio(false)} title="Add Audio Chapter">
          <form className="space-y-4" onSubmit={handleAddAudioChapter}>
            <Input label="Chapter Title" name="title" placeholder="e.g. Chapter 1: Introduction" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Order Number" name="orderNumber" type="number" placeholder="1" defaultValue={audioChapters.length + 1} required />
              <Input label="Duration (seconds)" name="duration" type="number" placeholder="300" />
            </div>
            <Input label="Narrator Name" name="narrator" placeholder="e.g. John Doe" />
            <Select label="Status" name="status" defaultValue="published"
              options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />
            <div className="w-full">
              <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Audio File (MP3) <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>or paste URL below</span>
              </label>
              <input type="file" name="audioFile" accept="audio/*" className="input-field" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddAudio(false)}>Cancel</Button>
              <Button type="submit">Add Audio Chapter</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Audio Chapter Modal */}
        {editAudio && (
          <Modal isOpen={!!editAudio} onClose={() => setEditAudio(null)} title="Edit Audio Chapter">
            <form className="space-y-4" onSubmit={handleEditAudioChapter}>
              <Input label="Chapter Title" name="title" defaultValue={editAudio.title} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Order Number" name="orderNumber" type="number" defaultValue={editAudio.orderNumber} required />
                <Input label="Duration (seconds)" name="duration" type="number" defaultValue={editAudio.duration || 0} />
              </div>
              <Input label="Narrator Name" name="narrator" defaultValue={editAudio.narrator || ''} />
              <Select label="Status" name="status" defaultValue={editAudio.status}
                options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
              <div className="w-full">
                <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Replace Audio File
                  {editAudio.audioUrl && <a href={editAudio.audioUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-500 text-xs underline">current file</a>}
                </label>
                <input type="file" name="audioFile" accept="audio/*" className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditAudio(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Bulk Add eBook Chapters */}
        <Modal isOpen={showBulkAdd} onClose={() => { setShowBulkAdd(false); setBulkRows([newBulkRow(1)]); }}
          title={`Bulk Add Chapters — ${chaptersBook?.title || ''}`}>
          <div className="space-y-4">
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {bulkRows.map((row, idx) => (
                <div key={row.id} className="border rounded-xl p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card, #f9fafb)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-400)' }}>Chapter {idx + 1}</span>
                    {bulkRows.length > 1 && (
                      <button type="button" onClick={() => setBulkRows((prev) => prev.filter((r) => r.id !== row.id))} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Title <span className="text-red-400">*</span></label>
                      <input className="input-field w-full" placeholder="Chapter title" value={row.title} onChange={(e) => updateBulkRow(row.id, 'title', e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Order <span className="text-red-400">*</span></label>
                      <input className="input-field w-full" type="number" min="1" value={row.orderNumber} onChange={(e) => updateBulkRow(row.id, 'orderNumber', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Read Time (min)</label>
                      <input className="input-field w-full" type="number" min="0" placeholder="0" value={row.estimatedReadTime} onChange={(e) => updateBulkRow(row.id, 'estimatedReadTime', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
                      <select className="input-field w-full" value={row.status} onChange={(e) => updateBulkRow(row.id, 'status', e.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>PDF File</label>
                      <input type="file" accept="application/pdf" className="input-field w-full" onChange={(e) => updateBulkRow(row.id, 'pdfFile', e.target.files?.[0] || null)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" icon={Plus} className="w-full" onClick={() => setBulkRows((prev) => [...prev, newBulkRow(prev.length + 1)])}>
              Add Another Chapter
            </Button>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" disabled={bulkSubmitting} onClick={() => { setShowBulkAdd(false); setBulkRows([newBulkRow(1)]); }}>Cancel</Button>
              <Button disabled={bulkSubmitting} onClick={handleBulkAddChapters}>
                {bulkSubmitting ? 'Uploading...' : `Upload ${bulkRows.length} Chapter${bulkRows.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Add Audio Chapters */}
        <Modal isOpen={showBulkAddAudio} onClose={() => { setShowBulkAddAudio(false); setAudioBulkRows([newAudioBulkRow(1)]); }}
          title={`Bulk Add Audio Chapters — ${chaptersBook?.title || ''}`}>
          <div className="space-y-4">
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {audioBulkRows.map((row, idx) => (
                <div key={row.id} className="border rounded-xl p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card, #f9fafb)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-400)' }}>
                      <Music className="w-3 h-3 inline mr-1" />Track {idx + 1}
                    </span>
                    {audioBulkRows.length > 1 && (
                      <button type="button" onClick={() => setAudioBulkRows((prev) => prev.filter((r) => r.id !== row.id))} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Title <span className="text-red-400">*</span></label>
                      <input className="input-field w-full" placeholder="Chapter title" value={row.title} onChange={(e) => updateAudioBulkRow(row.id, 'title', e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Order <span className="text-red-400">*</span></label>
                      <input className="input-field w-full" type="number" min="1" value={row.orderNumber} onChange={(e) => updateAudioBulkRow(row.id, 'orderNumber', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Duration (sec)</label>
                      <input className="input-field w-full" type="number" min="0" placeholder="0" value={row.duration} onChange={(e) => updateAudioBulkRow(row.id, 'duration', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Narrator</label>
                      <input className="input-field w-full" placeholder="Narrator name" value={row.narrator} onChange={(e) => updateAudioBulkRow(row.id, 'narrator', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
                      <select className="input-field w-full" value={row.status} onChange={(e) => updateAudioBulkRow(row.id, 'status', e.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Audio File (MP3)</label>
                      <input type="file" accept="audio/*" className="input-field w-full" onChange={(e) => updateAudioBulkRow(row.id, 'audioFile', e.target.files?.[0] || null)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" icon={Plus} className="w-full" onClick={() => setAudioBulkRows((prev) => [...prev, newAudioBulkRow(prev.length + 1)])}>
              Add Another Track
            </Button>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" disabled={audioBulkSubmitting} onClick={() => { setShowBulkAddAudio(false); setAudioBulkRows([newAudioBulkRow(1)]); }}>Cancel</Button>
              <Button disabled={audioBulkSubmitting} onClick={handleBulkAddAudio}>
                {audioBulkSubmitting ? 'Uploading...' : `Upload ${audioBulkRows.length} Track${audioBulkRows.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Read Chapter Modal */}
        {readChapter && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="relative w-full max-w-4xl h-[90vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{readChapter.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Chapter {readChapter.orderNumber}{readChapter.estimatedReadTime ? ` · ${readChapter.estimatedReadTime} min read` : ''}</p>
                </div>
                <Button variant="ghost" size="sm" icon={X} onClick={() => setReadChapter(null)} />
              </div>
              <div className="flex-1 overflow-auto">
                {readChapter.rawPdfUrl ? (
                  <iframe src={`${readChapter.rawPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`} className="w-full h-full border-0" title={readChapter.title} style={{ userSelect: 'none' }} />
                ) : readChapter.contentHtml ? (
                  <div className="px-8 py-6 prose prose-sm max-w-none"
                    style={{ color: 'var(--text-primary)', lineHeight: 1.8, userSelect: 'none', WebkitUserSelect: 'none' }}
                    onContextMenu={(e) => e.preventDefault()}
                    dangerouslySetInnerHTML={{ __html: readChapter.contentHtml }} />
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}><p>No content available</p></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Books list view ───────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-400)' }} />
            Books
          </h1>
          <p>{pagination ? `${pagination.total} books` : 'Manage all books'}</p>
        </div>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Search books..." className="w-52" />
          <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'All Types' }, { value: 'ebook', label: '📖 eBook' }, { value: 'audiobook', label: '🎧 Audiobook' }]}
            className="!w-36" />
          <Select value={languageFilter} onChange={(e) => { setLanguageFilter(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'All Languages' }, ...LANGUAGE_OPTIONS]}
            className="!w-36" />
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'All Status' }, { value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]}
            className="!w-32" />
          <Button icon={Plus} onClick={() => setShowCreate(true)}>Add Book</Button>
        </div>
      </div>

      <DataTable columns={columns} data={books} isLoading={loading} pagination={pagination} onPageChange={setPage} />

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setCreateImagePreview(''); }} title="Create New Book">
        <form className="space-y-4" onSubmit={handleCreate}>
          <Input label="Book Title" name="title" placeholder="Enter book title" required />
          <Select label="Author" name="authorId" required options={authorOptions} />
          <Select label="Category" name="categoryId" required options={categoryOptions} />
          <Input label="Genres" name="genres" placeholder="Comma-separated (e.g. Fiction, Thriller)" required />
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Cover Image</label>
            <input type="file" name="coverImage" accept="image/*" onChange={handleCreateImageChange} className="w-full text-sm border rounded-lg px-3 py-2" />
            {createImagePreview ? (
              <div className="mt-3 relative w-28 h-40 rounded-lg overflow-hidden border">
                <img src={createImagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setCreateImagePreview('')} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <div className="mt-3 w-28 h-40 rounded-lg border flex items-center justify-center" style={{ color: 'var(--text-muted)' }}><ImageIcon className="w-5 h-5" /></div>
            )}
          </div>
          <Select label="Language" name="bookLanguage" required options={LANGUAGE_OPTIONS} />
          <div>
            <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Content Type</label>
            <select name="contentType" className="input-field w-full" value={createContentType} onChange={(e) => setCreateContentType(e.target.value)}>
              {CONTENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Access</label>
            <select name="isFree" className="input-field w-full" value={createIsFree ? 'true' : 'false'} onChange={(e) => setCreateIsFree(e.target.value === 'true')}>
              <option value="true">Free</option>
              <option value="false">Paid</option>
            </select>
          </div>
          {!createIsFree && <PriceFields contentType={createContentType} defaults={{}} />}
          <Textarea label="Description" name="description" placeholder="Write a compelling description..." rows={3} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" disabled={createSubmitting} onClick={() => { setShowCreate(false); setCreateImagePreview(''); }}>Cancel</Button>
            <Button type="submit" disabled={createSubmitting}>{createSubmitting ? 'Creating...' : 'Create Book'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editBook && (
        <Modal isOpen={!!editBook} onClose={() => { setEditBook(null); setEditImagePreview(''); }} title="Edit Book">
          <form className="space-y-4" onSubmit={handleEdit}>
            <Input label="Book Title" name="title" defaultValue={editBook.title} required />
            <Select label="Author" name="authorId" required options={authorOptions} defaultValue={editBook.authorId?._id || editBook.authorId} />
            <Select label="Category" name="categoryId" required options={categoryOptions} defaultValue={editBook.categoryId?._id || editBook.categoryId} />
            <Input label="Genres" name="genres" defaultValue={(editBook.genres || []).join(', ')} required />
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Cover Image</label>
              <input type="file" name="coverImage" accept="image/*" onChange={handleEditImageChange} className="w-full text-sm border rounded-lg px-3 py-2" />
              {editImagePreview ? (
                <div className="mt-3 w-28 h-40 rounded-lg overflow-hidden border">
                  <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="mt-3 w-28 h-40 rounded-lg border flex items-center justify-center" style={{ color: 'var(--text-muted)' }}><ImageIcon className="w-5 h-5" /></div>
              )}
            </div>
            <Select label="Language" name="bookLanguage" defaultValue={editBook.bookLanguage || 'English'} options={LANGUAGE_OPTIONS} />
            <div>
              <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Content Type</label>
              <select name="contentType" className="input-field w-full" value={editContentType} onChange={(e) => setEditContentType(e.target.value)}>
                {CONTENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Select label="Status" name="status" options={statusOptions} defaultValue={editBook.status} />
            <div>
              <label className="block text-[0.75rem] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Access</label>
              <select name="isFree" className="input-field w-full" value={editIsFree ? 'true' : 'false'} onChange={(e) => setEditIsFree(e.target.value === 'true')}>
                <option value="true">Free</option>
                <option value="false">Paid</option>
              </select>
            </div>
            {!editIsFree && <PriceFields contentType={editContentType} defaults={editBook} />}
            <Textarea label="Description" name="description" defaultValue={editBook.description} rows={3} required />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" disabled={editSubmitting} onClick={() => { setEditBook(null); setEditImagePreview(''); }}>Cancel</Button>
              <Button type="submit" disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
