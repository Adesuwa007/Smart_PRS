'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { STUDENT_SCORES, STUDENT_PROFILES } from '@/lib/mock-data';
import { calculateBatchStats } from '@/lib/ai-engine';
import BatchBarChart from '@/components/charts/BatchBarChart';
import { getAllStudents, subscribeToStudentUpdates, type UnifiedStudent } from '@/lib/students-service';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const statsInput = STUDENT_SCORES.map((s, i) => ({ scores: s, department: STUDENT_PROFILES[i]?.department }));
  const stats = calculateBatchStats(statsInput);

  const [students, setStudents] = useState<UnifiedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStudents().then(data => { setStudents(data); setLoading(false); });
    const sub = subscribeToStudentUpdates(() => getAllStudents().then(setStudents));
    return () => { sub.unsubscribe(); };
  }, []);

  const atRisk = students.filter(s => s.prs < 50);
  const highPerformers = students.filter(s => s.prs >= 80);
  const totalStudents = students.length;
  const avgPRS = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.prs, 0) / totalStudents) : stats.avgPRS;

  return (
    <DashboardLayout role="faculty" userName={user?.name || 'Faculty'}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Faculty Overview 👨‍🏫</h1>
          <p className="text-sm text-gray-400 mt-1">Class readiness analytics for Vidyavardhaka College of Engineering</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'My Students', value: loading ? '...' : totalStudents, icon: '👥', color: 'text-brand-cyan' },
            { label: 'Average PRS', value: avgPRS, icon: '📊', color: 'text-brand-cyan' },
            { label: 'High Performers', value: loading ? '...' : highPerformers.length, icon: '⭐', color: 'text-emerald-400' },
            { label: 'At-Risk (<50)', value: loading ? '...' : atRisk.length, icon: '⚠️', color: 'text-red-400' },
          ].map((c, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{c.label}</p>
                <span className="text-lg">{c.icon}</span>
              </div>
              <p className={`text-3xl font-extrabold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Class Health Bar */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">Class Health Score</h3>
            <span className="text-2xl font-bold text-brand-cyan">{avgPRS}<span className="text-gray-500 text-sm font-normal">/100</span></span>
          </div>
          {loading ? <div className="h-4 bg-gray-800 rounded-full animate-pulse" /> : (
            <div className="h-4 bg-brand-border rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${(highPerformers.length / Math.max(totalStudents, 1)) * 100}%` }} title="Ready" />
              <div className="h-full bg-yellow-400 transition-all" style={{ width: `${((totalStudents - highPerformers.length - atRisk.length) / Math.max(totalStudents, 1)) * 100}%` }} title="On Track" />
              <div className="h-full bg-red-400 transition-all" style={{ width: `${(atRisk.length / Math.max(totalStudents, 1)) * 100}%` }} title="At Risk" />
            </div>
          )}
          <div className="flex gap-6 mt-3 text-xs text-gray-500">
            <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />{highPerformers.length} Ready</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />{totalStudents - highPerformers.length - atRisk.length} On Track</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />{atRisk.length} At Risk</span>
          </div>
        </div>

        <BatchBarChart data={stats.deptStats} />

        {/* At-Risk Students */}
        {!loading && atRisk.length > 0 && (
          <div className="glass-card p-6 border border-red-500/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-400 text-lg">⚠️</span>
              <h3 className="text-base font-semibold text-red-400">At-Risk Students — Immediate Attention Required</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {atRisk.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.department} · {s.isDemo ? 'Demo' : 'Real user'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-red-400">{s.prs.toFixed(1)}</span>
                    <p className="text-[10px] text-gray-500">PRS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Ready to log assessment scores?</p>
            <p className="text-sm text-gray-400 mt-1">Update student scores and watch their PRS update in real-time.</p>
          </div>
          <Link href="/dashboard/faculty/add-score" className="btn-primary py-2.5 px-6">➕ Add Scores →</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
