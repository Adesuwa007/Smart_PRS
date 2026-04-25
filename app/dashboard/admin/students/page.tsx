'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UpgradeModal from '@/components/modals/UpgradeModal';
import { getAllStudents, subscribeToStudentUpdates, type UnifiedStudent } from '@/lib/students-service';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

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
  const [allStudents, setAllStudents] = useState<UnifiedStudent[]>([]);

  useEffect(() => {
    getAllStudents().then(data => { setAllStudents(data); });
    const sub = subscribeToStudentUpdates(() => getAllStudents().then(setAllStudents));
    return () => { sub.unsubscribe(); };
  }, []);

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
    (prsMin === 0 || s.prs >= prsMin)
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
      // Re-fetch since we added a local extra
      getAllStudents().then(setAllStudents);
    }

    setForm(BLANK);
    setSaving(false);
    setTimeout(() => setShowForm(false), 2000);
  };

  return (
    <DashboardLayout role="admin" userName="User">
      <Toaster position="top-center" />
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#1A1035] pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">All Students 👥</h1>
            <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Complete student roster with scores</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowForm(v => !v)} className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-3 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs">
              {showForm ? '✕ Cancel' : '➕ Add Student'}
            </button>
            <button onClick={() => setUpgradeOpen(true)} className="bg-[#6C47FF] text-white font-black uppercase tracking-wider py-3 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs flex items-center gap-2">
              📁 Export CSV <span className="bg-white text-[#1A1035] px-1.5 py-0.5 rounded text-[8px] tracking-widest">PRO</span>
            </button>
          </div>
        </div>

        {/* Add Student Form */}
        {showForm && (
          <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#00C9A7] border-r-4 border-[#1A1035]"></div>
            <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 pl-4 border-b-4 border-[#1A1035]/10 pb-4">Add New Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-6 pl-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">Full Name *</label>
                  <input
                    className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] focus:-translate-y-1 transition-all outline-none"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Riya Patel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#1A1035] uppercase tracking-wider mb-2">Department</label>
                  <select
                    className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] focus:-translate-y-1 transition-all outline-none appearance-none"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="CS">CS</option>
                    <option value="IS">IS</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t-4 border-[#1A1035]/10">
                {([
                  { key: 'aptitude', label: 'Aptitude' },
                  { key: 'coding', label: 'Coding' },
                  { key: 'core_subjects', label: 'Core Subjects' },
                  { key: 'soft_skills', label: 'Soft Skills' },
                  { key: 'attendance', label: 'Attendance %' },
                ] as const).map(f => (
                  <div key={f.key} className="bg-[#F8F7FF] border-2 border-[#1A1035] p-4 rounded-xl shadow-[4px_4px_0px_#1A1035]">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-black text-[#1A1035]/60 uppercase tracking-wider">{f.label}</label>
                      <span className="text-sm font-black text-[#1A1035] bg-white border-2 border-[#1A1035] px-2 py-0.5 rounded shadow-[2px_2px_0px_#1A1035]">{form[f.key]}</span>
                    </div>
                    <input
                      type="range" min="0" max="100"
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: +e.target.value }))}
                      className="w-full accent-[#00C9A7]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button type="submit" disabled={saving} className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-4 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#00C9A7] hover:shadow-[6px_6px_0px_#00C9A7] hover:-translate-y-1 transition-all disabled:opacity-50 w-full sm:w-auto">
                  {saving ? 'Saving...' : '💾 Add Student'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2">Search</label>
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[2px_2px_0px_#6C47FF] transition-all" placeholder="Name..." />
          </div>
          <div className="w-[150px]">
            <label className="block text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2">Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)} className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1A1035] outline-none appearance-none">
              <option value="all">All</option>
              <option value="CS">CS</option>
              <option value="IS">IS</option>
              <option value="ECE">ECE</option>
            </select>
          </div>
          <div className="w-[200px] bg-[#F8F7FF] border-2 border-[#1A1035] p-2.5 rounded-xl">
            <label className="block text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2">Min PRS: <span className="text-[#6C47FF] bg-white border-2 border-[#1A1035] px-2 py-0.5 rounded shadow-[2px_2px_0px_#1A1035] ml-2">{prsMin}</span></label>
            <input type="range" min="0" max="100" value={prsMin} onChange={e => setPrsMin(+e.target.value)} className="w-full accent-[#6C47FF]" />
          </div>
          <button onClick={() => { setSearch(''); setDept('all'); setPrsMin(0); }} className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-2.5 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs">Reset Filters</button>
        </div>

        <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b-4 border-[#1A1035]/10 pb-4">
            <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider">Students ({filtered.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-[#1A1035]">
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF] border-r-4 border-[#1A1035]">#</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Name</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Dept</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">PRS</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Aptitude</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Coding</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Core</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Soft</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Attendance</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Backlogs</th>
                  <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#1A1035]/10">
                {paginated.map((s, idx) => {
                  const prsScore = s.prs || 0;
                  const tier = s.status || '';
                  return (
                    <tr key={s.id} className="hover:bg-[#F8F7FF] transition-colors">
                      <td className="py-4 px-4 text-[#1A1035]/60 font-black border-r-4 border-[#1A1035]">{(page - 1) * PER_PAGE + idx + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-[#1A1035] font-black">{s.name}</span>
                          <span className="text-[10px] font-bold text-[#1A1035]/40 uppercase mt-0.5">
                            {s.usn || `4VV24${s.department === 'ECE' ? 'EC' : (s.department || 'CS')}${String(idx + 1).padStart(3, '0')}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4"><span className="bg-white text-[#1A1035] border-2 border-[#1A1035] shadow-[2px_2px_0px_#6C47FF] px-2 py-1 text-xs font-black uppercase tracking-wider rounded">{s.department}</span></td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] text-sm font-black
                          ${prsScore >= 75 ? 'bg-[#00C9A7] text-[#1A1035]' : prsScore >= 50 ? 'bg-[#FFB347] text-[#1A1035]' : 'bg-[#FF4D6D] text-white'}`}>
                          {prsScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#1A1035] font-bold">{s.aptitude}</td>
                      <td className="py-4 px-4 text-[#1A1035] font-bold">{s.coding}</td>
                      <td className="py-4 px-4 text-[#1A1035] font-bold">{s.core_subjects}</td>
                      <td className="py-4 px-4 text-[#1A1035] font-bold">{s.soft_skills}</td>
                      <td className={`py-4 px-4 font-black ${(s.attendance || 0) >= 75 ? 'text-[#00C9A7]' : 'text-[#FF4D6D]'}`}>{s.attendance}%</td>
                      <td className="py-4 px-4">{(s.backlogs || 0) > 0 ? <span className="bg-[#FF4D6D] text-white border-2 border-[#1A1035] px-2 py-0.5 rounded text-xs font-black shadow-[2px_2px_0px_#1A1035]">{s.backlogs}</span> : <span className="text-[#1A1035]/50 font-bold">0</span>}</td>
                      <td className="py-4 px-4"><span className="text-xs font-bold text-[#1A1035] bg-[#F8F7FF] border-2 border-[#1A1035] px-2 py-1 rounded whitespace-nowrap">{tier.length > 14 ? tier.slice(0, 14) + '…' : tier}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t-4 border-[#1A1035]/10 text-sm font-black text-[#1A1035]">
              <span className="uppercase tracking-widest">Page {page} of {totalPages}</span>
              <div className="flex gap-4">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-2 px-4 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#1A1035]">← Prev</button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-2 px-4 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#6C47FF] hover:shadow-[6px_6px_0px_#6C47FF] hover:-translate-y-1 transition-all text-xs disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#6C47FF]">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="CSV Export" />
    </DashboardLayout>
  );
}
