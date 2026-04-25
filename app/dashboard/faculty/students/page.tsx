'use client';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudents, subscribeToStudentUpdates, type UnifiedStudent } from '@/lib/students-service';
import { getStudentPortfolio } from '@/lib/client-data';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

const PRS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'low', label: 'Low PRS (<50)' },
  { key: 'attention', label: 'Needs Attention (50-65)' },
  { key: 'track', label: 'On Track (65-80)' },
  { key: 'ready', label: 'Placement Ready (80+)' },
] as const;

type PrsFilter = (typeof PRS_FILTERS)[number]['key'];

export default function FacultyStudentsPage() {
  const [allStudents, setAllStudents] = useState<UnifiedStudent[]>([]);

  useEffect(() => {
    getAllStudents().then(data => { setAllStudents(data); });
    const sub = subscribeToStudentUpdates(() => getAllStudents().then(setAllStudents));
    return () => { sub.unsubscribe(); };
  }, []);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [prsFilter, setPrsFilter] = useState<PrsFilter>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = selectedStudentId ? allStudents.find(s => s.id === selectedStudentId) : null;
  const selectedPortfolio = selectedStudent ? getStudentPortfolio(selectedStudent.id, selectedStudent.name) : null;

  const draggingSkill = useMemo(() => {
    if (!selectedStudent) return null;
    const ordered = [
      { skill: 'Coding', value: selectedStudent.coding },
      { skill: 'Aptitude', value: selectedStudent.aptitude },
      { skill: 'Core Subjects', value: selectedStudent.core_subjects },
      { skill: 'Soft Skills', value: selectedStudent.soft_skills },
      { skill: 'Attendance', value: selectedStudent.attendance },
    ].sort((a, b) => a.value - b.value);
    return ordered[0];
  }, [selectedStudent]);

  const filtered = allStudents.filter(s => {
    const score = s.prs || 0;
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
    <DashboardLayout role="faculty" userName="Faculty">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Student List 👥</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Review student performance and PRS breakdown</p>
        </div>

        <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] space-y-4">
          <div className="flex flex-wrap gap-4">
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-auto flex-1 max-w-sm bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] transition-all" placeholder="Search by name..." />
            <select value={dept} onChange={e => setDept(e.target.value)} className="w-full sm:w-auto bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] transition-all appearance-none">
              <option value="all">All Departments</option>
              <option value="CS">CS</option>
              <option value="IS">IS</option>
              <option value="ECE">ECE</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {PRS_FILTERS.map(filter => (
              <button
                key={filter.key}
                onClick={() => setPrsFilter(filter.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  prsFilter === filter.key
                    ? 'border-[#1A1035] bg-[#6C47FF] text-white shadow-[2px_2px_0px_#1A1035] -translate-y-0.5'
                    : 'border-[#1A1035] bg-white text-[#1A1035] hover:shadow-[2px_2px_0px_#1A1035] hover:-translate-y-0.5'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-4 border-[#1A1035]">
                <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF] border-r-4 border-[#1A1035]">Name</th>
                <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Dept</th>
                <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">PRS</th>
                <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Coding</th>
                <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Aptitude</th>
                <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Attendance</th>
                <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Backlogs</th>
                <th className="py-4 px-4 text-xs font-black text-[#1A1035] uppercase tracking-wider bg-[#F8F7FF]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#1A1035]/10">
              {filtered.map(s => {
                const prsScore = s.prs || 0;
                return (
                  <tr 
                    key={s.id} 
                    className="transition-colors"
                    onClick={() => setSelectedStudentId(s.id)}
                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,71,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="py-4 px-4 border-r-4 border-[#1A1035]">
                      <div className="flex flex-col">
                        <span className="text-[#1A1035] font-black">{s.name}</span>
                        <span className="text-[10px] font-bold text-[#1A1035]/40 uppercase mt-0.5">{s.usn}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4"><span className="bg-white text-[#1A1035] border-2 border-[#1A1035] shadow-[2px_2px_0px_#6C47FF] px-2 py-1 text-xs font-black uppercase tracking-wider rounded">{s.department}</span></td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded border-2 border-[#1A1035] text-sm font-black shadow-[2px_2px_0px_#1A1035] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1035] transition-all
                        ${prsScore >= 75 ? 'bg-[#00C9A7] text-[#1A1035]' : prsScore >= 50 ? 'bg-[#FFB347] text-[#1A1035]' : 'bg-[#FF4D6D] text-white'}`}
                      >
                        {prsScore.toFixed(1)}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-[#1A1035] font-bold">{s.coding}</td>
                    <td className="py-4 px-4 text-[#1A1035] font-bold">{s.aptitude}</td>
                    <td className={`py-4 px-4 font-black ${(s.attendance || 0) >= 75 ? 'text-[#00C9A7]' : 'text-[#FF4D6D]'}`}>
                      {s.attendance}%
                    </td>
                    <td className="py-4 px-4">{(s.backlogs || 0) > 0 ? <span className="bg-[#FF4D6D] text-white border-2 border-[#1A1035] px-2 py-0.5 rounded text-xs font-black shadow-[2px_2px_0px_#1A1035]">{s.backlogs}</span> : <span className="text-[#1A1035]/50 font-bold">0</span>}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs font-black uppercase tracking-widest border-2 border-[#1A1035] rounded shadow-[2px_2px_0px_#1A1035] whitespace-nowrap ${prsScore >= 75 ? 'bg-white text-[#00C9A7]' : prsScore >= 50 ? 'bg-[#FFB347] text-[#1A1035]' : 'bg-[#FF4D6D] text-white'}`}>
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
          <div className="fixed inset-0 z-50 bg-[#1A1035]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl p-6 sm:p-8 space-y-6 border-4 border-[#1A1035] shadow-[12px_12px_0px_#00C9A7] rounded-2xl relative">
              <div className="flex items-center justify-between border-b-4 border-[#1A1035]/10 pb-4">
                <h3 className="text-xl font-black text-[#1A1035] uppercase tracking-tight flex items-center gap-3">
                  {selectedStudent.name} — PRS Breakdown
                  <span className="text-xs font-bold text-[#1A1035]/40 tracking-widest mt-1">{(selectedStudent as unknown as { usn?: string }).usn || `4VV24${selectedStudent.department === 'ECE' ? 'EC' : (selectedStudent.department || 'CS')}001`}</span>
                </h3>
                <button onClick={() => setSelectedStudentId(null)} className="text-[#1A1035] hover:text-[#FF4D6D] transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  ['Coding', selectedStudent.coding],
                  ['Aptitude', selectedStudent.aptitude],
                  ['Core', selectedStudent.core_subjects],
                  ['Soft', selectedStudent.soft_skills],
                  ['Attendance', selectedStudent.attendance],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] text-center">
                    <p className="text-[10px] font-black text-[#1A1035]/60 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-2xl font-black text-[#1A1035]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border-4 border-[#1A1035] bg-white shadow-[4px_4px_0px_#FF4D6D] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#FF4D6D] border-r-4 border-[#1A1035]"></div>
                <div className="pl-4">
                  <p className="text-sm text-[#FF4D6D] font-black uppercase tracking-wider">
                    Main Dragging Skill: {draggingSkill?.skill} <span className="bg-[#FF4D6D] text-white px-1.5 py-0.5 rounded border-2 border-[#1A1035] text-xs shadow-[2px_2px_0px_#1A1035]">{draggingSkill?.value}</span>
                  </p>
                  <p className="text-sm font-bold text-[#1A1035]/70 mt-2">
                    Focus practice on weakest area to lift PRS quickly.
                  </p>
                </div>
              </div>

              {selectedPortfolio && (
                <div className="p-5 rounded-xl border-4 border-[#1A1035] bg-[#F8F7FF] shadow-[4px_4px_0px_#6C47FF]">
                  <p className="text-sm text-[#1A1035] font-black uppercase tracking-wider mb-4 border-b-4 border-[#1A1035]/10 pb-2 inline-block">Mini Portfolio Card</p>
                  <p className="text-xs font-bold text-[#1A1035]/70 mb-2">
                    <span className="uppercase tracking-widest text-[#1A1035]/50">LinkedIn:</span> {selectedPortfolio.linkedInUrl || 'Not added'}
                  </p>
                  <p className="text-xs font-bold text-[#1A1035]/70">
                    <span className="uppercase tracking-widest text-[#1A1035]/50">GitHub:</span>{' '}
                    {selectedPortfolio.githubUsername
                      ? `github.com/${selectedPortfolio.githubUsername}`
                      : 'Not added'}
                  </p>
                  <div className="mt-4 pt-4 border-t-2 border-[#1A1035]/10">
                    <p className="text-[10px] font-black text-[#1A1035]/50 uppercase tracking-widest mb-2">Top Projects</p>
                    {selectedPortfolio.topProjects.filter(Boolean).length === 0 ? (
                      <p className="text-xs font-bold text-[#1A1035]/50 italic">No projects added</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedPortfolio.topProjects.filter(Boolean).map(project => (
                          <div key={project} className="text-xs font-bold text-[#1A1035] flex items-start gap-2">
                            <span className="text-[#00C9A7] font-black">▶</span> {project}
                          </div>
                        ))}
                      </div>
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
