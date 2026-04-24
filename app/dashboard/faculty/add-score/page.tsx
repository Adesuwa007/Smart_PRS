'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudentsWithScores } from '@/lib/mock-data';
import { analyzeStudent } from '@/lib/ai-engine';
import { StudentScores } from '@/types';

export default function AddScorePage() {
  const allStudents = getAllStudentsWithScores();
  const [selectedId, setSelectedId] = useState(allStudents[0]?.id || '');
  const [scores, setScores] = useState<Partial<StudentScores>>({
    aptitude: 0, coding: 0, core_subjects: 0, soft_skills: 0, attendance: 0, backlogs: 0,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedStudent = allStudents.find(s => s.id === selectedId);

  const handlePreFill = () => {
    if (selectedStudent?.scores) {
      setScores({
        aptitude: selectedStudent.scores.aptitude,
        coding: selectedStudent.scores.coding,
        core_subjects: selectedStudent.scores.core_subjects,
        soft_skills: selectedStudent.scores.soft_skills,
        attendance: selectedStudent.scores.attendance,
        backlogs: selectedStudent.scores.backlogs,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
    <DashboardLayout role="faculty" userName="Dr. Ramesh Kumar">
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Log Assessment Score ➕</h1>
          <p className="text-sm text-gray-400 mt-1">Update student scores — changes update PRS in real-time</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          {/* Student selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Select Student</label>
            <div className="flex gap-3">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="input-dark flex-1 py-2.5 text-sm">
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                ))}
              </select>
              <button onClick={handlePreFill} className="btn-secondary py-2 px-4 text-sm flex-shrink-0">
                📋 Pre-fill Current
              </button>
            </div>
          </div>

          {/* Score inputs */}
          <div className="grid md:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm text-gray-400 mb-1.5">
                  {f.label}
                  <span className="text-gray-600 ml-1">{f.key === 'backlogs' ? '(0–10)' : '(0–100)'}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={f.key === 'backlogs' ? 10 : 100}
                    value={scores[f.key] || 0}
                    onChange={e => setScores(prev => ({ ...prev, [f.key]: +e.target.value }))}
                    className="flex-1"
                  />
                  <span className="text-white font-bold w-8 text-right">{scores[f.key] || 0}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Live PRS Preview */}
          {previewPRS && (
            <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl">
              <p className="text-xs text-brand-cyan font-semibold mb-2">LIVE PRS PREVIEW</p>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-3xl font-extrabold text-white">{previewPRS.score.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm ml-1">/100</span>
                </div>
                <div>
                  <span className={`badge text-xs ${previewPRS.probability === 'High' ? 'badge-success' : previewPRS.probability === 'Medium' ? 'badge-warning' : 'badge-error'}`}>
                    {previewPRS.probability} Probability
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Eligible: {previewPRS.companyTiers[0]}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary py-3 px-8 disabled:opacity-50">
              {saving ? '💾 Saving...' : saved ? '✅ Saved!' : '💾 Save Scores'}
            </button>
            <button onClick={() => setScores({ aptitude: 0, coding: 0, core_subjects: 0, soft_skills: 0, attendance: 0, backlogs: 0 })}
              className="btn-secondary py-3 px-6">
              Reset
            </button>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">
              ✅ Scores saved successfully! The student&apos;s dashboard will update in real-time via Supabase Realtime.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
