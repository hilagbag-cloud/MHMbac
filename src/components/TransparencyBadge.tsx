import React from 'react';
import { Info } from 'lucide-react';

interface TransparencyBadgeProps { className?: string; variant?: 'banner' | 'pill' | 'card' | 'inline'; }

export const TransparencyBadge: React.FC<TransparencyBadgeProps> = ({ className = '', variant = 'banner' }) => {
  const content = <><Info className="h-4 w-4 shrink-0 text-indigo-500" /><span><strong>Données observées.</strong> Les relevés reçus par MHM SOLUTIONS décrivent une situation à un moment donné. Ils ne garantissent ni admission ni attribution d’une bourse.</span></>;
  if (variant === 'pill' || variant === 'inline') return <span className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 ${className}`}>{content}</span>;
  return <div className={`flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 ${className}`}>{content}</div>;
};
export default TransparencyBadge;
