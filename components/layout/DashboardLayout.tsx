'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface NavItem { label: string; href: string; icon: string; }

const navByRole: Record<string, NavItem[]> = {
  student: [
    { label: 'Dashboard', href: '/dashboard/student', icon: '📊' },
    { label: 'Assessments', href: '/dashboard/student/assessments', icon: '📝' },
    { label: 'Progress', href: '/dashboard/student/progress', icon: '📈' },
    { label: 'Soft Skills AI', href: '/dashboard/student/soft-skills-analyzer', icon: '🎤' },
    { label: 'Resume Analyzer', href: '/dashboard/student/resume-analyzer', icon: '🔍' },
  ],
  faculty: [
    { label: 'Overview', href: '/dashboard/faculty', icon: '📊' },
    { label: 'Students', href: '/dashboard/faculty/students', icon: '👥' },
    { label: 'Add Score', href: '/dashboard/faculty/add-score', icon: '➕' },
    { label: 'Soft Skills', href: '/dashboard/faculty/soft-skills-assessment', icon: '🗣️' },
  ],
  admin: [
    { label: 'Analytics', href: '/dashboard/admin', icon: '📊' },
    { label: 'Students', href: '/dashboard/admin/students', icon: '👥' },
    { label: 'Companies', href: '/dashboard/admin/companies', icon: '🏢' },
    { label: 'Export', href: '/dashboard/admin/export', icon: '📁' },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  ],
};

interface Props { role: string; userName: string; children: React.ReactNode; }

export default function DashboardLayout({ role, children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadViolations, setUnreadViolations] = useState(0);

  // Real user identity from AuthContext
  const { user, logout } = useAuth();
  const displayName = user?.name || 'User';
  const displayRole = user?.role || role || 'student';
  const userPlan = user?.plan || 'free';

  const nav = navByRole[displayRole] || navByRole[role] || navByRole.student;

  useEffect(() => {
    const refresh = () => {
      const count = Number(localStorage.getItem('smartprsUnreadViolationCount') || '0');
      setUnreadViolations(Number.isFinite(count) ? count : 0);
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r-3 border-[#1A1035] z-40 flex flex-col transition-transform duration-300 w-[240px] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-5 mb-8 mt-5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-[#1A1035] flex items-center justify-center text-[#1A1035] font-black text-sm shadow-[2px_2px_0px_#6C47FF]">S</div>
            <span className="text-xl font-black text-[#1A1035] uppercase tracking-tighter">Smart<span className="text-[#6C47FF]">PRS</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-[#1A1035]">✕</button>
        </div>
        <nav className="px-3 space-y-2 flex-1">
          {nav.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 font-bold ${
                pathname === item.href
                  ? 'bg-[#1A1035] text-white shadow-[3px_3px_0px_#6C47FF]'
                  : 'text-[#1A1035]/50 hover:bg-[#EDE9FE] hover:text-[#1A1035]'
              }`}>
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {displayRole === 'admin' && item.href === '/dashboard/admin' && unreadViolations > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#FF4D6D] px-2 py-0.5 text-[10px] text-white font-black">
                  {unreadViolations}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t-2 border-[#1A1035]/10 p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] border-2 border-[#1A1035] flex items-center justify-center text-[#6C47FF] font-black text-sm">
              {displayName[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1035] truncate">{displayName}</p>
              <p className="text-[10px] font-bold text-[#1A1035]/50 uppercase tracking-wider">{displayRole}</p>
            </div>
            <button onClick={logout} className="text-[#1A1035]/40 hover:text-[#FF4D6D] transition" title="Logout">⏻</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b-2 border-[#1A1035]/10 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[#1A1035] p-2">☰</button>
            <h2 className="text-lg font-black text-[#1A1035] hidden sm:block">
              Welcome back, {displayName} 👋
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] bg-white text-[#1A1035]">
              {userPlan === 'pro' ? 'PRO PLAN' : userPlan === 'enterprise' ? 'ENTERPRISE' : 'FREE PLAN'}
            </div>
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-xl border-2 border-[#1A1035]/10 hover:bg-[#EDE9FE] transition-colors">
                <span className="text-xl">🔔</span>
                <span className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white ${unreadViolations > 0 ? 'bg-[#FF4D6D] animate-pulse' : 'bg-[#00C9A7]'}`}></span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-72 bold-card bg-white p-3 space-y-2 z-50">
                  <p className="text-xs font-black text-[#1A1035] px-2 pb-2 border-b-2 border-[#1A1035]/10 uppercase tracking-wider">Notifications</p>
                  {['📊 Your coding score was updated to 88!', '🎯 New assessment available: Core Subjects Mock Test'].map((n, i) => (
                    <div key={i} className="p-3 rounded-xl border-2 border-transparent hover:border-[#1A1035]/10 text-xs font-bold text-[#1A1035]/70 hover:bg-[#F8F7FF] cursor-pointer transition-all">{n}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
