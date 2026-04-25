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
          <h1 className="text-3xl font-black text-[#1A1035] tracking-tight">Faculty Overview 👨‍🏫</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Class readiness analytics for Vidyavardhaka College of Engineering</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'My Students', value: loading ? '...' : totalStudents, icon: '👥', color: 'text-[#6C47FF]', bg: 'bg-[#EDE9FE]' },
            { label: 'Average PRS', value: avgPRS, icon: '📊', color: 'text-[#00C9A7]', bg: 'bg-[#D1FAE5]' },
            { label: 'High Performers', value: loading ? '...' : highPerformers.length, icon: '⭐', color: 'text-[#FFB347]', bg: 'bg-[#FEF3C7]' },
            { label: 'At-Risk (<50)', value: loading ? '...' : atRisk.length, icon: '⚠️', color: 'text-[#FF4D6D]', bg: 'bg-[#FCE7F3]' },
          ].map((c, i) => (
            <div key={i} className={`bold-card p-6 ${c.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-[#1A1035]/50 uppercase tracking-wider">{c.label}</p>
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#1A1035] flex items-center justify-center text-lg shadow-[2px_2px_0px_#1A1035]">{c.icon}</div>
              </div>
              <p className={`text-4xl font-black ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Class Health Bar */}
        <div className="bold-card bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight">Class Health Score</h3>
            <span className="text-3xl font-black text-[#00C9A7]">{avgPRS}<span className="text-[#1A1035]/40 text-sm font-bold">/100</span></span>
          </div>
          {loading ? <div className="h-6 bg-[#F8F7FF] border-2 border-[#1A1035]/10 rounded-full animate-pulse" /> : (
            <div className="h-6 bg-white border-2 border-[#1A1035] rounded-full overflow-hidden flex shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
              <div className="h-full bg-[#00C9A7] transition-all" style={{ width: `${(highPerformers.length / Math.max(totalStudents, 1)) * 100}%` }} title="Ready" />
              <div className="h-full bg-[#FFB347] transition-all border-l-2 border-[#1A1035]" style={{ width: `${((totalStudents - highPerformers.length - atRisk.length) / Math.max(totalStudents, 1)) * 100}%` }} title="On Track" />
              <div className="h-full bg-[#FF4D6D] transition-all border-l-2 border-[#1A1035]" style={{ width: `${(atRisk.length / Math.max(totalStudents, 1)) * 100}%` }} title="At Risk" />
            </div>
          )}
          <div className="flex flex-wrap gap-6 mt-4 text-xs font-black text-[#1A1035]/60 uppercase tracking-wider">
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#00C9A7] border-2 border-[#1A1035]" />{highPerformers.length} Ready</span>
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#FFB347] border-2 border-[#1A1035]" />{totalStudents - highPerformers.length - atRisk.length} On Track</span>
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#FF4D6D] border-2 border-[#1A1035]" />{atRisk.length} At Risk</span>
          </div>
        </div>

        <BatchBarChart data={stats.deptStats} />

        {/* Student List & Filters */}
        {/* Student List & Filters */}
        <div className="bold-card bg-white p-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight">Student Directory</h3>
            <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wider">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full border-2 transition-all ${filter === 'all' ? 'bg-[#1A1035] text-white border-[#1A1035] shadow-[2px_2px_0px_#6C47FF]' : 'bg-white text-[#1A1035]/50 border-[#1A1035]/20 hover:border-[#1A1035] hover:text-[#1A1035]'}`}>All</button>
              <button onClick={() => setFilter('ready')} className={`px-4 py-2 rounded-full border-2 transition-all ${filter === 'ready' ? 'bg-[#D1FAE5] text-[#00C9A7] border-[#00C9A7] shadow-[2px_2px_0px_#00C9A7]' : 'bg-white text-[#1A1035]/50 border-[#1A1035]/20 hover:border-[#00C9A7] hover:text-[#00C9A7]'}`}>Ready (≥80)</button>
              <button onClick={() => setFilter('track')} className={`px-4 py-2 rounded-full border-2 transition-all ${filter === 'track' ? 'bg-[#FEF3C7] text-[#FFB347] border-[#FFB347] shadow-[2px_2px_0px_#FFB347]' : 'bg-white text-[#1A1035]/50 border-[#1A1035]/20 hover:border-[#FFB347] hover:text-[#FFB347]'}`}>On Track (65-79)</button>
              <button onClick={() => setFilter('attention')} className={`px-4 py-2 rounded-full border-2 transition-all ${filter === 'attention' ? 'bg-[#FFEDD5] text-[#F97316] border-[#F97316] shadow-[2px_2px_0px_#F97316]' : 'bg-white text-[#1A1035]/50 border-[#1A1035]/20 hover:border-[#F97316] hover:text-[#F97316]'}`}>Attention (50-64)</button>
              <button onClick={() => setFilter('low')} className={`px-4 py-2 rounded-full border-2 transition-all ${filter === 'low' ? 'bg-[#FCE7F3] text-[#FF4D6D] border-[#FF4D6D] shadow-[2px_2px_0px_#FF4D6D]' : 'bg-white text-[#1A1035]/50 border-[#1A1035]/20 hover:border-[#FF4D6D] hover:text-[#FF4D6D]'}`}>Low (&lt;50)</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-xs font-black uppercase tracking-wider bg-[#F8F7FF] text-[#1A1035]/50 border-b-2 border-[#1A1035]/10">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">PRS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#1A1035]/5">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-[#F8F7FF] transition-colors group">
                    <td className="px-4 py-3 font-black text-[#1A1035] group-hover:text-[#6C47FF] transition-colors">{student.name}</td>
                    <td className="px-4 py-3 font-bold text-[#1A1035]/60">{student.department}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 shadow-[1px_1px_0px_currentColor]
                        ${student.prs >= 80 ? 'bg-[#D1FAE5] text-[#00C9A7] border-[#00C9A7]' : 
                          student.prs >= 65 ? 'bg-[#FEF3C7] text-[#FFB347] border-[#FFB347]' : 
                          student.prs >= 50 ? 'bg-[#FFEDD5] text-[#F97316] border-[#F97316]' : 
                          'bg-[#FCE7F3] text-[#FF4D6D] border-[#FF4D6D]'}`}>
                        {student.status || 'TBD'}
                      </span>
                    </td>
                    <td onClick={() => setSelectedStudent(student)} className="cursor-pointer text-[#6C47FF] px-4 py-3 font-black hover:underline">
                      {student.prs.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && <p className="text-center text-[#1A1035]/40 font-bold py-6">No students found for this filter.</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bold-card bg-[#EDE9FE] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[#1A1035] font-black uppercase tracking-tight text-lg">Ready to log assessment scores?</p>
            <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Update student scores and watch their PRS update in real-time.</p>
          </div>
          <Link href="/dashboard/faculty/add-score" className="btn-primary py-3 px-8 text-sm font-black border-2 border-[#1A1035] shadow-[3px_3px_0px_#1A1035] hover:shadow-[5px_5px_0px_#1A1035] hover:-translate-y-0.5 transition-all whitespace-nowrap">➕ Add Scores →</Link>
        </div>

        <div className="bold-card bg-white p-6 space-y-5">
          <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight">Meetings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors"
              value={meetingForm.studentId}
              onChange={e => setMeetingForm(prev => ({ ...prev, studentId: e.target.value }))}
            >
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" value={meetingForm.date} onChange={e => setMeetingForm(prev => ({ ...prev, date: e.target.value }))} />
              <input type="time" className="bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" value={meetingForm.time} onChange={e => setMeetingForm(prev => ({ ...prev, time: e.target.value }))} />
            </div>
            <input className="bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" placeholder="Agenda" value={meetingForm.agenda} onChange={e => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))} />
            <input className="bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" placeholder="Zoom/Meet link (optional)" value={meetingForm.link} onChange={e => setMeetingForm(prev => ({ ...prev, link: e.target.value }))} />
          </div>
          <textarea className="bg-[#F8F7FF] border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors min-h-[80px] w-full" placeholder="Notes for student" value={meetingForm.notes} onChange={e => setMeetingForm(prev => ({ ...prev, notes: e.target.value }))} />
          <button onClick={scheduleMeeting} className="btn-secondary py-3 px-8 text-sm font-black border-2 border-[#1A1035] shadow-[3px_3px_0px_#1A1035] hover:shadow-[5px_5px_0px_#1A1035] hover:-translate-y-0.5 transition-all">Schedule Meeting</button>

          <div className="space-y-3 mt-6">
            {meetings.length === 0 ? (
              <p className="text-sm font-bold text-[#1A1035]/40">No meetings yet.</p>
            ) : (
              meetings.map(m => (
                <div key={m.id} className="p-5 rounded-xl border-2 border-[#1A1035]/10 bg-[#F8F7FF] space-y-3">
                  <p className="text-sm font-black text-[#1A1035]">{m.studentName} <span className="text-[#1A1035]/40 font-bold ml-2">• {new Date(m.scheduledAt).toLocaleString()}</span></p>
                  <p className="text-xs font-bold text-[#1A1035]/60">Agenda: {m.agenda}</p>
                  <textarea
                    className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors min-h-[64px]"
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
        <div className="bold-card bg-white p-6">
          <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight mb-6">Improvement Sessions</h3>
          {impSessions.length === 0 ? (
            <p className="text-sm font-bold text-[#1A1035]/40">No improvement sessions scheduled.</p>
          ) : (
            <div className="space-y-4">
              {impSessions.map(s => (
                <div key={s.id} className={`p-5 rounded-xl border-2 flex flex-col md:flex-row gap-4 justify-between transition-all
                  ${s.status === 'completed' ? 'border-[#00C9A7] bg-[#D1FAE5]/30' : 
                    s.status === 'cancelled' ? 'border-[#FF4D6D] bg-[#FCE7F3]/30' : 
                    'border-[#1A1035] bg-white shadow-[3px_3px_0px_#1A1035]'}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[#1A1035] font-black">{s.student_name}</span>
                      <span className={`text-[10px] px-3 py-1 rounded-full uppercase font-black border-2
                        ${s.status === 'completed' ? 'border-[#00C9A7] bg-[#D1FAE5] text-[#00C9A7]' : 'border-[#1A1035] bg-[#EDE9FE] text-[#6C47FF]'}`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#1A1035]/60 mb-1">
                      <span className="text-[#6C47FF] font-black">{s.weak_area}</span> • {s.current_score} → {s.target_score} Target
                    </p>
                    <p className="text-xs font-bold text-[#1A1035]/40">{new Date(s.session_date).toLocaleString()}</p>
                    {s.status === 'completed' && s.outcome_notes && (
                      <p className="text-xs font-bold text-[#1A1035]/70 mt-3 border-l-2 border-[#00C9A7] pl-3 py-1 italic bg-[#F8F7FF] rounded-r pr-2">&quot;{s.outcome_notes}&quot;</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 items-end">
                    {s.status === 'scheduled' && (
                      <>
                        {s.meet_link && (
                          <a href={s.meet_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[#F8F7FF] text-[#6C47FF] border-2 border-[#1A1035]/10 text-xs font-black rounded-lg hover:border-[#6C47FF] transition-colors">Join Meeting</a>
                        )}
                        <button onClick={() => setOutcomeForm({ id: s.id, notes: '', rating: 'Good', newScore: '', materials: '' })} className="px-4 py-2 bg-white text-[#00C9A7] border-2 border-[#00C9A7] shadow-[2px_2px_0px_#00C9A7] hover:shadow-[4px_4px_0px_#00C9A7] hover:-translate-y-0.5 text-xs font-black rounded-lg transition-all">
                          Mark Complete
                        </button>
                      </>
                    )}
                    {s.status === 'completed' && s.outcome_rating && (
                      <span className="text-xs text-[#00C9A7] font-black bg-white border-2 border-[#00C9A7] px-3 py-1.5 rounded-full">Score after: {s.score_after_session} • {s.outcome_rating}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1035]/40 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-[#1A1035] rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_#1A1035]">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#F8F7FF] border-2 border-[#1A1035] rounded-full text-[#1A1035] font-black hover:bg-[#1A1035] hover:text-white transition-colors">✕</button>
            <h2 className="text-2xl font-black text-[#1A1035] mb-1 tracking-tight">{selectedStudent.name}</h2>
            <p className="text-sm font-bold text-[#1A1035]/60 mb-6">{selectedStudent.department} • PRS: <span className="text-[#6C47FF]">{selectedStudent.prs.toFixed(1)}</span></p>
            
            <h3 className="text-xs font-black text-[#1A1035]/40 mb-3 uppercase tracking-wider">Skill Breakdown</h3>
            <div className="space-y-3 mb-8">
              {[
                { name: 'Aptitude', score: selectedStudent.aptitude },
                { name: 'Coding', score: selectedStudent.coding },
                { name: 'Core Subjects', score: selectedStudent.core_subjects },
                { name: 'Soft Skills', score: selectedStudent.soft_skills }
              ].map(skill => {
                const isLowest = skill.score === Math.min(selectedStudent.aptitude, selectedStudent.coding, selectedStudent.core_subjects, selectedStudent.soft_skills);
                return (
                  <div key={skill.name} className={`flex justify-between items-center p-3 rounded-xl border-2 ${isLowest ? 'bg-[#FCE7F3] border-[#FF4D6D]' : 'bg-[#F8F7FF] border-[#1A1035]/10'}`}>
                    <div>
                      <span className={`text-sm font-black ${isLowest ? 'text-[#FF4D6D]' : 'text-[#1A1035]'}`}>{skill.name} {isLowest && <span className="ml-2 px-2 py-0.5 rounded-full bg-white border-2 border-[#FF4D6D] text-[9px] text-[#FF4D6D] uppercase tracking-wider font-black">Needs Attention</span>}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-black ${isLowest ? 'text-[#FF4D6D]' : 'text-[#1A1035]/60'}`}>{skill.score}/100</span>
                      {isLowest && (
                        <button
                          onClick={() => setSessionForm({
                            student_id: selectedStudent.id,
                            student_name: selectedStudent.name,
                            weak_area: skill.name,
                            current_score: skill.score,
                            target_score: skill.score + 10,
                          })}
                          className="px-3 py-1.5 bg-white text-[#FF4D6D] border-2 border-[#FF4D6D] text-[10px] font-black uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_#FF4D6D] hover:shadow-[4px_4px_0px_#FF4D6D] hover:-translate-y-0.5 transition-all"
                        >
                          Schedule
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 className="text-xs font-black text-[#1A1035]/40 mb-3 uppercase tracking-wider">Student Profile</h3>
            {(() => {
              const linkedin = typeof window !== 'undefined' ? localStorage.getItem('linkedin') : null;
              const github = typeof window !== 'undefined' ? localStorage.getItem('github') : null;
              const projects = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('projects') || '[]') : [];
              if (!linkedin && !github && projects.length === 0) return <p className="text-sm font-bold text-[#1A1035]/40 bg-[#F8F7FF] border-2 border-[#1A1035]/10 rounded-xl p-4 text-center">No profile data available.</p>;
              return (
                <div className="space-y-3 text-sm bg-[#F8F7FF] border-2 border-[#1A1035]/10 rounded-xl p-4">
                  {linkedin && <p className="flex flex-col"><span className="text-[10px] font-black text-[#1A1035]/40 uppercase tracking-wider">LinkedIn</span> <a href={linkedin} target="_blank" rel="noreferrer" className="text-[#6C47FF] font-bold hover:underline truncate">{linkedin}</a></p>}
                  {github && <p className="flex flex-col mt-2"><span className="text-[10px] font-black text-[#1A1035]/40 uppercase tracking-wider">GitHub</span> <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" className="text-[#6C47FF] font-bold hover:underline">@{github}</a></p>}
                  {projects.some((p: string) => p) && (
                    <div className="mt-2">
                      <span className="text-[10px] font-black text-[#1A1035]/40 uppercase tracking-wider">Projects</span>
                      <ul className="list-disc pl-5 mt-1 text-[#1A1035] font-bold">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1A1035]/40 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-[#1A1035] rounded-2xl w-full max-w-md p-6 relative shadow-[8px_8px_0px_#1A1035]">
            <button onClick={() => setSessionForm(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#F8F7FF] border-2 border-[#1A1035] rounded-full text-[#1A1035] font-black hover:bg-[#1A1035] hover:text-white transition-colors">✕</button>
            <h2 className="text-xl font-black text-[#1A1035] mb-6 uppercase tracking-tight">Schedule Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Student</label>
                <input className="w-full bg-[#F8F7FF] border-2 border-[#1A1035]/10 rounded-xl px-4 py-2 text-sm font-black text-[#1A1035]/50 cursor-not-allowed" readOnly value={sessionForm.student_name || ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Weak Area</label>
                  <input className="w-full bg-[#FCE7F3] border-2 border-[#FF4D6D]/30 rounded-xl px-4 py-2 text-sm font-black text-[#FF4D6D] cursor-not-allowed" readOnly value={sessionForm.weak_area || ''} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Current Score</label>
                  <input className="w-full bg-[#FCE7F3] border-2 border-[#FF4D6D]/30 rounded-xl px-4 py-2 text-sm font-black text-[#FF4D6D] cursor-not-allowed" readOnly value={sessionForm.current_score || ''} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Target Score (must be &gt; current)</label>
                <input type="number" className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" value={sessionForm.target_score || ''} onChange={e => setSessionForm(prev => ({ ...prev!, target_score: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Date & Time</label>
                <input type="datetime-local" className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" value={sessionForm.session_date?.slice(0, 16) || ''} onChange={e => setSessionForm(prev => ({ ...prev!, session_date: new Date(e.target.value).toISOString() }))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Meet/Zoom Link</label>
                <input className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" placeholder="https://meet.google.com/..." value={sessionForm.meet_link || ''} onChange={e => setSessionForm(prev => ({ ...prev!, meet_link: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Agenda</label>
                <textarea className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors min-h-[80px]" placeholder="What will be covered?" value={sessionForm.agenda || ''} onChange={e => setSessionForm(prev => ({ ...prev!, agenda: e.target.value }))} />
              </div>
              <button onClick={submitImpSession} className="w-full btn-primary py-3 mt-4 text-sm font-black border-2 border-[#1A1035] shadow-[3px_3px_0px_#1A1035] hover:shadow-[5px_5px_0px_#1A1035] hover:-translate-y-0.5 transition-all">Schedule Session</button>
            </div>
          </div>
        </div>
      )}

      {outcomeForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1A1035]/40 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-[#1A1035] rounded-2xl w-full max-w-md p-6 relative shadow-[8px_8px_0px_#1A1035]">
            <button onClick={() => setOutcomeForm(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#F8F7FF] border-2 border-[#1A1035] rounded-full text-[#1A1035] font-black hover:bg-[#1A1035] hover:text-white transition-colors">✕</button>
            <h2 className="text-xl font-black text-[#1A1035] mb-6 uppercase tracking-tight">Complete Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Outcome Notes</label>
                <textarea className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors min-h-[80px]" placeholder="What was covered? Did they improve?" value={outcomeForm.notes} onChange={e => setOutcomeForm(prev => ({ ...prev!, notes: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Rating</label>
                <select className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" value={outcomeForm.rating} onChange={e => setOutcomeForm(prev => ({ ...prev!, rating: e.target.value }))}>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Needs More Work</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">Score After Session (Optional)</label>
                <input type="number" className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors" placeholder="e.g. 85" value={outcomeForm.newScore} onChange={e => setOutcomeForm(prev => ({ ...prev!, newScore: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#1A1035]/50 uppercase tracking-wider mb-1">📚 Study Materials (Optional)</label>
                <textarea className="w-full bg-white border-2 border-[#1A1035]/20 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:ring-0 transition-colors min-h-[80px]" placeholder="Paste resource links, notes, or practice problems..." value={outcomeForm.materials} onChange={e => setOutcomeForm(prev => ({ ...prev!, materials: e.target.value }))} />
                <p className="text-[10px] font-bold text-[#1A1035]/40 mt-1">Student will see this in their session card.</p>
              </div>
              <button onClick={submitOutcome} className="w-full btn-primary py-3 mt-4 text-sm font-black border-2 border-[#1A1035] shadow-[3px_3px_0px_#1A1035] hover:shadow-[5px_5px_0px_#1A1035] hover:-translate-y-0.5 transition-all">Save Outcome</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
