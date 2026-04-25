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
    <div className="min-h-screen bg-[#F8F7FF] text-[#1A1035] font-sans selection:bg-[#00C9A7] selection:text-[#1A1035]">
      {/* Nav */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 backdrop-blur-lg border-b-4 border-[#1A1035] shadow-[0px_4px_0px_#1A1035]' : 'bg-transparent border-b-4 border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white border-4 border-[#1A1035] flex items-center justify-center text-[#1A1035] font-black text-lg shadow-[2px_2px_0px_#6C47FF] group-hover:shadow-[4px_4px_0px_#6C47FF] group-hover:-translate-y-0.5 transition-all">S</div>
            <span className="text-2xl font-black text-[#1A1035] uppercase tracking-tighter">Smart<span className="text-[#6C47FF]">PRS</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-black uppercase tracking-wider">
            <a href="#features" className="text-[#1A1035]/60 hover:text-[#6C47FF] transition-colors">Features</a>
            <a href="#pricing" className="text-[#1A1035]/60 hover:text-[#6C47FF] transition-colors">Pricing</a>
            <Link href="/login" className="text-[#1A1035]/60 hover:text-[#6C47FF] transition-colors">Login</Link>
            <Link href="/signup" className="bg-[#00C9A7] text-[#1A1035] px-6 py-2.5 rounded-xl border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-0.5 transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center relative overflow-hidden bg-[#F8F7FF]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1A1035 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 w-full">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1A1035] leading-[1.1] mb-8 uppercase tracking-tighter">
              Turn Every Student Into a{' '}
              <span className="inline-block bg-[#00C9A7] px-4 py-1 border-4 border-[#1A1035] shadow-[6px_6px_0px_#1A1035] -rotate-1 mt-2 lg:mt-4 text-[#1A1035]">Placement Success</span>
            </h1>
            <p className="text-xl font-bold text-[#1A1035]/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              The ultimate neo-brutalist dashboard for placement readiness. Real-time tracking, predictive analytics, and personalized AI training.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Link href="/signup" className="w-full sm:w-auto bg-[#6C47FF] text-white text-lg font-black uppercase tracking-wider py-4 px-10 rounded-xl border-4 border-[#1A1035] shadow-[6px_6px_0px_#1A1035] hover:shadow-[8px_8px_0px_#1A1035] hover:-translate-y-1 transition-all">Start Free</Link>
              <Link href="/login" className="w-full sm:w-auto bg-white text-[#1A1035] text-lg font-black uppercase tracking-wider py-4 px-10 rounded-xl border-4 border-[#1A1035] shadow-[6px_6px_0px_#1A1035] hover:shadow-[8px_8px_0px_#1A1035] hover:-translate-y-1 transition-all">See Live Demo →</Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((s, i) => (
                <div key={i} className="bg-white border-4 border-[#1A1035] p-6 shadow-[4px_4px_0px_#1A1035] rounded-xl transform hover:-translate-y-1 transition-transform">
                  <div className={`text-3xl lg:text-4xl font-black mb-2 ${i === 0 ? 'text-[#FF4D6D]' : i === 1 ? 'text-[#00C9A7]' : i === 2 ? 'text-[#6C47FF]' : 'text-[#FFB347]'}`}>{s.value}</div>
                  <div className="text-xs font-bold text-[#1A1035] uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-6 bg-[#1A1035]">
        <div className="max-w-7xl mx-auto">
          <div id="problems" data-animate className={`text-center mb-16 transition-all duration-700 ${isVisible('problems') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">The Problem is <span className="text-[#FF4D6D]">Real</span></h2>
            <p className="text-xl font-bold text-white/60 max-w-2xl mx-auto">56.35% of Indian engineering graduates are unemployable. Here&apos;s why traditional methods fail.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((p, i) => (
              <div key={i} id={`pain-${i}`} data-animate className={`bg-white border-4 border-white p-8 rounded-2xl shadow-[8px_8px_0px_rgba(255,255,255,0.2)] transition-all duration-700 delay-${i * 100} ${isVisible(`pain-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="w-16 h-16 bg-[#F8F7FF] border-4 border-[#1A1035] rounded-xl flex items-center justify-center text-3xl shadow-[4px_4px_0px_#1A1035] mb-6">{p.icon}</div>
                <h3 className="text-xl font-black text-[#1A1035] mb-4 uppercase tracking-tight">{p.title}</h3>
                <p className="text-base font-bold text-[#1A1035]/60 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white border-y-4 border-[#1A1035]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1035] mb-6 uppercase tracking-tight">Intelligent <span className="inline-block bg-[#00C9A7] px-2 border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] rotate-1">Features</span></h2>
            <p className="text-xl font-bold text-[#1A1035]/60 max-w-2xl mx-auto">Everything your placement cell needs to transform student outcomes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-[#F8F7FF] border-4 border-[#1A1035] p-6 shadow-[6px_6px_0px_#1A1035] rounded-xl hover:-translate-y-2 transition-transform">
                <div className="w-14 h-14 bg-white border-4 border-[#1A1035] rounded-xl flex items-center justify-center text-2xl shadow-[2px_2px_0px_#1A1035] mb-6">{f.icon}</div>
                <h3 className="text-lg font-black text-[#1A1035] mb-3 uppercase tracking-tight leading-tight">{f.title}</h3>
                <p className="text-sm font-bold text-[#1A1035]/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-[#F8F7FF] relative overflow-hidden">
        {/* Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1A1035 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div id="social" data-animate className={`text-center mb-16 transition-all duration-700 ${isVisible('social') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="bg-[#1A1035] text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block mb-6 border-2 border-[#1A1035] shadow-[2px_2px_0px_#6C47FF]">TRUSTED BY EDUCATORS</p>
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1035] mb-4 uppercase tracking-tight">Loved by 12+ Colleges</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className={`bg-white border-4 border-[#1A1035] p-8 shadow-[8px_8px_0px_#1A1035] rounded-2xl relative ${i === 1 ? 'md:-translate-y-4' : ''}`}>
                <div className="absolute -top-5 -left-5 text-6xl text-[#00C9A7]">❝</div>
                <p className="text-base font-bold text-[#1A1035]/80 mb-6 italic relative z-10">&quot;{t.quote}&quot;</p>
                <div className="border-t-4 border-[#1A1035]/10 pt-4">
                  <p className="text-[#1A1035] font-black text-lg uppercase tracking-tight">{t.name}</p>
                  <p className="text-sm font-bold text-[#6C47FF]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-white border-y-4 border-[#1A1035]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1035] mb-6 uppercase tracking-tight">Simple Pricing</h2>
            <p className="text-xl font-bold text-[#1A1035]/60">Start free. Upgrade when you&apos;re ready to unlock AI.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`bg-[#F8F7FF] border-4 border-[#1A1035] p-8 rounded-2xl relative transition-transform ${plan.popular ? 'shadow-[12px_12px_0px_#6C47FF] md:-translate-y-4' : 'shadow-[8px_8px_0px_#1A1035]'}`}>
                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFB347] text-[#1A1035] font-black text-xs px-4 py-1.5 uppercase tracking-widest border-4 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] rounded-full rotate-2">MOST POPULAR</div>}
                <h3 className="text-2xl font-black text-[#1A1035] mb-2 uppercase tracking-tight">{plan.name}</h3>
                <div className="mb-8 pb-8 border-b-4 border-[#1A1035]/10">
                  <span className="text-5xl font-black text-[#1A1035]">{plan.price}</span>
                  <span className="text-[#1A1035]/50 font-bold ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((f, fi) => <li key={fi} className="flex items-start gap-3 font-bold text-[#1A1035]"><span className="text-[#00C9A7] font-black text-lg leading-none">✓</span>{f}</li>)}
                  {plan.blocked.map((f, fi) => <li key={fi} className="flex items-start gap-3 font-bold text-[#1A1035]/40 line-through"><span className="text-[#FF4D6D] font-black text-lg leading-none">✗</span>{f}</li>)}
                </ul>
                <Link href={plan.name === 'Enterprise' ? '#' : '/signup'} className={`block w-full text-center font-black uppercase tracking-wider py-4 rounded-xl border-4 border-[#1A1035] transition-all ${plan.popular ? 'bg-[#6C47FF] text-white shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1' : 'bg-white text-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1'}`}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-[#00C9A7] relative overflow-hidden">
        {/* Background Text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
          <span className="text-[20vw] font-black text-[#1A1035] whitespace-nowrap">SMARTPRS</span>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-[#1A1035] mb-8 uppercase tracking-tighter leading-tight">Ready to Transform Your Placement Cell?</h2>
          <p className="text-2xl font-bold text-[#1A1035]/80 mb-12">Join 12+ colleges already using SmartPRS.</p>
          <Link href="/signup" className="inline-block bg-[#1A1035] text-white text-xl font-black uppercase tracking-wider py-5 px-12 rounded-xl border-4 border-[#1A1035] shadow-[8px_8px_0px_rgba(255,255,255,0.5)] hover:shadow-[12px_12px_0px_rgba(255,255,255,0.5)] hover:-translate-y-2 transition-all">Get Started Free 🚀</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1035] py-12 px-6 border-t-8 border-[#6C47FF]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#1A1035] flex items-center justify-center text-[#1A1035] font-black text-lg shadow-[2px_2px_0px_#00C9A7]">S</div>
            <span className="text-2xl font-black text-white uppercase tracking-tighter">Smart<span className="text-[#00C9A7]">PRS</span></span>
          </div>
          <p className="text-sm font-bold text-white/50 uppercase tracking-wider">© 2026 SmartPRS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
