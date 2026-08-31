import React, { useState, useEffect } from 'react';
import { admin as adminApi, categories as categoriesApi, products as productsApi } from '../../api/client';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiTag, FiCheck, FiAlertTriangle, FiPackage, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const CATEGORY_COLORS = [
  '#7B6FFF','#10B981','#FBBF24','#F87171','#A78BFA',
  '#22D3EE','#F472B6','#3B82F6','#84CC16','#F97316',
];

/*  Confirm Dialog  */
const ConfirmDialog = ({ isOpen, title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading, isKhmer }) => {
  if (!isOpen) return null;
  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="admin-modal" style={{ maxWidth: 420, padding: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: confirmColor === 'danger' ? 'rgba(248,113,113,0.15)' : 'rgba(123,111,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <FiAlertTriangle size={26} style={{ color: confirmColor === 'danger' ? '#F87171' : '#7B6FFF' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginBottom: 8 }}>{title}</div>
            <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{message}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
            <button
              onClick={onCancel}
              className="admin-btn admin-btn-outline"
              style={{ flex: 1 }}
            >
              <FiX size={14} /> {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="admin-btn"
              style={{
                flex: 1,
                background: confirmColor === 'danger' ? 'rgba(248,113,113,0.2)' : 'var(--admin-accent)',
                color: confirmColor === 'danger' ? '#F87171' : '#fff',
                border: confirmColor === 'danger' ? '1px solid rgba(248,113,113,0.4)' : 'none',
                boxShadow: confirmColor === 'danger' ? 'none' : '0 4px 14px var(--admin-accent-glow)',
              }}
            >
              {loading ? '...' : <><FiCheck size={14} /> {confirmLabel || (isKhmer ? 'យល់ព្រម' : 'Confirm')}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoriesManage = () => {
  const { isKhmer } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);

  /* Edit/Add modal */
  const [showModal, setShowModal]             = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData]               = useState({ name: '', description: '' });

  /* Confirm dialogs */
  const [confirmEdit,   setConfirmEdit]   = useState(null); // { category, formData }
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [confirming,    setConfirming]    = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.allSettled([
        categoriesApi.getAll(),
        productsApi.getAll()
      ]);
      const cats = catRes.status === 'fulfilled' && Array.isArray(catRes.value.data) ? catRes.value.data : [];
      const prods = prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.data) ? prodRes.value.data : [];
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load categories data: ' + (err.response?.data?.message || err.message));
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getProductCount = (catId) => {
    return products.filter(p => p.categoryId === catId || p.category?.id === catId).length;
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({ name: c.name, description: c.description || '' });
    setShowModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      setShowModal(false);
      setConfirmEdit({ category: editingCategory, data: formData });
    } else {
      doCreate(formData);
    }
  };

  const doCreate = async (data) => {
    try {
      await adminApi.createCategory(data);
      toast.success('Category created!');
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const doUpdate = async () => {
    if (!confirmEdit) return;
    setConfirming(true);
    try {
      await adminApi.updateCategory(confirmEdit.category.id, confirmEdit.data);
      toast.success('Category updated!');
      setConfirmEdit(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setConfirming(false); }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setConfirming(true);
    try {
      await adminApi.deleteCategory(confirmDelete.id);
      toast.success('Category deleted!');
      setConfirmDelete(null);
      fetchData();
    } catch { toast.error('Failed to delete category'); }
    finally { setConfirming(false); }
  };

  return (
    <div className="admin-animate-in">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title"><FiTag /> {isKhmer ? 'ប្រភេទផលិតផល' : 'Categories'}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', marginTop: 4 }}>
            {isKhmer ? `គ្រប់គ្រងប្រភេទផលិតផលក្នុងហាង (សរុប ${categories.length})` : `Manage store product categories (${categories.length} total)`}
          </div>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleOpenAdd}>
          <FiPlus size={15} /> {isKhmer ? 'បន្ថែមប្រភេទថ្មី' : 'Add Category'}
        </button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        /*  Full height 3-column responsive grid with wave animation  */
        <div className="admin-categories-3col" style={{ gap: 20 }}>
          {categories.map((c, i) => {
            const count = getProductCount(c.id);
            const themeColor = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

            return (
              <div
                key={c.id}
                className="admin-card admin-glass-card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'adminRowWave 0.45s cubic-bezier(0.34, 1.25, 0.64, 1) both',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                {/* Accent strip */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${themeColor}, rgba(255,255,255,0.2))` }} />

                <div style={{ padding: '22px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    {/* Avatar + Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: `${themeColor}20`,
                        border: `1px solid ${themeColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.25rem',
                        color: themeColor,
                        fontWeight: 800,
                        boxShadow: `0 6px 16px ${themeColor}25`,
                      }}>
                        {c.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem', wordBreak: 'break-word' }}>
                          {c.name}
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                          fontSize: '0.73rem', fontWeight: 600, color: themeColor,
                          background: `${themeColor}15`, padding: '2px 8px', borderRadius: 6,
                          border: `1px solid ${themeColor}30`
                        }}>
                          <FiPackage size={11} /> {count} {count === 1 ? (isKhmer ? 'ផលិតផល' : 'Product') : (isKhmer ? 'ផលិតផល' : 'Products')}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        className="admin-action-btn edit"
                        title={isKhmer ? 'កែប្រែ' : 'Edit'}
                        onClick={() => handleOpenEdit(c)}
                      >
                        <FiEdit2 size={14} />
                      </button>

                      <button
                        title={isKhmer ? 'លុប' : 'Delete'}
                        onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: '1px solid rgba(248,113,113,0.3)',
                          background: 'rgba(248,113,113,0.1)',
                          color: '#F87171',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.25s', fontWeight: 800,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.25)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Description - FULLY VISIBLE, no ellipsis or cut-off */}
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--admin-text-secondary)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background: 'rgba(0, 0, 0, 0.15)',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    marginTop: 'auto',
                  }}>
                    {c.description ? c.description : <span style={{ opacity: 0.5, fontStyle: 'italic' }}>{isKhmer ? 'មិនមានការពិពណ៌នាទេ។' : 'No description provided.'}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="admin-card admin-glass-card" style={{ gridColumn: '1 / -1', padding: 50, textAlign: 'center' }}>
              <FiTag size={36} style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }} />
              <h3 style={{ color: '#fff', marginBottom: 6 }}>{isKhmer ? 'រកមិនឃើញប្រភេទផលិតផលទេ' : 'No categories found'}</h3>
              <p style={{ color: 'var(--admin-text-muted)' }}>{isKhmer ? 'ចុច "បន្ថែមប្រភេទថ្មី" ខាងលើដើម្បីបង្កើតប្រភេទដំបូងរបស់អ្នក!' : 'Click "Add Category" above to create your first category!'}</p>
            </div>
          )}
        </div>
      )}

      {/*  Add / Edit Modal  */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 500 }}>
            <button className="admin-modal-close" onClick={() => setShowModal(false)}><FiX size={14} /></button>
            <h2>{editingCategory ? (isKhmer ? 'កែប្រែប្រភេទផលិតផល' : 'Edit Category') : (isKhmer ? 'បន្ថែមប្រភេទផលិតផលថ្មី' : 'Add Category')}</h2>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">{isKhmer ? 'ឈ្មោះប្រភេទ *' : 'Category Name *'}</label>
                <input className="admin-input" type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required placeholder={isKhmer ? 'ឧទាហរណ៍៖ គណនីហ្គេម' : 'e.g. Gaming Accounts'} />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">{isKhmer ? 'ការពិពណ៌នា' : 'Description'}</label>
                <textarea className="admin-textarea" style={{ minHeight: 95, resize: 'vertical' }}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isKhmer ? 'បញ្ចូលការពិពណ៌នាសម្រាប់ប្រភេទនេះ...' : 'Provide a description for this category...'} />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="admin-btn admin-btn-outline" style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}>
                  <FiX size={14} /> {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
                  <FiCheck size={14} /> {editingCategory ? (isKhmer ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Update') : (isKhmer ? 'បង្កើត' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  Confirm Edit dialog  */}
      <ConfirmDialog
        isOpen={!!confirmEdit}
        title={isKhmer ? 'បញ្ជាក់ការកែប្រែ' : 'Confirm Update'}
        message={isKhmer ? `តើអ្នកពិតជាចង់កែប្រែ "${confirmEdit?.category?.name}" ជាមួយព័ត៌មានថ្មីនេះមែនទេ?` : `Are you sure you want to update "${confirmEdit?.category?.name}" with the new details?`}
        confirmLabel={isKhmer ? 'បាទ/ចាស, កែប្រែ' : 'Yes, Update'}
        confirmColor="accent"
        loading={confirming}
        isKhmer={isKhmer}
        onConfirm={doUpdate}
        onCancel={() => {
          setConfirmEdit(null);
          setShowModal(true);
        }}
      />

      {/*  Confirm Delete dialog  */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={isKhmer ? 'លុបប្រភេទផលិតផល' : 'Delete Category'}
        message={isKhmer ? `តើអ្នកពិតជាចង់លុប "${confirmDelete?.name}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។` : `Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel={isKhmer ? 'បាទ/ចាស, លុប' : 'Yes, Delete'}
        confirmColor="danger"
        loading={confirming}
        isKhmer={isKhmer}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default CategoriesManage;
