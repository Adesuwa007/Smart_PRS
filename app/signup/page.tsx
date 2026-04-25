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
    // Generate a temporary USN for signup (Ideally this would be checked against existing count on server)
    const timestamp = Date.now().toString().slice(-3);
    const generatedUsn = `4VV24${department === 'ECE' ? 'EC' : (department || 'CS')}${timestamp}`;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
      role,
      college_id: 'vvce-mysuru',
      plan: 'free',
      usn: generatedUsn,
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
        aptitude: 50,
        coding: 50,
        core_subjects: 50,
        soft_skills: 50,
        attendance: 75,
        backlogs: 0,
        department: department || 'CSE',
      });
    }

    toast.success('Account created! Please sign in.');
    setTimeout(() => router.push('/login'), 1200);
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
            Start your <span className="inline-block bg-[#00C9A7] px-2 border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] -rotate-2">journey</span><br/>
            to success
          </h1>
          <p className="text-xl font-bold text-[#1A1035]/60 max-w-md">
            Join thousands of students tracking their placement readiness on SmartPRS.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-white border-4 border-[#1A1035] p-4 shadow-[4px_4px_0px_#1A1035] rounded-xl transform hover:-rotate-2 transition-transform">
            <div className="text-[#6C47FF] font-black text-3xl mb-1">FREE</div>
            <div className="text-sm font-bold text-[#1A1035] uppercase tracking-wider">Forever for Students</div>
          </div>
          <div className="bg-[#FFB347] border-4 border-[#1A1035] p-4 shadow-[4px_4px_0px_#1A1035] rounded-xl transform hover:rotate-2 transition-transform">
            <div className="text-[#1A1035] font-black text-3xl mb-1">AI</div>
            <div className="text-sm font-bold text-[#1A1035] uppercase tracking-wider">Powered Insights</div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#1A1035] flex items-center justify-center text-[#1A1035] font-black shadow-[2px_2px_0px_#6C47FF]">S</div>
              <span className="text-2xl font-black text-[#1A1035] uppercase tracking-tighter">Smart<span className="text-[#6C47FF]">PRS</span></span>
            </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-black text-[#1A1035] mb-2 uppercase tracking-tight">Create Account</h2>
            <p className="text-sm font-bold text-[#1A1035]/50">Free forever. No credit card required.</p>
          </div>

          <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 shadow-[8px_8px_0px_#1A1035] rounded-2xl relative">
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] focus:-translate-y-1 transition-all outline-none" placeholder="Student Name" required />
              </div>
              <div>
                <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">College Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] focus:-translate-y-1 transition-all outline-none" placeholder="you@college.edu" required />
              </div>
              <div>
                <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] focus:-translate-y-1 transition-all outline-none" placeholder="Min 8 characters" minLength={8} required />
              </div>

              <div>
                <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">I am a...</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${role === r.value ? 'border-[#1A1035] bg-[#00C9A7] shadow-[4px_4px_0px_#1A1035] -translate-y-1' : 'border-[#1A1035]/20 bg-white hover:border-[#1A1035] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-1 hover:bg-[#F8F7FF]'}`}>
                      <div className="text-2xl">{r.icon}</div>
                      <div className={`text-xs font-black uppercase tracking-tight ${role === r.value ? 'text-[#1A1035]' : 'text-[#1A1035]/60'}`}>{r.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-[#1A1035]/50 mt-3 text-center">{ROLES.find(r2 => r2.value === role)?.desc}</p>
              </div>

              {role === 'student' && (
                <div>
                  <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] focus:-translate-y-1 transition-all outline-none appearance-none">
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="ISE">Information Science (ISE)</option>
                    <option value="ECE">Electronics (ECE)</option>
                    <option value="ME">Mechanical (ME)</option>
                    <option value="CV">Civil (CV)</option>
                  </select>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-[#1A1035] text-white font-black uppercase tracking-wider py-4 rounded-xl border-2 border-[#1A1035] shadow-[4px_4px_0px_#6C47FF] hover:shadow-[6px_6px_0px_#6C47FF] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#6C47FF] mt-4">
                {loading ? 'Creating account...' : 'Create Account 🚀'}
              </button>
            </form>

            <p className="text-xs font-bold text-[#1A1035]/40 text-center mt-6">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <p className="text-center mt-8 text-sm font-bold text-[#1A1035]/50">
            Already have an account? <Link href="/login" className="text-[#6C47FF] font-black hover:underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
