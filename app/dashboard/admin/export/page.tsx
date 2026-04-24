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
    <DashboardLayout role="admin" userName="Prof. Anitha Desai">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Export Data 📁</h1>
          <p className="text-sm text-gray-400">Download student readiness data as CSV for external analysis</p>
        </div>

        {/* Export Options */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'All Students CSV', desc: 'Complete batch with all scores and PRS', icon: '📊', pro: true },
            { title: 'At-Risk Students', desc: 'Students with PRS below 50', icon: '⚠️', pro: true },
            { title: 'Company Eligibility Report', desc: 'Tier-wise eligible students list', icon: '🏢', pro: true },
            { title: 'Department Analytics', desc: 'Dept-wise summary statistics', icon: '📈', pro: false },
          ].map((option, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{option.title}</p>
                    {option.pro && <span className="pro-badge text-[8px]">PRO</span>}
                  </div>
                  <p className="text-xs text-gray-500">{option.desc}</p>
                </div>
              </div>
              <button
                onClick={() => option.pro ? setUpgradeOpen(true) : null}
                className={option.pro ? 'btn-secondary py-2 px-4 text-sm w-full justify-center' : 'btn-primary py-2 px-4 text-sm w-full justify-center'}>
                {option.pro ? '🔒 Upgrade to Export' : '📥 Download Free'}
              </button>
            </div>
          ))}
        </div>

        {/* CSV Preview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Data Preview (first 5 rows)</h3>
            <button onClick={() => setUpgradeOpen(true)} className="btn-purple py-1.5 px-4 text-xs">
              📁 Export Full CSV <span className="pro-badge ml-1 text-[8px]">PRO</span>
            </button>
          </div>
          <div className="overflow-x-auto font-mono text-xs">
            <div className="bg-brand-dark/80 rounded-xl p-4 border border-brand-border">
              <div className="text-brand-cyan mb-2">name,department,prs,aptitude,coding,core_subjects,soft_skills,attendance,backlogs,tier</div>
              {preview.map(s => (
                <div key={s.id} className="text-gray-400">
                  {s.name},{s.department},{s.prs?.score.toFixed(1)},{s.scores?.aptitude},{s.scores?.coding},{s.scores?.core_subjects},{s.scores?.soft_skills},{s.scores?.attendance},{s.scores?.backlogs},&quot;{s.prs?.companyTiers[0]}&quot;
                </div>
              ))}
              <div className="text-gray-600 mt-2">... {allStudents.length - 5} more rows (upgrade to export all)</div>
            </div>
          </div>
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="CSV Export" />
    </DashboardLayout>
  );
}
