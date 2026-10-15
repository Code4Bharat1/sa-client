'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  label?: string;
}

export function BackButton({ className = '', label = 'Back' }: BackButtonProps) {
  const router = useRouter();

  return (
    <div className={`mb-2.5 ${className}`}>
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-all duration-150 hover:border-slate-300 group"
        title="Go back"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform group-hover:-translate-x-0.5" />
        {label && <span>{label}</span>}
      </button>
    </div>
  );
}

export default BackButton;
