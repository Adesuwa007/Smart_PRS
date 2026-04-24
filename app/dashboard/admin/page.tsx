'use client';
import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BatchBarChart from '@/components/charts/BatchBarChart';
import UpgradeModal from '@/components/modals/UpgradeModal';
import { STUDENT_SCORES, STUDENT_PROFILES } from '@/lib/mock-data';
import { calculateBatchStats } from '@/lib/ai-engine';
import { getAllStudents, subscribeToStudentUpdates, type UnifiedStudent } from '@/lib/students-service';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { ViolationRecord } from '@/types';



const today = new Date().toISOString().split('T')[0];

export default function AdminDashboard() {
  const { user } = useAuth();
  const statsInput = STUDENT_SCORES.map((s, i) => ({ scores: s, department: STUDENT_PROFILES[i]?.department }));
  const stats = calculateBatchStats(statsInput);

  const [students, setStudents] = useState<UnifiedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);

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

  const loadViolations = async () => {
    let loaded: ViolationRecord[] = [];
    
    // Always read localStorage first
    const localStr = localStorage.getItem('exam_violations');
    const local: ViolationRecord[] = localStr ? JSON.parse(localStr) : [];
    
    // Try Supabase too
    try {
      const { data } = await supabase
        .from('exam_violations')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(50);
      
      if (data && data.length > 0) {
        // Merge both sources, deduplicate by student_name + occurred_at
        loaded = [...data, ...local]
          .filter((v, i, arr) => 
            arr.findIndex(x => 
              x.occurred_at === v.occurred_at && 
              x.student_name === v.student_name
            ) === i
          )
          .sort((a, b) => 
            new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
          );
      } else {
        loaded = local;
      }
    } catch {
      loaded = local;
    }
    
    setViolations(loaded);
  };

  const seedDemoViolations = () => {
    const existing = localStorage.getItem('exam_violations');
    if (!existing || JSON.parse(existing).length === 0) {
      const demoViolations = [
        {
          student_id: 'demo-student',
          student_name: 'Arjun Sharma',
          exam_type: 'Aptitude Assessment',
          violation_type: 'tab_switch',
          message: 'Student switched tabs during exam',
          occurred_at: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          student_id: 'demo-student-2', 
          student_name: 'Kiran Kumar',
          exam_type: 'Coding Assessment',
          violation_type: 'right_click',
          message: 'Right click attempted during exam',
          occurred_at: new Date(Date.now() - 12 * 60000).toISOString()
        },
        {
          student_id: 'demo-student-3',
          student_name: 'Vijay Kumar', 
          exam_type: 'Core Subjects Test',
          violation_type: 'camera_denied',
          message: 'Camera permission denied',
          occurred_at: new Date(Date.now() - 28 * 60000).toISOString()
        }
      ];
      localStorage.setItem('exam_violations', JSON.stringify(demoViolations));
    }
  };

  // Poll every 5 seconds for real-time feel
  useEffect(() => {
    seedDemoViolations();
    loadViolations();
    const interval = setInterval(loadViolations, 5000);
    return () => clearInterval(interval);
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center">
                🔍 Exam Activity
                {violations.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{violations.length}</span>}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Total Today: {violations.length}</span>
                <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold">Live</span>
                </div>
              </div>
            </div>
            
            {violations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-xs text-gray-500">No violations recorded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {violations.map((v, i) => {
                  const ageMins = (Date.now() - new Date(v.occurred_at).getTime()) / 60000;
                  const isVeryRecent = ageMins < 5;
                  const isRecent = ageMins < 30;
                  
                  let badgeColor = "bg-gray-500/20 text-gray-400";
                  let badgeText = v.violation_type;
                  
                  if (v.violation_type === 'tab_switch') {
                    badgeColor = "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
                    badgeText = "Tab Switch";
                  } else if (v.violation_type === 'right_click') {
                    badgeColor = "bg-orange-500/20 text-orange-400 border border-orange-500/30";
                    badgeText = "Right Click";
                  } else if (v.violation_type === 'camera_denied') {
                    badgeColor = "bg-red-500/20 text-red-400 border border-red-500/30";
                    badgeText = "Camera Denied";
                  } else if (v.violation_type === 'copy_paste') {
                    badgeColor = "bg-red-500/20 text-red-400 border border-red-500/30";
                    badgeText = "Copy Attempt";
                  }

                  let timeAgo = "Just now";
                  if (ageMins >= 1) timeAgo = `${Math.floor(ageMins)} minutes ago`;
                  if (ageMins >= 60) timeAgo = `${Math.floor(ageMins / 60)} hours ago`;
                  
                  return (
                    <div key={i} className="p-3 rounded-xl bg-brand-surface/40 border border-white/5 flex items-start gap-3">
                      <div className={`mt-1.5 w-2 h-2 rounded-full ${isVeryRecent ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' : isRecent ? 'bg-orange-400' : 'bg-gray-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-white font-bold">{v.student_name || 'Unknown Student'}</p>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-brand-cyan mt-0.5">{v.exam_type}</p>
                        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                      </div>
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
