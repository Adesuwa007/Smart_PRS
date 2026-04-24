'use client';
import Link from 'next/link';

interface Props { open: boolean; onClose: () => void; feature: string; }

export default function UpgradeModal({ open, onClose, feature }: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-card p-8 max-w-md w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()} style={{ borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 flex items-center justify-center text-3xl">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Unlock {feature}</h2>
          <p className="text-sm text-gray-400 mb-6">This premium feature is available on the Pro plan. Upgrade to get full access to AI-powered analytics.</p>

          <div className="glass-card p-4 mb-6 text-left" style={{ borderRadius: '16px' }}>
            <p className="text-xs font-semibold text-brand-purple uppercase tracking-wider mb-3">Pro Plan Includes:</p>
            <ul className="space-y-2 text-sm text-gray-300">
              {['Full AI Readiness Engine', 'Placement Probability predictions', 'CSV export & batch analytics', 'Company-tier filtering', 'AI Resume Analyzer'].map((f, i) => (
                <li key={i} className="flex items-center gap-2"><span className="text-brand-cyan">✓</span>{f}</li>
              ))}
            </ul>
          </div>

          <Link href="/pricing" className="btn-purple w-full justify-center py-3 text-base mb-3 block">
            Upgrade to Pro — ₹8,499/mo
          </Link>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-300 transition">Maybe later</button>
        </div>
      </div>
    </div>
  );
}
