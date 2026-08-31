import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEdit2, FiTrash2, FiPlus, FiDatabase,
  FiX, FiUpload, FiImage, FiPackage, FiSearch
} from 'react-icons/fi';
import { admin as adminApi, products as productsApi, categories as categoriesApi } from '../../api/client';
import { DIGITAL_PRODUCT_TYPES, PRODUCT_DURATIONS, PRODUCT_LABELS, getCategoryTypes, getDefaultTypeForCategory, getProductTypeInfo } from '../../utils/productOptions';
import ConfirmDeleteProductModal from '../../components/ConfirmDeleteProductModal';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const ProductsManage = () => {
  const { isKhmer } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef();

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', imageUrl: '', categoryId: '', productType: 'ACCOUNT', duration: '1 Month', productLabel: '', active: true,
  });

  const durationOptions = ['1 Month', '3 Months', '6 Months', '1 Year'];

  const stockImages = [
    { name: 'Netflix',  url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=400&q=80' },
    { name: 'Spotify',  url: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?auto=format&fit=crop&w=400&q=80' },
    { name: 'Gaming',   url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80' },
    { name: 'Discord',  url: 'https://images.unsplash.com/photo-1614680376739-414d95ff43df?auto=format&fit=crop&w=400&q=80' },
    { name: 'VPN',      url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80' },
    { name: 'Adobe',    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data ? [prodRes.data] : []));
      setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data ? [catRes.data] : []));
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load products/categories: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', imageUrl: '', categoryId: categories[0]?.id || '', productType: 'ACCOUNT', duration: '1 Month', productLabel: '', active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({ name: p.name, description: p.description || '', price: p.price, imageUrl: p.imageUrl || '', categoryId: p.categoryId || '', productType: p.productType || 'ACCOUNT', duration: p.duration || '1 Month', productLabel: p.productLabel || '', active: p.active });
    setShowModal(true);
  };

  const handleDelete = (product) => {
    setDeleteConfirmProduct(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    setDeletingProduct(true);
    try {
      await adminApi.deleteProduct(deleteConfirmProduct.id);
      toast.success(`Product "${deleteConfirmProduct.name}" deleted successfully!`);
      setDeleteConfirmProduct(null);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingProduct(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminApi.uploadImage(fd);
      const url = res.data?.data || res.data;
      setFormData(prev => ({ ...prev, imageUrl: 'http://localhost:8080' + url }));
      toast.success('Image uploaded!');
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, price: parseFloat(formData.price), categoryId: formData.categoryId ? parseInt(formData.categoryId) : null };
    if (isNaN(payload.price) || payload.price < 0) { toast.error('Invalid price'); return; }
    try {
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, payload);
        toast.success('Product updated!');
      } else {
        await adminApi.createProduct(payload);
        toast.success('Product created!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const nameStr = (p.name || '').toLowerCase();
    const descStr = (p.description || '').toLowerCase();
    const catStr = (p.category?.name || p.categoryName || '').toLowerCase();
    const durStr = (p.duration || '').toLowerCase();
    const typeStr = (p.productType || '').toLowerCase();
    const priceStr = String(p.price || '');

    return nameStr.includes(q) ||
           descStr.includes(q) ||
           catStr.includes(q) ||
           durStr.includes(q) ||
           typeStr.includes(q) ||
           priceStr.includes(q);
  });

  return (
    <div className="admin-animate-in">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <FiPackage /> {isKhmer ? 'ការគ្រប់គ្រងផលិតផល & ស្តុក' : 'Inventory Management'}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }} />
            <input
              className="admin-input"
              placeholder={isKhmer ? 'ស្វែងរកផលិតផល...' : 'Search products...'}
              style={{ paddingLeft: 36, width: 220 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-btn admin-btn-primary" onClick={handleOpenAdd}>
            <FiPlus size={15} /> {isKhmer ? 'បន្ថែមផលិតផល' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading && products.length === 0 ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        <div className="admin-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isKhmer ? 'ផលិតផល' : 'Product'}</th>
                <th>{isKhmer ? 'ប្រភេទ' : 'Category'}</th>
                <th>{isKhmer ? 'រយៈពេល' : 'Duration'}</th>
                <th>{isKhmer ? 'តម្លៃ' : 'Price'}</th>
                <th>{isKhmer ? 'កម្រិតស្តុក' : 'Stock'}</th>
                <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  style={{
                    animation: 'adminRowWave 0.75s cubic-bezier(0.34, 1.25, 0.64, 1) both',
                    animationDelay: `${idx * 90}ms`,
                  }}
                >
                  <td>
                    <div className="admin-product-cell">
                      <div className="admin-product-avatar">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} />
                          : <span>{(p.name || '?')[0]}</span>
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.description || (isKhmer ? 'មិនមានការពិពណ៌នា' : 'No description')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)' }}>
                    {p.category?.name || p.categoryName || (isKhmer ? 'មិនមានប្រភេទ' : 'Uncategorized')}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}>
                      {p.duration || '1 Month'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>${Number(p.price).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className="admin-stock-bar">
                        <div
                          className={`admin-stock-bar-fill ${p.stockCount > 10 ? 'high' : p.stockCount > 3 ? 'medium' : 'low'}`}
                          style={{ width: `${Math.min(100, (p.stockCount / 20) * 100)}%` }}
                        />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{p.stockCount} {isKhmer ? 'មុខ' : 'items'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${p.active ? 'active' : 'inactive'}`}>
                      {p.active ? (isKhmer ? 'សកម្ម' : 'Active') : (isKhmer ? 'អសកម្ម' : 'Inactive')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <Link to={`/admin/products/${p.id}/stock`} className="admin-action-btn" title={isKhmer ? 'គ្រប់គ្រងស្តុក' : 'Manage Stock'}>
                        <FiDatabase size={14} />
                      </Link>
                      <button className="admin-action-btn edit" title={isKhmer ? 'កែប្រែ' : 'Edit'} onClick={() => handleOpenEdit(p)}>
                        <FiEdit2 size={14} />
                      </button>
                      <button className="admin-action-btn danger" title={isKhmer ? 'លុប' : 'Delete'} onClick={() => handleDelete(p)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    {search ? (isKhmer ? 'រកមិនឃើញផលិតផលដែលត្រូវនឹងការស្វែងរកទេ។' : 'No products match your search.') : (isKhmer ? 'មិនទាន់មានផលិតផលទេ។ ចុច "បន្ថែមផលិតផល" ដើម្បីចាប់ផ្តើម!' : "No products yet. Click 'Add Product' to get started!")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="admin-modal">
            <button className="admin-modal-close" onClick={() => setShowModal(false)}>
              <FiX size={14} />
            </button>
            <h2>{editingProduct ? (isKhmer ? 'កែប្រែផលិតផល' : 'Edit Product') : (isKhmer ? 'បន្ថែមផលិតផលថ្មី' : 'Add Product')}</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">{isKhmer ? 'ឈ្មោះផលិតផល *' : 'Product Name *'}</label>
                <input className="admin-input" type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              {(() => {
                const selectedCatObj = categories.find(c => String(c.id) === String(formData.categoryId));
                const catName = selectedCatObj?.name || '';
                const availableTypes = getCategoryTypes(catName);

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label">Category (ប្រភេទទំនិញ) *</label>
                      <select className="admin-select" value={formData.categoryId}
                        onChange={e => {
                          const catId = e.target.value;
                          const selCat = categories.find(c => String(c.id) === String(catId));
                          const newCatName = selCat?.name || '';
                          const autoType = getDefaultTypeForCategory(newCatName);
                          setFormData(f => ({ ...f, categoryId: catId, productType: autoType }));
                        }} required style={{ width: '100%', fontSize: '0.85rem' }}>
                        <option value="">Select Category First</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label">Digital Product Type (ប្រភេទឌីជីថល) *</label>
                      <select className="admin-select" value={formData.productType}
                        onChange={e => setFormData({ ...formData, productType: e.target.value })} required style={{ width: '100%', fontSize: '0.85rem' }}>
                        {availableTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const selectedCatObj = categories.find(c => String(c.id) === String(formData.categoryId));
                const isGameCategory = (selectedCatObj?.name && (
                  selectedCatObj.name.toLowerCase().includes('game') ||
                  selectedCatObj.name.toLowerCase().includes('gaming') ||
                  selectedCatObj.name.includes('ហ្គេម')
                )) || formData.productType === 'ACCOUNT_GAME';

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label">Price / តម្លៃ ($) *</label>
                      <input className="admin-input" type="number" step="0.01" min="0" placeholder="e.g. 3.99"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    {!isGameCategory && (
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-form-label">Product Duration (រយះពេល) *</label>
                        <select className="admin-select" value={formData.duration}
                          onChange={e => setFormData({ ...formData, duration: e.target.value })} required style={{ width: '100%', fontSize: '0.85rem' }}>
                          <option value="">Select Duration</option>
                          {PRODUCT_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label" style={{ color: '#10B981', fontWeight: 800 }}>Product Badge / Label *</label>
                      <select className="admin-select" value={formData.productLabel}
                        onChange={e => setFormData({ ...formData, productLabel: e.target.value })} required style={{ width: '100%', fontSize: '0.85rem', borderColor: '#10B981', fontWeight: 700 }}>
                        <option value="">-- Select Product Badge / Label * --</option>
                        {PRODUCT_LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })()}

              {/* Image */}
              <div className="admin-form-group">
                <label className="admin-form-label"><FiImage style={{ marginRight: 6 }} />Product Image</label>
                <div className="admin-image-upload">
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleImageUpload(e.target.files[0])} />
                  <button type="button" className="admin-btn admin-btn-outline admin-btn-sm"
                    onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <FiUpload size={13} /> {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <input className="admin-input" type="text" placeholder="or paste image URL"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ flex: 1 }} />
                </div>

                {/* Stock image picker */}
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6 }}>Quick-pick:</label>
                  <div className="admin-stock-images">
                    {stockImages.map(img => (
                      <button key={img.name} type="button"
                        className={`admin-stock-img-btn ${formData.imageUrl === img.url ? 'selected' : ''}`}
                        style={{ border: `1px solid ${formData.imageUrl === img.url ? 'var(--admin-accent)' : 'var(--admin-card-border)'}` }}
                        onClick={() => setFormData({ ...formData, imageUrl: img.url })}>
                        <img src={img.url} alt={img.name} onError={e => { e.target.style.display = 'none'; }} />
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.imageUrl && (
                  <div className="admin-image-preview">
                    <img src={formData.imageUrl} alt="Preview"
                      onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <textarea className="admin-textarea" style={{ minHeight: 80, resize: 'vertical' }}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="active-check" className="admin-checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                <label htmlFor="active-check" className="admin-form-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
                  Active (Visible in Store)
                </label>
              </div>

              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '12px' }}>
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <ConfirmDeleteProductModal
        isOpen={Boolean(deleteConfirmProduct)}
        product={deleteConfirmProduct}
        onClose={() => setDeleteConfirmProduct(null)}
        onConfirm={confirmDeleteProduct}
        loading={deletingProduct}
      />
    </div>
  );
};

export default ProductsManage;
