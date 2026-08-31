import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders, FiGrid, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import YourRecentBuy from '../components/YourRecentBuy';
import { useLanguage } from '../context/LanguageContext';
import { products as productsApi, categories as categoriesApi } from '../api/client';
import { DIGITAL_PRODUCT_TYPES, PRODUCT_DURATIONS } from '../utils/productOptions';

const StorePage = () => {
  const { t, lang, isKhmer } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [selectedDuration, setSelectedDuration] = useState(searchParams.get('duration') || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Pagination state (16 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 16;

  const productSectionRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const categoryScrollRef = useRef(null);

  // Reset pagination to Page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedType, selectedDuration, sortBy]);

  // Sync state with URL search parameters
  useEffect(() => {
    const querySearch = searchParams.get('search') || '';
    const queryCategory = searchParams.get('category') || 'all';
    const queryType = searchParams.get('type') || 'all';
    const queryDuration = searchParams.get('duration') || 'all';

    if (querySearch !== searchTerm) setSearchTerm(querySearch);
    if (queryCategory !== selectedCategory) setSelectedCategory(queryCategory);
    if (queryType !== selectedType) setSelectedType(queryType);
    if (queryDuration !== selectedDuration) setSelectedDuration(queryDuration);
  }, [searchParams]);

  const updateUrlParams = (updates) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...updates };
    Object.keys(merged).forEach(key => {
      if (!merged[key] || merged[key] === 'all') {
        delete merged[key];
      }
    });
    setSearchParams(merged);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          categoriesApi.getAll({ signal: controller.signal }),
          productsApi.getAll(null, { signal: controller.signal })
        ]);
        const catData = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []);
        const prodData = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
        setCategories(catData);
        setProducts(prodData);
      } catch (error) {
        if (error.name !== 'CanceledError' && error.message !== 'canceled') {
          console.error('Fetch error', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      controller.abort();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    updateUrlParams({ search: val });

    if (val.trim() !== '') {
      setIsSearchLoading(true);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        setIsSearchLoading(false);
      }, 300);
    } else {
      setIsSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsSearchLoading(true);
    updateUrlParams({ search: searchTerm });
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearchLoading(false);
      if (productSectionRef.current) {
        productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 350);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearchLoading(false);
    updateUrlParams({ search: '' });
  };

  const isSearching = searchTerm.trim() !== '';

  const handleCategorySelect = (catId, e) => {
    setSelectedCategory(catId);
    updateUrlParams({ category: catId });
    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const pName = (p.name || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const catName = (p.category?.name || p.categoryName || '').toLowerCase();
      const sellerName = (p.sellerStoreName || p.seller?.sellerProfile?.storeName || '').toLowerCase();
      const pType = (p.productType || '').toLowerCase();
      const pDur = (p.duration || '').toLowerCase();

      const matchesSearch = q === '' ||
        pName.includes(q) ||
        pDesc.includes(q) ||
        catName.includes(q) ||
        sellerName.includes(q) ||
        pType.includes(q) ||
        pDur.includes(q);

      const prodCatId = String(p.category?.id ?? p.categoryId ?? '');
      const targetCatId = String(selectedCategory);
      const matchesCategory = selectedCategory === 'all' || prodCatId === targetCatId;

      const matchesType = selectedType === 'all' || pType === selectedType.toLowerCase();

      const matchesDuration = selectedDuration === 'all' || pDur === selectedDuration.toLowerCase();

      return matchesSearch && matchesCategory && matchesType && matchesDuration;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'best-rated') {
        const scoreA = ((a.averageRating || 0) * 100) + (a.reviewCount || 0);
        const scoreB = ((b.averageRating || 0) * 100) + (b.reviewCount || 0);
        return scoreB - scoreA;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [products, searchTerm, selectedCategory, selectedType, selectedDuration, sortBy]);

  const matchedCategoriesList = useMemo(() => {
    if (!isSearching || filteredProducts.length === 0) return [];
    const catMap = new Map();
    filteredProducts.forEach(p => {
      const cId = p.category?.id || p.categoryId || 'unknown';
      const cName = p.category?.name || p.categoryName || 'General';
      if (!catMap.has(cId)) {
        catMap.set(cId, { id: cId, name: cName, count: 1 });
      } else {
        catMap.get(cId).count += 1;
      }
    });
    return Array.from(catMap.values());
  }, [isSearching, filteredProducts]);

  const groupedProductClusters = useMemo(() => {
    const groups = [];
    const seenMap = new Map();

    filteredProducts.forEach(p => {
      const cleanName = (p.name || '')
        .replace(/\b(\d+)\s*(month|months|year|years|day|days|ខែ|ឆ្នាំ|ថ្ងៃ)\b/gi, '')
        .trim().toLowerCase();
      const key = `${p.sellerId || 'admin'}_${cleanName || p.name}`;

      if (!seenMap.has(key)) {
        const cluster = { primary: p, variants: [p] };
        seenMap.set(key, cluster);
        groups.push(cluster);
      } else {
        seenMap.get(key).variants.push(p);
      }
    });

    return groups;
  }, [filteredProducts]);

  // Derive total pages and paginated slice of 36 items per page
  const totalPages = useMemo(() => {
    return Math.ceil(groupedProductClusters.length / ITEMS_PER_PAGE) || 1;
  }, [groupedProductClusters.length]);

  const paginatedClusters = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return groupedProductClusters.slice(start, start + ITEMS_PER_PAGE);
  }, [groupedProductClusters, currentPage]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    if (productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = (current, total) => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total) {
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }

    return pages;
  };

  return (
    <div className="container" style={{ padding: '24px 16px 60px' }}>

      {/* 1. Search Bar at the Top */}
      <form onSubmit={handleSearchSubmit} action="#" className="search-bar-wrap" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <FiSearch style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '14px', color: 'var(--text-light)' }} size={18} />
          <input
            type="search"
            enterKeyHint="search"
            className="input"
            placeholder={t('store.searchPlaceholder')}
            style={{ paddingLeft: '42px', paddingRight: isSearching ? '40px' : '14px', height: '46px', borderRadius: 'var(--radius-sm)', width: '100%' }}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
          {isSearching && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
              title="Clear search"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{
            height: '46px',
            padding: '0 20px',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.92rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <FiSearch size={16} />
          <span>{t('store.search')}</span>
        </button>
      </form>

      {/* 2. Category Pill Bar with Scroll Controls */}
      {!isSearching && (
        <div className="category-section-wrap" style={{ marginBottom: '24px' }}>
          {/* Header */}
          <div className="category-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FiSliders size={18} color="#FF2B6D" />
            <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {t('store.categories')}
            </span>
          </div>

          {/* Horizontal Pills Scroll Container */}
          <div style={{ position: 'relative' }}>
            <div
              ref={categoryScrollRef}
              className="category-pills-row"
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '10px',
                scrollBehavior: 'smooth',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
              <button
                type="button"
                className={`category-pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={(e) => handleCategorySelect('all', e)}
              >
                {t('store.allProducts')}
              </button>
              {categories.map(cat => (
                <button
                  key={`cat-${cat.id}`}
                  type="button"
                  className={`category-pill-btn ${String(selectedCategory) === String(cat.id) ? 'active' : ''}`}
                  onClick={(e) => handleCategorySelect(cat.id, e)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Products Header & Grid */}
      <div style={{ flex: 1, minWidth: 0 }} ref={productSectionRef}>

        {/* Result Count & Sort Dropdown */}
        {/* Result Count & Reset Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>
            {t('store.showing')} {filteredProducts.length} {t('store.products')}
            {isSearching && (
              <span style={{ marginLeft: '8px', color: 'var(--primary)', fontWeight: 700 }}>
                ("{searchTerm}")
              </span>
            )}
          </span>

          {(selectedCategory !== 'all' || selectedType !== 'all' || selectedDuration !== 'all' || isSearching) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedType('all');
                setSelectedDuration('all');
                setSearchTerm('');
                setIsSearchLoading(false);
                setSearchParams({});
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
            >
              {t('store.resetFilter')}
            </button>
          )}
        </div>

        {/* Category Result Pill Banner when Searching */}
        {isSearching && matchedCategoriesList.length > 0 && (
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            fontSize: '0.84rem'
          }}>
            <span style={{ fontWeight: 800, color: 'var(--text)' }}>
              Category location for "{searchTerm}":
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {matchedCategoriesList.map(cat => (
                <span
                  key={cat.id}
                  onClick={(e) => cat.id !== 'unknown' && handleCategorySelect(cat.id, e)}
                  style={{
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    border: '1px solid #C7D2FE',
                    borderRadius: '8px',
                    padding: '3px 10px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: cat.id !== 'unknown' ? 'pointer' : 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={`Click to filter by category: ${cat.name}`}
                >
                  {cat.name} ({cat.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3 Filter Dropdowns Responsive Container for Phone and Computer */}
        <div className="store-filter-selects-row">
          {/* Type Filter */}
          <select
            className="select store-filter-select"
            value={selectedType}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedType(val);
              updateUrlParams({ type: val });
            }}
          >
            <option value="all">All Types (គ្រប់ប្រភេទ)</option>
            {DIGITAL_PRODUCT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Duration Filter */}
          <select
            className="select store-filter-select"
            value={selectedDuration}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedDuration(val);
              updateUrlParams({ duration: val });
            }}
          >
            <option value="all">All Durations (គ្រប់រយៈពេល)</option>
            {PRODUCT_DURATIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            className="select store-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="best-rated">Best Rated Sellers (ផ្កាយខ្ពស់គេ)</option>
            <option value="newest">{t('store.sortNewest')}</option>
            <option value="price-low">{t('store.sortPriceLow')}</option>
            <option value="price-high">{t('store.sortPriceHigh')}</option>
          </select>
        </div>

        <style>{`
          .store-filter-selects-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 20px;
            width: 100%;
          }
          .store-filter-select {
            width: 100%;
            height: 38px;
            cursor: pointer;
            border-radius: 10px;
            font-size: 0.82rem;
            padding: 4px 10px;
            border: 1px solid #CBD5E1;
            background: #FFFFFF;
            color: #0F172A;
            font-weight: 600;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          @media (max-width: 640px) {
            .store-filter-selects-row {
              display: flex;
              gap: 6px;
              overflow-x: auto;
              padding-bottom: 4px;
              margin-bottom: 16px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .store-filter-selects-row::-webkit-scrollbar {
              display: none;
            }
            .store-filter-select {
              flex: 1 1 0px;
              min-width: 130px;
              height: 34px;
              font-size: 0.73rem;
              padding: 2px 6px;
              border-radius: 8px;
            }
          }
        `}</style>

        {/* Products Grid */}
        {loading || isSearchLoading ? (
          <LoadingSpinner />
        ) : groupedProductClusters.length > 0 ? (
          <>
            <div className="grid grid-3">
              {paginatedClusters.map(cluster => (
                <ProductCard key={cluster.primary.id} product={cluster.primary} variants={cluster.variants} />
              ))}
            </div>

            {/* 36-Item Pagination Controls Bar (< 1 2 3 ... >) */}
            {totalPages > 1 && (
              <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Previous Button (<) */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-outline"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--card-bg)',
                      color: currentPage === 1 ? 'var(--text-lighter)' : 'var(--text)',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      transition: 'var(--transition)'
                    }}
                  >
                    <FiChevronLeft size={16} />
                    <span>{lang === 'km' ? 'ថយក្រោយ' : 'Prev'}</span>
                  </button>

                  {/* Number Buttons (1, 2, 3...) */}
                  {getPageNumbers(currentPage, totalPages).map((p, idx) => (
                    p === '...' ? (
                      <span key={`dots-${idx}`} style={{ padding: '0 6px', color: 'var(--text-lighter)', fontWeight: 700 }}>...</span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => handlePageChange(p)}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          border: currentPage === p ? '1.5px solid #FF2B6D' : '1px solid var(--border)',
                          background: currentPage === p ? 'linear-gradient(135deg, #FF4B8B 0%, #FF2B6D 100%)' : 'var(--card-bg)',
                          color: currentPage === p ? '#ffffff' : 'var(--text)',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          boxShadow: currentPage === p ? '0 4px 12px rgba(255, 43, 109, 0.35)' : 'none',
                          transition: 'var(--transition)'
                        }}
                      >
                        {p}
                      </button>
                    )
                  ))}

                  {/* Next Button (>) */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--card-bg)',
                      color: currentPage === totalPages ? 'var(--text-lighter)' : 'var(--text)',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      transition: 'var(--transition)'
                    }}
                  >
                    <span>{lang === 'km' ? 'បន្ទាប់' : 'Next'}</span>
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title={t('store.noProductsTitle')}
            description={t('store.noProductsDesc')}
            actionText={isSearching || selectedCategory !== 'ALL' ? t('store.clearSearch') : (lang === 'km' ? 'មើលទំនិញទាំងអស់' : 'View All Products')}
            onAction={() => {
              handleClearSearch();
              setSelectedCategory('ALL');
            }}
          />
        )}

        {/* User Completed Purchases & License Keys History */}
        <div style={{ marginTop: '40px' }}>
          <YourRecentBuy limit={4} />
        </div>
      </div>

      <style>{`
        .category-pills-row::-webkit-scrollbar {
          display: none;
        }

        .category-pill-btn {
          padding: 8px 24px;
          border-radius: 9999px;
          border: 1.5px solid var(--border-light, #E2E8F0);
          background: var(--card-bg, #FFFFFF);
          color: var(--text, #0F172A);
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
          font-family: inherit;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }

        .category-pill-btn:hover {
          border-color: #FF2B6D;
          color: #FF2B6D;
        }

        .category-pill-btn.active {
          background: linear-gradient(135deg, #FF4B8B 0%, #FF2B6D 100%);
          color: #FFFFFF !important;
          border-color: #FF2B6D;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(255, 43, 109, 0.35);
        }

        @media (max-width: 639px) {
          .search-bar-wrap {
            gap: 8px !important;
          }
          .search-bar-wrap input {
            height: 44px !important;
            font-size: 0.9rem !important;
          }
          .search-bar-wrap button[type="submit"] {
            height: 44px !important;
            padding: 0 14px !important;
            font-size: 0.85rem !important;
          }
          .category-pill-btn {
            padding: 7px 18px !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StorePage;
