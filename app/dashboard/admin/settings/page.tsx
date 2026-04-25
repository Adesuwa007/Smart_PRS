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
    <DashboardLayout role="admin" userName="User">
      <Toaster position="top-center" />
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Settings ⚙️</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Manage your college plan and billing</p>
        </div>

        {/* College Info */}
        <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
          <h3 className="text-sm font-black text-[#1A1035] mb-6 uppercase tracking-wider border-b-4 border-[#1A1035]/10 pb-4">College Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: 'College Name', value: 'Vidyavardhaka College of Engineering, Mysuru' },
              { label: 'Admin Email', value: 'user@demo.com' },
              { label: 'Student Count', value: '180 students' },
              { label: 'Plan', value: plan === 'pro' ? 'Pro ⭐' : 'Free' },
            ].map((f, i) => (
              <div key={i} className="bg-[#F8F7FF] border-2 border-[#1A1035] p-4 rounded-xl shadow-[4px_4px_0px_#1A1035]">
                <label className="text-xs font-black text-[#1A1035]/50 uppercase tracking-widest">{f.label}</label>
                <p className={`text-base font-black mt-1 ${f.label === 'Plan' ? (plan === 'pro' ? 'text-[#00C9A7]' : 'text-[#6C47FF]') : 'text-[#1A1035]'}`}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Plan */}
        <div className={`bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl ${plan === 'free' ? 'shadow-[6px_6px_0px_#1A1035]' : 'shadow-[8px_8px_0px_#6C47FF]'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <p className="text-xs font-black text-[#1A1035]/50 uppercase tracking-widest mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-[#1A1035] uppercase tracking-tight">{plan === 'free' ? 'Free' : 'Pro'}</h3>
                {plan === 'pro' && <span className="bg-[#6C47FF] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-[#1A1035] rounded-full shadow-[2px_2px_0px_#1A1035]">ACTIVE</span>}
              </div>
              <p className="text-sm font-bold text-[#1A1035]/60 mt-1">
                {plan === 'free' ? '₹0/month · Up to 50 students' : '₹8,499/month · Unlimited students'}
              </p>
            </div>
            {plan === 'free' && (
              <div>
                <button onClick={handleUpgrade} disabled={loading} className="bg-[#6C47FF] text-white font-black uppercase tracking-wider py-3 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all disabled:opacity-50">
                  {loading ? '⏳ Redirecting...' : '⚡ Upgrade to Pro'}
                </button>
              </div>
            )}
          </div>
          {plan === 'free' && (
            <div className="p-5 bg-[#F8F7FF] border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#FFB347] border-r-4 border-[#1A1035]"></div>
              <p className="text-xs font-black text-[#1A1035] uppercase tracking-wider mb-4 pl-4">🔒 Locked on Free Plan</p>
              <div className="grid sm:grid-cols-2 gap-3 pl-4">
                {['AI Predictions', 'CSV Export', 'Batch Analytics', 'Company Filtering', 'AI Resume Analyzer', 'Unlimited Students'].map((f, i) => (
                  <p key={i} className="text-xs font-bold text-[#1A1035]/60 flex items-center gap-2"><span className="text-[#FF4D6D] font-black">✗</span>{f}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stripe Billing */}
        {plan === 'pro' && (
          <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
            <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4">Billing</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] gap-4">
              <div>
                <p className="text-sm font-black text-[#1A1035]">Pro Plan · Monthly</p>
                <p className="text-xs font-bold text-[#1A1035]/60 mt-1">Next billing: May 24, 2026</p>
              </div>
              <span className="bg-[#00C9A7] text-[#1A1035] px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-[#1A1035] rounded-full shadow-[2px_2px_0px_#1A1035]">Active</span>
            </div>
            <button className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-3 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all mt-6 text-xs">Manage in Stripe →</button>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#FF4D6D] border-r-4 border-[#1A1035]"></div>
          <h3 className="text-sm font-black text-[#FF4D6D] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4 pl-4">Danger Zone</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pl-4">
            <div>
              <p className="text-base font-black text-[#1A1035] uppercase tracking-tight">Reset all student data</p>
              <p className="text-xs font-bold text-[#1A1035]/60 mt-1">This will permanently delete all scores. Cannot be undone.</p>
            </div>
            <button className="bg-[#FF4D6D] text-white font-black uppercase tracking-wider py-3 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs">
              Reset Data
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
