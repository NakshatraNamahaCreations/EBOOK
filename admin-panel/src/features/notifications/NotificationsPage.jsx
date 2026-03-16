import React, { useState, useEffect } from 'react';
import { DataTable, Badge } from '../../components/ui/DataDisplay';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Forms';
import { Bell, Plus, Send } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const typeColors = { promo: 'accent', offer: 'warning', system: 'info', update: 'success' };

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const columns = [
    {
      header: 'Notification', key: 'title',
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.title}</p>
          <p className="text-xs mt-0.5 max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{row.body}</p>
        </div>
      ),
    },
    { header: 'Type', key: 'type', render: (row) => <Badge variant={typeColors[row.type] || 'neutral'}>{row.type}</Badge> },
    { header: 'Target', key: 'targetType', render: (row) => <Badge variant="neutral">{row.targetType}</Badge> },
    { header: 'Read Rate', key: 'readRate', render: (row) => <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>{row.stats?.opened ? `${Math.round((row.stats.opened / (row.stats.delivered || 1)) * 100)}%` : '0%'}</span> },
    { header: 'Sent', key: 'sentAt', render: (row) => <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.sentAt ? new Date(row.sentAt).toLocaleDateString() : 'Pending'}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5"><Bell className="w-5 h-5" style={{ color: 'var(--accent-400)' }} /> Notifications</h1>
          <p>Push notifications &amp; announcements</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>Send Notification</Button>
      </div>
      <DataTable columns={columns} data={notifications} isLoading={loading} />
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Send Notification" >
        <form className="space-y-4" onSubmit={async (e) => { 
          e.preventDefault(); 
          const formData = new FormData(e.target);
          const data = {
            title: formData.get('title'),
            body: formData.get('body'),
            type: formData.get('type'),
            targetType: formData.get('target')
          };
          try {
            await api.post('/admin/notifications/send', data);
            toast.success('Notification sent successfully');
            setShowCreate(false);
            fetchNotifs();
          } catch (error) { toast.error(error.message || 'Failed to send notification'); }
        }}>
          <Input label="Title" name="title" placeholder="Notification title" required />
          <Textarea label="Body" name="body" placeholder="Notification message..." rows={3} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" name="type" options={[{ value: 'promo', label: 'Promo' }, { value: 'offer', label: 'Offer' }, { value: 'system', label: 'System' }, { value: 'update', label: 'Update' }]} />
            <Select label="Target" name="target" options={[{ value: 'all', label: 'All Users' }, { value: 'readers', label: 'Readers' }, { value: 'authors', label: 'Authors' }]} />
          </div>
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" icon={Send}>Send</Button></div>
        </form>
      </Modal>
    </div>
  );
};
