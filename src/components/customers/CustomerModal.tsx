import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Customer } from '../../types';
import { customerService } from '../../services/customerService';
import { Modal } from '../ui/Modal';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSaved: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone || '');
      setAddress(customerToEdit.address || '');
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      alert('Please provide customer name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (customerToEdit && customerToEdit.id) {
        const updated = await customerService.update(customerToEdit.id, {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim()
        });
        onSaved(updated);
      } else {
        const created = await customerService.create({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim()
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      alert('Error saving customer: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Edit Customer Profile' : 'Add New Customer'}
      subtitle="Track purchase habits and credit ledger"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Customer Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. John Mukasa"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. +256 772 123 456"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Address / Shop Location (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Plot 12, Market Stall 5"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Credit Terms (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Pays at month end, trusted customer"
            value={notes}
            onChange={e => setNotes(e.target.value)}
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
            {isSubmitting ? 'Saving...' : <><Check className="w-4 h-4" /> Save Customer</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
