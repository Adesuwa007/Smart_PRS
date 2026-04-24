'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { STUDENT_SCORES, STUDENT_PROFILES } from '@/lib/mock-data';
import { calculateBatchStats } from '@/lib/ai-engine';
import BatchBarChart from '@/components/charts/BatchBarChart';
import { getAllStudents, subscribeToStudentUpdates, type UnifiedStudent } from '@/lib/students-service';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { getImprovementSessions, createImprovementSession, updateImprovementSession, createNotification } from '@/lib/client-data';
import type { MeetingRecord, ImprovementSession } from '@/types';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const statsInput = STUDENT_SCORES.map((s, i) => ({ scores: s, department: STUDENT_PROFILES[i]?.department }));
  const stats = calculateBatchStats(statsInput);

  const [students, setStudents] = useState<UnifiedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [meetingForm, setMeetingForm] = useState({ studentId: '', date: '', time: '', agenda: '', notes: '', link: '' });
  const [impSessions, setImpSessions] = useState<ImprovementSession[]>([]);
  const [sessionForm, setSessionForm] = useState<Partial<ImprovementSession> | null>(null);
  const [outcomeForm, setOutcomeForm] = useState<{ id: string, notes: string, rating: string, newScore: string, materials: string } | null>(null);
  const [filter, setFilter] = useState<'all'|'low'|'attention'|'track'|'ready'>('all');
  const [selectedStudent, setSelectedStudent] = useState<UnifiedStudent | null>(null);

  useEffect(() => {
    getAllStudents().then(data => { setStudents(data); setLoading(false); });
    const sub = subscribeToStudentUpdates(() => getAllStudents().then(setStudents));
    return () => { sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    setMeetings(JSON.parse(localStorage.getItem('meetings') || '[]'));
    setImpSessions(getImprovementSessions());
  }, []);

  const atRisk = students.filter(s => s.prs < 50);
  const highPerformers = students.filter(s => s.prs >= 80);
  const totalStudents = students.length;
  const avgPRS = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.prs, 0) / totalStudents) : stats.avgPRS;

  const filteredStudents = students.filter(s => {
    if (filter === 'low') return s.prs < 50;
    if (filter === 'attention') return s.prs >= 50 && s.prs < 65;
    if (filter === 'track') return s.prs >= 65 && s.prs < 80;
    if (filter === 'ready') return s.prs >= 80;
    return true;
  });

  const scheduleMeeting = async () => {
    const student = students.find(s => s.id === meetingForm.studentId);
    if (!student || !meetingForm.date || !meetingForm.time || !meetingForm.agenda.trim()) return;
    const newMeeting: MeetingRecord = {
      id: `meeting-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      facultyName: user?.name || 'Faculty',
      scheduledAt: new Date(`${meetingForm.date}T${meetingForm.time}`).toISOString(),
      agenda: meetingForm.agenda,
      notes: meetingForm.notes,
      meetingLink: meetingForm.link || undefined,
      createdAt: new Date().toISOString(),
      outcome: ''
    };
    
    setMeetings(prev => {
      const updated = [...prev, newMeeting];
      localStorage.setItem('meetings', JSON.stringify(updated));
      return updated;
    });

    setMeetingForm({ studentId: '', date: '', time: '', agenda: '', notes: '', link: '' });
  };

  const submitImpSession = async () => {
    if (!sessionForm || !sessionForm.session_date || !sessionForm.agenda) return;
    const record: ImprovementSession = {
      id: `sess-${Date.now()}`,
      faculty_id: user?.id || 'fac-1',
      faculty_name: user?.name || 'Faculty',
      student_id: sessionForm.student_id!,
      student_name: sessionForm.student_name!,
      weak_area: sessionForm.weak_area!,
      target_score: sessionForm.target_score!,
      current_score: sessionForm.current_score!,
      session_date: sessionForm.session_date,
      meet_link: sessionForm.meet_link || '',
      agenda: sessionForm.agenda,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    await createImprovementSession(record);
    await createNotification({
      id: `notif-${Date.now()}`,
      user_id: sessionForm.student_id!,
      message: `New improvement session scheduled for ${sessionForm.weak_area} on ${new Date(sessionForm.session_date).toLocaleDateString()}`,
      read: false,
      created_at: new Date().toISOString()
    });
    setImpSessions(getImprovementSessions());
    setSessionForm(null);
  };

  const submitOutcome = async () => {
    if (!outcomeForm) return;
    await updateImprovementSession(outcomeForm.id, {
      status: 'completed',
      outcome_notes: outcomeForm.notes,
      outcome_rating: outcomeForm.rating as ImprovementSession['outcome_rating'],
      score_after_session: outcomeForm.newScore ? parseInt(outcomeForm.newScore) : undefined,
      ...(outcomeForm.materials ? { materials: outcomeForm.materials } : {})
    } as Partial<ImprovementSession>);
    const sess = impSessions.find(s => s.id === outcomeForm.id);
    if (sess) {
      await createNotification({
        id: `notif-${Date.now()}`,
        user_id: sess.student_id,
        message: `Session outcome added by ${user?.name || 'Faculty'}`,
        read: false,
        created_at: new Date().toISOString()
      });
    }
    setImpSessions(getImprovementSessions());
    setOutcomeForm(null);
  };

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

        {/* Student List & Filters */}
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <h3 className="text-lg font-semibold text-white">Student Directory</h3>
            <div className="flex gap-2 text-sm">
              <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full ${filter === 'all' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}>All</button>
              <button onClick={() => setFilter('ready')} className={`px-3 py-1 rounded-full ${filter === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-emerald-400'}`}>Ready (≥80)</button>
              <button onClick={() => setFilter('track')} className={`px-3 py-1 rounded-full ${filter === 'track' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}>On Track (65-79)</button>
              <button onClick={() => setFilter('attention')} className={`px-3 py-1 rounded-full ${filter === 'attention' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-orange-400'}`}>Attention (50-64)</button>
              <button onClick={() => setFilter('low')} className={`px-3 py-1 rounded-full ${filter === 'low' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-red-400'}`}>Low (&lt;50)</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">PRS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{student.name}</td>
                    <td className="px-4 py-3">{student.department}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider
                        ${student.prs >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          student.prs >= 65 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                          student.prs >= 50 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                          'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {student.status || 'TBD'}
                      </span>
                    </td>
                    <td onClick={() => setSelectedStudent(student)} className="cursor-pointer text-blue-400 px-4 py-3 font-bold hover:underline">
                      {student.prs.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && <p className="text-center text-gray-500 py-4">No students found for this filter.</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Ready to log assessment scores?</p>
            <p className="text-sm text-gray-400 mt-1">Update student scores and watch their PRS update in real-time.</p>
          </div>
          <Link href="/dashboard/faculty/add-score" className="btn-primary py-2.5 px-6">➕ Add Scores →</Link>
        </div>

        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">Meetings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="input-dark py-2.5 text-sm"
              value={meetingForm.studentId}
              onChange={e => setMeetingForm(prev => ({ ...prev, studentId: e.target.value }))}
            >
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="input-dark py-2.5 text-sm" value={meetingForm.date} onChange={e => setMeetingForm(prev => ({ ...prev, date: e.target.value }))} />
              <input type="time" className="input-dark py-2.5 text-sm" value={meetingForm.time} onChange={e => setMeetingForm(prev => ({ ...prev, time: e.target.value }))} />
            </div>
            <input className="input-dark py-2.5 text-sm" placeholder="Agenda" value={meetingForm.agenda} onChange={e => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))} />
            <input className="input-dark py-2.5 text-sm" placeholder="Zoom/Meet link (optional)" value={meetingForm.link} onChange={e => setMeetingForm(prev => ({ ...prev, link: e.target.value }))} />
          </div>
          <textarea className="input-dark py-2.5 text-sm min-h-[80px]" placeholder="Notes for student" value={meetingForm.notes} onChange={e => setMeetingForm(prev => ({ ...prev, notes: e.target.value }))} />
          <button onClick={scheduleMeeting} className="btn-primary py-2.5 px-6">Schedule Meeting</button>

          <div className="space-y-3">
            {meetings.length === 0 ? (
              <p className="text-sm text-gray-500">No meetings yet.</p>
            ) : (
              meetings.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-white/10 bg-brand-surface/40 space-y-2">
                  <p className="text-sm text-white">{m.studentName} • {new Date(m.scheduledAt).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Agenda: {m.agenda}</p>
                  <textarea
                    className="input-dark text-sm py-2 min-h-[64px]"
                    placeholder="Outcome notes after meeting"
                    value={m.outcome || ''}
                    onChange={e => {
                      setMeetings(prev => {
                        const updated = prev.map(meet => meet.id === m.id ? { ...meet, outcome: e.target.value } : meet);
                        localStorage.setItem('meetings', JSON.stringify(updated));
                        return updated;
                      });
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Improvement Sessions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Improvement Sessions</h3>
          {impSessions.length === 0 ? (
            <p className="text-sm text-gray-500">No improvement sessions scheduled.</p>
          ) : (
            <div className="space-y-4">
              {impSessions.map(s => (
                <div key={s.id} className={`p-4 rounded-xl border bg-brand-dark/50 flex flex-col md:flex-row gap-4 justify-between
                  ${s.status === 'completed' ? 'border-l-4 border-emerald-500/50' : 
                    s.status === 'cancelled' ? 'border-l-4 border-red-500/50' : 
                    'border-l-4 border-blue-500/50'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{s.student_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase
                        ${s.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">
                      <span className="text-purple-400 font-medium">{s.weak_area}</span> • {s.current_score} → {s.target_score} Target
                    </p>
                    <p className="text-xs text-gray-500">{new Date(s.session_date).toLocaleString()}</p>
                    {s.status === 'completed' && s.outcome_notes && (
                      <p className="text-xs text-gray-300 mt-2 bg-black/30 p-2 rounded">{s.outcome_notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {s.status === 'scheduled' && (
                      <>
                        {s.meet_link && (
                          <a href={s.meet_link} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-brand-cyan/20 text-brand-cyan text-xs rounded hover:bg-brand-cyan/30">Join Meeting</a>
                        )}
                        <button onClick={() => setOutcomeForm({ id: s.id, notes: '', rating: 'Good', newScore: '', materials: '' })} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30">
                          Mark Complete
                        </button>
                      </>
                    )}
                    {s.status === 'completed' && s.outcome_rating && (
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">Score after: {s.score_after_session} • {s.outcome_rating}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-xl font-bold text-white mb-1">{selectedStudent.name}</h2>
            <p className="text-sm text-gray-400 mb-6">{selectedStudent.department} • PRS: {selectedStudent.prs.toFixed(1)}</p>
            
            <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Skill Breakdown</h3>
            <div className="space-y-3 mb-6">
              {[
                { name: 'Aptitude', score: selectedStudent.aptitude },
                { name: 'Coding', score: selectedStudent.coding },
                { name: 'Core Subjects', score: selectedStudent.core_subjects },
                { name: 'Soft Skills', score: selectedStudent.soft_skills }
              ].map(skill => {
                const isLowest = skill.score === Math.min(selectedStudent.aptitude, selectedStudent.coding, selectedStudent.core_subjects, selectedStudent.soft_skills);
                return (
                  <div key={skill.name} className={`flex justify-between items-center p-3 rounded-lg border ${isLowest ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                    <div>
                      <span className="text-sm text-white">{skill.name} {isLowest && <span className="ml-2 text-[10px] text-red-400 uppercase tracking-wider">Needs Attention</span>}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${isLowest ? 'text-red-400' : 'text-gray-300'}`}>{skill.score}/100</span>
                      {isLowest && (
                        <button
                          onClick={() => setSessionForm({
                            student_id: selectedStudent.id,
                            student_name: selectedStudent.name,
                            weak_area: skill.name,
                            current_score: skill.score,
                            target_score: skill.score + 10,
                          })}
                          className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] uppercase rounded border border-red-500/30 hover:bg-red-500/30 transition"
                        >
                          Schedule Session
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Student Profile</h3>
            {(() => {
              const linkedin = typeof window !== 'undefined' ? localStorage.getItem('linkedin') : null;
              const github = typeof window !== 'undefined' ? localStorage.getItem('github') : null;
              const projects = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('projects') || '[]') : [];
              if (!linkedin && !github && projects.length === 0) return <p className="text-sm text-gray-500">No profile data available.</p>;
              return (
                <div className="space-y-3 text-sm">
                  {linkedin && <p><span className="text-gray-500">LinkedIn:</span> <a href={linkedin} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{linkedin}</a></p>}
                  {github && <p><span className="text-gray-500">GitHub:</span> <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">@{github}</a></p>}
                  {projects.some((p: string) => p) && (
                    <div>
                      <span className="text-gray-500">Projects:</span>
                      <ul className="list-disc pl-5 mt-1 text-gray-300">
                        {projects.filter((p: string) => p).map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {sessionForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setSessionForm(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-xl font-bold text-white mb-4">Schedule Improvement Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Student</label>
                <input className="input-dark w-full text-sm bg-black/50" readOnly value={sessionForm.student_name || ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Weak Area</label>
                  <input className="input-dark w-full text-sm bg-black/50 text-red-400" readOnly value={sessionForm.weak_area || ''} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Current Score</label>
                  <input className="input-dark w-full text-sm bg-black/50 text-red-400 font-bold" readOnly value={sessionForm.current_score || ''} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Score (must be &gt; current)</label>
                <input type="number" className="input-dark w-full text-sm" value={sessionForm.target_score || ''} onChange={e => setSessionForm(prev => ({ ...prev!, target_score: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date & Time</label>
                <input type="datetime-local" className="input-dark w-full text-sm" value={sessionForm.session_date?.slice(0, 16) || ''} onChange={e => setSessionForm(prev => ({ ...prev!, session_date: new Date(e.target.value).toISOString() }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Meet/Zoom Link</label>
                <input className="input-dark w-full text-sm" placeholder="https://meet.google.com/..." value={sessionForm.meet_link || ''} onChange={e => setSessionForm(prev => ({ ...prev!, meet_link: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Agenda</label>
                <textarea className="input-dark w-full text-sm min-h-[80px]" placeholder="What will be covered?" value={sessionForm.agenda || ''} onChange={e => setSessionForm(prev => ({ ...prev!, agenda: e.target.value }))} />
              </div>
              <button onClick={submitImpSession} className="btn-primary w-full py-3 mt-2">Schedule Session</button>
            </div>
          </div>
        </div>
      )}

      {outcomeForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setOutcomeForm(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-xl font-bold text-white mb-4">Complete Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Outcome Notes</label>
                <textarea className="input-dark w-full text-sm min-h-[80px]" placeholder="What was covered? Did they improve?" value={outcomeForm.notes} onChange={e => setOutcomeForm(prev => ({ ...prev!, notes: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rating</label>
                <select className="input-dark w-full text-sm" value={outcomeForm.rating} onChange={e => setOutcomeForm(prev => ({ ...prev!, rating: e.target.value }))}>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Needs More Work</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Score After Session (Optional)</label>
                <input type="number" className="input-dark w-full text-sm" placeholder="e.g. 85" value={outcomeForm.newScore} onChange={e => setOutcomeForm(prev => ({ ...prev!, newScore: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">📚 Study Materials (Optional)</label>
                <textarea className="input-dark w-full text-sm min-h-[80px]" placeholder="Paste resource links, notes, or practice problems..." value={outcomeForm.materials} onChange={e => setOutcomeForm(prev => ({ ...prev!, materials: e.target.value }))} />
                <p className="text-[10px] text-gray-600 mt-1">Student will see this in their session card.</p>
              </div>
              <button onClick={submitOutcome} className="btn-primary w-full py-3 mt-2">Save Outcome</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
