'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PRSGauge from '@/components/dashboard/PRSGauge';
import WeakAreasPanel from '@/components/dashboard/WeakAreasPanel';
import RecommendationsPanel from '@/components/dashboard/RecommendationsPanel';
import SmartCoachChat from '@/components/dashboard/SmartCoachChat';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import ProgressLineChart from '@/components/charts/ProgressLineChart';
import ShareCardModal from '@/components/modals/ShareCardModal';
import UpgradeModal from '@/components/modals/UpgradeModal';
import { STUDENT_SCORES, PRS_HISTORY, getBatchAverageScores, getAllStudentsWithScores } from '@/lib/mock-data';
import { analyzeStudent } from '@/lib/ai-engine';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const { user } = useAuth();
  const allStudents = getAllStudentsWithScores();
  const batchAvg = getBatchAverageScores();

  const [scores, setScores] = useState(STUDENT_SCORES[0]);

  useEffect(() => {
    if (!user) return;
    if (user.isDemo) {
      setScores(STUDENT_SCORES[0]); // Arjun Sharma mock data
    } else {
      supabase.from('student_scores').select('*').eq('student_id', user.id).single()
        .then(({ data }) => {
          if (data) setScores(data);
        });
    }
  }, [user]);

  const prs = analyzeStudent(scores);
  const allPRS = allStudents.map(s => s.prs?.score || 0).sort((a, b) => b - a);
  const rank = allPRS.indexOf(prs.score) + 1 || 1;

  const displayName = user?.name || 'Student';
  const firstName = displayName.split(' ')[0];

  const [shareOpen, setShareOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');

  const showUpgrade = (feature: string) => {
    setUpgradeFeature(feature);
    setUpgradeOpen(true);
  };

  const pointsToProduct = Math.max(0, 80 - prs.score);

  return (
    <DashboardLayout role="student" userName={displayName}>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome + Psychology Microcopy */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {firstName} 👋</h1>
            <p className="text-sm text-gray-400 mt-1">
              {prs.score >= 80
                ? `You're in the top ${Math.round((rank / allStudents.length) * 100)}% of your batch! 🏆`
                : `You're ${pointsToProduct.toFixed(0)} points away from Product Tier — keep pushing! 🚀`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShareOpen(true)} className="btn-secondary py-2 px-4 text-sm">📤 Share Card</button>
            <button onClick={() => showUpgrade('AI Resume Analyzer')} className="btn-purple py-2 px-4 text-sm">
              📄 Resume Analyzer <span className="pro-badge ml-1 text-[8px]">PRO</span>
            </button>
          </div>
        </div>

        {/* Top Row — 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">PRS Score</p>
              <p className="text-sm text-gray-400 mt-2">Placement Readiness</p>
            </div>
            <PRSGauge score={prs.score} size={120} />
          </div>

          <div className="stat-card">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Placement Probability</p>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-extrabold ${prs.probability === 'High' ? 'text-emerald-400' : prs.probability === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                {prs.probabilityRange}
              </span>
            </div>
            <span className={`badge mt-3 ${prs.probability === 'High' ? 'badge-success' : prs.probability === 'Medium' ? 'badge-warning' : 'badge-error'}`}>
              {prs.probability} Probability
            </span>
            <button onClick={() => showUpgrade('Placement Probability')} className="block mt-2 text-[10px] text-brand-purple hover:underline">
              🔮 Detailed analysis → PRO
            </button>
          </div>

          <div className="stat-card">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Batch Rank</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">{rank}</span>
              <span className="text-gray-500 text-lg">/ {allStudents.length}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">students in your batch</p>
            <p className="text-xs text-brand-cyan mt-1 font-semibold">Top {Math.round((rank / allStudents.length) * 100)}% 🎯</p>
          </div>
        </div>

        {/* Middle Row — Radar + Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkillRadarChart
            studentScores={{ aptitude: scores.aptitude, coding: scores.coding, core_subjects: scores.core_subjects, soft_skills: scores.soft_skills, attendance: scores.attendance }}
            batchAverage={batchAvg}
          />
          <ProgressLineChart data={PRS_HISTORY} />
        </div>

        {/* Bottom Row — Weak Areas + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeakAreasPanel areas={prs.weakAreas} />
          <RecommendationsPanel recommendations={prs.recommendations} companyTiers={prs.companyTiers} areas={prs.weakAreas} />
        </div>

        {/* Motivational Footer */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm text-white font-medium">Increase your PRS by +15 in 2 weeks</p>
              <p className="text-xs text-gray-500">Follow your personalized study plan from SmartCoach AI</p>
            </div>
          </div>
          <button onClick={() => {}} className="btn-secondary py-2 px-4 text-xs">Open SmartCoach →</button>
        </div>
      </div>

      {/* SmartCoach FAB */}
      <SmartCoachChat scores={scores} />

      {/* Modals */}
      <ShareCardModal name={displayName} prs={prs} open={shareOpen} onClose={() => setShareOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature={upgradeFeature} />
    </DashboardLayout>
  );
}
