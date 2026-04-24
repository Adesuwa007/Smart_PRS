'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudentsWithScores } from '@/lib/mock-data';

const COMPANY_TIERS = [
  { tier: 'Product (FAANG-tier)', icon: '🏆', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30', minPRS: 80, minCoding: 75 },
  { tier: 'Service (Top)', icon: '⭐', color: 'text-brand-cyan', bgColor: 'bg-brand-cyan/10 border-brand-cyan/30', minPRS: 65, minCoding: 60 },
  { tier: 'Service (Mid)', icon: '🔵', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30', minPRS: 50, minCoding: 0 },
  { tier: 'Startups', icon: '🚀', color: 'text-brand-purple', bgColor: 'bg-brand-purple/10 border-brand-purple/30', minPRS: 50, minCoding: 0 },
  { tier: 'Internships recommended first', icon: '📋', color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/30', minPRS: 0, minCoding: 0 },
];

const MOCK_COMPANIES = [
  { name: 'Google', tier: 'Product (FAANG-tier)', package: '₹45 LPA', logo: '🔍' },
  { name: 'Microsoft', tier: 'Product (FAANG-tier)', package: '₹40 LPA', logo: '🪟' },
  { name: 'Amazon', tier: 'Product (FAANG-tier)', package: '₹38 LPA', logo: '📦' },
  { name: 'Infosys', tier: 'Service (Top)', package: '₹8 LPA', logo: '💠' },
  { name: 'TCS', tier: 'Service (Top)', package: '₹7 LPA', logo: '🔷' },
  { name: 'Wipro', tier: 'Service (Mid)', package: '₹5 LPA', logo: '🔵' },
  { name: 'Cognizant', tier: 'Service (Mid)', package: '₹4.5 LPA', logo: '🌐' },
  { name: 'StartupXYZ', tier: 'Startups', package: '₹12 LPA', logo: '🚀' },
];

export default function AdminCompaniesPage() {
  const allStudents = getAllStudentsWithScores();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const eligibleForTier = (tier: string) =>
    allStudents.filter(s => s.prs?.companyTiers.includes(tier));

  const tierStudents = selectedTier ? eligibleForTier(selectedTier) : [];

  return (
    <DashboardLayout role="admin" userName="Prof. Anitha Desai">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Eligibility 🏢</h1>
          <p className="text-sm text-gray-400">See which students are eligible for each company tier</p>
        </div>

        {/* Tier Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMPANY_TIERS.map(ct => {
            const eligible = eligibleForTier(ct.tier);
            return (
              <div key={ct.tier}
                onClick={() => setSelectedTier(selectedTier === ct.tier ? null : ct.tier)}
                className={`glass-card p-6 cursor-pointer transition-all border ${ct.bgColor} ${selectedTier === ct.tier ? 'ring-1 ring-offset-0' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{ct.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${ct.color}`}>{ct.tier}</p>
                    <p className="text-xs text-gray-500">PRS ≥ {ct.minPRS}{ct.minCoding > 0 ? ` · Coding ≥ ${ct.minCoding}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className={`text-3xl font-extrabold ${ct.color}`}>{eligible.length}</span>
                    <span className="text-gray-500 text-sm ml-1">students</span>
                  </div>
                  <div className="text-xs text-gray-600">{Math.round((eligible.length / allStudents.length) * 100)}% of batch</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Eligible Students for selected tier */}
        {selectedTier && (
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-4">
              Students Eligible for: <span className="text-brand-cyan">{selectedTier}</span>
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tierStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface/50 border border-brand-border/50">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 flex items-center justify-center text-xs font-bold text-white">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.department} · PRS: <span className="text-brand-cyan">{s.prs?.score.toFixed(1)}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Company Listings */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">Companies Hiring This Season</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {MOCK_COMPANIES.map((company, i) => {
              const tier = COMPANY_TIERS.find(t => t.tier === company.tier);
              const eligible = eligibleForTier(company.tier).length;
              return (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-brand-surface/50 border border-brand-border/50">
                  <div className="text-2xl">{company.logo}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{company.name}</p>
                    <p className={`text-xs ${tier?.color}`}>{company.tier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-400 font-semibold">{company.package}</p>
                    <p className="text-xs text-gray-500">{eligible} eligible</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
