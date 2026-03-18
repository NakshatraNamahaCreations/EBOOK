import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Input, Select, Textarea } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Ticket, Plus, Edit, Trash2, Copy } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/admin/coupons', { params });
      setCoupons(res?.data || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchCoupons, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const f = new FormData(e.target);
      const data = {
        code: f.get('code')?.toUpperCase().trim(),
        description: f.get('description') || '',
        discountType: f.get('discountType'),
        discountValue: Number(f.get('discountValue') || 0),
        minPurchaseAmount: Number(f.get('minPurchaseAmount') || 0),
        maxDiscountAmount: Number(f.get('maxDiscountAmount') || 0),
        usageLimit: Number(f.get('usageLimit') || 0),
        validFrom: f.get('validFrom') || undefined,
        validUntil: f.get('validUntil') || undefined,
        applicableTo: f.get('applicableTo'),
      };
      await api.post('/admin/coupons', data);
      toast.success('Coupon created');
      setShowCreate(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err?.message || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const f = new FormData(e.target);
      const data = {
        description: f.get('description') || '',
        discountType: f.get('discountType'),
        discountValue: Number(f.get('discountValue') || 0),
        minPurchaseAmount: Number(f.get('minPurchaseAmount') || 0),
        maxDiscountAmount: Number(f.get('maxDiscountAmount') || 0),
        usageLimit: Number(f.get('usageLimit') || 0),
        validFrom: f.get('validFrom') || undefined,
        validUntil: f.get('validUntil') || undefined,
        applicableTo: f.get('applicableTo'),
        isActive: f.get('isActive') === 'true',
      };
      await api.put(`/admin/coupons/${editCoupon._id}`, data);
      toast.success('Coupon updated');
      setEditCoupon(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err?.message || 'Failed to update coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await api.delete(`/admin/coupons/${coupon._id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  const toDateInput = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d)) return '';
    return d.toISOString().slice(0, 10);
  };

  const columns = [
    {
      header: 'Coupon', key: 'code',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 2px 8px rgba(99,102,241,0.2)' }}>
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>{row.code}</p>
              <button onClick={() => copyCode(row.code)} className="p-0.5 rounded hover:bg-gray-100">
                <Copy className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Discount', key: 'discountValue',
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
          {row.discountType === 'percentage' ? `${row.discountValue}%` : `₹${row.discountValue}`}
        </span>
      ),
    },
    {
      header: 'Applies To', key: 'applicableTo',
      render: (row) => (
        <Badge variant="info">
          {row.applicableTo === 'ebook' ? 'E-Book' : row.applicableTo === 'audiobook' ? 'Audiobook' : row.applicableTo === 'combo' ? 'Combo' : 'All Books'}
        </Badge>
      ),
    },
    {
      header: 'Usage', key: 'usageCount',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {row.usageCount || 0}{row.usageLimit ? ` / ${row.usageLimit}` : ''}
        </span>
      ),
    },
    {
      header: 'Valid Until', key: 'validUntil',
      render: (row) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {row.validUntil ? new Date(row.validUntil).toLocaleDateString() : 'No expiry'}
        </span>
      ),
    },
    {
      header: 'Status', key: 'isActive',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: '', key: 'actions',
      render: (row) => (
        <div className="flex gap-0.5">
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => setEditCoupon(row)} />
          <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" onClick={() => handleDelete(row)} />
        </div>
      ),
    },
  ];

  const CouponFormFields = ({ coupon }) => (
    <>
      {!coupon && (
        <Input label="Coupon Code" name="code" placeholder="e.g. SAVE20" required />
      )}
      <Textarea label="Description" name="description" placeholder="Describe the offer..." rows={2} defaultValue={coupon?.description || ''} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Discount Type" name="discountType" defaultValue={coupon?.discountType || 'percentage'}
          options={[
            { value: 'percentage', label: 'Percentage (%)' },
            { value: 'fixed', label: 'Fixed Amount (₹)' },
          ]}
        />
        <Input label="Discount Value" name="discountValue" type="number" placeholder="e.g. 20" required defaultValue={coupon?.discountValue || ''} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Min Purchase (₹)" name="minPurchaseAmount" type="number" placeholder="0" defaultValue={coupon?.minPurchaseAmount || ''} />
        <Input label="Max Discount (₹)" name="maxDiscountAmount" type="number" placeholder="0 = no limit" defaultValue={coupon?.maxDiscountAmount || ''} />
      </div>
      <Select label="Applicable To" name="applicableTo" defaultValue={coupon?.applicableTo || 'all'}
        options={[
          { value: 'all', label: 'All Books' },
          { value: 'ebook', label: 'E-Books Only' },
          { value: 'audiobook', label: 'Audiobooks Only' },
          { value: 'combo', label: 'Combo Only' },
        ]}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Valid From" name="validFrom" type="date" defaultValue={toDateInput(coupon?.validFrom)} />
        <Input label="Valid Until" name="validUntil" type="date" defaultValue={toDateInput(coupon?.validUntil)} />
      </div>
      <Input label="Usage Limit (0 = unlimited)" name="usageLimit" type="number" placeholder="0" defaultValue={coupon?.usageLimit || ''} />
      {coupon && (
        <Select label="Status" name="isActive" defaultValue={String(coupon?.isActive ?? true)}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
      )}
    </>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5" style={{ color: 'var(--accent-400)' }} />
            Coupons & Discounts
          </h1>
          <p>{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Search coupons..." className="w-56" />
          <Button icon={Plus} onClick={() => setShowCreate(true)}>Create Coupon</Button>
        </div>
      </div>

      <DataTable columns={columns} data={coupons} isLoading={loading} />

      <Modal isOpen={showCreate} onClose={() => { if (!submitting) setShowCreate(false); }} title="Create Coupon">
        <form className="space-y-4" onSubmit={handleCreate}>
          <CouponFormFields />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" disabled={submitting} onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Coupon'}</Button>
          </div>
        </form>
      </Modal>

      {editCoupon && (
        <Modal isOpen={!!editCoupon} onClose={() => { if (!submitting) setEditCoupon(null); }} title="Edit Coupon">
          <form className="space-y-4" onSubmit={handleEdit}>
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-lg font-bold tracking-wider" style={{ color: 'var(--accent)' }}>{editCoupon.code}</span>
            </div>
            <CouponFormFields coupon={editCoupon} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" disabled={submitting} onClick={() => setEditCoupon(null)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
