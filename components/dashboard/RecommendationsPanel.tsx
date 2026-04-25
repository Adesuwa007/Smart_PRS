'use client';
import { Recommendation, WeakArea } from '@/types';
import { COURSE_MAP } from '@/lib/course-recommendations';

interface Props { recommendations: Recommendation[]; companyTiers: string[]; areas?: WeakArea[]; }

export default function RecommendationsPanel({ recommendations, companyTiers, areas = [] }: Props) {
  return (
    <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
      <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight mb-4 border-b-4 border-[#1A1035]/10 pb-4">🎯 Recommended Actions</h3>
      <div className="space-y-4 mb-6">
        {recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-0.5 transition-all">
            <span className="text-2xl mt-0.5 bg-white border-2 border-[#1A1035] w-10 h-10 flex items-center justify-center rounded-full shadow-[2px_2px_0px_#1A1035]">{rec.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-black text-[#1A1035]">{rec.title}</p>
                <span className="bg-[#00C9A7] text-[#1A1035] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded border-2 border-[#1A1035] shrink-0">{rec.impact}</span>
              </div>
              <p className="text-xs font-bold text-[#1A1035]/70">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-6 border-t-4 border-[#1A1035]/10">
        <p className="text-[10px] text-[#1A1035]/60 mb-3 font-black uppercase tracking-widest">Company Tier Eligible For</p>
        <div className="flex flex-wrap gap-2">
          {companyTiers.map((tier, i) => (
            <span key={i} className="bg-[#6C47FF] text-white border-2 border-[#1A1035] px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded shadow-[2px_2px_0px_#1A1035]">{tier}</span>
          ))}
        </div>
      </div>

      {/* Recommended Courses Section */}
      {areas.length > 0 && (
        <div className="mt-8 pt-6 border-t-4 border-[#1A1035]/10">
          <h4 className="text-sm font-black text-[#1A1035] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-lg bg-[#00C9A7] rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#1A1035]">📚</span> Recommended Courses</h4>
          {areas.filter(a => a.score < 65).length === 0 ? (
            <div>
              <p className="text-xs font-bold text-[#1A1035]/60 mb-4 uppercase tracking-widest">Great job! Explore advanced courses:</p>
              <div className="space-y-4">
                {COURSE_MAP.advanced.map((course, i) => (
                  <a key={i} href={course.url} target="_blank" rel="noreferrer" className="block p-4 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-black text-[#1A1035] group-hover:text-[#6C47FF] transition-colors">{course.title}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest border-2 border-[#1A1035] bg-white text-[#1A1035] px-2 py-0.5 rounded shadow-[2px_2px_0px_#1A1035]">{course.price === 'Free' ? 'FREE' : course.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#1A1035]/60 mb-3 uppercase tracking-widest">
                      <span>{course.platform === 'Udemy' ? '📚' : course.platform === 'Coursera' ? '🎓' : course.platform === 'NPTEL' ? '🇮🇳' : '📺'} {course.platform}</span>
                      <span>•</span>
                      <span>{course.duration}</span>
                      <span>•</span>
                      <span>{course.level}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-[#1A1035]/10">
                      {course.affiliate && <span className="text-[8px] font-black text-[#1A1035]/40 border-2 border-[#1A1035]/20 px-1.5 py-0.5 rounded uppercase">Sponsored</span>}
                      <button className="text-xs font-black text-[#6C47FF] group-hover:underline ml-auto uppercase tracking-wider">Enroll Now →</button>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {areas.filter(a => a.score < 65).map((area, i) => {
                const skillKey = area.skill === 'Aptitude' ? 'aptitude' :
                                 area.skill === 'Coding' ? 'coding' :
                                 area.skill === 'Core Subjects' ? 'core_subjects' :
                                 area.skill === 'Soft Skills' ? 'soft_skills' : null;
                
                const courses = skillKey ? COURSE_MAP[skillKey] : [];
                if (!courses || courses.length === 0) return null;

                return (
                  <div key={i} className="mb-6 last:mb-0">
                    <p className="text-[10px] font-black text-[#1A1035]/50 mb-3 uppercase tracking-widest">{area.skill} Courses</p>
                    <div className="space-y-4">
                      {courses.map((course, j) => (
                        <a key={j} href={course.url} target="_blank" rel="noreferrer" className="block p-4 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-0.5 transition-all group">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-black text-[#1A1035] group-hover:text-[#6C47FF] transition-colors pr-4">{course.title}</p>
                            {course.price === 'Free' ? (
                              <span className="bg-[#00C9A7] text-[#1A1035] border-2 border-[#1A1035] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#1A1035]">FREE</span>
                            ) : (
                              <span className="bg-white text-[#1A1035] border-2 border-[#1A1035] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#1A1035] whitespace-nowrap">{course.price}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#1A1035]/60 mb-3 uppercase tracking-widest">
                            <span>{course.platform === 'Udemy' ? '📚' : course.platform === 'Coursera' ? '🎓' : course.platform === 'NPTEL' ? '🇮🇳' : '📺'} {course.platform}</span>
                            <span>•</span>
                            <span>{course.duration}</span>
                            <span>•</span>
                            <span>{course.level}</span>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-[#1A1035]/10">
                            {course.affiliate ? <span className="text-[8px] font-black text-[#1A1035]/40 border-2 border-[#1A1035]/20 px-1.5 py-0.5 rounded uppercase">Sponsored</span> : <div/>}
                            <button className="text-xs font-black text-[#6C47FF] group-hover:underline uppercase tracking-wider">Enroll Now →</button>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
