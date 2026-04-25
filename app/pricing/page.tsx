'use client';
import { useState } from 'react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    usd: '$0',
    period: '/month',
    popular: false,
    color: 'brand-cyan',
    icon: '🌱',
    features: [
      'Up to 50 students',
      'Basic PRS dashboard',
      'Manual score entry',
      'Student & faculty logins',
      'Email support',
    ],
    blocked: [
      'AI Placement Predictions',
      'CSV export',
      'Advanced batch analytics',
      'Company-tier filtering',
      'AI Resume Analyzer',
      'Priority support',
    ],
    cta: 'Start Free',
    ctaLink: '/signup',
    stripeProductId: null,
  },
  {
    name: 'Pro',
    price: '₹8,499',
    usd: '~$99',
    period: '/month',
    popular: true,
    color: 'brand-purple',
    icon: '🚀',
    features: [
      'Unlimited students',
      'Full AI Readiness Engine',
      'Placement Probability predictions',
      'Advanced batch analytics',
      'CSV export',
      'Company-tier filtering',
      'AI Resume Analyzer (Pro)',
      'Supabase Realtime updates',
      'Priority support',
      'Everything in Free',
    ],
    blocked: [],
    cta: 'Start Pro Trial',
    ctaLink: '/api/stripe/checkout',
    stripeProductId: 'pro',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    usd: '',
    period: '',
    popular: false,
    color: 'brand-cyan',
    icon: '🏢',
    features: [
      'Everything in Pro',
      'Multi-campus deployment',
      'Custom ML model training',
      'LMS/ERP integration (SAP, Jenzabar)',
      'Dedicated account manager',
      'SLA guarantee (99.9% uptime)',
      'API access',
      'Custom onboarding',
      'White-label option',
    ],
    blocked: [],
    cta: 'Contact Sales',
    ctaLink: 'mailto:sales@smartprs.io',
    stripeProductId: null,
  },
];

