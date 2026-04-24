'use client';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudentsWithScores } from '@/lib/mock-data';
import { getStudentPortfolio } from '@/lib/client-data';
import { analyzeStudent } from '@/lib/ai-engine';
import { useAuth } from '@/lib/auth-context';

const PRS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'low', label: 'Low PRS (<50)' },
  { key: 'attention', label: 'Needs Attention (50-65)' },
  { key: 'track', label: 'On Track (65-80)' },
  { key: 'ready', label: 'Placement Ready (80+)' },
] as const;

type PrsFilter = (typeof PRS_FILTERS)[number]['key'];

export default function FacultyStudentsPage() {
  const { user } = useAuth();
  const allStudents = useMemo(() => {
    const base = getAllStudentsWithScores();
    if (!user || user.role !== 'student') return base;
    const exists = base.some(s => s.name.toLowerCase() === user.name.toLowerCase() || s.email.toLowerCase() === user.email.toLowerCase());
    if (exists) return base;
    const seed = base.find(s => s.name === 'Arjun Sharma') || base[0];
    if (!seed) return base;
    return [{ ...seed, id: user.id, name: user.name, email: user.email }, ...base];
  }, [user]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [prsFilter, setPrsFilter] = useState<PrsFilter>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = selectedStudentId ? allStudents.find(s => s.id === selectedStudentId) : null;
  const selectedScores = selectedStudent?.scores;
  const selectedPortfolio = selectedStudent ? getStudentPortfolio(selectedStudent.id, selectedStudent.name) : null;

  const draggingSkill = useMemo(() => {
    if (!selectedScores) return null;
    const ordered = [
      { skill: 'Coding', value: selectedScores.coding },
      { skill: 'Aptitude', value: selectedScores.aptitude },
      { skill: 'Core Subjects', value: selectedScores.core_subjects },
      { skill: 'Soft Skills', value: selectedScores.soft_skills },
      { skill: 'Attendance', value: selectedScores.attendance },
    ].sort((a, b) => a.value - b.value);
    return ordered[0];
  }, [selectedScores]);

  const filtered = allStudents.filter(s => {
    const score = s.prs?.score || 0;
    const prsMatch =
      prsFilter === 'all' ||
      (prsFilter === 'low' && score < 50) ||
      (prsFilter === 'attention' && score >= 50 && score < 65) ||
      (prsFilter === 'track' && score >= 65 && score < 80) ||
      (prsFilter === 'ready' && score >= 80);
    return (dept === 'all' || s.department === dept) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase())) &&
      prsMatch;
  });

  return (
    <DashboardLayout role="faculty" userName="Dr. Ramesh Kumar">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Student List 👥</h1>

        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-dark max-w-xs py-2 text-sm" placeholder="Search by name..." />
          <select value={dept} onChange={e => setDept(e.target.value)} className="input-dark max-w-[150px] py-2 text-sm">
            <option value="all">All Departments</option>
            <option value="CS">CS</option>
            <option value="IS">IS</option>
            <option value="ECE">ECE</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRS_FILTERS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setPrsFilter(filter.key)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${
                prsFilter === filter.key
                  ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-300'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="glass-card p-6 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dept</th>
                <th>PRS</th>
                <th>Coding</th>
                <th>Aptitude</th>
                <th>Attendance</th>
                <th>Backlogs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const prsScore = s.prs?.score || 0;
                return (
                  <tr key={s.id}>
                    <td className="text-white font-medium">{s.name}</td>
                    <td><span className="badge badge-purple text-xs">{s.department}</span></td>
                    <td>
                      <button
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-bold underline-offset-2 hover:underline
                        ${prsScore >= 75 ? 'bg-emerald-500/15 text-emerald-400' : prsScore >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}
                      >
                        {prsScore.toFixed(1)}
                      </button>
                    </td>
                    <td className="text-gray-300">{s.scores?.coding}</td>
                    <td className="text-gray-300">{s.scores?.aptitude}</td>
                    <td>
                      <span className={(s.scores?.attendance || 0) >= 75 ? 'text-emerald-400' : 'text-red-400'}>
                        {s.scores?.attendance}%
                      </span>
                    </td>
                    <td>{(s.scores?.backlogs || 0) > 0 ? <span className="badge badge-error text-xs">{s.scores?.backlogs}</span> : <span className="text-gray-600">0</span>}</td>
                    <td>
                      <span className={`badge text-xs ${prsScore >= 75 ? 'badge-success' : prsScore >= 50 ? 'badge-warning' : 'badge-error'}`}>
                        {prsScore >= 75 ? 'Ready' : prsScore >= 50 ? 'On Track' : 'At Risk'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedStudent && selectedScores && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{selectedStudent.name} — PRS Breakdown</h3>
                <button onClick={() => setSelectedStudentId(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  ['Coding', selectedScores.coding],
                  ['Aptitude', selectedScores.aptitude],
                  ['Core', selectedScores.core_subjects],
                  ['Soft', selectedScores.soft_skills],
                  ['Attendance', selectedScores.attendance],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 rounded-xl bg-brand-surface border border-white/10 text-center">
                    <p className="text-[10px] text-gray-500 uppercase">{label}</p>
                    <p className="text-xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                <p className="text-sm text-red-300 font-semibold">
                  Main Dragging Skill: {draggingSkill?.skill} ({draggingSkill?.value})
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {analyzeStudent(selectedScores).weakAreas[0]?.recommendation || 'Focus practice on weakest area to lift PRS quickly.'}
                </p>
              </div>

              {selectedPortfolio && (
                <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d14]">
                  <p className="text-sm text-white font-semibold mb-3">Mini Portfolio Card</p>
                  <p className="text-xs text-gray-400">LinkedIn: {selectedPortfolio.linkedInUrl || 'Not added'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    GitHub:{' '}
                    {selectedPortfolio.githubUsername
                      ? `github.com/${selectedPortfolio.githubUsername}`
                      : 'Not added'}
                  </p>
                  <div className="mt-3 space-y-1">
                    {selectedPortfolio.topProjects.filter(Boolean).length === 0 ? (
                      <p className="text-xs text-gray-500">No projects added</p>
                    ) : (
                      selectedPortfolio.topProjects.filter(Boolean).map(project => (
                        <p key={project} className="text-xs text-cyan-300">• {project}</p>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
