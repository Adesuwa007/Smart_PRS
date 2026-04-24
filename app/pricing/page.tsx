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
    <div className="min-h-screen bg-brand-dark text-gray-200">
      {/* Nav */}
      <nav className="border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="text-xl font-bold text-white">Smart<span className="text-brand-cyan">PRS</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Login</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 text-center gradient-mesh">
        <div className="badge badge-purple mb-4 text-xs mx-auto">💰 Transparent Pricing</div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-gray-400 max-w-lg mx-auto">Start free. Upgrade when you need AI superpowers. No hidden fees.</p>
        <div className="mt-6 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 text-sm text-emerald-400">
          ✓ 14-day Pro trial available · No credit card required to start
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`glass-card p-8 relative flex flex-col ${plan.popular ? 'border-brand-purple/50 ring-1 ring-brand-purple/20' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 pro-badge px-4 py-1.5">⚡ MOST POPULAR</div>
              )}
              <div className="text-3xl mb-3">{plan.icon}</div>
              <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
              <div className="mb-1">
                <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              {plan.usd && <p className="text-xs text-gray-600 mb-6">{plan.usd} USD</p>}

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
                {plan.blocked.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-gray-600 line-through">
                    <span className="mt-0.5 flex-shrink-0">✗</span>{f}
                  </li>
                ))}
              </ul>

              {plan.stripeProductId ? (
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loading === plan.name}
                  className={`w-full justify-center block ${plan.popular ? 'btn-purple' : 'btn-secondary'} py-3 text-center disabled:opacity-50`}>
                  {loading === plan.name ? '⏳ Opening Checkout...' : plan.cta}
                </button>
              ) : plan.name === 'Enterprise' ? (
                <a href={plan.ctaLink} className="btn-secondary w-full text-center py-3">
                  {plan.cta}
                </a>
              ) : (
                <Link href={plan.ctaLink} className={`w-full text-center block ${plan.popular ? 'btn-purple' : 'btn-secondary'} py-3`}>
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Feature comparison note */}
        <div className="max-w-6xl mx-auto mt-10 glass-card p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="text-3xl">🔒</div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Try before you commit</p>
            <p className="text-gray-400 text-sm mt-1">Log in as <code className="bg-brand-surface px-1.5 py-0.5 rounded text-brand-cyan text-xs">admin@demo.com</code> with password <code className="bg-brand-surface px-1.5 py-0.5 rounded text-brand-cyan text-xs">Demo@1234</code> to explore all Pro features on our demo college.</p>
          </div>
          <Link href="/login" className="btn-secondary py-2 px-6 text-sm flex-shrink-0">Try Demo →</Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-brand-surface/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-card p-6">
                <p className="text-white font-semibold mb-2">{faq.q}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border py-8 px-6 text-center">
        <p className="text-xs text-gray-600">© 2026 SmartPRS · DebugLeaf · SYMBIOT Hackathon · Vidyavardhaka College of Engineering, Mysuru</p>
      </footer>
    </div>
  );
}
