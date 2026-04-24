'use client';
import { Recommendation, WeakArea } from '@/types';
import { COURSE_MAP } from '@/lib/course-recommendations';

interface Props { recommendations: Recommendation[]; companyTiers: string[]; areas?: WeakArea[]; }

export default function RecommendationsPanel({ recommendations, companyTiers, areas = [] }: Props) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-base font-semibold text-white mb-4">🎯 Recommended Actions</h3>
      <div className="space-y-3 mb-6">
        {recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-brand-dark/50 border border-brand-border/50 hover:border-brand-cyan/20 transition-all">
            <span className="text-xl mt-0.5">{rec.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{rec.title}</p>
                <span className="badge badge-cyan text-[10px] shrink-0">{rec.impact}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-brand-border">
        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Company Tier Eligible For</p>
        <div className="flex flex-wrap gap-2">
          {companyTiers.map((tier, i) => (
            <span key={i} className="badge badge-purple text-xs">{tier}</span>
          ))}
        </div>
      </div>

      {/* Recommended Courses Section */}
      {areas.length > 0 && (
        <div className="mt-6 pt-6 border-t border-brand-border">
          <h4 className="text-sm font-semibold text-white mb-3">📚 Recommended Courses</h4>
          {areas.filter(a => a.score < 65).length === 0 ? (
            <div>
              <p className="text-xs text-brand-cyan mb-3">Great job! Explore advanced courses:</p>
              <div className="space-y-3">
                {COURSE_MAP.advanced.map((course, i) => (
                  <a key={i} href={course.url} target="_blank" rel="noreferrer" className="block p-3 rounded-xl bg-brand-dark/50 border border-brand-border hover:border-brand-cyan/30 transition-all group">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-white group-hover:text-brand-cyan transition-colors">{course.title}</p>
                      <span className="badge badge-purple text-[10px] whitespace-nowrap">{course.price === 'Free' ? 'FREE' : course.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span>{course.platform === 'Udemy' ? '📚' : course.platform === 'Coursera' ? '🎓' : course.platform === 'NPTEL' ? '🇮🇳' : '📺'} {course.platform}</span>
                      <span>•</span>
                      <span>{course.duration}</span>
                      <span>•</span>
                      <span>{course.level}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {course.affiliate && <span className="text-[9px] text-gray-600 border border-gray-700 px-1 rounded uppercase">Sponsored</span>}
                      <button className="text-xs font-semibold text-brand-cyan group-hover:underline ml-auto">Enroll Now →</button>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {areas.filter(a => a.score < 65).map((area, i) => {
                const skillKey = area.skill === 'Aptitude' ? 'aptitude' :
                                 area.skill === 'Coding' ? 'coding' :
                                 area.skill === 'Core Subjects' ? 'core_subjects' :
                                 area.skill === 'Soft Skills' ? 'soft_skills' : null;
                
                const courses = skillKey ? COURSE_MAP[skillKey] : [];
                if (!courses || courses.length === 0) return null;

                return (
                  <div key={i}>
                    <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">{area.skill} Courses</p>
                    <div className="space-y-2">
                      {courses.map((course, j) => (
                        <a key={j} href={course.url} target="_blank" rel="noreferrer" className="block p-3 rounded-xl bg-brand-dark/50 border border-brand-border hover:border-brand-cyan/30 transition-all group">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium text-white group-hover:text-brand-cyan transition-colors">{course.title}</p>
                            {course.price === 'Free' ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">FREE</span>
                            ) : (
                              <span className="badge badge-purple text-[10px] whitespace-nowrap">{course.price}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <span>{course.platform === 'Udemy' ? '📚' : course.platform === 'Coursera' ? '🎓' : course.platform === 'NPTEL' ? '🇮🇳' : '📺'} {course.platform}</span>
                            <span>•</span>
                            <span>{course.duration}</span>
                            <span>•</span>
                            <span>{course.level}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            {course.affiliate ? <span className="text-[9px] text-gray-600 border border-gray-700 px-1 rounded uppercase">Sponsored</span> : <div/>}
                            <button className="text-xs font-semibold text-brand-cyan group-hover:underline">Enroll Now →</button>
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
