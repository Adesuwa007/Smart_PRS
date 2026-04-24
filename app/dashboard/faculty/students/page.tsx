'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudentsWithScores } from '@/lib/mock-data';

export default function FacultyStudentsPage() {
  const allStudents = getAllStudentsWithScores();
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');

  const filtered = allStudents.filter(s =>
    (dept === 'all' || s.department === dept) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-bold
                        ${prsScore >= 75 ? 'bg-emerald-500/15 text-emerald-400' : prsScore >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                        {prsScore.toFixed(1)}
                      </span>
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
      </div>
    </DashboardLayout>
  );
}
