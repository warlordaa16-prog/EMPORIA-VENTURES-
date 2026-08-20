import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User as UserIcon,
  Lock,
  KeyRound,
  Store,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { authService, RegisterDTO } from '../../services/authService';
import { User, UserRole, ShopSettings } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<string | null>(null);

  // Register form state
  const [registerRole, setRegisterRole] = useState<UserRole>('owner');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerShopName, setRegisterShopName] = useState(settings.shopName || '');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPin, setRegisterPin] = useState('');
  const [registerConfirmPin, setRegisterConfirmPin] = useState('');
  const [showRegisterPin, setShowRegisterPin] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // Load existing users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await authService.getAllUsers();
      // Ensure unique list by username
      const seen = new Set<string>();
      const deduped: User[] = [];
      for (const u of users) {
        const key = u.username.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(u);
        }
      }
      setRegisteredUsers(deduped);
      if (deduped.length > 0 && !selectedUser) {
        setSelectedUser(deduped[0]);
        setLoginUsername(deduped[0].username);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setLoginUsername(u.username);
    setLoginPin('');
    setLoginError(null);
  };

  const handleQuickFillPin = (pin: string) => {
    setLoginPin(pin);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const usernameToUse = selectedUser ? selectedUser.username : loginUsername;
    if (!usernameToUse.trim()) {
      setLoginError('Please select or enter a username.');
      return;
    }
    if (!loginPin.trim()) {
      setLoginError('Please enter your 4-digit PIN / password.');
      return;
    }

    setIsAuthenticating(true);
    setAuthStep('1/2 Authenticating Credentials...');

    try {
      // Step 1: Authentication via AuthService
      const res = await authService.login(usernameToUse, loginPin);
      if (!res.success || !res.user) {
        setIsAuthenticating(false);
        setAuthStep(null);
        setLoginError(res.error || 'Authentication failed. Please verify your PIN.');
        return;
      }

      // Step 2: Role Validation
      setAuthStep(`2/2 Role Validated: ${res.user.role.toUpperCase()}`);
      setTimeout(() => {
        setIsAuthenticating(false);
        onAuthenticated(res.user!);
      }, 450);
    } catch (err) {
      setIsAuthenticating(false);
      setAuthStep(null);
      setLoginError('System error during login. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    if (!registerFullName.trim()) {
      setRegisterError('Please enter your full name.');
      return;
    }
    if (!registerUsername.trim()) {
      setRegisterError('Please choose a unique username.');
      return;
    }
    if (!registerPin.trim() || registerPin.length < 4) {
      setRegisterError('Security PIN must be at least 4 digits.');
      return;
    }
    if (registerPin !== registerConfirmPin) {
      setRegisterError('PIN confirmation does not match.');
      return;
    }

    setIsAuthenticating(true);
    setAuthStep('Registering User in Repository Layer...');

    try {
      const payload: RegisterDTO = {
        fullName: registerFullName.trim(),
        username: registerUsername.trim(),
        role: registerRole,
        pin: registerPin.trim(),
        phone: registerPhone.trim(),
        shopName: registerRole === 'owner' ? registerShopName.trim() : undefined
      };

      const res = await authService.register(payload);
      if (!res.success || !res.user) {
        setIsAuthenticating(false);
        setAuthStep(null);
        setRegisterError(res.error || 'Failed to register user.');
        return;
      }

      setAuthStep(`Role Assigned: ${res.user.role.toUpperCase()} • Launching Application...`);
      await loadUsers();

      setTimeout(() => {
        setIsAuthenticating(false);
        onAuthenticated(res.user!);
      }, 500);
    } catch (err) {
      setIsAuthenticating(false);
      setAuthStep(null);
      setRegisterError('Error creating user profile.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between items-center p-4 sm:p-6 antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Banner / Navigation */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#173B6C] to-[#2F6DB2] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#173B6C]/20">
            SP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ShopPay</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-[#173B6C] uppercase tracking-wider">
                Offline PWA
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Sales, Credit Ledger & Digital Cashbook
            </p>
          </div>
        </div>

        <button
          onClick={onOpenArchitecture}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          title="View System Architecture Diagram"
        >
          <Layers className="w-4 h-4 text-[#173B6C]" />
          <span className="hidden sm:inline">View Architecture</span>
        </button>
      </header>

      {/* Main Login Portal Bento Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden my-4">
        {/* Portal Header */}
        <div className="p-6 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/60 text-[#173B6C] text-xs font-black uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Authentication & Role Validation Portal
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome to ShopPay
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose your profile and authenticate to enter your role-tailored dashboard.
          </p>

          {/* Tab Switcher: REGISTER vs LOGIN */}
          <div className="flex p-1 bg-slate-100/90 rounded-2xl max-w-xs mx-auto mt-4 border border-slate-200/60">
            <button
              id="portal-tab-login"
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              LOGIN
            </button>
            <button
              id="portal-tab-register"
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegisterError(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              REGISTER
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Quick Select Existing Users */}
              {registeredUsers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    Select User Account
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {registeredUsers.map((u, idx) => {
                      const isSelected = selectedUser?.username === u.username;
                      const isOwner = u.role === 'owner';
                      return (
                        <button
                          key={`user-card-${u.id ?? ''}-${u.username}-${idx}`}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50/80 border-[#2F6DB2] ring-2 ring-[#2F6DB2]/20 shadow-2xs'
                              : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-xs text-slate-900 truncate">
                              {u.fullName}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                isOwner
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-sky-100 text-sky-800 border border-sky-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            @{u.username}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PIN / Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Security PIN / Password
                  </label>
                  {/* Demo Quick PIN Helpers */}
                  {selectedUser && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400">Demo PIN:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickFillPin(selectedUser.pin)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded border border-slate-200 cursor-pointer"
                      >
                        {selectedUser.pin}
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-pin-input"
                    type={showLoginPin ? 'text' : 'password'}
                    maxLength={8}
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value)}
                    placeholder="Enter 4-digit PIN (e.g. 1234)"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F6DB2]/30 focus:border-[#2F6DB2] transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPin(!showLoginPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Validation Notice */}
              {selectedUser && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#173B6C] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-900 uppercase font-black">{selectedUser.role}</strong> permissions will be validated:
                    {selectedUser.role === 'owner' ? (
                      <span> full revenue analytics, shop settings, attendant management & backups.</span>
                    ) : (
                      <span> counter sales, payments ledger, and client credit balance check.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Login Action Button */}
              <button
                id="portal-login-submit-btn"
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 text-white text-sm font-black rounded-2xl shadow-md shadow-[#173B6C]/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-70"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{authStep || 'Validating Role...'}</span>
                  </div>
                ) : (
                  <>
                    <span>Authenticate & Enter ShopPay</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {registerError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Select User Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('owner')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      registerRole === 'owner'
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-slate-900">👑 OWNER</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Shop Owner & Manager with full reporting, backups, and settings.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterRole('attendant')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      registerRole === 'attendant'
                        ? 'bg-sky-50/80 border-[#2F6DB2] ring-2 ring-[#2F6DB2]/20 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-slate-900">💼 ATTENDANT</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Cashier & Counter Staff for fast sales recording and payment entry.
                    </p>
                  </button>
                </div>
              </div>

              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Full Name *
                  </label>
                  <input
                    id="register-fullname"
                    type="text"
                    required
                    value={registerFullName}
                    onChange={e => setRegisterFullName(e.target.value)}
                    placeholder="e.g. David Mukasa"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F6DB2]/30 focus:border-[#2F6DB2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Username *
                  </label>
                  <input
                    id="register-username"
                    type="text"
                    required
                    value={registerUsername}
                    onChange={e => setRegisterUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. david"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F6DB2]/30 focus:border-[#2F6DB2]"
                  />
                </div>
              </div>

              {/* Shop Name (if Owner) */}
              {registerRole === 'owner' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Shop / Store Name
                  </label>
                  <input
                    id="register-shopname"
                    type="text"
                    value={registerShopName}
                    onChange={e => setRegisterShopName(e.target.value)}
                    placeholder="e.g. Mukasa General Stores"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F6DB2]/30 focus:border-[#2F6DB2]"
                  />
                </div>
              )}

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Phone Number (Optional)
                </label>
                <input
                  id="register-phone"
                  type="tel"
                  value={registerPhone}
                  onChange={e => setRegisterPhone(e.target.value)}
                  placeholder="+256 700 000 000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F6DB2]/30 focus:border-[#2F6DB2]"
                />
              </div>

              {/* PIN and Confirm PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Create 4-digit PIN *
                  </label>
                  <input
                    id="register-pin"
                    type={showRegisterPin ? 'text' : 'password'}
                    maxLength={8}
                    required
                    value={registerPin}
                    onChange={e => setRegisterPin(e.target.value)}
                    placeholder="e.g. 5678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F6DB2]/30 focus:border-[#2F6DB2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Confirm PIN *
                  </label>
                  <input
                    id="register-confirm-pin"
                    type={showRegisterPin ? 'text' : 'password'}
                    maxLength={8}
                    required
                    value={registerConfirmPin}
                    onChange={e => setRegisterConfirmPin(e.target.value)}
                    placeholder="Repeat PIN"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F6DB2]/30 focus:border-[#2F6DB2]"
                  />
                </div>
              </div>

              {/* Register Action Button */}
              <button
                id="portal-register-submit-btn"
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 text-white text-sm font-black rounded-2xl shadow-md shadow-[#173B6C]/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-70 mt-2"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{authStep || 'Creating Account...'}</span>
                  </div>
                ) : (
                  <>
                    <span>Create Account & Enter App</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Architecture Breadcrumb */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Offline-First Engine (IndexedDB)</span>
          </div>
          <button
            type="button"
            onClick={onOpenArchitecture}
            className="text-[#173B6C] font-bold hover:underline cursor-pointer"
          >
            System Topology →
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center text-xs text-slate-400 space-y-1">
        <p>ShopPay Architecture • Login Portal ➔ Auth ➔ Role Validation ➔ IndexedDB</p>
      </footer>
    </div>
  );
};
