import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Plus, Search, Edit3, Trash2, Tag, AlertTriangle, CheckCircle2, Package, RefreshCw, Layers, Lock } from 'lucide-react';
import { Product, ShopSettings, User } from '../types';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/currency';

interface ProductsProps {
  settings: ShopSettings;
  currentUser?: User | null;
  onOpenProductModal: (product?: Product) => void;
  refreshTrigger: number;
}

export const Products: React.FC<ProductsProps> = ({
  settings,
  currentUser,
  onOpenProductModal,
  refreshTrigger
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [restockingId, setRestockingId] = useState<number | null>(null);

  const isManager = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  useEffect(() => {
    loadProducts();
  }, [refreshTrigger]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const list = await productService.getAll();
      setProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      if (p.trackStock === false) return false;
      const stock = p.stockQuantity ?? 0;
      const threshold = p.lowStockThreshold ?? 5;
      return stock <= threshold;
    }).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => (p.stockQuantity ?? 0) <= 0 && p.trackStock !== false).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      
      const stock = p.stockQuantity ?? 0;
      const threshold = p.lowStockThreshold ?? 5;
      if (stockFilter === 'LOW' && (stock > threshold || p.trackStock === false)) return false;
      if (stockFilter === 'OUT' && (stock > 0 || p.trackStock === false)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCategory = (p.category || '').toLowerCase().includes(q);
        const matchesSku = (p.sku || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesSku) return false;
      }
      return true;
    });
  }, [products, selectedCategory, stockFilter, searchQuery]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove product "${name}"?`)) return;
    try {
      await productService.delete(id);
      loadProducts();
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  const handleQuickRestock = async (id: number, amount: number) => {
    setRestockingId(id);
    try {
      await productService.restockProduct(id, amount);
      await loadProducts();
    } catch (err: any) {
      alert('Failed to restock: ' + err.message);
    } finally {
      setRestockingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bento Tile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {isManager ? 'Emporia Item Catalog & Stock Control' : 'Emporia Item Catalog & Price Lookup'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isManager
              ? 'Preconfigure shop merchandise, set custom low-stock thresholds, and manage inventory restocking.'
              : 'Browse item catalog, look up official selling prices, and check product descriptions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="add-product-btn"
            onClick={() => onOpenProductModal()}
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 rounded-xl shadow-sm shadow-[#173B6C]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> + Add Product
          </button>
        </div>
      </div>

      {/* Stock Health Quick Overview Tabs (Shown to Manager/Admin/Owner) */}
      {isManager && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStockFilter('ALL')}
            className={`px-3.5 py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
              stockFilter === 'ALL'
                ? 'bg-[#173B6C] text-white border-[#173B6C] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>All Catalog Items</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${stockFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter('LOW')}
            className={`px-3.5 py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
              stockFilter === 'LOW'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Low Stock Alerts</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stockFilter === 'LOW' ? 'bg-white/20 text-white' : 'bg-amber-200/70 text-amber-900'}`}>
              {lowStockCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter('OUT')}
            className={`px-3.5 py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
              stockFilter === 'OUT'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/80 text-rose-900 border-rose-200 hover:bg-rose-100/70'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Out of Stock</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stockFilter === 'OUT' ? 'bg-white/20 text-white' : 'bg-rose-200/70 text-rose-900'}`}>
              {outOfStockCount}
            </span>
          </button>
        </div>
      )}

      {/* Filter & Search Bento Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by name, SKU or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-purple-900 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Items Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">No Products in Catalog</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL'
                  ? 'No products match your current search or filter criteria.'
                  : 'Start adding merchandise and products with custom prices and stock tracking.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenProductModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#173B6C] hover:bg-[#1E4D8C] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Product Item</span>
            </button>
          </div>
        ) : (
          filteredProducts.map(prod => {
            const stock = prod.stockQuantity ?? 0;
            const threshold = prod.lowStockThreshold ?? 5;
            const isOutOfStock = stock <= 0 && prod.trackStock !== false;
            const isLowStock = stock <= threshold && prod.trackStock !== false;

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-3xl border p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all space-y-3 relative group flex flex-col justify-between ${
                  isOutOfStock
                    ? 'border-rose-300 bg-gradient-to-b from-rose-50/20 to-white'
                    : isLowStock
                    ? 'border-amber-300 bg-gradient-to-b from-amber-50/20 to-white'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200/60">
                        {prod.category || 'General'}
                      </span>
                      {prod.sku && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 text-[#173B6C] text-[10px] font-mono font-semibold border border-sky-100">
                          {prod.sku}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenProductModal(prod)}
                        className="p-1.5 text-slate-400 hover:text-[#173B6C] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Item & Pricing"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {prod.id && (
                        <button
                          onClick={() => handleDelete(prod.id!, prod.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove / Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-slate-900 line-clamp-1">{prod.name}</h3>
                    <span className="text-xs text-slate-400 font-medium">Unit: per {prod.unit}</span>
                  </div>

                  {/* Stock Quantity Indicator */}
                  {isManager ? (
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 text-[11px]">On-Hand Stock:</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {stock} {prod.unit}s
                        </span>
                      </div>

                      {prod.trackStock !== false && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Alert Threshold:</span>
                          <span className="font-bold text-slate-600">&le; {threshold} {prod.unit}s</span>
                        </div>
                      )}

                      {/* Low Stock Warning Pill */}
                      {isOutOfStock ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>OUT OF STOCK — Restock Needed!</span>
                        </div>
                      ) : isLowStock ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Low Stock Alert (&le; {threshold} limit)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Stock Level Healthy</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs flex items-center justify-between">
                      <span className="text-[11px] font-medium">Availability:</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Selling Price</span>
                    <span className="text-base font-black text-slate-900">
                      {formatCurrency(prod.defaultPrice, settings.currency)}
                    </span>
                  </div>

                  {/* Quick 1-click restock buttons (Only for Admin/Manager/Owner) */}
                  {isManager && prod.id && (
                    <div className="flex items-center gap-1 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Restock:</span>
                      <button
                        type="button"
                        disabled={restockingId === prod.id}
                        onClick={() => handleQuickRestock(prod.id!, 10)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-[#173B6C] rounded-md border border-sky-200 transition-colors cursor-pointer"
                        title="Add +10 units"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        disabled={restockingId === prod.id}
                        onClick={() => handleQuickRestock(prod.id!, 25)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-[#173B6C] rounded-md border border-sky-200 transition-colors cursor-pointer"
                        title="Add +25 units"
                      >
                        +25
                      </button>
                      <button
                        type="button"
                        disabled={restockingId === prod.id}
                        onClick={() => {
                          const input = prompt(`Enter quantity to add for "${prod.name}":`, '50');
                          if (input) {
                            const val = parseInt(input, 10);
                            if (!isNaN(val) && val > 0) {
                              handleQuickRestock(prod.id!, val);
                            }
                          }
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                        title="Add Custom units"
                      >
                        +Custom
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