const faqs = [
  { q: 'Can I switch plans anytime?', a: 'Yes. Upgrade or downgrade at any time. When upgrading, you get instant access. When downgrading, changes take effect at the next billing cycle.' },
  { q: 'Is my data safe?', a: 'Absolutely. We use Supabase (PostgreSQL) with row-level security. All data is encrypted at rest and in transit. We are FERPA-compliant.' },
  { q: 'What happens when I exceed 50 students on Free?', a: 'You\'ll get a notification to upgrade. Existing data is preserved. We never delete your data.' },
  { q: 'Can I get a demo before upgrading?', a: 'You can log in right now with admin@demo.com / Demo@1234 to explore all Pro features on our demo college account.' },
  { q: 'Do you offer annual billing discounts?', a: 'Yes! Annual billing gives you 2 months free (effectively 17% off). Contact us for annual pricing.' },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: typeof plans[0]) => {
    if (!plan.stripeProductId) return;
    setLoading(plan.name);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.stripeProductId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Stripe checkout: ' + (data.error || 'Configure STRIPE_SECRET_KEY to enable payments'));
    } catch {
      alert('Test mode: Stripe checkout requires STRIPE_SECRET_KEY in .env.local');
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] text-[#1A1035] font-sans selection:bg-[#00C9A7] selection:text-[#1A1035]">
      {/* Nav */}
      <nav className="border-b-4 border-[#1A1035] bg-white px-6 py-4 flex items-center justify-between shadow-[0px_4px_0px_#1A1035] relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white border-4 border-[#1A1035] flex items-center justify-center text-[#1A1035] font-black text-lg shadow-[2px_2px_0px_#6C47FF] group-hover:shadow-[4px_4px_0px_#6C47FF] group-hover:-translate-y-0.5 transition-all">S</div>
          <span className="text-2xl font-black text-[#1A1035] uppercase tracking-tighter">Smart<span className="text-[#6C47FF]">PRS</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-black uppercase tracking-wider text-[#1A1035]/60 hover:text-[#6C47FF] transition-colors">Login</Link>
          <Link href="/signup" className="bg-[#00C9A7] text-[#1A1035] text-sm font-black uppercase tracking-wider px-6 py-2.5 rounded-xl border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-0.5 transition-all">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 text-center relative overflow-hidden bg-white border-b-4 border-[#1A1035]">
        {/* Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1A1035 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        <div className="relative z-10">
          <div className="bg-[#6C47FF] text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block mb-6 border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">💰 Transparent Pricing</div>
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1035] mb-4 uppercase tracking-tight">Simple, <span className="text-[#FF4D6D]">Transparent</span> Pricing</h1>
          <p className="text-lg font-bold text-[#1A1035]/60 max-w-lg mx-auto">Start free. Upgrade when you need AI superpowers. No hidden fees.</p>
          <div className="mt-8 inline-flex items-center gap-2 bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] shadow-[4px_4px_0px_#00C9A7]">
            <span className="text-[#00C9A7] font-black text-lg leading-none">✓</span> 14-day Pro trial available · No credit card required to start
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white border-4 border-[#1A1035] p-8 rounded-2xl relative flex flex-col transition-transform ${plan.popular ? 'shadow-[12px_12px_0px_#6C47FF] md:-translate-y-4' : 'shadow-[8px_8px_0px_#1A1035]'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFB347] text-[#1A1035] font-black text-xs px-4 py-1.5 uppercase tracking-widest border-4 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] rounded-full rotate-2">⚡ MOST POPULAR</div>
              )}
              <div className="w-16 h-16 bg-[#F8F7FF] border-4 border-[#1A1035] rounded-xl flex items-center justify-center text-3xl shadow-[4px_4px_0px_#1A1035] mb-6">{plan.icon}</div>
              <h2 className="text-2xl font-black text-[#1A1035] mb-2 uppercase tracking-tight">{plan.name}</h2>
              <div className="mb-2">
                <span className="text-4xl font-black text-[#1A1035]">{plan.price}</span>
                <span className="text-[#1A1035]/50 font-bold ml-1">{plan.period}</span>
              </div>
              {plan.usd && <p className="text-sm font-bold text-[#1A1035]/40 mb-8">{plan.usd} USD</p>}

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-3 text-sm font-bold text-[#1A1035]">
                    <span className="text-[#00C9A7] font-black text-lg leading-none flex-shrink-0">✓</span>{f}
                  </li>
                ))}
                {plan.blocked.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-3 text-sm font-bold text-[#1A1035]/40 line-through">
                    <span className="text-[#FF4D6D] font-black text-lg leading-none flex-shrink-0">✗</span>{f}
                  </li>
                ))}
              </ul>

              {plan.stripeProductId ? (
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loading === plan.name}
                  className={`w-full block text-center font-black uppercase tracking-wider py-4 rounded-xl border-4 border-[#1A1035] transition-all disabled:opacity-50 ${plan.popular ? 'bg-[#6C47FF] text-white shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1' : 'bg-[#F8F7FF] text-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1'}`}>
                  {loading === plan.name ? '⏳ Checkout...' : plan.cta}
                </button>
              ) : plan.name === 'Enterprise' ? (
                <a href={plan.ctaLink} className="block w-full text-center font-black uppercase tracking-wider py-4 rounded-xl border-4 border-[#1A1035] bg-[#F8F7FF] text-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all">
                  {plan.cta}
                </a>
              ) : (
                <Link href={plan.ctaLink} className={`block w-full text-center font-black uppercase tracking-wider py-4 rounded-xl border-4 border-[#1A1035] transition-all ${plan.popular ? 'bg-[#6C47FF] text-white shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1' : 'bg-[#F8F7FF] text-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1'}`}>
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Feature comparison note */}
        <div className="max-w-6xl mx-auto mt-12 bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[8px_8px_0px_#1A1035] flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 bg-[#F8F7FF] border-4 border-[#1A1035] rounded-xl flex items-center justify-center text-3xl shadow-[4px_4px_0px_#00C9A7] flex-shrink-0">🔒</div>
          <div className="flex-1">
            <p className="text-[#1A1035] font-black text-lg uppercase tracking-tight mb-2">Try before you commit</p>
            <p className="text-[#1A1035]/70 font-bold text-sm">Log in as <code className="bg-[#1A1035] px-2 py-1 rounded text-white text-xs border-2 border-[#1A1035]">admin@demo.com</code> with password <code className="bg-[#1A1035] px-2 py-1 rounded text-white text-xs border-2 border-[#1A1035]">Demo@1234</code> to explore all Pro features on our demo college.</p>
          </div>
          <Link href="/login" className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-3 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#6C47FF] hover:shadow-[6px_6px_0px_#6C47FF] hover:-translate-y-1 transition-all whitespace-nowrap">Try Demo →</Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white border-t-4 border-[#1A1035]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-[#1A1035] text-center mb-12 uppercase tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#F8F7FF] border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
                <p className="text-[#1A1035] font-black uppercase tracking-tight mb-3 text-lg">{faq.q}</p>
                <p className="text-base font-bold text-[#1A1035]/70 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1035] border-t-8 border-[#6C47FF] py-10 px-6 text-center">
        <p className="text-xs font-bold text-white/50 uppercase tracking-wider">© 2026 SmartPRS · DebugLeaf · SYMBIOT Hackathon · Vidyavardhaka College of Engineering, Mysuru</p>
      </footer>
    </div>
  );
}
