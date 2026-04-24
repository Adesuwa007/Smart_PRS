'use client';
import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BatchBarChart from '@/components/charts/BatchBarChart';
import UpgradeModal from '@/components/modals/UpgradeModal';
import { STUDENT_SCORES, STUDENT_PROFILES } from '@/lib/mock-data';
import { calculateBatchStats } from '@/lib/ai-engine';
import { getAllStudents, subscribeToStudentUpdates, type UnifiedStudent } from '@/lib/students-service';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

const today = new Date().toISOString().split('T')[0];

export default function AdminDashboard() {
  const { user } = useAuth();
  const statsInput = STUDENT_SCORES.map((s, i) => ({ scores: s, department: STUDENT_PROFILES[i]?.department }));
  const stats = calculateBatchStats(statsInput);

  const [students, setStudents] = useState<UnifiedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState<{ student_name: string; exam_type: string; message: string; occurred_at: string }[]>([]);

  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('prs');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');

  const showUpgrade = (f: string) => { setUpgradeFeature(f); setUpgradeOpen(true); };

  useEffect(() => {
    getAllStudents().then(data => { setStudents(data); setLoading(false); });
    const sub = subscribeToStudentUpdates(() => getAllStudents().then(setStudents));
    return () => { sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    supabase.from('exam_violations').select('*').order('occurred_at', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setViolations(data); });
  }, []);

  const filtered = useMemo(() => {
    let list = [...students];
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      if (sortCol === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const va = (a as unknown as Record<string, number>)[sortCol] || 0;
      const vb = (b as unknown as Record<string, number>)[sortCol] || 0;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return list;
  }, [students, search, sortCol, sortDir]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const totalStudents = students.length;
  const avgPRS = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.prs, 0) / totalStudents) : 0;
  const atRisk = students.filter(s => s.prs < 50).length;
  const placementReady = students.filter(s => s.prs >= 80).length;
  const realCount = students.filter(s => !s.isDemo).length;

  return (
    <DashboardLayout role="admin" userName={user?.name || 'Admin'}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard 📊</h1>
            <p className="text-sm text-gray-400">Macro batch analytics and student management</p>
          </div>
          <button onClick={() => showUpgrade('CSV Export')} className="btn-purple py-2 px-5 text-sm">
            📁 Export CSV <span className="pro-badge ml-1 text-[8px]">PRO</span>
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: totalStudents, icon: '👥', color: 'text-brand-cyan' },
            { label: 'Average PRS', value: avgPRS, icon: '📊', color: 'text-brand-cyan' },
            { label: 'Placement Ready', value: placementReady, icon: '🎯', color: 'text-emerald-400' },
            { label: 'At-Risk (<50 PRS)', value: atRisk, icon: '⚠️', color: 'text-red-400' },
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student Table */}
          <div className="lg:col-span-2 glass-card p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">Students ({filtered.length})</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing {filtered.length} students — {realCount} real · {students.length - realCount} demo
                </p>
              </div>
              <div className="flex gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input-dark py-1.5 text-sm w-40" placeholder="Search..." />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('name')} className="cursor-pointer">
                      Name {sortCol === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th>Dept</th>
                    <th onClick={() => toggleSort('prs')} className="cursor-pointer">
                      PRS {sortCol === 'prs' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => toggleSort('coding')} className="cursor-pointer">Code</th>
                    <th onClick={() => toggleSort('aptitude')} className="cursor-pointer">Apt</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const isNew = s.joinedAt === today;
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{s.name}</span>
                            {isNew && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">NEW</span>}
                          </div>
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </td>
                        <td><span className="badge badge-purple text-xs">{s.department}</span></td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-sm font-bold ${s.prs >= 75 ? 'bg-emerald-500/15 text-emerald-400' : s.prs >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                            {s.prs.toFixed(1)}
                          </span>
                        </td>
                        <td className="text-gray-300">{s.coding}</td>
                        <td className="text-gray-300">{s.aptitude}</td>
                        <td>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${s.isDemo ? 'border-gray-700 text-gray-500' : 'border-brand-cyan/30 text-brand-cyan'}`}>
                            {s.isDemo ? 'demo' : 'real'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Violation Feed */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-4">🔍 Exam Activity</h3>
            {violations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-xs text-gray-500">No violations recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {violations.map((v, i) => {
                  const age = Date.now() - new Date(v.occurred_at).getTime();
                  const isRecent = age < 5 * 60 * 1000; // within 5 mins
                  return (
                    <div key={i} className="p-2.5 rounded-xl bg-brand-dark/50 border border-brand-border/50">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isRecent ? 'bg-red-400' : 'bg-gray-600'}`} />
                        <p className="text-xs text-white font-medium">{v.student_name}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 ml-3">{v.exam_type} · {v.message}</p>
                      <p className="text-[10px] text-gray-600 ml-3">
                        {new Date(v.occurred_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Batch Chart */}
        <BatchBarChart data={stats.deptStats} />
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature={upgradeFeature} />
    </DashboardLayout>
  );
}
