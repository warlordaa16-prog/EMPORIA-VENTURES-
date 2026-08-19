import React from 'react';
import { PaymentStatus } from '../../types';

interface StatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-bold tracking-wide',
    lg: 'px-3.5 py-1.5 text-sm font-bold tracking-wide'
  };

  if (status === 'PAID') {
    return (
      <span
        id={`badge-paid-${status}`}
        className={`inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses[size]}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        PAID
      </span>
    );
  }

  if (status === 'PARTIAL') {
    return (
      <span
        id={`badge-partial-${status}`}
        className={`inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses[size]}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        PARTIAL
      </span>
    );
  }

  return (
    <span
      id={`badge-credit-${status}`}
      className={`inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
      CREDIT
    </span>
  );
};
