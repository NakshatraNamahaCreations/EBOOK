import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Select } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { MessageSquare, Star, CheckCircle, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reviews');
      setReviews(res.data || []);
    } catch {
      setReviews([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const filtered = reviews.filter(r => {
    const userName = r.userId?.name || r.user || '';
    const bookTitle = r.contentId?.title || r.book || '';
    const matchSearch = userName.toLowerCase().includes(search.toLowerCase()) || bookTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const RatingStars = ({ rating }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-amber-400 text-amber-400' : ''}`} style={i >= rating ? { color: 'var(--border-strong)' } : {}} />
      ))}
    </div>
  );

  const columns = [
    {
      header: 'Review', key: 'review',
      render: (row) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.userId?.name || row.user || 'Unknown'}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>on</span>
            <span className="text-sm font-medium" style={{ color: 'var(--accent-400)' }}>{row.contentId?.title || row.book || 'Unknown'}</span>
          </div>
          <RatingStars rating={row.rating} />
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{row.body || row.comment}</p>
        </div>
      ),
    },
    { header: 'Status', key: 'status', render: (row) => <Badge variant={row.status === 'approved' ? 'success' : 'warning'}>{row.status}</Badge> },
    { header: 'Date', key: 'createdAt', render: (row) => <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(row.createdAt).toLocaleDateString()}</span> },
    {
      header: '', key: 'actions',
      render: (row) => (
        <div className="flex gap-0.5">
          {row.status === 'pending' && <Button variant="ghost" size="sm" icon={CheckCircle} className="!text-emerald-400" />}
          <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5"><MessageSquare className="w-5 h-5" style={{ color: '#f59e0b' }} /> Reviews</h1>
          <p>{reviews.length} total reviews</p>
        </div>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Search..." className="w-56" />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            options={[{ value: '', label: 'All Status' }, { value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Pending' }]}
            className="!w-32" />
        </div>
      </div>
      <DataTable columns={columns} data={filtered} isLoading={loading} />
    </div>
  );
};
