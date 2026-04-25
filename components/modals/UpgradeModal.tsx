'use client';
import Link from 'next/link';

interface Props { open: boolean; onClose: () => void; feature: string; }

export default function UpgradeModal({ open, onClose, feature }: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop backdrop-blur-sm bg-[#1A1035]/60 flex items-center justify-center fixed inset-0 z-50 p-4" onClick={onClose}>
      <div className="bg-white border-4 border-[#1A1035] p-8 max-w-md w-full animate-slide-up rounded-2xl shadow-[8px_8px_0px_#1A1035]" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00C9A7] border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] flex items-center justify-center text-3xl">🔒</div>
          <h2 className="text-2xl font-black text-[#1A1035] uppercase tracking-tight mb-2">Unlock {feature}</h2>
          <p className="text-sm font-bold text-[#1A1035]/60 mb-6">This premium feature is available on the Pro plan. Upgrade to get full access to AI-powered analytics.</p>

          <div className="bg-[#F8F7FF] border-2 border-[#1A1035] p-5 mb-6 text-left rounded-xl shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-black text-[#6C47FF] uppercase tracking-widest mb-3">Pro Plan Includes:</p>
            <ul className="space-y-3 text-sm font-bold text-[#1A1035]">
              {['Full AI Readiness Engine', 'Placement Probability predictions', 'CSV export & batch analytics', 'Company-tier filtering', 'AI Resume Analyzer'].map((f, i) => (
                <li key={i} className="flex items-center gap-3"><span className="w-5 h-5 flex items-center justify-center bg-[#00C9A7] text-[#1A1035] rounded-full border-2 border-[#1A1035] text-[10px] shadow-[2px_2px_0px_#1A1035] shrink-0">✓</span>{f}</li>
              ))}
            </ul>
          </div>

          <Link href="/pricing" className="bg-[#6C47FF] border-4 border-[#1A1035] text-white w-full flex items-center justify-center py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all mb-4">
            Upgrade to Pro — ₹8,499/mo
          </Link>
          <button onClick={onClose} className="text-xs font-black text-[#1A1035]/60 hover:text-[#1A1035] uppercase tracking-widest transition-colors">Maybe later</button>
        </div>
      </div>
    </div>
  );
}
