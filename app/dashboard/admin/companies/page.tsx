'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllStudentsWithScores } from '@/lib/mock-data';

const COMPANY_TIERS = [
  { tier: 'Product (FAANG-tier)', icon: '🏆', color: 'text-[#6C47FF]', bgColor: 'bg-[#F8F7FF] border-[#6C47FF]', minPRS: 80, minCoding: 75 },
  { tier: 'Service (Top)', icon: '⭐', color: 'text-[#00C9A7]', bgColor: 'bg-[#F8F7FF] border-[#00C9A7]', minPRS: 65, minCoding: 60 },
  { tier: 'Service (Mid)', icon: '🔵', color: 'text-[#FFB347]', bgColor: 'bg-[#F8F7FF] border-[#FFB347]', minPRS: 50, minCoding: 0 },
  { tier: 'Startups', icon: '🚀', color: 'text-[#FF4D6D]', bgColor: 'bg-[#F8F7FF] border-[#FF4D6D]', minPRS: 50, minCoding: 0 },
  { tier: 'Internships recommended first', icon: '📋', color: 'text-[#1A1035]', bgColor: 'bg-[#F8F7FF] border-[#1A1035]', minPRS: 0, minCoding: 0 },
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
    <DashboardLayout role="admin" userName="User">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Company Eligibility 🏢</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">See which students are eligible for each company tier</p>
        </div>

        {/* Tier Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMPANY_TIERS.map(ct => {
            const eligible = eligibleForTier(ct.tier);
            return (
              <div key={ct.tier}
                onClick={() => setSelectedTier(selectedTier === ct.tier ? null : ct.tier)}
                className={`bg-white border-4 p-6 cursor-pointer transition-all rounded-2xl ${selectedTier === ct.tier ? `shadow-none translate-y-1 ${ct.bgColor}` : 'border-[#1A1035] shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#1A1035]'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="w-12 h-12 bg-[#F8F7FF] border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] rounded-xl flex items-center justify-center text-2xl">{ct.icon}</span>
                  <div>
                    <p className={`text-base font-black uppercase tracking-tight ${selectedTier === ct.tier ? ct.color : 'text-[#1A1035]'}`}>{ct.tier}</p>
                    <p className="text-xs font-bold text-[#1A1035]/60 mt-0.5">PRS ≥ {ct.minPRS}{ct.minCoding > 0 ? ` · Coding ≥ ${ct.minCoding}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between border-t-4 border-[#1A1035]/10 pt-4">
                  <div>
                    <span className={`text-4xl font-black ${selectedTier === ct.tier ? ct.color : 'text-[#1A1035]'}`}>{eligible.length}</span>
                    <span className="text-[#1A1035]/50 font-bold text-sm ml-1 uppercase tracking-widest">students</span>
                  </div>
                  <div className="text-xs font-black text-[#1A1035]/60 bg-[#F8F7FF] px-2 py-1 border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] rounded-md">{Math.round((eligible.length / allStudents.length) * 100)}% of batch</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Eligible Students for selected tier */}
        {selectedTier && (
          <div className="bg-[#F8F7FF] border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
            <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4">
              Students Eligible for: <span className="text-[#6C47FF]">{selectedTier}</span>
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tierStudents.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-white border-2 border-[#1A1035] shadow-[4px_4px_0px_#1A1035]">
                  <div className="w-10 h-10 rounded-xl bg-[#00C9A7] border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] flex items-center justify-center text-lg font-black text-[#1A1035]">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#1A1035] truncate">{s.name}</p>
                    <p className="text-xs font-bold text-[#1A1035]/60 mt-0.5">{s.department} · PRS: <span className="text-[#00C9A7] font-black">{s.prs?.score.toFixed(1)}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Company Listings */}
        <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
          <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4">Companies Hiring This Season</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {MOCK_COMPANIES.map((company, i) => {
              const tier = COMPANY_TIERS.find(t => t.tier === company.tier);
              const eligible = eligibleForTier(company.tier).length;
              return (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1A1035] transition-all">
                  <div className="w-12 h-12 bg-white border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] rounded-xl flex items-center justify-center text-2xl">{company.logo}</div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-[#1A1035] uppercase tracking-tight">{company.name}</p>
                    <p className={`text-xs font-bold ${tier?.color || 'text-[#1A1035]/60'} mt-0.5 uppercase tracking-widest`}>{company.tier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base text-[#00C9A7] font-black bg-white px-2 py-0.5 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] inline-block">{company.package}</p>
                    <p className="text-xs font-bold text-[#1A1035]/50 mt-1 uppercase tracking-widest">{eligible} eligible</p>
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
