import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, PackageCheck, Barcode, ShieldAlert } from 'lucide-react';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { Modal } from '../ui/Modal';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSaved: (product: Product) => void;
  currency: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSaved,
  currency
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('packet');
  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  const [category, setCategory] = useState('Groceries');
  const [stockQuantity, setStockQuantity] = useState<number>(20);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [trackStock, setTrackStock] = useState<boolean>(true);
  const [sku, setSku] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setUnit(productToEdit.unit);
      setDefaultPrice(productToEdit.defaultPrice);
      setCategory(productToEdit.category || 'Groceries');
      setStockQuantity(productToEdit.stockQuantity !== undefined ? productToEdit.stockQuantity : 20);
      setLowStockThreshold(productToEdit.lowStockThreshold !== undefined ? productToEdit.lowStockThreshold : 5);
      setTrackStock(productToEdit.trackStock !== undefined ? productToEdit.trackStock : true);
      setSku(productToEdit.sku || '');
    } else {
      setName('');
      setUnit('packet');
      setDefaultPrice(0);
      setCategory('Groceries');
      setStockQuantity(25);
      setLowStockThreshold(5);
      setTrackStock(true);
      setSku(`EV-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      alert('Please enter product name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (productToEdit && productToEdit.id) {
        const updated = await productService.update(productToEdit.id, {
          name: name.trim(),
          unit: unit.trim(),
          defaultPrice,
          category: category.trim(),
          stockQuantity: Number(stockQuantity) || 0,
          lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 0),
          trackStock,
          sku: sku.trim()
        });
        onSaved(updated);
      } else {
        const created = await productService.create({
          name: name.trim(),
          unit: unit.trim(),
          defaultPrice,
          category: category.trim(),
          stockQuantity: Number(stockQuantity) || 0,
          lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 0),
          trackStock,
          sku: sku.trim()
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      alert('Error saving product: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLowStockPreview = trackStock && stockQuantity <= lowStockThreshold;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Product & Stock Level' : 'Add Catalog Product & Inventory'}
      subtitle="Configure item details, pricing, and automated low-stock dashboard alert threshold"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Item / Product Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Sugar 1kg (Premium), Cooking Oil 1L"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Unit of Measure
            </label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
            >
              <option value="packet">packet</option>
              <option value="kg">kg</option>
              <option value="g">gram (g)</option>
              <option value="bottle">bottle</option>
              <option value="bar">bar</option>
              <option value="pouch">pouch</option>
              <option value="loaf">loaf</option>
              <option value="box">box</option>
              <option value="tin">tin</option>
              <option value="bag">bag</option>
              <option value="tray">tray</option>
              <option value="pack">pack</option>
              <option value="piece">piece</option>
              <option value="liter">liter</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Default Price ({currency}) *
            </label>
            <input
              type="number"
              min="0"
              step="100"
              required
              value={defaultPrice || ''}
              onChange={e => setDefaultPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0"
              className="w-full text-sm font-bold rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <input
              type="text"
              placeholder="e.g. Groceries, Bakery, Beverages"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full text-xs rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              SKU / Code
            </label>
            <input
              type="text"
              placeholder="e.g. EV-GR-001"
              value={sku}
              onChange={e => setSku(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
            />
          </div>
        </div>

        {/* Stock Management & User-Defined Alert Threshold Section */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#173B6C]" />
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                Inventory & Stock Alert Threshold
              </span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={trackStock}
                onChange={e => setTrackStock(e.target.checked)}
                className="rounded text-[#173B6C] focus:ring-sky-700 w-4 h-4"
              />
              <span>Enable Alerts</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Current Stock Quantity ({unit}s)
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={e => setStockQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full text-sm font-bold rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Auto-deducted on counter sales
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Low Stock Threshold *
              </label>
              <input
                type="number"
                min="0"
                required
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full text-sm font-bold rounded-lg border-slate-300 bg-white px-3 py-2 text-amber-900 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700 bg-amber-50/50"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Triggers visual alert when &le; {lowStockThreshold}
              </span>
            </div>
          </div>

          {/* Real-time status preview */}
          {trackStock && (
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              isLowStockPreview
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {isLowStockPreview ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Low Stock Alert Active:</strong> On-hand ({stockQuantity}) &le; threshold ({lowStockThreshold}). Will alert on Dashboard!
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Stock Healthy:</strong> {stockQuantity} {unit}s available (Safe above threshold of {lowStockThreshold}).
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-bold text-white bg-[#173B6C] hover:bg-[#2F6DB2] rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : <><Check className="w-4 h-4" /> Save Product & Stock</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
