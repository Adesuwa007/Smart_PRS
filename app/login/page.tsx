'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  {
    email: 'student@demo.com', password: 'Demo@1234',
    role: 'student', name: 'Arjun Sharma', plan: 'free',
    redirect: '/dashboard/student', label: 'Student',
  },
  {
    email: 'faculty@demo.com', password: 'Demo@1234',
    role: 'faculty', name: 'Prof. Ramesh Kumar', plan: 'pro',
    redirect: '/dashboard/faculty', label: 'Faculty',
  },
  {
    email: 'admin@demo.com', password: 'Demo@1234',
    role: 'admin', name: 'Dr. Suresh Nayak', plan: 'pro',
    redirect: '/dashboard/admin', label: 'Admin / TPO',
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
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-white font-bold">S</div>
            <span className="text-2xl font-bold text-white">Smart<span className="text-brand-cyan">PRS</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-sm text-gray-400">Sign in to your placement readiness dashboard</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-dark" placeholder="you@college.edu" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-brand-border">
            <p className="text-xs text-gray-500 mb-3 text-center">Quick Demo Login</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} onClick={() => quickLogin(acc)} className="w-full text-left p-3 rounded-xl border border-brand-border hover:border-brand-cyan/40 hover:bg-brand-surface transition-all flex items-center justify-between group">
                  <div>
                    <p className="text-sm text-white font-medium">{acc.label}</p>
                    <p className="text-xs text-gray-500">{acc.email}</p>
                  </div>
                  <span className="text-xs text-gray-600 group-hover:text-brand-cyan transition">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Don&apos;t have an account? <Link href="/signup" className="text-brand-cyan hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
