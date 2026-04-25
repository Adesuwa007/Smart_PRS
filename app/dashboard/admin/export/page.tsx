'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UpgradeModal from '@/components/modals/UpgradeModal';
import { getAllStudentsWithScores } from '@/lib/mock-data';

export default function AdminExportPage() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const allStudents = getAllStudentsWithScores();

  const preview = allStudents.slice(0, 5);

  return (
    <DashboardLayout role="admin" userName="User">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Export Data 📁</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Download student readiness data as CSV for external analysis</p>
        </div>

        {/* Export Options */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'All Students CSV', desc: 'Complete batch with all scores and PRS', icon: '📊', pro: true, color: '#6C47FF' },
            { title: 'At-Risk Students', desc: 'Students with PRS below 50', icon: '⚠️', pro: true, color: '#FF4D6D' },
            { title: 'Company Eligibility Report', desc: 'Tier-wise eligible students list', icon: '🏢', pro: true, color: '#FFB347' },
            { title: 'Department Analytics', desc: 'Dept-wise summary statistics', icon: '📈', pro: false, color: '#00C9A7' },
          ].map((option, i) => (
            <div key={i} className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[8px_8px_0px_#1A1035] transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full border-r-4 border-[#1A1035]" style={{ backgroundColor: option.color }}></div>
              <div className="flex items-center gap-4 mb-6 pl-2">
                <div className="w-12 h-12 bg-[#F8F7FF] border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] rounded-xl flex items-center justify-center text-2xl">{option.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black text-[#1A1035] uppercase tracking-tight">{option.title}</p>
                    {option.pro && <span className="bg-[#6C47FF] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 border-[#1A1035] rounded-full shadow-[2px_2px_0px_#1A1035]">PRO</span>}
                  </div>
                  <p className="text-xs font-bold text-[#1A1035]/60 mt-1">{option.desc}</p>
                </div>
              </div>
              <button
                onClick={() => option.pro ? setUpgradeOpen(true) : null}
                className={option.pro ? 'w-full bg-[#F8F7FF] text-[#1A1035] font-black uppercase tracking-wider py-3 rounded-xl border-2 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs' : 'w-full bg-[#1A1035] text-white font-black uppercase tracking-wider py-3 rounded-xl border-2 border-[#1A1035] shadow-[4px_4px_0px_#00C9A7] hover:shadow-[6px_6px_0px_#00C9A7] hover:-translate-y-1 transition-all text-xs'}>
                {option.pro ? '🔒 Upgrade to Export' : '📥 Download Free'}
              </button>
            </div>
          ))}
        </div>

        {/* CSV Preview */}
        <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b-4 border-[#1A1035]/10 pb-4">
            <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider">Data Preview (first 5 rows)</h3>
            <button onClick={() => setUpgradeOpen(true)} className="bg-[#6C47FF] text-white font-black uppercase tracking-wider py-2 px-4 rounded-xl border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs flex items-center gap-2">
              📁 Export Full CSV <span className="bg-white text-[#1A1035] px-1.5 py-0.5 rounded text-[8px]">PRO</span>
            </button>
          </div>
          <div className="overflow-x-auto font-mono text-xs">
            <div className="bg-[#F8F7FF] rounded-xl p-6 border-4 border-[#1A1035] shadow-inner">
              <div className="text-[#00C9A7] font-black mb-3">name,department,prs,aptitude,coding,core_subjects,soft_skills,attendance,backlogs,tier</div>
              {preview.map(s => (
                <div key={s.id} className="text-[#1A1035] font-medium leading-relaxed">
                  {s.name},{s.department},{s.prs?.score.toFixed(1)},{s.scores?.aptitude},{s.scores?.coding},{s.scores?.core_subjects},{s.scores?.soft_skills},{s.scores?.attendance},{s.scores?.backlogs},&quot;{s.prs?.companyTiers[0]}&quot;
                </div>
              ))}
              <div className="text-[#1A1035]/40 font-bold mt-4">... {allStudents.length - 5} more rows (upgrade to export all)</div>
            </div>
          </div>
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="CSV Export" />
    </DashboardLayout>
  );
}
