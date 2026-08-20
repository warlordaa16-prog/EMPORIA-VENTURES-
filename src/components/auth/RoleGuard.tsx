import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { User } from '../../types';
import { authService } from '../../services/authService';

interface RoleGuardProps {
  requiredRole?: 'owner';
  currentUser: User | null;
  children: React.ReactNode;
  title?: string;
  description?: string;
  onElevateToOwner?: (ownerUser: User) => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  requiredRole = 'owner',
  currentUser,
  children,
  title = 'Restricted Feature',
  description = 'This section contains sensitive business data and requires Owner / Manager authorization.',
  onElevateToOwner
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isUnlockedLocally, setIsUnlockedLocally] = useState(false);

  // If user is already owner or locally unlocked, grant access
  if (currentUser?.role === 'owner' || isUnlockedLocally) {
    return <>{children}</>;
  }

  const handleVerifyOwnerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthorizing(true);

    try {
      const users = await authService.getAllUsers();
      const owner = users.find(u => u.role === 'owner');

      if (!owner) {
        setError('No owner account found. Please register an owner account.');
        setIsAuthorizing(false);
        return;
      }

      if (owner.pin === pin.trim()) {
        setIsUnlockedLocally(true);
        if (onElevateToOwner) {
          onElevateToOwner(owner);
        }
      } else {
        setError('Invalid Owner PIN. Access denied.');
      }
    } catch {
      setError('Authorization check failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)] text-center space-y-5 animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 mx-auto flex items-center justify-center shadow-xs">
        <Lock className="w-7 h-7 stroke-[2.2]" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-900 text-[10px] font-black uppercase tracking-wider">
          <ShieldAlert className="w-3 h-3" /> Role Validation: {requiredRole.toUpperCase()} Required
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left flex items-start gap-2.5">
        <UserCheck className="w-4 h-4 text-[#173B6C] shrink-0 mt-0.5" />
        <div>
          Current Active Profile: <strong className="text-slate-900">{currentUser?.fullName}</strong> (
          <span className="font-mono text-sky-800 font-bold uppercase">{currentUser?.role}</span>)
          <div className="text-[11px] text-slate-500 mt-0.5">
            Enter the Owner PIN (Default: <code>1234</code>) to unlock this view.
          </div>
        </div>
      </div>

      <form onSubmit={handleVerifyOwnerPin} className="space-y-3 max-w-xs mx-auto">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            maxLength={8}
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="Enter Owner PIN (1234)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F6DB2]/30 focus:border-[#2F6DB2]"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={isAuthorizing}
          className="w-full py-2.5 bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
        >
          {isAuthorizing ? (
            <span>Validating...</span>
          ) : (
            <>
              <span>Authorize & Unlock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
