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
import { getImprovementSessions, getNotifications, saveNotifications } from '@/lib/client-data';
import type { ImprovementSession, Notification } from '@/types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allStudents = getAllStudentsWithScores();
  const batchAvg = getBatchAverageScores();

  const [scores, setScores] = useState(STUDENT_SCORES[0]);
  const [profile, setProfile] = useState({
    linkedin: typeof window !== 'undefined' ? localStorage.getItem('linkedin') || '' : '',
    github: typeof window !== 'undefined' ? localStorage.getItem('github') || '' : '',
    projects: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('projects') || '["", "", ""]') : ['', '', '']
  });

  useEffect(() => {
    if (!user) return;
    if (user.isDemo) {
      const softSkillsOverride = Number(localStorage.getItem('latestMockInterviewScore') || '0');
      if (softSkillsOverride > 0) {
        setScores({ ...STUDENT_SCORES[0], soft_skills: softSkillsOverride });
      } else {
        setScores(STUDENT_SCORES[0]); // Arjun Sharma mock data
      }
    } else {
      supabase.from('student_scores').select('*').eq('student_id', user.id).single()
        .then(({ data }) => {
          if (data) setScores(data);
        });
    }
  }, [user]);

  const [impSessions, setImpSessions] = useState<ImprovementSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [expandedMaterials, setExpandedMaterials] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const allSessions = getImprovementSessions();
    // Match by id 'demo-student' for demo users, or by actual user.id
    const studentId = user.isDemo ? 'demo-student' : user.id;
    setImpSessions(allSessions.filter(s => s.student_id === studentId));
    setNotifications(getNotifications().filter(n => n.user_id === studentId));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('linkedin', profile.linkedin);
    localStorage.setItem('github', profile.github);
    localStorage.setItem('projects', JSON.stringify(profile.projects));
  }, [profile]);

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
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedRank, setAnimatedRank] = useState(0);

  useEffect(() => {
    const duration = 1100;
    const start = performance.now();

    const step = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(prs.score * eased));
      setAnimatedRank(Math.max(1, Math.round(rank * eased)));
      if (progress < 1) requestAnimationFrame(step);
    };

    const frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [prs.score, rank]);

  if (!mounted) {
    return (
      <DashboardLayout role="student" userName={displayName}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" userName={displayName}>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome + Psychology Microcopy */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Welcome back, {firstName} 👋</h1>
            <p className="text-slate-500 text-sm mt-1">
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
          <div className="stat-card reveal-up md:col-span-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="relative">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">PRS Score</p>
              <p className="text-8xl font-black tracking-tight text-white leading-none">{animatedScore}</p>
              <p className="text-slate-500 text-sm mt-3">Placement Readiness Score</p>
              <span className="badge score-status-badge mt-4 badge-cyan">{prs.probability} Momentum</span>
            </div>
            <PRSGauge score={prs.score} size={170} />
          </div>

          <div className="stat-card reveal-up">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Placement Probability</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
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

          <div className="stat-card reveal-up">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Batch Rank</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">{animatedRank}</span>
              <span className="text-slate-500 text-lg">/ {allStudents.length}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">students in your batch</p>
            <p className="text-xs text-brand-cyan mt-1 font-semibold">Top {Math.round((rank / allStudents.length) * 100)}% 🎯</p>
          </div>
        </div>

        {/* Middle Row — Radar + Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkillRadarChart
            studentScores={{ aptitude: scores.aptitude, coding: scores.coding, core_subjects: scores.core_subjects, soft_skills: scores.soft_skills, attendance: scores.attendance }}
            batchAverage={batchAvg}
          />
          <ProgressLineChart data={(() => {
            const chartData: { date: string; prs: number; sessionInfo?: string }[] = PRS_HISTORY.map(d => ({ ...d }));
            const completedSession = impSessions.find(s => s.status === 'completed');
            if (completedSession && chartData.length > 2) {
              chartData[chartData.length - 2].sessionInfo = `${completedSession.weak_area} session with ${completedSession.faculty_name}`;
            }
            return chartData;
          })()} />
        </div>

        {/* Bottom Row — Weak Areas + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeakAreasPanel areas={prs.weakAreas} />
          <RecommendationsPanel recommendations={prs.recommendations} companyTiers={prs.companyTiers} areas={prs.weakAreas} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">Profile Portfolio Card</h3>
            <div>
              <label className="text-xs text-gray-500">LinkedIn URL</label>
              <input
                value={profile.linkedin}
                onChange={e => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                className="input-dark mt-1 text-sm py-2"
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">GitHub Username</label>
              <input
                value={profile.github}
                onChange={e => setProfile(prev => ({ ...prev, github: e.target.value.replace('@', '') }))}
                className="input-dark mt-1 text-sm py-2"
                placeholder="octocat"
              />
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 mt-1 inline-block hover:underline"
                >
                  github.com/{profile.github}
                </a>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Top 3 Projects</label>
              {[0, 1, 2].map(index => (
                <input
                  key={index}
                  value={profile.projects[index] || ''}
                  onChange={e => {
                    const next = [...profile.projects];
                    next[index] = e.target.value;
                    setProfile(prev => ({ ...prev, projects: next }));
                  }}
                  className="input-dark text-sm py-2"
                  placeholder={`Project ${index + 1} name`}
                />
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">My Improvement Sessions</h3>
              <button
                onClick={() => {
                  setShowNotifPanel(p => !p);
                  // mark all read
                  const updated = notifications.map(n => ({ ...n, read: true }));
                  setNotifications(updated);
                  saveNotifications(updated);
                }}
                className="relative p-2 rounded-lg hover:bg-white/5 transition"
              >
                <span className="text-lg">🔔</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>

            {/* Notification Panel */}
            {showNotifPanel && (
              <div className="mb-4 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-3">No notifications</p>
                ) : notifications.map((n, i) => (
                  <div key={i} className={`p-3 rounded-xl border text-sm flex gap-3 items-start ${
                    n.read ? 'border-white/5 bg-white/2' : 'border-blue-500/30 bg-blue-500/5'
                  }`}>
                    <span className="text-base">📅</span>
                    <div className="flex-1">
                      {n.title && <p className="text-white font-semibold text-xs mb-0.5">{n.title}</p>}
                      <p className="text-gray-400 text-xs">{n.message}</p>
                      {n.meet_link && (
                        <a href={n.meet_link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline mt-1 inline-block">Join Meeting →</a>
                      )}
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {impSessions.length === 0 ? (
              <p className="text-sm text-gray-500">No sessions scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {impSessions
                  .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
                  .map(s => {
                    const sessionDate = new Date(s.session_date);
                    const diffMs = sessionDate.getTime() - Date.now();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    let countdown = '';
                    if (s.status === 'scheduled') {
                      if (diffMs < 0) countdown = 'Session time passed';
                      else if (diffDays >= 1) countdown = `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
                      else if (diffHours >= 1) countdown = `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                      else countdown = 'Starting soon!';
                    }
                    const hasMaterials = !!(s as ImprovementSession & { materials?: string }).materials;
                    const materialsExpanded = expandedMaterials.includes(s.id);

                    return (
                      <div key={s.id} className={`rounded-xl border bg-brand-surface/40 flex flex-col gap-0 overflow-hidden
                        ${ s.status === 'completed' ? 'border-l-4 border-emerald-500/60' : 
                           s.status === 'cancelled' ? 'border-l-4 border-red-500/60' : 
                           'border-l-4 border-blue-500/60'}`}>
                        <div className="p-4 flex flex-col gap-3">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-white">📅 {s.weak_area} Improvement Session</p>
                              <p className="text-xs text-gray-400 mt-0.5">with {s.faculty_name}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0
                              ${ s.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                 s.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                 'bg-blue-500/20 text-blue-400'}`}>
                              {s.status}
                            </span>
                          </div>

                          {/* Date + Countdown */}
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">📆 Date</p>
                              <p className="text-xs text-gray-300">{sessionDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                            {countdown && (
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">⏰ Time Left</p>
                                <p className={`text-xs font-bold ${ diffMs < 3600000 && diffMs > 0 ? 'text-yellow-400' : 'text-cyan-400'}`}>{countdown}</p>
                              </div>
                            )}
                          </div>

                          {/* Score Goal */}
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">🎯 Focus Area</p>
                            <p className="text-sm text-white">{s.weak_area} <span className="text-gray-500">({s.current_score} → <span className="text-purple-400 font-bold">{s.target_score}</span>)</span></p>
                          </div>

                          {/* Agenda (scheduled only) */}
                          {s.status === 'scheduled' && s.agenda && (
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">📋 Agenda</p>
                              <p className="text-xs text-gray-300">{s.agenda}</p>
                            </div>
                          )}

                          {/* Join button */}
                          {s.status === 'scheduled' && s.meet_link && (
                            <a href={s.meet_link} target="_blank" rel="noreferrer"
                              className="text-center text-xs font-bold py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 transition">
                              🔗 Join Meeting
                            </a>
                          )}

                          {/* Outcome */}
                          {s.status === 'completed' && (
                            <div className="pt-3 border-t border-white/10 space-y-2">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">── Outcome ──</p>
                              {s.outcome_notes ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">✅ {s.outcome_rating}</span>
                                    {s.score_after_session && s.score_after_session > s.current_score && (
                                      <span className="text-xs font-bold text-emerald-400">📈 {s.current_score} → {s.score_after_session} (+{s.score_after_session - s.current_score} pts) 🎉</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-300 italic">&quot;{s.outcome_notes}&quot;</p>
                                </>
                              ) : (
                                <p className="text-xs text-gray-500">⏳ Awaiting faculty outcome...</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Collapsible Study Materials */}
                        {hasMaterials && (
                          <div className="border-t border-white/10">
                            <button
                              onClick={() => setExpandedMaterials(prev =>
                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                              )}
                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition text-left"
                            >
                              <span className="text-xs font-semibold text-yellow-400">📚 Study Materials</span>
                              <span className="text-gray-500 text-xs">{materialsExpanded ? '▲' : '▼'}</span>
                            </button>
                            {materialsExpanded && (
                              <div className="px-4 pb-4">
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                                  {(s as ImprovementSession & { materials?: string }).materials}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Motivational Footer */}
        <div className="glass-card reveal-up p-4 flex items-center justify-between">
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
