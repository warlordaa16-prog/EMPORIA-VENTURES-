import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  KeyRound,
  Layers,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';
import { authService } from '../../services/authService';
import { User, ShopSettings } from '../../types';
import { BRAND_CONFIG } from '../../constants/branding';

interface LoginPortalProps {
  onAuthenticated: (user: User) => void;
  settings: ShopSettings;
  onOpenArchitecture: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onAuthenticated,
  settings,
  onOpenArchitecture
}) => {
  // Attendant state
  const [attendantPin, setAttendantPin] = useState('');
  const [showAttendantPin, setShowAttendantPin] = useState(false);
  const [attendantError, setAttendantError] = useState<string | null>(null);
  const [isAuthenticatingAttendant, setIsAuthenticatingAttendant] = useState(false);

  // Hidden Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAuthenticatingAdmin, setIsAuthenticatingAdmin] = useState(false);

  // Keyboard shortcut listener: Alt + A or Ctrl + Shift + A to open hidden admin portal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsAdminModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Attendant Sign In
  const handleAttendantLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAttendantError(null);

    const pinToUse = attendantPin.trim() || 'Emporia00';
    setIsAuthenticatingAttendant(true);

    try {
      const res = await authService.login('attendant', pinToUse);
      if (!res.success || !res.user) {
        setIsAuthenticatingAttendant(false);
        setAttendantError(res.error || 'Invalid PIN. Please enter the Attendant PIN (Emporia00).');
        return;
      }

      setTimeout(() => {
        setIsAuthenticatingAttendant(false);
        onAuthenticated(res.user!);
      }, 300);
    } catch {
      setIsAuthenticatingAttendant(false);
      setAttendantError('Authentication failed. Please check your credentials.');
    }
  };

  // Hidden Admin Sign In (Emporia Ventures)
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAdminError(null);

    const passToUse = adminPassword.trim();
    if (!passToUse) {
      setAdminError('Please enter your Admin password.');
      return;
    }
    setIsAuthenticatingAdmin(true);

    try {
      const res = await authService.loginAdmin(passToUse);
      if (!res.success || !res.user) {
        setIsAuthenticatingAdmin(false);
        setAdminError(res.error || 'Invalid Admin Password. Access denied.');
        return;
      }

      setTimeout(() => {
        setIsAuthenticatingAdmin(false);
        setIsAdminModalOpen(false);
        onAuthenticated(res.user!);
      }, 300);
    } catch {
      setIsAuthenticatingAdmin(false);
      setAdminError('Admin authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between items-center p-4 sm:p-6 antialiased selection:bg-[#173B6C] selection:text-white relative overflow-hidden">
      {/* Light Ambient Logo Watermark */}
      {BRAND_CONFIG.logoUrl && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
          <img
            src={BRAND_CONFIG.logoUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-[450px] sm:w-[600px] max-w-none opacity-[0.038] grayscale filter blur-[0.4px]"
          />
        </div>
      )}

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between py-2 relative z-10">
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none"
          onDoubleClick={() => setIsAdminModalOpen(true)}
          title="Emporia Ventures (Double-click for Admin Access)"
        >
          {BRAND_CONFIG.logoUrl ? (
            <img
              src={BRAND_CONFIG.logoUrl}
              alt="Emporia Ventures Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-slate-200/80 group-hover:border-[#173B6C] transition-colors"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#173B6C] to-[#2F6DB2] text-white flex items-center justify-center font-black text-lg shadow-sm">
              EV
            </div>
          )}
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
              {BRAND_CONFIG.shortName}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Sales, Stock & Cashbook POS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtle Discreet Admin Trigger Icon */}
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-800 hover:bg-amber-50/70 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
            title="Management Access (Alt + A)"
            aria-label="Admin Access"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
            title="View System Architecture"
          >
            <Layers className="w-3.5 h-3.5 text-[#173B6C]" />
            <span className="hidden sm:inline">System Stack</span>
          </button>
        </div>
      </header>

      {/* Main Counter Terminal Sign In Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.05)] overflow-hidden my-auto relative z-10">
        {/* Card Header */}
        <div className="p-6 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-[#173B6C] text-[11px] font-black uppercase tracking-wider">
            <ShoppingBag className="w-3 h-3 text-[#173B6C]" /> Counter Terminal Sign In
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Attendant Counter
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Enter your attendant operator PIN to record customer sales and collect cash payments.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <form onSubmit={handleAttendantLogin} className="space-y-4">
            {attendantError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{attendantError}</span>
              </div>
            )}

            {/* Operator Identifier */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#173B6C] flex items-center justify-center font-bold">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-900 font-bold">Attendant Terminal</div>
                  <div className="text-[10px] text-slate-400 font-medium">Counter Sales & Cashbook</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] font-mono">
                ACTIVE
              </span>
            </div>

            {/* Operator Password / PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Attendant PIN
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Default: <code>Emporia00</code>
                </span>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-pin-input"
                  type={showAttendantPin ? 'text' : 'password'}
                  value={attendantPin}
                  onChange={e => setAttendantPin(e.target.value)}
                  placeholder="Enter PIN (Emporia00)"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#173B6C]/20 focus:border-[#173B6C] transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowAttendantPin(!showAttendantPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showAttendantPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Fill Attendant Credentials */}
            <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#173B6C] shrink-0" />
                <span className="text-[11px]">
                  Attendant PIN: <strong className="text-slate-900 font-mono">Emporia00</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttendantPin('Emporia00')}
                className="px-2.5 py-1 bg-white border border-sky-200 text-[#173B6C] text-[10px] font-black rounded-lg shadow-2xs hover:bg-sky-50 transition-colors cursor-pointer"
              >
                Quick Fill
              </button>
            </div>

            {/* Login Submit Button */}
            <button
              id="portal-login-submit-btn"
              type="submit"
              disabled={isAuthenticatingAttendant}
              className="w-full py-3.5 bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 text-white text-sm font-black rounded-2xl shadow-md shadow-[#173B6C]/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-70 mt-1"
            >
              {isAuthenticatingAttendant ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Opening Counter...</span>
                </div>
              ) : (
                <>
                  <span>Open Attendant Terminal</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card Footer Status & Discreet Admin Link */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Offline-First POS</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Store Admin</span>
          </button>
        </div>
      </div>

      {/* Hidden Admin Access Modal (Password: Eliana / Name: Emporia Ventures) */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-br from-[#173B6C] via-[#1E4D8C] to-[#2F6DB2] text-white relative">
              <button
                type="button"
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setAdminError(null);
                }}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-[10px] font-black uppercase tracking-wider">
                  <ShieldAlert className="w-3 h-3" /> Management Terminal
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">
                  Emporia Ventures
                </h3>
                <p className="text-xs text-sky-100/90 leading-relaxed">
                  Administrator access for stock management, P&L reports, item catalogs, and settings.
                </p>
              </div>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              {adminError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                      Admin Password
                    </label>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="admin-password-input"
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Enter Admin Password"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#173B6C]/20 focus:border-[#173B6C] transition-all"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-2.5 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-[#173B6C] shrink-0" />
                  <span className="text-[11px] leading-tight">
                    Authorized store manager & executive credentials required.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminModalOpen(false);
                      setAdminError(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticatingAdmin}
                    className="flex-2 py-3 bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 text-white text-xs font-black rounded-2xl shadow-md shadow-[#173B6C]/20 transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer disabled:opacity-70"
                  >
                    {isAuthenticatingAdmin ? (
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Authorizing...</span>
                      </div>
                    ) : (
                      <>
                        <span>Authorize Admin</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding with requested copyright */}
      <footer className="text-center text-xs text-slate-500 py-3 relative z-10 space-y-1">
        <p className="font-semibold text-slate-600 tracking-wide">
          ©️ by Arnible
        </p>
      </footer>
    </div>
  );
};
