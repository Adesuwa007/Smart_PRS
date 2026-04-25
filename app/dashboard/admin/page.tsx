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
          student_name: 'Student',
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
    <DashboardLayout role="admin" userName={user?.name || 'User'}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A1035] tracking-tight">User Dashboard 📊</h1>
            <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Macro batch analytics and candidate discovery</p>
          </div>
          <button onClick={() => showUpgrade('CSV Export')} className="btn-purple py-2 px-5 text-sm font-black border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] hover:shadow-[4px_4px_0px_#1A1035]">
            📁 Export CSV <span className="bg-white text-[#1A1035] border-2 border-[#1A1035] px-1.5 py-0.5 rounded-full ml-1 text-[8px] font-black">PRO</span>
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: totalStudents, subLabel: `${students.length - realCount} demo + ${realCount} real accounts`, icon: '👥', color: 'text-[#6C47FF]', bg: 'bg-[#EDE9FE]' },
            { label: 'Average PRS', value: avgPRS, icon: '📊', color: 'text-[#00C9A7]', bg: 'bg-[#D1FAE5]' },
            { label: 'Placement Ready', value: placementReady, icon: '🎯', color: 'text-[#FFB347]', bg: 'bg-[#FEF3C7]' },
            { label: 'At-Risk (<50 PRS)', value: atRisk, icon: '⚠️', color: 'text-[#FF4D6D]', bg: 'bg-[#FCE7F3]' },
          ].map((c, i) => (
            <div key={i} className={`bold-card p-6 ${c.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-[#1A1035]/50 uppercase tracking-wider">{c.label}</p>
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#1A1035] flex items-center justify-center text-lg shadow-[2px_2px_0px_#1A1035]">{c.icon}</div>
              </div>
              <div className="flex flex-col">
                <p className={`text-4xl font-black ${c.color}`}>{c.value}</p>
                {c.subLabel && <p className="text-[10px] font-bold text-[#1A1035]/60 mt-2 uppercase tracking-widest">{c.subLabel}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student Table */}
          <div className="lg:col-span-2 bold-card bg-white p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight">Students ({filtered.length})</h3>
                <p className="text-xs font-bold text-[#1A1035]/50 mt-1">
                  Showing {filtered.length} students — {realCount} real · {students.length - realCount} demo
                </p>
              </div>
              <div className="flex gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors w-48" placeholder="Search..." />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-14 bg-[#F8F7FF] border-2 border-[#1A1035]/10 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#1A1035]/10">
                    <th onClick={() => toggleSort('name')} className="py-3 px-4 text-xs font-black text-[#1A1035]/50 uppercase tracking-wider cursor-pointer hover:text-[#6C47FF]">
                      Name {sortCol === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="py-3 px-4 text-xs font-black text-[#1A1035]/50 uppercase tracking-wider">Dept</th>
                    <th onClick={() => toggleSort('prs')} className="py-3 px-4 text-xs font-black text-[#1A1035]/50 uppercase tracking-wider cursor-pointer hover:text-[#6C47FF]">
                      PRS {sortCol === 'prs' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => toggleSort('coding')} className="py-3 px-4 text-xs font-black text-[#1A1035]/50 uppercase tracking-wider cursor-pointer hover:text-[#6C47FF]">Code</th>
                    <th onClick={() => toggleSort('aptitude')} className="py-3 px-4 text-xs font-black text-[#1A1035]/50 uppercase tracking-wider cursor-pointer hover:text-[#6C47FF]">Apt</th>
                    <th className="py-3 px-4 text-xs font-black text-[#1A1035]/50 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#1A1035]/5">
                  {filtered.map(s => {
                    const isNew = s.joinedAt === today;
                    return (
                      <tr key={s.id} className="hover:bg-[#F8F7FF] transition-colors group cursor-pointer">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#1A1035] font-black group-hover:text-[#6C47FF] transition-colors">{s.name}</span>
                            {isNew && <span className="text-[10px] bg-[#6C47FF] text-white font-black px-2 py-0.5 rounded-full border-2 border-[#1A1035]">NEW</span>}
                          </div>
                          <p className="text-xs font-bold text-[#1A1035]/40">{s.email}</p>
                        </td>
                        <td className="py-3 px-4"><span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-[#1A1035] bg-[#EDE9FE] text-[#6C47FF]">{s.department}</span></td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-black border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] ${s.prs >= 75 ? 'bg-[#D1FAE5] text-[#00C9A7]' : s.prs >= 50 ? 'bg-[#FEF3C7] text-[#FFB347]' : 'bg-[#FCE7F3] text-[#FF4D6D]'}`}>
                            {s.prs.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#1A1035]/70 font-black">{s.coding}</td>
                        <td className="py-3 px-4 text-[#1A1035]/70 font-black">{s.aptitude}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider border-2 ${s.isDemo ? 'border-[#1A1035]/20 text-[#1A1035]/40 bg-[#F8F7FF]' : 'border-[#1A1035] text-[#6C47FF] bg-[#EDE9FE]'}`}>
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
          <div className="bold-card bg-white p-6">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#1A1035]/10 pb-4">
              <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight flex items-center">
                🔍 Exam Activity
                {violations.length > 0 && <span className="ml-3 bg-[#FF4D6D] border-2 border-[#1A1035] text-white text-[10px] px-2.5 py-0.5 rounded-full shadow-[2px_2px_0px_#1A1035] animate-pulse">{violations.length}</span>}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#1A1035]/50 uppercase tracking-wider">Total: {violations.length}</span>
                <div className="flex items-center gap-1.5 bg-[#D1FAE5] border-2 border-[#00C9A7] px-2 py-1 rounded-md shadow-[2px_2px_0px_rgba(0,201,167,0.4)]">
                  <div className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></div>
                  <span className="text-[10px] text-[#00C9A7] uppercase tracking-wider font-black">Live</span>
                </div>
              </div>
            </div>
            
            {violations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-4">✅</p>
                <p className="text-sm font-black text-[#1A1035]/40 uppercase tracking-wider">No violations recorded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {violations.map((v, i) => {
                  const ageMins = (Date.now() - new Date(v.occurred_at).getTime()) / 60000;
                  const isVeryRecent = ageMins < 5;
                  const isRecent = ageMins < 30;
                  
                  let badgeColor = "bg-[#F8F7FF] text-[#1A1035]/40 border-[#1A1035]/10";
                  let badgeText = v.violation_type;
                  
                  if (v.violation_type === 'tab_switch') {
                    badgeColor = "bg-[#FEF3C7] text-[#FFB347] border-[#FFB347]";
                    badgeText = "Tab Switch";
                  } else if (v.violation_type === 'right_click') {
                    badgeColor = "bg-[#FFEDD5] text-[#F97316] border-[#F97316]";
                    badgeText = "Right Click";
                  } else if (v.violation_type === 'camera_denied') {
                    badgeColor = "bg-[#FCE7F3] text-[#FF4D6D] border-[#FF4D6D]";
                    badgeText = "Camera Denied";
                  } else if (v.violation_type === 'copy_paste') {
                    badgeColor = "bg-[#FCE7F3] text-[#FF4D6D] border-[#FF4D6D]";
                    badgeText = "Copy Attempt";
                  }

                  let timeAgo = "Just now";
                  if (ageMins >= 1) timeAgo = `${Math.floor(ageMins)} minutes ago`;
                  if (ageMins >= 60) timeAgo = `${Math.floor(ageMins / 60)} hours ago`;
                  
                  return (
                    <div key={i} className="p-4 rounded-xl bg-white border-2 border-[#1A1035] shadow-[3px_3px_0px_#1A1035] flex items-start gap-4 hover:shadow-[5px_5px_0px_#1A1035] hover:-translate-y-0.5 transition-all">
                      <div className={`mt-1.5 w-3 h-3 rounded-full border-2 border-[#1A1035] ${isVeryRecent ? 'bg-[#FF4D6D] animate-pulse' : isRecent ? 'bg-[#FFB347]' : 'bg-[#1A1035]/20'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p className="text-sm text-[#1A1035] font-black truncate">{v.student_name || 'Unknown Student'}</p>
                          <span className={`text-[9px] uppercase font-black px-2 py-1 rounded border-2 whitespace-nowrap ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#6C47FF] mt-1">{v.exam_type}</p>
                        <p className="text-[10px] font-bold text-[#1A1035]/40 uppercase tracking-wider mt-2">{timeAgo}</p>
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
