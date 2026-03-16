import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { SearchInput, Select, Input } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  CreditCard, TrendingUp, DollarSign, Package,
  RefreshCw, Filter, X, Eye, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusMeta = {
  created: { variant: 'neutral', label: 'Created', icon: Clock },
  authorized: { variant: 'info', label: 'Authorized', icon: CheckCircle },
  captured: { variant: 'success', label: 'Captured', icon: CheckCircle },
  failed: { variant: 'danger', label: 'Failed', icon: AlertCircle },
  refunded: { variant: 'warning', label: 'Refunded', icon: RefreshCw },
  pending: { variant: 'neutral', label: 'Pending', icon: Clock },
  completed: { variant: 'success', label: 'Completed', icon: CheckCircle },
};

const SummaryCard = ({ icon: Icon, title, value, sub, color }) => (
  <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{title}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </div>
);

const formatAmount = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount / 100);
};

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [filters, setFilters] = useState({ status: '', gateway: '', startDate: '', endDate: '' });
  const [viewPayment, setViewPayment] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const [activeTab, setActiveTab] = useState('payments');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      // Remove empty keys
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/admin/payments', { params });
      setPayments(res.data || []);
      setPagination(res.pagination || null);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get('/admin/payments/summary', {
        params: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }
      });
      setSummary(res.data || null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasePagination, setPurchasePagination] = useState(null);
  const [purchasePage, setPurchasePage] = useState(1);

  const fetchPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const res = await api.get('/admin/payments/purchases', { params: { page: purchasePage, limit: 20 } });
      setPurchases(res.data || []);
      setPurchasePagination(res.pagination || null);
    } catch {
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchPayments();
  }, [page, filters]);

  useEffect(() => {
    if (activeTab === 'purchases') fetchPurchases();
  }, [activeTab, purchasePage]);

  const handleUpdateStatus = async () => {
    if (!newStatus || !viewPayment) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/payments/${viewPayment._id}/status`, { status: newStatus });
      toast.success('Payment status updated');
      setViewPayment(null);
      setNewStatus('');
      fetchPayments();
      fetchSummary();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const paymentColumns = [
    {
      header: 'Transaction', key: 'gatewayPaymentId',
      render: (row) => (
        <div>
          <p className="text-xs font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
            {row.gatewayPaymentId || row.gatewayOrderId || row._id?.slice(-8)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.gateway}</p>
        </div>
      ),
    },
    {
      header: 'User', key: 'userId',
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.userId?.name || 'Unknown'}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.userId?.email || ''}</p>
        </div>
      ),
    },
    {
      header: 'Amount', key: 'amount',
      render: (row) => (
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {formatAmount(row.amount, row.currency)}
        </span>
      ),
    },
    {
      header: 'Status', key: 'status',
      render: (row) => {
        const m = statusMeta[row.status] || { variant: 'neutral', label: row.status };
        return <Badge variant={m.variant}>{m.label}</Badge>;
      },
    },
    {
      header: 'Date', key: 'createdAt',
      render: (row) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: '', key: 'actions', align: 'right',
      render: (row) => (
        <Button variant="ghost" size="sm" icon={Eye} onClick={() => { setViewPayment(row); setNewStatus(row.status); }} />
      ),
    },
  ];

  const purchaseColumns = [
    {
      header: 'User', key: 'userId',
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.userId?.name || 'Unknown'}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.userId?.email || ''}</p>
        </div>
      ),
    },
    { header: 'Amount', key: 'amountPaid', render: (row) => <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatAmount(row.amountPaid, row.currency)}</span> },
    { header: 'Coins', key: 'coinsReceived', render: (row) => <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>+{row.coinsReceived + (row.bonusCoins || 0)}</span> },
    {
      header: 'Status', key: 'paymentStatus',
      render: (row) => {
        const m = statusMeta[row.paymentStatus] || { variant: 'neutral', label: row.paymentStatus };
        return <Badge variant={m.variant}>{m.label}</Badge>;
      }
    },
    { header: 'Date', key: 'createdAt', render: (row) => <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(row.createdAt).toLocaleDateString('en-IN')}</span> },
  ];

  const capturedTotal = summary?.statusBreakdown?.find(s => s._id === 'captured')?.count || 0;
  const failedTotal = summary?.statusBreakdown?.find(s => s._id === 'failed')?.count || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5"><CreditCard className="w-5 h-5" style={{ color: 'var(--accent-400)' }} /> Payments</h1>
          <p>Transaction history, revenue, and payment management</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" icon={RefreshCw} onClick={() => { fetchPayments(); fetchSummary(); }}>Refresh</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={DollarSign} title="Total Revenue" color="#6366f1"
          value={summaryLoading ? '...' : formatAmount(summary?.totalRevenue)}
          sub="Captured payments only" />
        <SummaryCard icon={TrendingUp} title="Total Transactions" color="#10b981"
          value={summaryLoading ? '...' : (summary?.totalTransactions || 0).toLocaleString()}
          sub="Successful captures" />
        <SummaryCard icon={CheckCircle} title="Avg. Value" color="#f59e0b"
          value={summaryLoading ? '...' : formatAmount(summary?.avgTransactionValue)}
          sub="Per transaction" />
        <SummaryCard icon={AlertCircle} title="Failed / Refunded" color="#ef4444"
          value={summaryLoading ? '...' : `${failedTotal + (summary?.statusBreakdown?.find(s => s._id === 'refunded')?.count || 0)}`}
          sub="Needs attention" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <Select label="Status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          options={[
            { value: '', label: 'All Status' },
            { value: 'captured', label: 'Captured' },
            { value: 'created', label: 'Created' },
            { value: 'authorized', label: 'Authorized' },
            { value: 'failed', label: 'Failed' },
            { value: 'refunded', label: 'Refunded' },
          ]} className="!w-36" />
        <Select label="Gateway" value={filters.gateway} onChange={e => setFilters(f => ({ ...f, gateway: e.target.value }))}
          options={[{ value: '', label: 'All Gateways' }, { value: 'razorpay', label: 'Razorpay' }, { value: 'stripe', label: 'Stripe' }]}
          className="!w-36" />
        <Input label="From Date" type="date" value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="!w-40" />
        <Input label="To Date" type="date" value={filters.endDate}
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="!w-40" />
        {(filters.status || filters.gateway || filters.startDate || filters.endDate) && (
          <Button variant="secondary" icon={X} size="sm"
            onClick={() => setFilters({ status: '', gateway: '', startDate: '', endDate: '' })}>
            Clear
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        {[{ key: 'payments', label: 'Gateway Payments' }, { key: 'purchases', label: 'Coin Purchases' }].map(tab => (
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

      {/* Data Table */}
      {activeTab === 'payments' ? (
        <DataTable columns={paymentColumns} data={payments} isLoading={loading} pagination={pagination} onPageChange={setPage} />
      ) : (
        <DataTable columns={purchaseColumns} data={purchases} isLoading={purchasesLoading} pagination={purchasePagination} onPageChange={setPurchasePage} />
      )}

      {/* Payment Detail Modal */}
      {viewPayment && (
        <Modal isOpen={!!viewPayment} onClose={() => setViewPayment(null)} title="Transaction Details" maxWidth="520px">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Transaction ID', value: viewPayment.gatewayPaymentId || '—' },
                { label: 'Order ID', value: viewPayment.gatewayOrderId || '—' },
                { label: 'Gateway', value: viewPayment.gateway },
                { label: 'Amount', value: formatAmount(viewPayment.amount, viewPayment.currency) },
                { label: 'Currency', value: viewPayment.currency || '—' },
                { label: 'Date', value: new Date(viewPayment.createdAt).toLocaleString('en-IN') },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-xs font-semibold mt-1 break-all" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>User</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{viewPayment.userId?.name || 'Unknown'}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{viewPayment.userId?.email}</p>
            </div>

            <div className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Current Status</p>
              <Badge variant={statusMeta[viewPayment.status]?.variant || 'neutral'}>{statusMeta[viewPayment.status]?.label || viewPayment.status}</Badge>
            </div>

            <div className="space-y-2">
              <Select label="Update Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}
                options={[
                  { value: 'created', label: 'Created' },
                  { value: 'authorized', label: 'Authorized' },
                  { value: 'captured', label: 'Captured' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'refunded', label: 'Refunded' },
                ]} />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setViewPayment(null)}>Close</Button>
              <Button onClick={handleUpdateStatus} isLoading={updatingStatus}>Update Status</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
