'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const stats = [
  { value: '56.35%', label: 'Engineers Unemployable' },
  { value: '12+', label: 'Colleges Trust Us' },
  { value: '8,400+', label: 'Students Tracked' },
  { value: '94%', label: 'Placement Rate (Pro)' },
];

const painPoints = [
  { icon: '📋', title: 'Manual Tracking', desc: 'Excel sheets, paper records, zero real-time visibility into student readiness.' },
  { icon: '🎯', title: 'Hidden Skill Gaps', desc: 'Students discover weaknesses only during interviews — too late to fix.' },
  { icon: '📚', title: 'Generic Training', desc: 'One-size-fits-all training ignores individual strengths and weaknesses.' },
];

const features = [
  { icon: '📊', title: 'Unified Real-Time Dashboard', desc: 'Track every student\'s placement readiness across departments, in real-time.' },
  { icon: '🧠', title: 'AI Placement Readiness Score', desc: 'Weighted, multi-factor PRS score that predicts placement outcomes accurately.' },
  { icon: '💡', title: 'Personalized Recommendations', desc: 'AI-generated study plans and focus areas tailored to each student.' },
  { icon: '🏢', title: 'Batch Analytics & Filtering', desc: 'Filter students by company tier, department, score range. Export to CSV.' },
];

const testimonials = [
  { name: 'Dr. Suresh Patel', role: 'TPO, RVCE Bangalore', quote: 'SmartPRS reduced our manual tracking by 80%. We placed 40 more students this year.' },
  { name: 'Prof. Meera Iyer', role: 'HOD CS, SJCE Mysuru', quote: 'The AI recommendations are spot-on. Students love the personalized study plans.' },
  { name: 'Dr. Rajesh Kumar', role: 'Dean, BMSCE Bangalore', quote: 'Enterprise plan gave us cross-campus analytics we never had. Game changer.' },
];

const plans = [
  {
    name: 'Free', price: '₹0', period: '/month', popular: false,
    features: ['Up to 50 students', 'Basic PRS dashboard', 'Manual score entry', 'Email support'],
    blocked: ['AI predictions', 'CSV export', 'Batch analytics', 'Company filtering'],
    cta: 'Start Free',
  },
  {
    name: 'Pro', price: '₹8,499', period: '/month', popular: true,
    features: ['Unlimited students', 'Full AI Readiness Engine', 'Placement Probability', 'Advanced batch analytics', 'CSV export', 'Company-tier filtering', 'AI Resume Analyzer', 'Priority support'],
    blocked: [],
    cta: 'Start Pro Trial',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', popular: false,
    features: ['Everything in Pro', 'Multi-campus deployment', 'Custom ML models', 'LMS/ERP integration', 'Dedicated account manager', 'SLA guarantee', 'API access'],
    blocked: [],
    cta: 'Contact Sales',
  },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(prev => new Set(prev).add(e.target.id)); });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => { window.removeEventListener('scroll', handleScroll); observer.disconnect(); };
  }, []);

  const isVisible = (id: string) => visible.has(id);

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200">
      {/* Nav */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-brand-dark/90 backdrop-blur-lg border-b border-brand-border' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="text-xl font-bold text-white">Smart<span className="text-brand-cyan">PRS</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a>
            <Link href="/login" className="text-gray-400 hover:text-white transition">Login</Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-mesh min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="particle" style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%`, animationDelay: `${i * 0.8}s`, width: `${3 + i % 3}px`, height: `${3 + i % 3}px` }} />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="max-w-3xl">


            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white leading-tight mb-6">
              Turn Every Student Into a{' '}
              <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent">Placement Success Story</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl leading-relaxed">
              AI-powered placement readiness tracking for modern engineering colleges. Real-time dashboards, predictive analytics, and personalized training — all in one platform.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/signup" className="btn-primary text-base py-3 px-8">Start Free — No Credit Card</Link>
              <Link href="/login" className="btn-secondary text-base py-3 px-8">See Live Demo →</Link>
            </div>
            <div className="flex flex-wrap gap-6">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div id="problems" data-animate className={`text-center mb-16 transition-all duration-700 ${isVisible('problems') ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
            <h2 className="text-3xl font-bold text-white mb-4">The Problem is Real</h2>
            <p className="text-gray-400 max-w-xl mx-auto">56.35% of Indian engineering graduates are unemployable. Here&apos;s why traditional methods fail.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((p, i) => (
              <div key={i} id={`pain-${i}`} data-animate className="glass-card p-8 transition-all duration-700">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Intelligent Features That Drive Results</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Everything your placement cell needs to transform student outcomes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div id="social" data-animate className={`text-center mb-16 transition-all duration-700 ${isVisible('social') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-brand-cyan text-sm font-semibold mb-2">TRUSTED BY EDUCATORS</p>
            <h2 className="text-3xl font-bold text-white mb-4">Loved by 12+ Colleges Across India</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card p-6">
                <p className="text-sm text-gray-300 mb-4 italic">&quot;{t.quote}&quot;</p>
                <div><p className="text-white font-semibold text-sm">{t.name}</p><p className="text-xs text-gray-500">{t.role}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">Start free. Upgrade when you&apos;re ready to unlock AI.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`glass-card p-8 relative ${plan.popular ? 'border-brand-cyan/50 ring-1 ring-brand-cyan/20' : ''}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 pro-badge px-3 py-1">MOST POPULAR</div>}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <div className="mb-6"><span className="text-3xl font-extrabold text-white">{plan.price}</span><span className="text-gray-500 text-sm">{plan.period}</span></div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => <li key={fi} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand-cyan mt-0.5">✓</span>{f}</li>)}
                  {plan.blocked.map((f, fi) => <li key={fi} className="flex items-start gap-2 text-sm text-gray-600 line-through"><span className="mt-0.5">✗</span>{f}</li>)}
                </ul>
                <Link href={plan.name === 'Enterprise' ? '#' : '/signup'} className={`w-full text-center block ${plan.popular ? 'btn-primary' : 'btn-secondary'} py-3`}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Placement Cell?</h2>
          <p className="text-gray-400 mb-8">Join 12+ colleges already using SmartPRS to drive better placement outcomes.</p>
          <Link href="/signup" className="btn-primary text-base py-3 px-10">Get Started Free →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-white font-bold text-xs">S</div>
            <span className="font-bold text-white text-sm">SmartPRS</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 SmartPRS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
