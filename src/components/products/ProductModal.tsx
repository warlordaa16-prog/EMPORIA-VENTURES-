import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setUnit(productToEdit.unit);
      setDefaultPrice(productToEdit.defaultPrice);
      setCategory(productToEdit.category || 'Groceries');
    } else {
      setName('');
      setUnit('packet');
      setDefaultPrice(0);
      setCategory('Groceries');
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
          category: category.trim()
        });
        onSaved(updated);
      } else {
        const created = await productService.create({
          name: name.trim(),
          unit: unit.trim(),
          defaultPrice,
          category: category.trim()
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Product Item' : 'Add Catalog Product'}
      subtitle="Speed up sales checkout with predefined items and prices"
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
            placeholder="e.g. Sugar 1kg, Cooking Oil 1L"
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

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Category
          </label>
          <input
            type="text"
            placeholder="e.g. Groceries, Bakery, Beverages, Household"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full text-xs rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-bold text-white bg-[#173B6C] hover:bg-[#2F6DB2] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            {isSubmitting ? 'Saving...' : <><Check className="w-4 h-4" /> Save Item</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
