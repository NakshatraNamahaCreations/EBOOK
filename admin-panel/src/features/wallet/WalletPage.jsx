import React, { useState, useEffect } from 'react';
import { StatCard, Card } from '../../components/ui/Cards';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Forms';
import { Wallet, Coins, TrendingUp, Edit, Trash2, Plus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const WalletPage = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coin-packs');
      setPacks(res.data || []);
    } catch {
      setPacks([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPacks(); }, []);

  const columns = [
    {
      header: 'Pack', key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 2px 8px rgba(245,158,11,0.2)' }}>
            <Coins className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.name}</p>
            {row.isOffer && <span className="text-[0.65rem] font-semibold" style={{ color: '#f59e0b' }}>{row.offerLabel}</span>}
          </div>
        </div>
      ),
    },
    { header: 'Coins', key: 'coins', render: (row) => <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>{row.coins}</span> },
    { header: 'Bonus', key: 'bonusCoins', render: (row) => <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>+{row.bonusCoins}</span> },
    { header: 'Price', key: 'priceINR', render: (row) => <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>₹{row.priceINR}</span> },
    { header: 'Status', key: 'isActive', render: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      header: '', key: 'actions',
      render: () => (
        <div className="flex gap-0.5">
          <Button variant="ghost" size="sm" icon={Edit} />
          <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5"><Wallet className="w-5 h-5" style={{ color: '#f59e0b' }} /> Wallet & Coins</h1>
          <p>Manage coin packs and economy</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>New Coin Pack</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Active Packs" value={packs.filter(p => p.isActive).length.toString()} icon={Wallet} iconClass="stat-icon-violet" />
      </div>
      <DataTable columns={columns} data={packs} isLoading={loading} />
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Coin Pack" >
        <form className="space-y-4" onSubmit={async e => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const data = {
            name: formData.get('name'),
            coins: Number(formData.get('coins') || 0),
            bonusCoins: Number(formData.get('bonusCoins') || 0),
            priceINR: Number(formData.get('priceINR') || 0),
            priceUSD: Number(formData.get('priceUSD') || 0),
            offerLabel: formData.get('offerLabel'),
            isOffer: !!formData.get('offerLabel')
          };
          try {
            await api.post('/admin/coin-packs', data);
            toast.success('Pack created');
            setShowCreate(false);
            fetchPacks();
          } catch(err) { toast.error(err.message || 'Failed to create pack'); }
        }}>
          <Input label="Pack Name" name="name" placeholder="e.g. Super Pack" required />
          <div className="grid grid-cols-2 gap-4"><Input label="Coins" name="coins" type="number" placeholder="100" required /><Input label="Bonus" name="bonusCoins" type="number" placeholder="0" /></div>
          <div className="grid grid-cols-2 gap-4"><Input label="Price (INR)" name="priceINR" type="number" placeholder="99" required /><Input label="Price (USD)" name="priceUSD" type="number" placeholder="1.99" /></div>
          <Input label="Offer Label" name="offerLabel" placeholder="e.g. 20% Bonus! (optional)" />
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit">Create</Button></div>
        </form>
      </Modal>
    </div>
  );
};
