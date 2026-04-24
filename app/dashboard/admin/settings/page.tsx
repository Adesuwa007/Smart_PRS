'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [plan] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.demo) {
        toast(data.message, { icon: '💡', duration: 6000 });
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast('⚠️ Add your real STRIPE_SECRET_KEY to .env.local to enable checkout.', { icon: '⚠️' });
      }
    } catch {
      toast.error('Could not connect to Stripe. Check your STRIPE_SECRET_KEY.');
    }
    setLoading(false);
  };

  return (
    <DashboardLayout role="admin" userName="Admin">
      <Toaster position="top-center" />
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings ⚙️</h1>
          <p className="text-sm text-gray-400">Manage your college plan and billing</p>
        </div>

        {/* College Info */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">College Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'College Name', value: 'Vidyavardhaka College of Engineering, Mysuru' },
              { label: 'Admin Email', value: 'admin@demo.com' },
              { label: 'Student Count', value: '180 students' },
              { label: 'Plan', value: plan === 'pro' ? 'Pro ⭐' : 'Free' },
            ].map((f, i) => (
              <div key={i}>
                <label className="text-xs text-gray-500 uppercase tracking-wider">{f.label}</label>
                <p className={`text-sm font-medium mt-1 ${f.label === 'Plan' ? (plan === 'pro' ? 'text-brand-cyan' : 'text-white') : 'text-white'}`}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Plan */}
        <div className={`glass-card p-6 ${plan === 'free' ? 'border-gray-700' : 'border-brand-purple/40'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{plan === 'free' ? 'Free' : 'Pro'}</h3>
                {plan === 'pro' && <span className="pro-badge text-[10px]">ACTIVE</span>}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {plan === 'free' ? '₹0/month · Up to 50 students' : '₹8,499/month · Unlimited students'}
              </p>
            </div>
            {plan === 'free' && (
              <div>
                <button onClick={handleUpgrade} disabled={loading} className="btn-purple py-2.5 px-6 disabled:opacity-50">
                  {loading ? '⏳ Redirecting...' : '⚡ Upgrade to Pro'}
                </button>
              </div>
            )}
          </div>
          {plan === 'free' && (
            <div className="p-4 bg-brand-purple/5 border border-brand-purple/20 rounded-xl">
              <p className="text-xs text-brand-purple font-semibold mb-2">🔒 Locked on Free Plan:</p>
              <div className="grid grid-cols-2 gap-1">
                {['AI Predictions', 'CSV Export', 'Batch Analytics', 'Company Filtering', 'AI Resume Analyzer', 'Unlimited Students'].map((f, i) => (
                  <p key={i} className="text-xs text-gray-500 flex items-center gap-1"><span>✗</span>{f}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stripe Billing */}
        {plan === 'pro' && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Billing</h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface/50 border border-brand-border">
              <div>
                <p className="text-sm text-white">Pro Plan · Monthly</p>
                <p className="text-xs text-gray-500">Next billing: May 24, 2026</p>
              </div>
              <span className="badge badge-success text-xs">Active</span>
            </div>
            <button className="btn-secondary py-2 px-4 text-xs mt-4">Manage in Stripe →</button>
          </div>
        )}

        {/* Danger Zone */}
        <div className="glass-card p-6" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <h3 className="text-sm font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Reset all student data</p>
              <p className="text-xs text-gray-500">This will permanently delete all scores. Cannot be undone.</p>
            </div>
            <button className="border border-red-500/40 text-red-400 hover:bg-red-500/10 transition py-2 px-4 rounded-xl text-xs font-semibold">
              Reset Data
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
