import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Download, Upload, RefreshCw, Trash2, Shield, Smartphone, HardDrive, Database, Check, Store, Sparkles } from 'lucide-react';
import { ShopSettings, UserRole } from '../types';
import { db } from '../db/database';
import { backupService } from '../services/backupService';
import { settingsService } from '../services/settingsService';

interface SettingsProps {
  settings: ShopSettings;
  onSettingsUpdated: (updated: ShopSettings) => void;
  refreshTrigger: number;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSettingsUpdated,
  refreshTrigger
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [storageStats, setStorageStats] = useState({
    customers: 0,
    sales: 0,
    payments: 0,
    products: 0
  });

  useEffect(() => {
    setFormData({ ...settings });
    loadStorageCounts();
  }, [settings, refreshTrigger]);

  const loadStorageCounts = async () => {
    try {
      const [cCount, sCount, pCount, prCount] = await Promise.all([
        db.customers.count(),
        db.sales.count(),
        db.payments.count(),
        db.products.count()
      ]);
      setStorageStats({
        customers: cCount,
        sales: sCount,
        payments: pCount,
        products: prCount
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field: keyof ShopSettings, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await settingsService.updateSettings(formData);
      onSettingsUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      await backupService.exportFullBackup();
    } catch (err: any) {
      alert('Failed to export backup: ' + err.message);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!confirm('Restoring will replace all current shop records with the backup file data. Continue?')) {
          return;
        }
        await backupService.restoreFromJSON(parsed);
        const newSettings = await settingsService.getSettings();
        onSettingsUpdated(newSettings);
        loadStorageCounts();
        alert('✅ Shop data restored successfully!');
      } catch (err: any) {
        alert('Failed to parse or restore backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadShowcaseData = async () => {
    if (!confirm('Populate the store with rich showcase sample data (products, sales, debtors & transactions)?')) return;
    setShowcaseLoading(true);
    try {
      await backupService.loadShowcaseData();
      const newSettings = await settingsService.getSettings();
      onSettingsUpdated(newSettings);
      await loadStorageCounts();
      alert('🎉 Showcase demo data loaded successfully! Check the Homepage & Reports.');
    } catch (err: any) {
      alert('Failed to load showcase data: ' + err.message);
    } finally {
      setShowcaseLoading(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('Reset current database to the default sample demo data?')) return;
    await backupService.resetToDemoData();
    const newSettings = await settingsService.getSettings();
    onSettingsUpdated(newSettings);
    await loadStorageCounts();
    alert('✅ Reset to demo store data completed.');
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL sales, customers, and payments from this device! Are you sure?')) {
      return;
    }
    await backupService.clearAllData();
    await loadStorageCounts();
    alert('Cleared all transaction data.');
  };

  return (
    <div className="space-y-5 max-w-4xl pb-10 animate-in fade-in duration-200">
      {/* Header Bento Tile */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#173B6C] flex items-center justify-center border border-sky-100">
            <SettingsIcon className="w-5 h-5" />
          </div>
          Shop Settings & Data Backup
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure business details, receipt footer, currency format, and local IndexedDB backups.
        </p>
      </div>

      {/* Shop Profile Form Bento Card */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#173B6C]" /> Business Identity & Receipts
          </h2>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl flex items-center gap-1 border border-emerald-100">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Shop / Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.shopName}
              onChange={e => handleChange('shopName', e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Shop Phone Number *
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Physical Address / Location
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Currency Code
            </label>
            <select
              value={formData.currency}
              onChange={e => handleChange('currency', e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden font-bold cursor-pointer"
            >
              <option value="UGX">UGX — Ugandan Shilling (Default)</option>
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="TZS">TZS — Tanzanian Shilling</option>
              <option value="RWF">RWF — Rwandan Franc</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="NGN">NGN — Nigerian Naira (₦)</option>
              <option value="GHS">GHS — Ghanaian Cedi (GH₵)</option>
              <option value="ZAR">ZAR — South African Rand (R)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Receipt Footer Message
          </label>
          <input
            type="text"
            value={formData.receiptFooter}
            onChange={e => handleChange('receiptFooter', e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden"
            placeholder="e.g. Thank you for shopping with us! No refund after 24 hrs."
          />
        </div>

        {/* User Role selection */}
        <div className="pt-3.5 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Active System Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              onClick={() => handleChange('activeRole', 'admin')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                formData.activeRole === 'admin' || formData.activeRole === 'owner'
                  ? 'bg-purple-50/80 border-purple-600 ring-1 ring-purple-600'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">👑 Admin (Emporia Ventures)</span>
                <span className="text-[10px] uppercase font-bold text-purple-700">Full Store Control</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Full access to financial reports, P&L summaries, stock management, inventory thresholds, and data backup.
              </p>
            </div>

            <div
              onClick={() => handleChange('activeRole', 'attendant')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                formData.activeRole === 'attendant'
                  ? 'bg-sky-50/80 border-[#173B6C] ring-1 ring-[#173B6C]'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">💼 Attendant Mode</span>
                <span className="text-[10px] uppercase font-bold text-[#173B6C]">Counter Safe</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Streamlined for rapid sales entry, customer debt collection, and receipt issuance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 rounded-xl shadow-sm shadow-[#173B6C]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4 stroke-[2.5]" /> Save Changes</>}
          </button>
        </div>
      </form>

      {/* Offline Storage Status Bento Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" /> Offline Storage & Diagnostics
          </h2>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            IndexedDB Active
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          ShopPay is engineered <strong>local-first</strong>. All transactions, customer debt records, and receipts are stored securely on this device. You can create sales and accept payments without an active internet connection.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sales</span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">{storageStats.sales}</span>
          </div>
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payments</span>
            <span className="text-lg font-black text-emerald-700 block mt-0.5">{storageStats.payments}</span>
          </div>
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customers</span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">{storageStats.customers}</span>
          </div>
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Products</span>
            <span className="text-lg font-black text-purple-700 block mt-0.5">{storageStats.products}</span>
          </div>
        </div>
      </div>

      {/* Showcase Data Quick Loader Bento Card */}
      <div className="bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/60 p-6 rounded-3xl border border-emerald-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Showcase Sample Data
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
            Ready to Demo
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Populate the store with realistic retail demo data (Groceries, Dairy, Beverages, Customer Accounts, Cash/Mobile Money Invoices, and Partial Debt Records) to showcase all ledger and profit calculation features.
        </p>
        <div className="pt-1">
          <button
            type="button"
            disabled={showcaseLoading}
            onClick={handleLoadShowcaseData}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            {showcaseLoading ? 'Loading Sample Records...' : 'Load Complete Showcase Data'}
          </button>
        </div>
      </div>

      {/* Backup & Restore Bento Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3.5 border-b border-slate-100">
          <HardDrive className="w-4 h-4 text-[#173B6C]" /> Backup & Data Migration
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON Backup */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
            <h3 className="font-black text-xs text-slate-900">Export Complete Shop Backup</h3>
            <p className="text-[11px] text-slate-500">
              Download a single <code className="bg-slate-200/70 px-1 py-0.5 rounded">.json</code> backup containing all sales, customer ledger, payments, and catalog.
            </p>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 bg-[#173B6C] hover:bg-[#2F6DB2] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" /> Download Backup File (.json)
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
            <h3 className="font-black text-xs text-slate-900">Restore from Backup</h3>
            <p className="text-[11px] text-slate-500">
              Restore your shop records from a previously exported ShopPay backup file.
            </p>
            <label className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
              <Upload className="w-4 h-4 text-[#173B6C]" /> Select Backup File
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger zone / resets */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleResetDemoData}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset to Demo Store
          </button>

          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};
