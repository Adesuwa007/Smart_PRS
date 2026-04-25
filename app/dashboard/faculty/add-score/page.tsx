'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudents, type UnifiedStudent } from '@/lib/students-service';
import { analyzeStudent } from '@/lib/ai-engine';
import { StudentScores } from '@/types';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function AddScorePage() {
  const [allStudents, setAllStudents] = useState<UnifiedStudent[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [scores, setScores] = useState<Partial<StudentScores>>({
    aptitude: 0, coding: 0, core_subjects: 0, soft_skills: 0, attendance: 0, backlogs: 0,
  });

  useEffect(() => {
    getAllStudents().then(data => {
      setAllStudents(data);
      if (data.length > 0) setSelectedId(data[0].id);
    });
  }, []);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedStudent = allStudents.find(s => s.id === selectedId);

  const handlePreFill = () => {
    if (selectedStudent) {
      setScores({
        aptitude: selectedStudent.aptitude,
        coding: selectedStudent.coding,
        core_subjects: selectedStudent.core_subjects,
        soft_skills: selectedStudent.soft_skills,
        attendance: selectedStudent.attendance,
        backlogs: selectedStudent.backlogs,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('student_scores')
      .upsert({
        student_id: selectedId,
        aptitude: scores.aptitude || 0,
        coding: scores.coding || 0,
        core_subjects: scores.core_subjects || 0,
        soft_skills: scores.soft_skills || 0,
        attendance: scores.attendance || 0,
        backlogs: scores.backlogs || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });

    setSaving(false);
    if (error) {
      toast.error('Failed to save scores: ' + error.message);
    } else {
      setSaved(true);
      toast.success('Scores updated!');
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const previewPRS = scores.coding && scores.aptitude
    ? analyzeStudent({
        id: 'preview', student_id: selectedId,
        aptitude: scores.aptitude || 0,
        coding: scores.coding || 0,
        core_subjects: scores.core_subjects || 0,
        soft_skills: scores.soft_skills || 0,
        attendance: scores.attendance || 0,
        backlogs: scores.backlogs || 0,
        mock_tests_completed: 0,
        updated_at: new Date().toISOString(),
      })
    : null;

  const fields = [
    { key: 'aptitude', label: 'Aptitude Score' },
    { key: 'coding', label: 'Coding Score' },
    { key: 'core_subjects', label: 'Core Subjects Score' },
    { key: 'soft_skills', label: 'Soft Skills Score' },
    { key: 'attendance', label: 'Attendance %' },
    { key: 'backlogs', label: 'Number of Backlogs' },
  ] as const;

  return (
    <DashboardLayout role="faculty" userName="Faculty">
      <Toaster position="top-center" />
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Log Assessment Score ➕</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Update student scores — changes update PRS in real-time</p>
        </div>

        <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035] space-y-6">
          {/* Student selector */}
          <div className="border-b-4 border-[#1A1035]/10 pb-6">
            <label className="block text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2">Select Student</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="flex-1 bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] transition-all appearance-none">
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                ))}
              </select>
              <button onClick={handlePreFill} className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-3 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs flex-shrink-0">
                📋 Pre-fill Current
              </button>
            </div>
          </div>

          {/* Score inputs */}
          <div className="grid md:grid-cols-2 gap-6">
            {fields.map(f => (
              <div key={f.key} className="bg-[#F8F7FF] border-2 border-[#1A1035] p-4 rounded-xl shadow-[4px_4px_0px_#1A1035]">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-[#1A1035]/60 uppercase tracking-widest">
                    {f.label}
                    <span className="text-[#1A1035]/40 ml-1">{f.key === 'backlogs' ? '(0–10)' : '(0–100)'}</span>
                  </label>
                  <span className="text-sm font-black text-[#1A1035] bg-white border-2 border-[#1A1035] px-2 py-0.5 rounded shadow-[2px_2px_0px_#1A1035]">{scores[f.key] || 0}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={f.key === 'backlogs' ? 10 : 100}
                  value={scores[f.key] || 0}
                  onChange={e => setScores(prev => ({ ...prev, [f.key]: +e.target.value }))}
                  className={`w-full ${f.key === 'backlogs' ? 'accent-[#FF4D6D]' : 'accent-[#00C9A7]'}`}
                />
              </div>
            ))}
          </div>

          {/* Live PRS Preview */}
          {previewPRS && (
            <div className="p-6 bg-[#00C9A7] border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl -mr-10 -mt-10"></div>
              <p className="text-xs font-black text-[#1A1035] uppercase tracking-widest mb-4">LIVE PRS PREVIEW</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                <div className="bg-white border-4 border-[#1A1035] px-4 py-2 rounded-xl shadow-[4px_4px_0px_#1A1035] transform -rotate-2">
                  <span className="text-4xl font-black text-[#1A1035]">{previewPRS.score.toFixed(1)}</span>
                  <span className="text-[#1A1035]/50 font-bold text-sm ml-1">/100</span>
                </div>
                <div>
                  <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-[#1A1035] rounded shadow-[2px_2px_0px_#1A1035] ${previewPRS.probability === 'High' ? 'bg-white text-[#00C9A7]' : previewPRS.probability === 'Medium' ? 'bg-[#FFB347] text-[#1A1035]' : 'bg-[#FF4D6D] text-white'}`}>
                    {previewPRS.probability} Probability
                  </span>
                  <p className="text-sm font-bold text-[#1A1035] mt-2 bg-white/80 inline-block px-2 py-0.5 rounded border-2 border-[#1A1035]">Eligible: {previewPRS.companyTiers[0]}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-4 border-[#1A1035]/10">
            <button onClick={handleSave} disabled={saving} className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-4 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#00C9A7] hover:shadow-[6px_6px_0px_#00C9A7] hover:-translate-y-1 transition-all disabled:opacity-50">
              {saving ? '💾 Saving...' : saved ? '✅ Saved!' : '💾 Save Scores'}
            </button>
            <button onClick={() => setScores({ aptitude: 0, coding: 0, core_subjects: 0, soft_skills: 0, attendance: 0, backlogs: 0 })}
              className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-4 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all">
              Reset
            </button>
          </div>

          {saved && (
            <div className="p-4 bg-white border-4 border-[#1A1035] shadow-[4px_4px_0px_#00C9A7] rounded-xl text-sm font-bold text-[#1A1035]">
              ✅ Scores saved successfully! The student&apos;s dashboard will update in real-time via Supabase Realtime.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
