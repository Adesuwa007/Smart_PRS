'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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

  // Real user identity from AuthContext
  const { user, logout } = useAuth();
  const displayName = user?.name || 'User';
  const displayRole = user?.role || role || 'student';
  const userPlan = user?.plan || 'free';

  const nav = navByRole[displayRole] || navByRole[role] || navByRole.student;

  return (
    <div className="min-h-screen bg-brand-dark gradient-mesh flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="px-5 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="text-lg font-bold text-white">Smart<span className="text-brand-cyan">PRS</span></span>
          </Link>
        </div>
        <nav className="px-3 space-y-1">
          {nav.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                pathname === item.href
                  ? 'bg-gradient-to-r from-cyan-500/85 to-violet-500/85 text-white font-semibold shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-0 right-0 px-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-dark/50 border border-brand-border/50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan/30 to-brand-purple/30 ring-1 ring-cyan-400/60 shadow-[0_0_14px_rgba(6,182,212,0.45)] flex items-center justify-center text-xs font-bold text-white">
              {displayName[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{displayName}</p>
              <p className="text-[10px] text-gray-500 capitalize">{displayRole}</p>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 text-xs transition" title="Logout">⏻</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#050508]/75 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white text-xl">☰</button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className={`badge text-[10px] ${userPlan === 'pro' || userPlan === 'enterprise' ? 'badge-cyan' : 'badge-cyan'}`}>
              {userPlan === 'pro' ? 'PRO PLAN' : userPlan === 'enterprise' ? 'ENTERPRISE' : 'FREE PLAN'}
            </div>
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-9 h-9 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-sm hover:border-brand-cyan/30 transition">
                🔔
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-cyan rounded-full text-[9px] font-bold text-white flex items-center justify-center">2</span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 glass-card p-3 space-y-2 z-50" style={{ borderRadius: '16px' }}>
                  <p className="text-xs font-semibold text-white px-2 pb-2 border-b border-brand-border">Notifications</p>
                  {['📊 Your coding score was updated to 88!', '🎯 New assessment available: Core Subjects Mock Test'].map((n, i) => (
                    <div key={i} className="p-2 rounded-lg text-xs text-gray-300 hover:bg-brand-surface/50 cursor-pointer">{n}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
