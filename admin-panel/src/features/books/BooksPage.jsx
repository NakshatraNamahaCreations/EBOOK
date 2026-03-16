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
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [chaptersBook, setChaptersBook] = useState(null);

  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editChapter, setEditChapter] = useState(null);

  const [createImagePreview, setCreateImagePreview] = useState('');
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const getImageUrl = (row) =>
    row?.coverImage ||
    row?.image ||
    row?.thumbnail ||
    row?.coverUrl ||
    '';

  const fetchBooks = async () => {
    try {
      setLoading(true);

      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/books', { params });

      const booksList =
        res?.data?.books ||
        res?.books ||
        res?.data?.data ||
        res?.data ||
        [];

      const paginationData =
        res?.data?.pagination ||
        res?.pagination ||
        null;

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

      setCategories(
        categoriesRes?.data?.data ||
          categoriesRes?.data ||
          []
      );
      setAuthors(
        authorsRes?.data?.data ||
          authorsRes?.data ||
          []
      );
    } catch (error) {
      console.error('Fetch meta error:', error);
      setCategories([]);
      setAuthors([]);
    }
  };

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

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchBooks();
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  const handleCreateImageChange = (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        setCreateImagePreview('');
        return;
      }
      const preview = URL.createObjectURL(file);
      setCreateImagePreview(preview);
    } catch (error) {
      console.error('Create image preview error:', error);
      toast.error('Failed to preview image');
    }
  };

  const handleEditImageChange = (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        setEditImagePreview(getImageUrl(editBook));
        return;
      }
      const preview = URL.createObjectURL(file);
      setEditImagePreview(preview);
    } catch (error) {
      console.error('Edit image preview error:', error);
      toast.error('Failed to preview image');
    }
  };

  const toggleFeatured = async (id) => {
    try {
      await api.patch(`/admin/books/${id}/feature`);
      toast.success('Updated');
      fetchBooks();
    } catch (error) {
      console.error('Toggle featured error:', error);
      toast.error('Failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm('Archive this book?')) return;
      await api.delete(`/admin/books/${id}`);
      toast.success('Book archived');
      fetchBooks();
    } catch (error) {
      console.error('Delete book error:', error);
      toast.error('Failed to archive');
    }
  };

  const handleEdit = async (e) => {
    try {
      e.preventDefault();
      setEditSubmitting(true);

      const formData = new FormData(e.target);
      const payload = new FormData();

      payload.append('title', formData.get('title') || '');
      payload.append('authorId', formData.get('authorId') || '');
      payload.append('categoryId', formData.get('categoryId') || '');
      payload.append(
        'genres',
        JSON.stringify(
          (formData.get('genres') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      payload.append('description', formData.get('description') || '');
      payload.append('status', formData.get('status') || 'draft');

      const file = formData.get('coverImage');
      if (file && file instanceof File && file.size > 0) {
        payload.append('coverImage', file);
      }

      await api.put(`/admin/books/${editBook._id}`, payload);

      toast.success('Book updated');
      setEditBook(null);
      setEditImagePreview('');
      fetchBooks();
    } catch (err) {
      console.error('Edit book error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAddChapter = async (e) => {
    try {
      e.preventDefault();

      const f = new FormData(e.target);
      const payload = new FormData();

      payload.append('title', f.get('title') || '');
      payload.append('orderNumber', f.get('orderNumber') || '');
      payload.append('isFree', f.get('isFree') || 'false');
      payload.append('coinCost', f.get('coinCost') || '0');
      payload.append('estimatedReadTime', f.get('estimatedReadTime') || '0');
      payload.append('status', f.get('status') || 'draft');

      const file = f.get('pdfFile');
      if (file && file instanceof File && file.size > 0) {
        payload.append('pdfFile', file);
      }

      await api.post(`/admin/books/${chaptersBook._id}/chapters`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Chapter added');
      setShowAddChapter(false);
      fetchChapters(chaptersBook._id);
    } catch (err) {
      console.error('Add chapter error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add chapter');
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    try {
      if (!window.confirm('Delete this chapter?')) return;
      await api.delete(`/admin/chapters/${chapterId}`);
      toast.success('Chapter deleted');
      fetchChapters(chaptersBook._id);
    } catch (error) {
      console.error('Delete chapter error:', error);
      toast.error('Failed to delete chapter');
    }
  };

  const handleEditChapter = async (e) => {
    try {
      e.preventDefault();
      const f = new FormData(e.target);
      const payload = new FormData();
      payload.append('title', f.get('title') || '');
      payload.append('orderNumber', f.get('orderNumber') || '');
      payload.append('isFree', f.get('isFree') || 'false');
      payload.append('coinCost', f.get('coinCost') || '0');
      payload.append('estimatedReadTime', f.get('estimatedReadTime') || '0');
      payload.append('status', f.get('status') || 'draft');
      const file = f.get('pdfFile');
      if (file && file instanceof File && file.size > 0) {
        payload.append('pdfFile', file);
      }
      await api.put(`/admin/chapters/${editChapter._id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Chapter updated');
      setEditChapter(null);
      fetchChapters(chaptersBook._id);
    } catch (err) {
      console.error('Edit chapter error:', err);
      toast.error(err?.message || 'Failed to update chapter');
    }
  };

  const handleTogglePublishChapter = async (chapter) => {
    try {
      const newStatus = chapter.status === 'published' ? 'draft' : 'published';
      await api.patch(`/admin/chapters/${chapter._id}/publish`, { status: newStatus });
      toast.success(`Chapter ${newStatus}`);
      fetchChapters(chaptersBook._id);
    } catch (error) {
      console.error('Toggle chapter publish error:', error);
      toast.error('Failed to update status');
    }
  };

  const openChapters = (book) => {
    setChaptersBook(book);
    fetchChapters(book._id);
  };

  const openEditBook = (book) => {
    setEditBook(book);
    setEditImagePreview(getImageUrl(book));
  };

  const statusColors = {
    draft: 'neutral',
    published: 'success',
    archived: 'danger',
  };

  const categoryOptions = [
    { value: '', label: 'Select category' },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const authorOptions = [
    { value: '', label: 'Select author' },
    ...authors.map((a) => ({ value: a._id, label: a.displayName || a.name })),
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  const columns = [
    {
      header: 'Book',
      key: 'title',
      align: 'left',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-14 rounded-md overflow-hidden flex items-center justify-center text-white"
            style={{
              background: getImageUrl(row)
                ? 'transparent'
                : 'linear-gradient(135deg, var(--accent-600), #7c3aed)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {getImageUrl(row) ? (
              <img
                src={getImageUrl(row)}
                alt={row?.title || 'Book'}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
          </div>

          <div>
            <p
              className="text-sm font-medium flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              {row.title}
              {row.isFeatured && (
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              )}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {row.authorId?.displayName || row.authorId?.name || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => (
        <Badge variant={statusColors[row.status] || 'neutral'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Chapters',
      key: 'totalChapters',
      align: 'center',
      render: (row) => (
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {row.totalChapters || 0}
        </span>
      ),
    },
    {
      header: 'Reads',
      key: 'totalReads',
      align: 'center',
      render: (row) => (
        <span className="text-sm inline-block" style={{ color: 'var(--text-secondary)' }}>
          {(row.totalReads || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Rating',
      key: 'averageRating',
      align: 'center',
      render: (row) =>
        row.averageRating > 0 ? (
          <div className="flex justify-center items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span
              className="text-sm font-semibold inline-block"
              style={{ color: 'var(--text-primary)' }}
            >
              {row.averageRating.toFixed(1)}
            </span>
          </div>
        ) : (
          <span className="inline-block" style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      header: '',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            icon={List}
            title="Chapters"
            onClick={() => openChapters(row)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Star}
            className={row.isFeatured ? '!text-amber-400' : ''}
            onClick={() => toggleFeatured(row._id)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={() => openEditBook(row)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="!text-red-400"
            onClick={() => handleDelete(row._id)}
          />
        </div>
      ),
    },
  ];

  if (chaptersBook) {
    return (
      <div className="space-y-5">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              onClick={() => {
                setChaptersBook(null);
                setChapters([]);
              }}
            />
            <div>
              <h1 className="flex items-center gap-2.5">
                <BookOpen
                  className="w-5 h-5"
                  style={{ color: 'var(--accent-400)' }}
                />
                {chaptersBook.title} — Chapters
              </h1>
              <p>
                {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="page-actions">
            <Button icon={Plus} onClick={() => setShowAddChapter(true)}>
              Add Chapter
            </Button>
          </div>
        </div>

        <DataTable
          columns={[
            {
              header: '#',
              key: 'orderNumber',
              render: (row) => (
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--accent-400)' }}
                >
                  {row.orderNumber}
                </span>
              ),
            },
            {
              header: 'Title',
              key: 'title',
              render: (row) => (
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {row.title}
                </span>
              ),
            },
            {
              header: 'Status',
              key: 'status',
              render: (row) => (
                <Badge variant={row.status === 'published' ? 'success' : 'neutral'}>
                  {row.status}
                </Badge>
              ),
            },
            {
              header: 'Access',
              key: 'isFree',
              render: (row) =>
                row.isFree ? (
                  <Badge variant="success">Free</Badge>
                ) : (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: '#f59e0b' }}
                  >
                    {row.coinCost} coins
                  </span>
                ),
            },
            {
              header: 'Read Time',
              key: 'estimatedReadTime',
              render: (row) => (
                <span
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {row.estimatedReadTime ? `${row.estimatedReadTime} min` : '—'}
                </span>
              ),
            },
            {
              header: '',
              key: 'actions',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-0.5">
                  <Button
                    variant="ghost" 
                    size="sm"
                    icon={row.status === 'published' ? Pause : Play}
                    title={row.status === 'published' ? 'Unpublish' : 'Publish'}
                    className={row.status === 'published' ? '!text-green-500' : ''}
                    onClick={() => handleTogglePublishChapter(row)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    title="Edit chapter"
                    onClick={() => setEditChapter(row)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    className="!text-red-400"
                    onClick={() => handleDeleteChapter(row._id)}
                  />
                </div>
              ),
            },
          ]}
          data={chapters}
          isLoading={chaptersLoading}
        />

        <Modal
          isOpen={showAddChapter}
          onClose={() => setShowAddChapter(false)}
          title="Add Chapter"
        >
          <form className="space-y-4" onSubmit={handleAddChapter}>
            <Input
              label="Chapter Title"
              name="title"
              placeholder="Enter chapter title"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Order Number"
                name="orderNumber"
                type="number"
                placeholder="1"
                required
              />
              <Input
                label="Est. Read Time (min)"
                name="estimatedReadTime"
                type="number"
                placeholder="10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Access"
                name="isFree"
                options={[
                  { value: 'true', label: 'Free' },
                  { value: 'false', label: 'Paid' },
                ]}
              />
              <Select
                label="Status"
                name="status"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                ]}
              />
            </div>
            <div className="grid grid-cols-1">
              <Input
                label="Coin Cost (if Paid)"
                name="coinCost"
                type="number"
                placeholder="0"
              />
            </div>
            
            <div className="w-full">
              <label className="block text-[0.75rem] font-semibold mb-1 text-gray-600">Chapter PDF</label>
              <input type="file" name="pdfFile" accept="application/pdf" className="input-field" />
              <p className="text-xs text-gray-500 mt-1">Upload a PDF to automatically generate chapter text.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddChapter(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Chapter</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Chapter Modal */}
        {editChapter && (
          <Modal isOpen={!!editChapter} onClose={() => setEditChapter(null)} title="Edit Chapter">
            <form className="space-y-4" onSubmit={handleEditChapter}>
              <Input label="Chapter Title" name="title" defaultValue={editChapter.title} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Order Number" name="orderNumber" type="number" defaultValue={editChapter.orderNumber} required />
                <Input label="Est. Read Time (min)" name="estimatedReadTime" type="number" defaultValue={editChapter.estimatedReadTime || 0} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Access" name="isFree" defaultValue={String(editChapter.isFree)}
                  options={[{ value: 'true', label: 'Free' }, { value: 'false', label: 'Paid' }]} />
                <Select label="Status" name="status" defaultValue={editChapter.status}
                  options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
              </div>
              <Input label="Coin Cost (if Paid)" name="coinCost" type="number" defaultValue={editChapter.coinCost || 0} />
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
      </div>
    );
  }

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
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search books..."
            className="w-56"
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' },
            ]}
            className="!w-32"
          />
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Add Book
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={books}
        isLoading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreateImagePreview('');
        }}
        title="Create New Book"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            try {
              e.preventDefault();
              setCreateSubmitting(true);

              const f = new FormData(e.target);
              const payload = new FormData();

              payload.append('title', f.get('title') || '');
              payload.append('authorId', f.get('authorId') || '');
              payload.append('categoryId', f.get('categoryId') || '');
              payload.append(
                'genres',
                JSON.stringify(
                  (f.get('genres') || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              );
              payload.append('description', f.get('description') || '');

              const file = f.get('coverImage');
              if (file && file instanceof File && file.size > 0) {
                payload.append('coverImage', file);
              }

              await api.post('/admin/books', payload);

              toast.success('Book created');
              setShowCreate(false);
              setCreateImagePreview('');
              fetchBooks();
            } catch (err) {
              console.error('Create book error:', err);
              toast.error(err?.response?.data?.message || err?.message || 'Failed to create');
            } finally {
              setCreateSubmitting(false);
            }
          }}
        >
          <Input
            label="Book Title"
            name="title"
            placeholder="Enter book title"
            required
          />
          <Select label="Author" name="authorId" required options={authorOptions} />
          <Select
            label="Category"
            name="categoryId"
            required
            options={categoryOptions}
          />
          <Input
            label="Genres"
            name="genres"
            placeholder="Comma-separated (e.g. Fiction, Thriller)"
            required
          />

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Cover Image
            </label>

            <input
              type="file"
              name="coverImage"
              accept="image/*"
              onChange={handleCreateImageChange}
              className="w-full text-sm border rounded-lg px-3 py-2"
            />

            {createImagePreview ? (
              <div className="mt-3 relative w-28 h-40 rounded-lg overflow-hidden border">
                <img
                  src={createImagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCreateImagePreview('')}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                className="mt-3 w-28 h-40 rounded-lg border flex items-center justify-center"
                style={{ color: 'var(--text-muted)' }}
              >
                <ImageIcon className="w-5 h-5" />
              </div>
            )}
          </div>

          <Textarea
            label="Description"
            name="description"
            placeholder="Write a compelling description..."
            rows={3}
            required
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={createSubmitting}
              onClick={() => {
                setShowCreate(false);
                setCreateImagePreview('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSubmitting}>
              {createSubmitting ? 'Creating...' : 'Create Book'}
            </Button>
          </div>
        </form>
      </Modal>

      {editBook && (
        <Modal
          isOpen={!!editBook}
          onClose={() => {
            setEditBook(null);
            setEditImagePreview('');
          }}
          title="Edit Book"
        >
          <form className="space-y-4" onSubmit={handleEdit}>
            <Input
              label="Book Title"
              name="title"
              defaultValue={editBook.title}
              required
            />
            <Select
              label="Author"
              name="authorId"
              required
              options={authorOptions}
              defaultValue={editBook.authorId?._id || editBook.authorId}
            />
            <Select
              label="Category"
              name="categoryId"
              required
              options={categoryOptions}
              defaultValue={editBook.categoryId?._id || editBook.categoryId}
            />
            <Input
              label="Genres"
              name="genres"
              defaultValue={(editBook.genres || []).join(', ')}
              required
            />

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Cover Image
              </label>

              <input
                type="file"
                name="coverImage"
                accept="image/*"
                onChange={handleEditImageChange}
                className="w-full text-sm border rounded-lg px-3 py-2"
              />

              {editImagePreview ? (
                <div className="mt-3 w-28 h-40 rounded-lg overflow-hidden border">
                  <img
                    src={editImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="mt-3 w-28 h-40 rounded-lg border flex items-center justify-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
            </div>

            <Textarea
              label="Description"
              name="description"
              defaultValue={editBook.description}
              rows={3}
              required
            />
            <Select
              label="Status"
              name="status"
              options={statusOptions}
              defaultValue={editBook.status}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={editSubmitting}
                onClick={() => {
                  setEditBook(null);
                  setEditImagePreview('');
                }}
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