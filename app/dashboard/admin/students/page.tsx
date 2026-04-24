'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UpgradeModal from '@/components/modals/UpgradeModal';
import { getAllStudentsWithScores } from '@/lib/mock-data';
import { analyzeStudent } from '@/lib/ai-engine';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

type NewStudent = {
  name: string;
  department: string;
  aptitude: number;
  coding: number;
  core_subjects: number;
  soft_skills: number;
  attendance: number;
};

const BLANK: NewStudent = { name: '', department: 'CS', aptitude: 75, coding: 75, core_subjects: 75, soft_skills: 75, attendance: 85 };

export default function AdminStudentsPage() {
  const mockStudents = getAllStudentsWithScores();
  const [extraStudents, setExtraStudents] = useState<ReturnType<typeof getAllStudentsWithScores>>([]);
  const allStudents = [...mockStudents, ...extraStudents];

  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [prsMin, setPrsMin] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewStudent>(BLANK);
  const [saving, setSaving] = useState(false);
  const PER_PAGE = 20;

  const filtered = allStudents.filter(s =>
    (dept === 'all' || s.department === dept) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase())) &&
    (prsMin === 0 || (s.prs?.score || 0) >= prsMin)
  );

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Step 1: Insert into profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        name: form.name,
        email: `${form.name.toLowerCase().replace(/\s+/g, '')}@vvce.ac.in`,
        role: 'student',
        college_id: 'vvce-mysuru',
        plan: 'free',
      })
      .select()
      .single();

    if (!profileError && profile) {
      // Step 2: Insert into student_scores using returned profile.id
      const { error: scoresError } = await supabase.from('student_scores').insert({
        student_id: profile.id,
        aptitude: Number(form.aptitude),
        coding: Number(form.coding),
        core_subjects: Number(form.core_subjects),
        soft_skills: Number(form.soft_skills),
        attendance: Number(form.attendance) || 80,
        backlogs: 0,
        department: form.department || 'CSE',
      });

      if (!scoresError) {
        toast.success('Student added successfully!');
      } else {
        toast('Student profile saved, scores failed: ' + scoresError.message, { icon: '⚠️' });
      }

      // Add to local state using Supabase-returned profile.id
      const scoreRow = {
        id: crypto.randomUUID(),
        student_id: profile.id,
        aptitude: form.aptitude,
        coding: form.coding,
        core_subjects: form.core_subjects,
        soft_skills: form.soft_skills,
        attendance: form.attendance,
        backlogs: 0,
        mock_tests_completed: 0,
        updated_at: new Date().toISOString(),
      };
      const prs = analyzeStudent(scoreRow);
      setExtraStudents(prev => [...prev, {
        id: profile.id,
        name: form.name,
        email: `${form.name.toLowerCase().replace(/\s+/g, '')}@vvce.ac.in`,
        role: 'student' as const,
        college_id: 'vvce-mysuru',
        plan: 'free' as const,
        department: form.department as 'CS' | 'IS' | 'ECE',
        created_at: new Date().toISOString(),
        scores: scoreRow,
        prs,
      }]);
    } else {
      // Fallback: add to local state only
      toast('Saved locally — connect Supabase to persist', { icon: '⚠️' });
      const localId = crypto.randomUUID();
      const scoreRow = {
        id: crypto.randomUUID(),
        student_id: localId,
        aptitude: form.aptitude,
        coding: form.coding,
        core_subjects: form.core_subjects,
        soft_skills: form.soft_skills,
        attendance: form.attendance,
        backlogs: 0,
        mock_tests_completed: 0,
        updated_at: new Date().toISOString(),
      };
      const prs = analyzeStudent(scoreRow);
      setExtraStudents(prev => [...prev, {
        id: localId,
        name: form.name,
        email: `${form.name.toLowerCase().replace(/\s+/g, '')}@vvce.ac.in`,
        role: 'student' as const,
        college_id: '',
        plan: 'free' as const,
        department: form.department as 'CS' | 'IS' | 'ECE',
        created_at: new Date().toISOString(),
        scores: scoreRow,
        prs,
      }]);
    }

    setForm(BLANK);
    setSaving(false);
    setTimeout(() => setShowForm(false), 2000);
  };

  return (
    <DashboardLayout role="admin" userName="Admin">
      <Toaster position="top-center" />
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Students 👥</h1>
            <p className="text-sm text-gray-400">Complete student roster with scores</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(v => !v)} className="btn-secondary py-2 px-5 text-sm">
              {showForm ? '✕ Cancel' : '➕ Add Student'}
            </button>
            <button onClick={() => setUpgradeOpen(true)} className="btn-purple py-2 px-5 text-sm">
              📁 Export CSV <span className="pro-badge ml-1 text-[8px]">PRO</span>
            </button>
          </div>
        </div>

        {/* Add Student Form */}
        {showForm && (
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-4">Add New Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
                  <input
                    className="input-dark py-2 text-sm w-full"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Riya Patel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Department</label>
                  <select
                    className="input-dark py-2 text-sm w-full"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="CS">CS</option>
                    <option value="IS">IS</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {([
                  { key: 'aptitude', label: 'Aptitude' },
                  { key: 'coding', label: 'Coding' },
                  { key: 'core_subjects', label: 'Core Subjects' },
                  { key: 'soft_skills', label: 'Soft Skills' },
                  { key: 'attendance', label: 'Attendance %' },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1">{f.label}: {form[f.key]}</label>
                    <input
                      type="range" min="0" max="100"
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: +e.target.value }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6 disabled:opacity-50">
                  {saving ? 'Saving...' : '💾 Add Student'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-card p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Search</label>
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-dark py-2 text-sm" placeholder="Name..." style={{ width: 180 }} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)} className="input-dark py-2 text-sm">
              <option value="all">All</option>
              <option value="CS">CS</option>
              <option value="IS">IS</option>
              <option value="ECE">ECE</option>
            </select>
          </div>
          <div style={{ width: 160 }}>
            <label className="block text-[10px] text-gray-500 mb-1">Min PRS: {prsMin}</label>
            <input type="range" min="0" max="100" value={prsMin} onChange={e => setPrsMin(+e.target.value)} />
          </div>
          <button onClick={() => { setSearch(''); setDept('all'); setPrsMin(0); }} className="btn-secondary py-2 px-4 text-xs">Reset</button>
        </div>

        <div className="glass-card p-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Students ({filtered.length})</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Dept</th>
                <th>PRS</th>
                <th>Aptitude</th>
                <th>Coding</th>
                <th>Core</th>
                <th>Soft</th>
                <th>Attendance</th>
                <th>Backlogs</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, idx) => {
                const prsScore = s.prs?.score || 0;
                const tier = s.prs?.companyTiers[0] || '';
                return (
                  <tr key={s.id}>
                    <td className="text-gray-600">{(page - 1) * PER_PAGE + idx + 1}</td>
                    <td className="text-white font-medium">{s.name}</td>
                    <td><span className="badge badge-purple text-xs">{s.department}</span></td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-bold
                        ${prsScore >= 75 ? 'bg-emerald-500/15 text-emerald-400' : prsScore >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                        {prsScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="text-gray-300">{s.scores?.aptitude}</td>
                    <td className="text-gray-300">{s.scores?.coding}</td>
                    <td className="text-gray-300">{s.scores?.core_subjects}</td>
                    <td className="text-gray-300">{s.scores?.soft_skills}</td>
                    <td className={(s.scores?.attendance || 0) >= 75 ? 'text-emerald-400' : 'text-red-400'}>{s.scores?.attendance}%</td>
                    <td>{(s.scores?.backlogs || 0) > 0 ? <span className="badge badge-error text-xs">{s.scores?.backlogs}</span> : <span className="text-gray-600">0</span>}</td>
                    <td><span className="text-xs text-gray-400">{tier.length > 14 ? tier.slice(0, 14) + '…' : tier}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">← Prev</button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="CSV Export" />
    </DashboardLayout>
  );
}
