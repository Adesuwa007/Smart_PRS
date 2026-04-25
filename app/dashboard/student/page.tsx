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
    linkedin: '',
    github: '',
    projects: ['', '', '']
  });

  useEffect(() => {
    setProfile({
      linkedin: localStorage.getItem('linkedin') || '',
      github: localStorage.getItem('github') || '',
      projects: JSON.parse(localStorage.getItem('projects') || '["", "", ""]')
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.isDemo) {
      const softSkillsOverride = Number(localStorage.getItem('latestMockInterviewScore') || '0');
      if (softSkillsOverride > 0) {
        setScores({ ...STUDENT_SCORES[0], soft_skills: softSkillsOverride });
      } else {
        setScores(STUDENT_SCORES[0]); // Student mock data
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
    
    const demoStudentIds = [
      'demo-student',
      'student@demo.com', 
      'arjun-sharma',
      '1'
    ];
    
    const currentUserId = localStorage.getItem('userId') || 'demo-student';
    const currentUserName = localStorage.getItem('userName') || 'Student';
    
    const all = getImprovementSessions();
    
    const mine = all.filter(s => 
      s.student_id === currentUserId ||
      s.student_id === currentUserName ||
      demoStudentIds.includes(s.student_id) ||
      s.student_name?.toLowerCase() === currentUserName.toLowerCase() ||
      s.student_name?.toLowerCase() === user.name.toLowerCase()
    );

    if (mine.length === 0 && user.isDemo) {
      const demoSession = {
        id: 'demo-session-1',
        faculty_id: 'fac-1',
        faculty_name: 'Prof. Ramesh Kumar',
        student_id: 'demo-student',
        student_name: user.name || 'Student',
        weak_area: 'Soft Skills',
        current_score: 71,
        target_score: 85,
        session_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        meet_link: 'https://meet.google.com/abc-defg-hij',
        agenda: 'HR round prep, communication techniques, mock behavioral questions',
        status: 'scheduled' as const,
        created_at: new Date().toISOString()
      };
      const existing = getImprovementSessions();
      existing.push(demoSession);
      localStorage.setItem('improvement_sessions', JSON.stringify(existing));
      mine.push(demoSession);
    }
    
    setImpSessions(mine);
    
    const notifs = getNotifications();
    setNotifications(notifs.filter(n => 
      n.user_id === currentUserId || 
      demoStudentIds.includes(n.user_id)
    ));
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
          <div className="w-12 h-12 border-4 border-[#1A1035] border-t-[#00C9A7] rounded-full animate-spin shadow-[4px_4px_0px_#1A1035]"></div>
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
            <h1 className="text-3xl font-black tracking-tight text-[#1A1035]">Welcome back, {firstName} 👋</h1>
            <p className="text-[#1A1035]/60 font-bold text-sm mt-1">
              {prs.score >= 80
                ? `You're in the top ${Math.round((rank / allStudents.length) * 100)}% of your batch! 🏆`
                : `You're ${pointsToProduct.toFixed(0)} points away from Product Tier — keep pushing! 🚀`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShareOpen(true)} className="btn-secondary py-2 px-4 text-sm font-black border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] hover:shadow-[4px_4px_0px_#1A1035]">📤 Share Card</button>
            <button onClick={() => showUpgrade('AI Resume Analyzer')} className="btn-purple py-2 px-4 text-sm font-black border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] hover:shadow-[4px_4px_0px_#1A1035]">
              📄 Resume Analyzer <span className="bg-white text-[#1A1035] border-2 border-[#1A1035] px-1.5 py-0.5 rounded-full ml-1 text-[8px] font-black">PRO</span>
            </button>
          </div>
        </div>

        {/* Top Row — 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bold-card gradient-section-hero p-8 md:col-span-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="relative">
              <p className="text-xs text-[#1A1035]/60 font-bold uppercase tracking-wider mb-3">PRS Score</p>
              <p className="text-8xl font-black tracking-tight text-[#1A1035] leading-none">{animatedScore}</p>
              <p className="text-[#1A1035]/60 font-bold text-sm mt-3">Placement Readiness Score</p>
              <span className="inline-flex items-center gap-1 bg-[#EDE9FE] border-2 border-[#6C47FF] rounded-full px-3 py-1 text-[10px] font-bold text-[#6C47FF] mt-4 uppercase">
                {prs.probability} Momentum
              </span>
            </div>
            <PRSGauge score={prs.score} size={170} />
          </div>

          <div className="bold-card bg-white p-6">
            <p className="text-xs text-[#1A1035]/40 font-bold uppercase tracking-wider mb-2">Placement Probability</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-[#6C47FF]">
                {prs.probabilityRange}
              </span>
            </div>
            <span className={`inline-block mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-[#1A1035] ${prs.probability === 'High' ? 'bg-[#D1FAE5] text-[#00C9A7]' : prs.probability === 'Medium' ? 'bg-[#FEF3C7] text-[#FFB347]' : 'bg-[#FCE7F3] text-[#FF4D6D]'}`}>
              {prs.probability} Probability
            </span>
            <button onClick={() => showUpgrade('Placement Probability')} className="block mt-4 text-[10px] font-bold text-[#6C47FF] hover:underline">
              🔮 Detailed analysis → PRO
            </button>
          </div>

          <div className="bold-card bg-white p-6">
            <p className="text-xs text-[#1A1035]/40 font-bold uppercase tracking-wider mb-2">Batch Rank</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#00C9A7]">{animatedRank}</span>
              <span className="text-[#1A1035]/40 font-bold text-lg">/ {allStudents.length}</span>
            </div>
            <p className="text-xs text-[#1A1035]/60 font-bold mt-2">students in your batch</p>
            <p className="text-xs text-[#6C47FF] mt-2 font-black uppercase tracking-wider">Top {Math.round((rank / allStudents.length) * 100)}% 🎯</p>
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
          <div className="bold-card bg-white p-6 space-y-4">
            <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight mb-4">Profile Portfolio Card</h3>
            <div>
              <label className="text-xs font-bold text-[#1A1035]/60 uppercase tracking-wider">LinkedIn URL</label>
              <input
                value={profile.linkedin}
                onChange={e => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                className="w-full mt-2 bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors"
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1A1035]/60 uppercase tracking-wider">GitHub Username</label>
              <input
                value={profile.github}
                onChange={e => setProfile(prev => ({ ...prev, github: e.target.value.replace('@', '') }))}
                className="w-full mt-2 bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors"
                placeholder="octocat"
              />
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#6C47FF] mt-2 inline-block hover:underline"
                >
                  github.com/{profile.github}
                </a>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#1A1035]/60 uppercase tracking-wider">Top 3 Projects</label>
              {[0, 1, 2].map(index => (
                <input
                  key={index}
                  value={profile.projects[index] || ''}
                  onChange={e => {
                    const next = [...profile.projects];
                    next[index] = e.target.value;
                    setProfile(prev => ({ ...prev, projects: next }));
                  }}
                  className="w-full bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors"
                  placeholder={`Project ${index + 1} name`}
                />
              ))}
            </div>
          </div>

          <div className="bold-card bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight">My Improvement Sessions</h3>
              <button
                onClick={() => {
                  setShowNotifPanel(p => !p);
                  // mark all read
                  const updated = notifications.map(n => ({ ...n, read: true }));
                  setNotifications(updated);
                  saveNotifications(updated);
                }}
                className="relative p-2 rounded-xl border-2 border-[#1A1035]/10 hover:bg-[#EDE9FE] transition-colors"
              >
                <span className="text-xl">🔔</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF4D6D] border-2 border-white text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>

            {/* Notification Panel */}
            {showNotifPanel && (
              <div className="mb-6 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs font-bold text-[#1A1035]/40 text-center py-4">No notifications</p>
                ) : notifications.map((n, i) => (
                  <div key={i} className={`p-4 rounded-xl border-2 text-sm flex gap-3 items-start ${
                    n.read ? 'border-[#1A1035]/10 bg-[#F8F7FF]' : 'border-[#6C47FF]/50 bg-[#EDE9FE]'
                  }`}>
                    <span className="text-lg">📅</span>
                    <div className="flex-1">
                      {n.title && <p className="text-[#1A1035] font-black text-sm mb-1">{n.title}</p>}
                      <p className="text-[#1A1035]/70 font-medium text-xs">{n.message}</p>
                      {n.meet_link && (
                        <a href={n.meet_link} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#6C47FF] hover:underline mt-2 inline-block">Join Meeting →</a>
                      )}
                    </div>
                    {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-[#6C47FF] mt-1 shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {impSessions.length === 0 ? (
              <p className="text-sm font-bold text-[#1A1035]/40">No sessions scheduled yet.</p>
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
                      <div key={s.id} className={`rounded-xl border-2 flex flex-col gap-0 overflow-hidden
                        ${ s.status === 'completed' ? 'border-[#00C9A7] bg-[#D1FAE5]/30' : 
                           s.status === 'cancelled' ? 'border-[#FF4D6D] bg-[#FCE7F3]/30' : 
                           'border-[#1A1035] bg-white hover:shadow-[4px_4px_0px_#1A1035] transition-all'}`}>
                        <div className="p-5 flex flex-col gap-4">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-black text-[#1A1035]">📅 {s.weak_area} Improvement Session</p>
                              <p className="text-xs font-bold text-[#1A1035]/50 mt-1">with {s.faculty_name}</p>
                            </div>
                            <span className={`text-[10px] px-3 py-1 rounded-full uppercase font-black border-2
                              ${ s.status === 'completed' ? 'border-[#00C9A7] bg-[#D1FAE5] text-[#00C9A7]' :
                                 s.status === 'cancelled' ? 'border-[#FF4D6D] bg-[#FCE7F3] text-[#FF4D6D]' :
                                 'border-[#1A1035] bg-[#EDE9FE] text-[#6C47FF]'}`}>
                              {s.status}
                            </span>
                          </div>

                          {/* Date + Countdown */}
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-[10px] font-bold text-[#1A1035]/40 uppercase tracking-wider mb-1">📆 Date</p>
                              <p className="text-xs font-bold text-[#1A1035]">{sessionDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                            {countdown && (
                              <div>
                                <p className="text-[10px] font-bold text-[#1A1035]/40 uppercase tracking-wider mb-1">⏰ Time Left</p>
                                <p className={`text-xs font-black ${ diffMs < 3600000 && diffMs > 0 ? 'text-[#FFB347]' : 'text-[#6C47FF]'}`}>{countdown}</p>
                              </div>
                            )}
                          </div>

                          {/* Score Goal */}
                          <div>
                            <p className="text-[10px] font-bold text-[#1A1035]/40 uppercase tracking-wider mb-1">🎯 Focus Area</p>
                            <p className="text-sm font-bold text-[#1A1035]">{s.weak_area} <span className="text-[#1A1035]/40 font-medium">({s.current_score} → <span className="text-[#00C9A7] font-black">{s.target_score}</span>)</span></p>
                          </div>

                          {/* Agenda (scheduled only) */}
                          {s.status === 'scheduled' && s.agenda && (
                            <div>
                              <p className="text-[10px] font-bold text-[#1A1035]/40 uppercase tracking-wider mb-1">📋 Agenda</p>
                              <p className="text-xs font-medium text-[#1A1035]/70">{s.agenda}</p>
                            </div>
                          )}

                          {/* Join button */}
                          {s.status === 'scheduled' && s.meet_link && (
                            <a href={s.meet_link} target="_blank" rel="noreferrer"
                              className="text-center text-xs font-black py-3 px-4 rounded-xl border-2 border-[#1A1035] bg-white text-[#1A1035] shadow-[2px_2px_0px_#1A1035] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-0.5 transition-all mt-2">
                              🔗 Join Meeting
                            </a>
                          )}

                          {/* Outcome */}
                          {s.status === 'completed' && (
                            <div className="pt-4 border-t-2 border-[#00C9A7]/20 space-y-3 mt-2">
                              <p className="text-[10px] font-bold text-[#1A1035]/40 uppercase tracking-wider">Outcome</p>
                              {s.outcome_notes ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-[#00C9A7] border-2 border-[#00C9A7] bg-white px-2 py-1 rounded-full">✅ {s.outcome_rating}</span>
                                    {s.score_after_session && s.score_after_session > s.current_score && (
                                      <span className="text-xs font-black text-[#00C9A7]">📈 {s.current_score} → {s.score_after_session} (+{s.score_after_session - s.current_score} pts) 🎉</span>
                                    )}
                                  </div>
                                  <p className="text-xs font-medium text-[#1A1035]/70 italic border-l-2 border-[#00C9A7] pl-3 py-1">&quot;{s.outcome_notes}&quot;</p>
                                </>
                              ) : (
                                <p className="text-xs font-bold text-[#1A1035]/40">⏳ Awaiting faculty outcome...</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Collapsible Study Materials */}
                        {hasMaterials && (
                          <div className={`border-t-2 ${s.status === 'completed' ? 'border-[#00C9A7]/20' : 'border-[#1A1035]/10'}`}>
                            <button
                              onClick={() => setExpandedMaterials(prev =>
                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                              )}
                              className="w-full flex items-center justify-between px-5 py-3 hover:bg-black/5 transition-colors text-left"
                            >
                              <span className="text-xs font-black text-[#1A1035] uppercase tracking-wider">📚 Study Materials</span>
                              <span className="text-[#1A1035]/40 text-xs font-bold">{materialsExpanded ? '▲' : '▼'}</span>
                            </button>
                            {materialsExpanded && (
                              <div className="px-5 pb-5 pt-2">
                                <pre className="text-xs text-[#1A1035]/70 whitespace-pre-wrap font-sans font-medium leading-relaxed bg-white border-2 border-[#1A1035]/10 rounded-xl p-4">
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
        <div className="bold-card bg-[#EDE9FE] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] flex items-center justify-center text-2xl">💡</div>
            <div>
              <p className="text-sm text-[#1A1035] font-black uppercase tracking-tight">Increase your PRS by +15 in 2 weeks</p>
              <p className="text-xs font-bold text-[#1A1035]/60 mt-1">Follow your personalized study plan from SmartCoach AI</p>
            </div>
          </div>
          <button onClick={() => {}} className="bg-white border-2 border-[#1A1035] text-[#1A1035] font-black text-xs py-2.5 px-6 rounded-xl shadow-[3px_3px_0px_#1A1035] hover:shadow-[5px_5px_0px_#1A1035] hover:-translate-y-0.5 transition-all">
            Open SmartCoach →
          </button>
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
