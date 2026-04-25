'use client';
import { WeakArea } from '@/types';
import { COURSE_MAP } from '@/lib/course-recommendations';

interface Props { areas: WeakArea[]; }

export default function WeakAreasPanel({ areas }: Props) {
  const filtered = areas.filter(a => a.severity !== 'good');

  return (
    <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
      <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight mb-4 border-b-4 border-[#1A1035]/10 pb-4">⚡ Weak Areas</h3>
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-2xl mb-2">🏆</p>
          <p className="text-sm text-gray-400">All areas are strong! Keep it up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((area, i) => (
            <div key={i} className={`p-4 rounded-xl border-4 shadow-[4px_4px_0px_#1A1035] ${area.severity === 'critical' ? 'border-[#1A1035] bg-[#FF4D6D] text-white critical-pulse' : 'border-[#1A1035] bg-[#FFB347] text-[#1A1035]'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black uppercase tracking-tight">{area.skill}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border-2 border-[#1A1035] bg-white ${area.severity === 'critical' ? 'text-[#FF4D6D]' : 'text-[#1A1035]'}`}>
                  {area.score}/100 · {area.severity === 'critical' ? 'Critical' : 'Needs Work'}
                </span>
              </div>
              <p className={`text-xs font-bold ${area.severity === 'critical' ? 'text-white/90' : 'text-[#1A1035]/80'}`}>{area.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Courses Section */}
      <div className="mt-8 pt-6 border-t-4 border-[#1A1035]/10">
        <h4 className="text-sm font-black text-[#1A1035] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-lg bg-[#00C9A7] rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#1A1035]">📚</span> Recommended Courses</h4>
        {filtered.length === 0 ? (
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
          <div className="space-y-4">
            {filtered.map((area, i) => {
              // Map skill name to COURSE_MAP key
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
    </div>
  );
}
