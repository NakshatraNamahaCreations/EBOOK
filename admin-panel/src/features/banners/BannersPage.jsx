import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Forms';
import {
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const BannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedBanner, setSelectedBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [createImagePreview, setCreateImagePreview] = useState('');
  const [editImagePreview, setEditImagePreview] = useState('');

  const toDateInput = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d)) return '';
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const normalizeBanner = (item) => ({
    ...item,
    _id: item?._id || '',
    title: item?.title || 'Untitled Banner',
    position: item?.position || 'not_available',
    linkType: item?.linkType || 'not_available',
    priority: item?.priority ?? 0,
    startDate: toDateInput(item?.startDate),
    endDate: toDateInput(item?.endDate),
    isActive: Boolean(item?.isActive),
    image: item?.image || item?.imageUrl || item?.bannerImage || '',
  });

  const formatLabel = (value) => {
    if (!value) return 'N/A';
    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/banners');

      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      setBanners(list.map(normalizeBanner));
    } catch (error) {
      console.error('Fetch banners error:', error);
      setBanners([]);
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreateImageChange = (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        setCreateImagePreview('');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setCreateImagePreview(previewUrl);
    } catch (error) {
      console.error('Create image preview error:', error);
      toast.error('Failed to preview selected image');
    }
  };

  const handleEditImageChange = (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        setEditImagePreview(selectedBanner?.image || '');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);
    } catch (error) {
      console.error('Edit image preview error:', error);
      toast.error('Failed to preview selected image');
    }
  };

  const handleCreateBanner = async (e) => {
    try {
      e.preventDefault();
      setSubmitting(true);

      const formData = new FormData(e.target);
      const imageFile = formData.get('image');

      const payload = new FormData();
      payload.append('title', formData.get('title')?.toString().trim() || '');
      payload.append('position', formData.get('position') || '');
      payload.append('linkType', formData.get('linkType') || '');
      payload.append('priority', Number(formData.get('priority') || 1));
      payload.append('startDate', formData.get('startDate') || '');
      payload.append('endDate', formData.get('endDate') || '');
      payload.append('isActive', 'true');

      if (imageFile && imageFile instanceof File && imageFile.size > 0) {
        payload.append('image', imageFile);
      }

      await api.post('/admin/banners', payload);

      toast.success('Banner created successfully');
      setShowCreate(false);
      setCreateImagePreview('');
      await fetchBanners();
      e.target.reset();
    } catch (error) {
      console.error('Create banner error:', error);
      toast.error(
        error?.response?.data?.message || error?.message || 'Failed to create banner'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (banner) => {
    try {
      const normalized = normalizeBanner(banner);
      setSelectedBanner(normalized);
      setEditImagePreview(normalized?.image || '');
      setShowEdit(true);
    } catch (error) {
      console.error('Open edit error:', error);
      toast.error('Failed to open edit modal');
    }
  };

  const handleEditBanner = async (e) => {
    try {
      e.preventDefault();

      if (!selectedBanner?._id) {
        toast.error('Banner ID is missing');
        return;
      }

      setSubmitting(true);

      const formData = new FormData(e.target);
      const imageFile = formData.get('image');

      const payload = new FormData();
      payload.append('title', formData.get('title')?.toString().trim() || '');
      payload.append('position', formData.get('position') || '');
      payload.append('linkType', formData.get('linkType') || '');
      payload.append('priority', Number(formData.get('priority') || 1));
      payload.append('startDate', formData.get('startDate') || '');
      payload.append('endDate', formData.get('endDate') || '');
      payload.append('isActive', formData.get('isActive') || 'true');

      if (imageFile && imageFile instanceof File && imageFile.size > 0) {
        payload.append('image', imageFile);
      }

      await api.put(`/admin/banners/${selectedBanner._id}`, payload);

      toast.success('Banner updated successfully');
      setShowEdit(false);
      setSelectedBanner(null);
      setEditImagePreview('');
      await fetchBanners();
    } catch (error) {
      console.error('Update banner error:', error);
      toast.error(
        error?.response?.data?.message || error?.message || 'Failed to update banner'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (banner) => {
    try {
      if (!banner?._id) {
        toast.error('Banner ID is missing');
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete "${banner?.title || 'this banner'}"?`
      );

      if (!confirmed) return;

      await api.delete(`/admin/banners/${banner._id}`);
      toast.success('Banner deleted successfully');
      await fetchBanners();
    } catch (error) {
      console.error('Delete banner error:', error);
      toast.error(
        error?.response?.data?.message || error?.message || 'Failed to delete banner'
      );
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      if (!banner?._id) {
        toast.error('Banner ID is missing');
        return;
      }

      const payload = new FormData();
      payload.append('title', banner?.title || '');
      payload.append('position', banner?.position || '');
      payload.append('linkType', banner?.linkType || '');
      payload.append('priority', banner?.priority ?? 1);
      payload.append('startDate', banner?.startDate || '');
      payload.append('endDate', banner?.endDate || '');
      payload.append('isActive', String(!banner?.isActive));

      await api.put(`/admin/banners/${banner._id}`, payload);

      toast.success(
        `Banner ${!banner?.isActive ? 'activated' : 'deactivated'} successfully`
      );
      await fetchBanners();
    } catch (error) {
      console.error('Toggle banner status error:', error);
      toast.error(
        error?.response?.data?.message || error?.message || 'Failed to update banner status'
      );
    }
  };

  const columns = [
    {
      header: 'Banner',
      key: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-10 rounded-md overflow-hidden flex items-center justify-center"
            style={{
              background: row?.image
                ? 'transparent'
                : 'linear-gradient(135deg, var(--accent-600), #7c3aed)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {row?.image ? (
              <img
                src={row.image}
                alt={row?.title || 'Banner'}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-4 h-4 text-white" />
            )}
          </div>

          <div>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {row?.title || 'Untitled Banner'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatLabel(row?.position)}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Link To',
      key: 'linkType',
      render: (row) => <Badge variant="info">{formatLabel(row?.linkType)}</Badge>,
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          #{row?.priority ?? 0}
        </span>
      ),
    },
    {
      header: 'Period',
      key: 'dates',
      render: (row) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {row?.startDate || 'N/A'} → {row?.endDate || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (row) => (
        <Badge variant={row?.isActive ? 'success' : 'neutral'}>
          {row?.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: '',
      key: 'actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={row?.isActive ? EyeOff : Eye}
            onClick={() => handleToggleStatus(row)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={() => handleOpenEdit(row)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="!text-red-400"
            onClick={() => handleDeleteBanner(row)}
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
            <ImageIcon className="w-5 h-5" style={{ color: 'var(--accent-400)' }} />
            Banners
          </h1>
          <p>Manage promotional banners</p>
        </div>

        <Button icon={Plus} onClick={() => setShowCreate(true)}>
          Create Banner
        </Button>
      </div>

      <DataTable columns={columns} data={banners} isLoading={loading} />

      <Modal
        isOpen={showCreate}
        onClose={() => {
          if (!submitting) {
            setShowCreate(false);
            setCreateImagePreview('');
          }
        }}
        title="Create Banner"
      >
        <form className="space-y-4" onSubmit={handleCreateBanner}>
          <Input label="Title" name="title" placeholder="Banner headline" required />

          <Select
            label="Position"
            name="position"
            options={[
              { value: 'home_top', label: 'Home Top' },
              { value: 'home_middle', label: 'Home Middle' },
              { value: 'explore', label: 'Explore Page' },
            ]}
          />

          <Select
            label="Link Type"
            name="linkType"
            options={[
              { value: 'book', label: 'Book' },
              { value: 'author', label: 'Author' },
              { value: 'coin_pack', label: 'Coin Pack' },
              { value: 'external', label: 'External URL' },
            ]}
          />

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Banner Image
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleCreateImageChange}
              className="w-full text-sm border rounded-lg px-3 py-2"
            />
            {createImagePreview ? (
              <div className="mt-3">
                <img
                  src={createImagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border"
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" name="startDate" type="date" />
            <Input label="End Date" name="endDate" type="date" />
          </div>

          <Input label="Priority" name="priority" type="number" placeholder="1" min="1" />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreate(false);
                setCreateImagePreview('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEdit}
        onClose={() => {
          if (!submitting) {
            setShowEdit(false);
            setSelectedBanner(null);
            setEditImagePreview('');
          }
        }}
        title="Edit Banner"
      >
        <form className="space-y-4" onSubmit={handleEditBanner}>
          <Input
            label="Title"
            name="title"
            placeholder="Banner headline"
            required
            defaultValue={selectedBanner?.title || ''}
          />

          <Select
            label="Position"
            name="position"
            defaultValue={selectedBanner?.position || 'home_top'}
            options={[
              { value: 'home_top', label: 'Home Top' },
              { value: 'home_middle', label: 'Home Middle' },
              { value: 'explore', label: 'Explore Page' },
            ]}
          />

          <Select
            label="Link Type"
            name="linkType"
            defaultValue={selectedBanner?.linkType || 'book'}
            options={[
              { value: 'book', label: 'Book' },
              { value: 'author', label: 'Author' },
              { value: 'coin_pack', label: 'Coin Pack' },
              { value: 'external', label: 'External URL' },
            ]}
          />

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Banner Image
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleEditImageChange}
              className="w-full text-sm border rounded-lg px-3 py-2"
            />
            {editImagePreview ? (
              <div className="mt-3">
                <img
                  src={editImagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border"
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              defaultValue={selectedBanner?.startDate || ''}
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              defaultValue={selectedBanner?.endDate || ''}
            />
          </div>

          <Input
            label="Priority"
            name="priority"
            type="number"
            placeholder="1"
            min="1"
            defaultValue={selectedBanner?.priority ?? 1}
          />

          <Select
            label="Status"
            name="isActive"
            defaultValue={String(selectedBanner?.isActive ?? true)}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEdit(false);
                setSelectedBanner(null);
                setEditImagePreview('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};