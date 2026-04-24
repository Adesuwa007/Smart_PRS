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
          <h1 className="text-2xl font-bold text-white">My Progress 📈</h1>
          <p className="text-sm text-gray-400 mt-1">Track your placement readiness journey over time</p>
        </div>

        {/* Real user with no data nudge */}
        {!user?.isDemo && !hasRealData && (
          <div className="glass-card p-6 border border-brand-cyan/20 bg-brand-cyan/5 text-center space-y-3">
            <p className="text-white font-semibold">No assessment data yet</p>
            <p className="text-sm text-gray-400">Complete your first assessment to see real progress tracking.</p>
            <Link href="/dashboard/student/assessments" className="btn-primary py-2.5 px-6 inline-block">
              Take Assessment →
            </Link>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Current PRS', value: prs.score.toFixed(1), sub: '/ 100', color: 'text-emerald-400' },
            { label: 'PRS Growth', value: `+${prsChange}`, sub: 'since Nov 2025', color: 'text-brand-cyan' },
            { label: 'Trend', value: trend === 'improving' ? '↑ Improving' : '↓ Declining', sub: '6-month view', color: trend === 'improving' ? 'text-emerald-400' : 'text-red-400' },
            { label: 'PRS Goal', value: `${targetPRS}`, sub: `${pointsToGoal} pts to go`, color: 'text-brand-purple' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{s.label}</p>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* PRS Over Time */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">PRS Score Over Time</h3>
            <span className="badge badge-success text-xs">+{prsChange} points in 6 months 🚀</span>
          </div>
          <ProgressLineChart data={PRS_HISTORY} />
        </div>

        {/* Monthly Breakdown Table */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">Monthly Score Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th><th>Aptitude</th><th>Coding</th><th>Core</th><th>Soft Skills</th><th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_SCORES.map((row, i) => (
                  <tr key={i}>
                    <td className="text-white font-medium">{row.month}</td>
                    {[row.aptitude, row.coding, row.core, row.soft, row.attendance].map((val, vi) => (
                      <td key={vi}>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-brand-border rounded-full">
                            <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${val}%` }} />
                          </div>
                          <span className="text-gray-300 text-sm">{val}</span>
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
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-1">Goal Tracker</h3>
            <p className="text-xs text-gray-500 mb-4">Set your target PRS and track how close you are.</p>

            {/* Target PRS slider */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Target PRS</span>
                <span className="text-brand-cyan font-bold">{targetPRS}</span>
              </div>
              <input
                type="range" min="50" max="100" value={targetPRS}
                onChange={e => handleTargetChange(+e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                {Number(pointsToGoal) > 0
                  ? `You need +${pointsToGoal} points to reach your goal`
                  : '🎉 Goal achieved! Set a higher target.'}
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: `Coding → 95`, current: scores.coding, target: 95, color: '#06B6D4' },
                { label: `Aptitude → 90`, current: scores.aptitude, target: 90, color: '#8B5CF6' },
                { label: `Core → 85`, current: scores.core_subjects, target: 85, color: '#10B981' },
                { label: `Soft Skills → 80`, current: scores.soft_skills, target: 80, color: '#F59E0B' },
                { label: `PRS → ${targetPRS}`, current: prs.score, target: targetPRS, color: '#06B6D4' },
              ].map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{g.label}</span>
                    <span>{g.current.toFixed(0)} / {g.target}</span>
                  </div>
                  <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (g.current / g.target) * 100)}%`, backgroundColor: g.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl">
              <p className="text-xs text-brand-cyan font-semibold">💡 SmartCoach Tip</p>
              <p className="text-xs text-gray-400 mt-1">
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
