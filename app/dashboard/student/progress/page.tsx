'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProgressLineChart from '@/components/charts/ProgressLineChart';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import { PRS_HISTORY, STUDENT_SCORES, getBatchAverageScores } from '@/lib/mock-data';
import { analyzeStudent } from '@/lib/ai-engine';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const MONTHLY_SCORES = [
  { month: 'Nov', aptitude: 68, coding: 72, core: 70, soft: 65, attendance: 85 },
  { month: 'Dec', aptitude: 72, coding: 75, core: 72, soft: 67, attendance: 86 },
  { month: 'Jan', aptitude: 75, coding: 79, core: 74, soft: 68, attendance: 88 },
  { month: 'Feb', aptitude: 78, coding: 82, core: 76, soft: 70, attendance: 89 },
  { month: 'Mar', aptitude: 80, coding: 85, core: 78, soft: 71, attendance: 90 },
  { month: 'Apr', aptitude: 82, coding: 88, core: 79, soft: 71, attendance: 91 },
];

export default function StudentProgressPage() {
  const { user } = useAuth();
  const batchAvg = getBatchAverageScores();

  const [scores, setScores] = useState(STUDENT_SCORES[0]);
  const [targetPRS, setTargetPRS] = useState(85);
  const [hasRealData, setHasRealData] = useState(false);

  // Restore saved target from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('targetPRS');
    if (saved) setTargetPRS(Number(saved));
  }, []);

  // Fetch real scores for real users
  useEffect(() => {
    if (!user) return;
    if (!user.isDemo) {
      supabase.from('student_scores').select('*').eq('student_id', user.id).single()
        .then(({ data }) => {
          if (data) { setScores(data); setHasRealData(true); }
        });
    }
  }, [user]);

  const prs = analyzeStudent(scores);
  const prsChange = PRS_HISTORY[PRS_HISTORY.length - 1].prs - PRS_HISTORY[0].prs;
  const trend = prsChange > 0 ? 'improving' : 'declining';
  const pointsToGoal = Math.max(0, targetPRS - prs.score).toFixed(1);

  const handleTargetChange = (val: number) => {
    setTargetPRS(val);
    localStorage.setItem('targetPRS', String(val));
  };

  return (
    <DashboardLayout role="student" userName={user?.name || 'Student'}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">My Progress 📈</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Track your placement readiness journey over time</p>
        </div>

        {/* Real user with no data nudge */}
        {!user?.isDemo && !hasRealData && (
          <div className="bg-[#00C9A7] border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] text-center space-y-4">
            <p className="text-xl font-black text-[#1A1035] uppercase tracking-tight">No assessment data yet</p>
            <p className="text-sm font-bold text-[#1A1035]/70">Complete your first assessment to see real progress tracking.</p>
            <Link href="/dashboard/student/assessments" className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-3 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all inline-block mt-2">
              Take Assessment →
            </Link>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Current PRS', value: prs.score.toFixed(1), sub: '/ 100', color: 'text-[#1A1035]', bg: 'bg-[#00C9A7]' },
            { label: 'PRS Growth', value: `+${prsChange}`, sub: 'since Nov 2025', color: 'text-[#1A1035]', bg: 'bg-[#F8F7FF]' },
            { label: 'Trend', value: trend === 'improving' ? '↑ Improving' : '↓ Declining', sub: '6-month view', color: trend === 'improving' ? 'text-[#00C9A7]' : 'text-[#FF4D6D]', bg: 'bg-white' },
            { label: 'PRS Goal', value: `${targetPRS}`, sub: `${pointsToGoal} pts to go`, color: 'text-[#6C47FF]', bg: 'bg-[#F8F7FF]' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#1A1035] transition-all`}>
              <p className="text-[10px] font-black text-[#1A1035]/60 uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</p>
              <p className="text-xs font-bold text-[#1A1035]/50">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* PRS Over Time */}
        <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider">PRS Score Over Time</h3>
            <span className="bg-[#00C9A7] text-[#1A1035] px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-[#1A1035] rounded shadow-[2px_2px_0px_#1A1035]">+{prsChange} points in 6 months 🚀</span>
          </div>
          <ProgressLineChart data={PRS_HISTORY} />
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] overflow-hidden">
          <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4">Monthly Score Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b-4 border-[#1A1035]">
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF] border-r-4 border-[#1A1035]">Month</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Aptitude</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Coding</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Core</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Soft Skills</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#1A1035]/10">
                {MONTHLY_SCORES.map((row, i) => (
                  <tr key={i} className="hover:bg-[#F8F7FF] transition-colors">
                    <td className="py-4 px-4 text-[#1A1035] font-black border-r-4 border-[#1A1035]">{row.month}</td>
                    {[row.aptitude, row.coding, row.core, row.soft, row.attendance].map((val, vi) => (
                      <td key={vi} className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[80px] h-2 bg-white border-2 border-[#1A1035] rounded-full overflow-hidden">
                            <div className="h-full bg-[#00C9A7]" style={{ width: `${val}%` }} />
                          </div>
                          <span className="text-[#1A1035] font-bold text-sm w-6">{val}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar + Goal Tracker */}
        <div className="grid md:grid-cols-2 gap-6">
          <SkillRadarChart
            studentScores={{ aptitude: scores.aptitude, coding: scores.coding, core_subjects: scores.core_subjects, soft_skills: scores.soft_skills, attendance: scores.attendance }}
            batchAverage={batchAvg}
          />
          <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035] space-y-6">
            <div className="border-b-4 border-[#1A1035]/10 pb-4">
              <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-2">Goal Tracker</h3>
              <p className="text-xs font-bold text-[#1A1035]/60">Set your target PRS and track how close you are.</p>
            </div>

            {/* Target PRS slider */}
            <div className="bg-[#F8F7FF] border-2 border-[#1A1035] p-6 rounded-xl shadow-[4px_4px_0px_#1A1035]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-[#1A1035] uppercase tracking-widest">Target PRS</span>
                <span className="text-xl font-black text-[#1A1035] bg-white border-2 border-[#1A1035] px-3 py-1 rounded shadow-[2px_2px_0px_#6C47FF]">{targetPRS}</span>
              </div>
              <input
                type="range" min="50" max="100" value={targetPRS}
                onChange={e => handleTargetChange(+e.target.value)}
                className="w-full accent-[#6C47FF] mb-4"
              />
              <p className="text-xs font-bold text-[#1A1035] bg-white border-2 border-[#1A1035] p-2 rounded text-center shadow-[2px_2px_0px_#1A1035]">
                {Number(pointsToGoal) > 0
                  ? `You need +${pointsToGoal} points to reach your goal`
                  : '🎉 Goal achieved! Set a higher target.'}
              </p>
            </div>

            <div className="space-y-4">
              {[
                { label: `Coding → 95`, current: scores.coding, target: 95, color: '#00C9A7' },
                { label: `Aptitude → 90`, current: scores.aptitude, target: 90, color: '#6C47FF' },
                { label: `Core → 85`, current: scores.core_subjects, target: 85, color: '#00C9A7' },
                { label: `Soft Skills → 80`, current: scores.soft_skills, target: 80, color: '#FFB347' },
                { label: `PRS → ${targetPRS}`, current: prs.score, target: targetPRS, color: '#1A1035' },
              ].map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-black text-[#1A1035]/60 uppercase tracking-widest mb-1.5">
                    <span>{g.label}</span>
                    <span className="text-[#1A1035]">{g.current.toFixed(0)} / {g.target}</span>
                  </div>
                  <div className="h-2.5 bg-[#F8F7FF] border-2 border-[#1A1035] rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (g.current / g.target) * 100)}%`, backgroundColor: g.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#6C47FF] border-4 border-[#1A1035] rounded-xl shadow-[4px_4px_0px_#1A1035] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full blur-xl -mr-8 -mt-8"></div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2"><span className="text-lg bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-[2px_2px_0px_#1A1035] border-2 border-[#1A1035]">💡</span> SmartCoach Tip</p>
              <p className="text-sm font-bold text-white/90 leading-relaxed pl-8">
                {prs.score >= targetPRS
                  ? 'You have reached your PRS goal! Raise the bar and keep improving.'
                  : `Focus on your weakest area to close the ${pointsToGoal}-point gap fastest.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
