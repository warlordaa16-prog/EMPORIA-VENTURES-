import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import {
  ShieldCheck,
  Database,
  HardDrive,
  Cpu,
  Layers,
  Users,
  ShoppingBag,
  CreditCard,
  FileText,
  Smartphone,
  Lock,
  CheckCircle2,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { User, ShopSettings } from '../../types';
import { salesRepository } from '../../repositories/salesRepository';
import { paymentRepository } from '../../repositories/paymentRepository';
import { customerRepository } from '../../repositories/customerRepository';
import { productRepository } from '../../repositories/productRepository';
import { userRepository } from '../../repositories/userRepository';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  settings: ShopSettings;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings
}) => {
  const [counts, setCounts] = useState({
    users: 0,
    sales: 0,
    payments: 0,
    customers: 0,
    products: 0
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        userRepository.count(),
        salesRepository.count(),
        paymentRepository.count(),
        customerRepository.count(),
        productRepository.count()
      ]).then(([u, s, p, c, prod]) => {
        setCounts({
          users: u,
          sales: s,
          payments: p,
          customers: c,
          products: prod
        });
      });
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ShopPay System Architecture"
      subtitle="Live execution topology from Login Portal to Device IndexedDB"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs text-slate-700">
        {/* Active Session Status Bar */}
        <div className="bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-base border border-white/20">
              SP
            </div>
            <div>
              <div className="font-black text-sm text-white flex items-center gap-2">
                Active Node: {currentUser?.fullName || 'Guest'}
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  currentUser?.role === 'owner' ? 'bg-amber-400 text-slate-950' : 'bg-sky-200 text-[#173B6C]'
                }`}>
                  {currentUser?.role || 'Guest'}
                </span>
              </div>
              <p className="text-[11px] text-sky-100/90 mt-0.5">
                Storage: 100% Offline IndexedDB • Device Execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              Live Topology Active
            </span>
          </div>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 space-y-4">
          {/* Level 1: SHOPPAY Root */}
          <div className="flex flex-col items-center">
            <div className="px-5 py-2 rounded-2xl bg-[#173B6C] text-white font-black text-sm tracking-wider shadow-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-300" /> SHOPPAY PLATFORM
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 my-1" />
          </div>

          {/* Level 2: Login Portal (Register / Login) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-center font-black text-slate-900 text-xs flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#173B6C]" /> LOGIN PORTAL
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-sky-50 border border-sky-100 font-bold text-sky-900 text-[11px]">
                  REGISTER (Owner / Attendant)
                </div>
                <div className="p-2 rounded-xl bg-sky-50 border border-sky-100 font-bold text-sky-900 text-[11px]">
                  LOGIN (PIN Authentication)
                </div>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 my-1" />
          </div>

          {/* Level 3: Authentication & Role Validation */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-center font-black text-slate-900 text-xs flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> AUTHENTICATION & ROLE VALIDATION
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`p-2 rounded-xl border text-[11px] font-bold ${
                  currentUser?.role === 'owner'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  👑 OWNER (Full Control)
                </div>
                <div className={`p-2 rounded-xl border text-[11px] font-bold ${
                  currentUser?.role === 'attendant'
                    ? 'bg-sky-50 border-sky-300 text-sky-900 ring-1 ring-sky-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  💼 ATTENDANT (Counter Ops)
                </div>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 my-1" />
          </div>

          {/* Level 4: Application Modules */}
          <div className="flex flex-col items-center">
            <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="text-center font-black text-slate-900 text-xs flex items-center justify-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#173B6C]" /> APPLICATION PRESENTATION LAYER
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Dashboard</span>
                  <span className="text-[10px] text-slate-500">Real-time KPI pulse</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Sales ➔ Payments</span>
                  <span className="text-[10px] text-emerald-700 font-bold">{counts.sales} Sales ({counts.payments} Payments)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Customers ➔ Credit</span>
                  <span className="text-[10px] text-rose-700 font-bold">{counts.customers} Client Ledgers</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Reports & Analytics</span>
                  <span className="text-[10px] text-slate-500">P&L and Channel splits</span>
                </div>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 my-1" />
          </div>

          {/* Level 5: Service Layer */}
          <div className="flex flex-col items-center">
            <div className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-center font-black text-slate-900 text-xs flex items-center justify-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-600" /> SERVICE LAYER (Business Logic)
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-100 font-bold text-[10px]">
                  AuthService
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-100 font-bold text-[10px]">
                  SalesService
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-100 font-bold text-[10px]">
                  CustomerCreditService
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-100 font-bold text-[10px]">
                  PaymentService
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-100 font-bold text-[10px]">
                  ReportService
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-100 font-bold text-[10px]">
                  BackupService
                </span>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 my-1" />
          </div>

          {/* Level 6: Repository Layer */}
          <div className="flex flex-col items-center">
            <div className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-center font-black text-slate-900 text-xs flex items-center justify-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-700" /> REPOSITORY LAYER (Data Access Abstraction)
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-bold text-[10px]">
                  userRepository
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-bold text-[10px]">
                  salesRepository
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-bold text-[10px]">
                  customerRepository
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-bold text-[10px]">
                  paymentRepository
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-bold text-[10px]">
                  productRepository
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-bold text-[10px]">
                  settingsRepository
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-bold text-[10px]">
                  backupRepository
                </span>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 my-1" />
          </div>

          {/* Level 7: IndexedDB & Backup ➔ Device */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 text-center">
              <div className="font-black text-emerald-900 text-xs flex items-center justify-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-700" /> INDEXEDDB (Offline Storage)
              </div>
              <p className="text-[11px] text-emerald-700">
                Direct client-side IndexedDB engine. 0ms network latency, persistent across reloads.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-1 text-center">
              <div className="font-black text-sky-900 text-xs flex items-center justify-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#173B6C]" /> JSON BACKUP ENGINE
              </div>
              <p className="text-[11px] text-sky-700">
                Single-click complete snapshot export and restore directly to local file system.
              </p>
            </div>
          </div>

          {/* Device Target */}
          <div className="flex flex-col items-center pt-2">
            <ArrowDown className="w-4 h-4 text-slate-400 mb-1" />
            <div className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white font-black text-xs tracking-wider flex items-center gap-2 shadow-md">
              <Smartphone className="w-4 h-4 text-emerald-400" /> USER PHYSICAL DEVICE / BROWSER RUNTIME
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Close Architecture Inspector
          </button>
        </div>
      </div>
    </Modal>
  );
};
