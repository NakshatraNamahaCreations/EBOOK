import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Cards';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Forms';
import { Tags, Plus, Edit, Trash2, FolderTree, Hash } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, tagRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/tags')
      ]);
      setCategories(catRes.data || []);
      setTags(tagRes.data || []);
    } catch {
      setCategories([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5"><Tags className="w-5 h-5" style={{ color: 'var(--accent-400)' }} /> Categories & Tags</h1>
          <p>Organize your content library</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Categories */}
        <Card noPadding>
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4" style={{ color: 'var(--accent-400)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Categories</h3>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent-glow)', color: 'var(--accent-400)' }}>{categories.length}</span>
            </div>
            <Button size="sm" icon={Plus} onClick={() => setShowCatModal(true)}>Add</Button>
          </div>
          {loading ? <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div> : (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {categories.map(cat => (
              <div key={cat._id} className="flex items-center justify-between px-4 py-3 transition-colors"
                   onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cat.bookCount || 0} books</p>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" icon={Edit} />
                  <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-400" />
                </div>
              </div>
            ))}
            {categories.length === 0 && <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No categories found</div>}
          </div>
          )}
        </Card>

        {/* Tags */}
        <Card noPadding>
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tags</h3>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>{tags.length}</span>
            </div>
            <Button size="sm" icon={Plus} onClick={() => setShowTagModal(true)}>Add</Button>
          </div>
          {loading ? <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div> : (
          <div className="p-4 flex flex-wrap gap-2">
            {tags.map(tag => (
              <div key={tag._id} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-default"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                <Hash className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                {tag.name}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({tag.usageCount || 0})</span>
                <button className="hidden group-hover:block ml-1" style={{ color: 'var(--danger)' }}><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            {tags.length === 0 && <div className="text-sm w-full text-center" style={{ color: 'var(--text-muted)' }}>No tags found</div>}
          </div>
          )}
        </Card>
      </div>

      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Add Category">
        <form className="space-y-4" onSubmit={async (e) => { 
          e.preventDefault(); 
          const formData = new FormData(e.target);
          try {
            await api.post('/admin/categories', { name: formData.get('name'), slug: formData.get('slug') });
            toast.success('Category added successfully');
            setShowCatModal(false);
            fetchData();
          } catch (error) { toast.error(error.message || 'Failed to add category'); }
        }}>
          <Input label="Name" name="name" placeholder="e.g. Science Fiction" required />
          <Input label="Slug" name="slug" placeholder="Auto-generated" />
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" onClick={() => setShowCatModal(false)}>Cancel</Button><Button type="submit">Create</Button></div>
        </form>
      </Modal>
      <Modal isOpen={showTagModal} onClose={() => setShowTagModal(false)} title="Add Tag">
        <form className="space-y-4" onSubmit={async (e) => { 
          e.preventDefault(); 
          const formData = new FormData(e.target);
          try {
            await api.post('/admin/tags', { name: formData.get('name') });
            toast.success('Tag added successfully');
            setShowTagModal(false);
            fetchData();
          } catch (error) { toast.error(error.message || 'Failed to add tag'); }
        }}>
          <Input label="Name" name="name" placeholder="e.g. Featured" required />
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" onClick={() => setShowTagModal(false)}>Cancel</Button><Button type="submit">Create</Button></div>
        </form>
      </Modal>
    </div>
  );
};
