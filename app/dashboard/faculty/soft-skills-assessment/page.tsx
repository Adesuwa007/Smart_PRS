'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudentsWithScores } from '@/lib/mock-data';
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
  const allStudents = getAllStudentsWithScores();
  
  const [selectedId, setSelectedId] = useState(allStudents[0]?.id || '');
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
          <h1 className="text-2xl font-bold text-white">Soft Skills Assessment Entry 🗣️</h1>
          <p className="text-sm text-gray-400 mt-1">Log in-person session results and track student communication progress.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-5">New Session Details</h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Select Student</label>
                  <select
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                    className="input-dark w-full py-2.5 text-sm"
                    required
                  >
                    {allStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Session Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="input-dark w-full py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Session Topic</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="input-dark w-full py-2.5 text-sm"
                  required
                >
                  {TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-brand-border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white">Scoring Rubric</h4>
                  <div className="badge badge-cyan">
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
                    <div key={field.key}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{field.label}</span>
                        <span className="text-white font-medium">{rubric[field.key as keyof typeof rubric]}/10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={rubric[field.key as keyof typeof rubric]}
                        onChange={e => setRubric(prev => ({ ...prev, [field.key]: +e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Overall Remarks</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="input-dark w-full py-2.5 text-sm min-h-[80px]"
                  placeholder="Notes on performance, areas to improve..."
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50">
                {saving ? '💾 Saving...' : '💾 Log Assessment'}
              </button>
            </form>
          </div>

          {/* Right Sidebar - Stats */}
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">🕒 Recent Sessions</h3>
              {recentSessions.length === 0 ? (
                <p className="text-xs text-gray-500">No recent sessions found.</p>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session, i) => (
                    <div key={i} className="p-3 rounded-xl bg-brand-surface/50 border border-brand-border">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-white">{session.profiles?.name || 'Unknown Student'}</p>
                        <span className="badge badge-purple text-[10px]">{session.score}/100</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{new Date(session.taken_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">⚠️</span>
                <h3 className="text-sm font-semibold text-red-400">At-Risk Students</h3>
              </div>
              <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider">No session in last 30 days</p>
              
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                {atRiskStudents.length === 0 ? (
                  <p className="text-xs text-emerald-400">All students are up to date!</p>
                ) : (
                  atRiskStudents.map(student => (
                    <div key={student.id} className="flex justify-between items-center p-2 rounded-lg bg-brand-surface border border-brand-border">
                      <span className="text-xs text-white truncate max-w-[120px]">{student.name}</span>
                      <span className="text-[10px] text-gray-500">{student.department}</span>
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
