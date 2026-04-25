'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudents, type UnifiedStudent } from '@/lib/students-service';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

const TOPICS = [
  "Group Discussion",
  "Mock Interview",
  "Presentation Skills",
  "Email Writing",
  "Body Language & Confidence"
];

export default function SoftSkillsAssessmentPage() {
  const [allStudents, setAllStudents] = useState<UnifiedStudent[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    getAllStudents().then(data => {
      setAllStudents(data);
      if (data.length > 0) setSelectedId(data[0].id);
    });
  }, []);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState(TOPICS[0]);
  
  const [rubric, setRubric] = useState({
    clarity: 5,
    confidence: 5,
    structuring: 5,
    vocabulary: 5,
    bodyLanguage: 5
  });
  
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);

  // Auto-calculated session score (average of rubric * 10)
  const sessionScore = Math.round(
    ((rubric.clarity + rubric.confidence + rubric.structuring + rubric.vocabulary + rubric.bodyLanguage) / 5) * 10
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch last 5 sessions
      const { data: recent } = await supabase
        .from('assessments')
        .select('*, profiles!inner(name)')
        .eq('type', 'soft_skills')
        .order('taken_at', { ascending: false })
        .limit(5);
        
      if (recent) setRecentSessions(recent);

      // Calculate at-risk students (no session in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: allAssessments } = await supabase
        .from('assessments')
        .select('student_id, taken_at')
        .eq('type', 'soft_skills');
        
      const recentStudentIds = new Set(
        (allAssessments || [])
          .filter(a => new Date(a.taken_at) >= thirtyDaysAgo)
          .map(a => a.student_id)
      );
      
      // We compare with all students in the batch
      const atRisk = allStudents.filter(s => !recentStudentIds.has(s.id));
      setAtRiskStudents(atRisk);
    };

    fetchDashboardData();
  }, [allStudents]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // 1. Save to assessments table
      const { error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          student_id: selectedId,
          type: 'soft_skills',
          score: sessionScore,
          taken_at: new Date(date).toISOString(),
          notes: `Topic: ${topic}\nRemarks: ${remarks}`
        });

      if (assessmentError) throw assessmentError;

      // 2. Fetch all soft skills assessments for this student to calculate weighted average
      const { data: pastAssessments } = await supabase
        .from('assessments')
        .select('score')
        .eq('student_id', selectedId)
        .eq('type', 'soft_skills');
        
      const allScores = pastAssessments ? pastAssessments.map(a => a.score) : [];
      // Include the current one if it wasn't returned immediately by the fetch
      if (allScores.length === 0) allScores.push(sessionScore);
      
      const averageScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

      // 3. Update student's soft_skills score in student_scores
      const { error: updateError } = await supabase
        .from('student_scores')
        .update({ soft_skills: averageScore })
        .eq('student_id', selectedId);
        
      if (updateError) throw updateError;

      toast.success('Soft skills assessment saved successfully!');
      
      // Reset form
      setRubric({ clarity: 5, confidence: 5, structuring: 5, vocabulary: 5, bodyLanguage: 5 });
      setRemarks('');
      
      // Refresh dashboard data by reloading the page state
      window.location.reload();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to save assessment');
      } else {
        toast.error('Failed to save assessment');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="faculty" userName="Faculty">
      <Toaster position="top-center" />
      <div className="space-y-6 animate-fade-in max-w-5xl">
        <div>
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Soft Skills Assessment Entry 🗣️</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Log in-person session results and track student communication progress.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
            <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4">New Session Details</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2">Select Student</label>
                  <select
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                    className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] transition-all appearance-none"
                    required
                  >
                    {allStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2">Session Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2">Session Topic</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] transition-all appearance-none"
                  required
                >
                  {TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 border-t-4 border-[#1A1035]/10">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-black text-[#1A1035] uppercase tracking-wider">Scoring Rubric</h4>
                  <div className="bg-[#00C9A7] text-[#1A1035] px-3 py-1 font-black text-sm uppercase tracking-widest border-2 border-[#1A1035] rounded shadow-[2px_2px_0px_#1A1035]">
                    Score: {sessionScore}/100
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { key: 'clarity', label: 'Clarity of Speech' },
                    { key: 'confidence', label: 'Confidence Level' },
                    { key: 'structuring', label: 'Logical Structuring' },
                    { key: 'vocabulary', label: 'Vocabulary & Grammar' },
                    { key: 'bodyLanguage', label: 'Eye Contact & Body Language' },
                  ].map(field => (
                    <div key={field.key} className="bg-[#F8F7FF] border-2 border-[#1A1035] p-4 rounded-xl shadow-[4px_4px_0px_#1A1035]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-[#1A1035]/60 uppercase tracking-widest">{field.label}</span>
                        <span className="text-sm font-black text-[#1A1035] bg-white border-2 border-[#1A1035] px-2 py-0.5 rounded shadow-[2px_2px_0px_#1A1035]">{rubric[field.key as keyof typeof rubric]}/10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={rubric[field.key as keyof typeof rubric]}
                        onChange={e => setRubric(prev => ({ ...prev, [field.key]: +e.target.value }))}
                        className="w-full accent-[#6C47FF]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2">Overall Remarks</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] transition-all min-h-[100px] resize-y"
                  placeholder="Notes on performance, areas to improve..."
                />
              </div>

              <button type="submit" disabled={saving} className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-4 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#6C47FF] hover:shadow-[6px_6px_0px_#6C47FF] hover:-translate-y-1 transition-all disabled:opacity-50 w-full">
                {saving ? '💾 Saving...' : '💾 Log Assessment'}
              </button>
            </form>
          </div>

          {/* Right Sidebar - Stats */}
          <div className="space-y-6">
            <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
              <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-4 border-b-4 border-[#1A1035]/10 pb-4">🕒 Recent Sessions</h3>
              {recentSessions.length === 0 ? (
                <p className="text-xs font-bold text-[#1A1035]/50">No recent sessions found.</p>
              ) : (
                <div className="space-y-4">
                  {recentSessions.map((session, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] shadow-[4px_4px_0px_#1A1035]">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-black text-[#1A1035]">{session.profiles?.name || 'Unknown Student'}</p>
                        <span className="bg-[#6C47FF] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 border-[#1A1035] rounded shadow-[2px_2px_0px_#1A1035]">{session.score}/100</span>
                      </div>
                      <p className="text-xs font-bold text-[#1A1035]/60">{new Date(session.taken_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#FF4D6D] border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl bg-white border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] w-10 h-10 flex items-center justify-center rounded-xl">⚠️</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">At-Risk Students</h3>
              </div>
              <p className="text-xs font-bold text-white/80 mb-4 uppercase tracking-widest">No session in last 30 days</p>
              
              <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {atRiskStudents.length === 0 ? (
                  <p className="text-xs font-black text-white bg-black/20 p-2 rounded border-2 border-[#1A1035]">All students are up to date!</p>
                ) : (
                  atRiskStudents.map(student => (
                    <div key={student.id} className="flex justify-between items-center p-3 rounded-xl bg-white border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">
                      <span className="text-xs font-black text-[#1A1035] truncate max-w-[120px]">{student.name}</span>
                      <span className="text-[10px] font-bold text-white bg-[#1A1035] px-2 py-1 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">{student.department}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
