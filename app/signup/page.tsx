'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

const ROLES = [
  { value: 'student', label: 'Student', icon: '🎓', desc: 'Track your readiness & get AI coaching' },
  { value: 'faculty', label: 'Faculty', icon: '👨‍🏫', desc: 'Manage class scores and analytics' },
  { value: 'admin', label: 'Admin / TPO', icon: '📊', desc: 'Batch-level analytics and placement tracking' },
];

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Step 1: Create Supabase auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (signUpError || !data.user) {
      toast.error(signUpError?.message || 'Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    // Step 2: Insert into profiles table
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
      role,
      college_id: 'vvce-mysuru',
      plan: 'free',
    });

    if (profileError) {
      toast.error('Account created but profile save failed: ' + profileError.message);
      setLoading(false);
      return;
    }

    // Step 3: If student, also insert into student_scores
    if (role === 'student') {
      await supabase.from('student_scores').insert({
        student_id: data.user.id,
        aptitude: 0,
        coding: 0,
        core_subjects: 0,
        soft_skills: 0,
        attendance: 75,
        backlogs: 0,
        department: department || 'CSE',
      });
    }

    toast.success('Account created! Please sign in.');
    setTimeout(() => router.push('/login'), 1200);
  };

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-12">
      <Toaster position="top-center" />
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-white font-bold">S</div>
            <span className="text-2xl font-bold text-white">Smart<span className="text-brand-cyan">PRS</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm text-gray-400">Free forever. No credit card required.</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-dark" placeholder="Arjun Sharma" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">College Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-dark" placeholder="you@college.edu" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" placeholder="Min 8 characters" minLength={8} required />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${role === r.value ? 'border-brand-cyan/60 bg-brand-cyan/10 text-white' : 'border-brand-border text-gray-400 hover:border-brand-border/80'}`}>
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="text-xs font-semibold">{r.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{ROLES.find(r2 => r2.value === role)?.desc}</p>
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Department</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} className="input-dark">
                  <option value="CSE">CSE</option>
                  <option value="ISE">ISE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CV">CV</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Free Account →'}
            </button>
          </form>

          <p className="text-xs text-gray-600 text-center mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-brand-cyan hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
