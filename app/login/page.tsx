'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  {
    email: 'student@demo.com', password: 'Demo@1234',
    role: 'student', name: 'Student', plan: 'pro',
    redirect: '/dashboard/student', label: 'Student',
  },
  {
    email: 'faculty@demo.com', password: 'Demo@1234',
    role: 'faculty', name: 'Faculty', plan: 'pro',
    redirect: '/dashboard/faculty', label: 'Faculty',
  },
  {
    email: 'user@demo.com', password: 'Demo@1234',
    role: 'admin', name: 'User', plan: 'pro',
    redirect: '/dashboard/admin', label: 'User',
  },
];

const ROLE_REDIRECT: Record<string, string> = {
  student: '/dashboard/student',
  faculty: '/dashboard/faculty',
  admin: '/dashboard/admin',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Check demo accounts first (always works, no Supabase needed)
    const demo = DEMO_ACCOUNTS.find(a => a.email === email && a.password === password);
    if (demo) {
      localStorage.clear();
      localStorage.setItem('demoRole', demo.role);
      localStorage.setItem('demoName', demo.name);
      localStorage.setItem('demoEmail', demo.email);
      localStorage.setItem('demoPlan', demo.plan);
      router.push(demo.redirect);
      return;
    }

    // 2. Try Supabase auth for real accounts
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      toast.error(authError?.message || 'Invalid credentials. Try a demo account below.');
      setLoading(false);
      return;
    }

    // 3. Fetch full profile from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      toast.error('Profile not found. Please contact support.');
      setLoading(false);
      return;
    }

    // 4. Do NOT set localStorage for real users — AuthContext reads Supabase session directly
    router.push(ROLE_REDIRECT[profile.role] || '/dashboard/student');
  };

  const quickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <Toaster position="top-center" />
      
      {/* Left Side - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#F8F7FF] border-r-4 border-[#1A1035] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1A1035 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-white border-4 border-[#1A1035] flex items-center justify-center text-[#1A1035] font-black text-xl shadow-[4px_4px_0px_#6C47FF]">S</div>
            <span className="text-3xl font-black text-[#1A1035] uppercase tracking-tighter">Smart<span className="text-[#6C47FF]">PRS</span></span>
          </Link>
          
          <h1 className="text-5xl font-black text-[#1A1035] leading-tight mb-6 uppercase tracking-tight">
            Ready to <span className="inline-block bg-[#00C9A7] px-2 border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] -rotate-2">dominate</span><br/>
            your placements?
          </h1>
          <p className="text-xl font-bold text-[#1A1035]/60 max-w-md">
            The ultimate neo-brutalist dashboard for student placement readiness and analytics.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-white border-4 border-[#1A1035] p-4 shadow-[4px_4px_0px_#1A1035] rounded-xl transform hover:-rotate-2 transition-transform">
            <div className="text-[#6C47FF] font-black text-3xl mb-1">98%</div>
            <div className="text-sm font-bold text-[#1A1035] uppercase tracking-wider">Placement Rate</div>
          </div>
          <div className="bg-[#00C9A7] border-4 border-[#1A1035] p-4 shadow-[4px_4px_0px_#1A1035] rounded-xl transform hover:rotate-2 transition-transform">
            <div className="text-[#1A1035] font-black text-3xl mb-1">50k+</div>
            <div className="text-sm font-bold text-[#1A1035] uppercase tracking-wider">Assessments</div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#1A1035] flex items-center justify-center text-[#1A1035] font-black shadow-[2px_2px_0px_#6C47FF]">S</div>
              <span className="text-2xl font-black text-[#1A1035] uppercase tracking-tighter">Smart<span className="text-[#6C47FF]">PRS</span></span>
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-[#1A1035] mb-2 uppercase tracking-tight">Welcome Back</h2>
            <p className="text-sm font-bold text-[#1A1035]/50">Sign in to your placement readiness dashboard</p>
          </div>

          <div className="bg-white border-4 border-[#1A1035] p-8 shadow-[8px_8px_0px_#1A1035] rounded-2xl relative">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] focus:-translate-y-1 transition-all outline-none" placeholder="you@college.edu" required />
              </div>
              <div>
                <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] focus:-translate-y-1 transition-all outline-none" placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#1A1035] text-white font-black uppercase tracking-wider py-4 rounded-xl border-2 border-[#1A1035] shadow-[4px_4px_0px_#6C47FF] hover:shadow-[6px_6px_0px_#6C47FF] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#6C47FF]">
                {loading ? 'Signing in...' : 'Sign In 🚀'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t-4 border-[#1A1035]/10 border-dashed">
              <p className="text-xs font-black text-[#1A1035]/40 uppercase tracking-wider mb-4 text-center">Quick Demo Login</p>
              <div className="space-y-3">
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.email} onClick={() => quickLogin(acc)} className="w-full text-left p-4 rounded-xl border-2 border-[#1A1035]/20 hover:border-[#1A1035] hover:bg-[#F8F7FF] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-1 transition-all flex items-center justify-between group bg-white">
                    <div>
                      <p className="text-sm font-black text-[#1A1035]">{acc.label}</p>
                      <p className="text-xs font-bold text-[#1A1035]/50">{acc.email}</p>
                    </div>
                    <span className="text-[#6C47FF] font-black text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center mt-8 text-sm font-bold text-[#1A1035]/50">
            Don&apos;t have an account? <Link href="/signup" className="text-[#6C47FF] font-black hover:underline underline-offset-4">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
