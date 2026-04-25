'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getUsageCount, incrementUsage } from '@/lib/usage-tracker';
import toast, { Toaster } from 'react-hot-toast';

const FREE_LIMIT = 5;

interface AnalysisResult {
  overall_score: number;
  ats_score: number;
  strengths: string[];
  improvements: string[];
  missing_sections: string[];
  keyword_gaps: string[];
  summary: string;
  recommended_courses: Array<{ skill: string; reason: string; platform: string }>;
}

export default function ResumeAnalyzerPage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [usageCount, setUsageCount] = useState(0);
  const [fileName, setFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentScores, setStudentScores] = useState<any>(null);

  const isPro = user?.plan === 'pro' || user?.plan === 'enterprise';
  const usesLeft = Math.max(0, FREE_LIMIT - usageCount);

  useEffect(() => {
    if (!user) return;
    getUsageCount(user.id, 'resume_analyzer').then(setUsageCount);

    if (!user.isDemo) {
      supabase.from('student_scores').select('*').eq('student_id', user.id).single()
        .then(({ data }) => { if (data) setStudentScores(data); });
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setResumeText(ev.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setResumeText(ev.target?.result as string || '');
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!resumeText) { toast.error('Please upload your resume first.'); return; }
    if (!user) { toast.error('Please log in.'); return; }

    if (!isPro && usageCount >= FREE_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    setAnalyzing(true);
    try {
      const newCount = await incrementUsage(user.id, 'resume_analyzer');
      setUsageCount(newCount);

      const res = await fetch('/api/resume-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, studentScores }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        toast.success('Resume analyzed successfully!');
      } else {
        toast.error(data.error || 'Analysis failed.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardLayout role="student" userName={user?.name || 'Student'}>
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Resume Analyzer 🔍</h1>
            <p className="text-sm font-bold text-[#1A1035]/60 mt-1">AI-powered resume feedback for campus placements.</p>
          </div>
          {!isPro ? (
            <div className="bg-white border-4 border-[#1A1035] px-6 py-4 flex items-center gap-6 rounded-2xl shadow-[4px_4px_0px_#1A1035]">
              <div>
                <p className="text-[10px] font-black text-[#1A1035]/60 uppercase tracking-widest">Free analyses used</p>
                <p className="text-2xl font-black text-[#1A1035] mt-1">{usageCount} <span className="text-sm text-[#1A1035]/40 font-bold">/ {FREE_LIMIT}</span></p>
              </div>
              <div className="w-24 h-3 bg-[#F8F7FF] border-2 border-[#1A1035] rounded-full overflow-hidden">
                <div className="h-full bg-[#00C9A7] transition-all" style={{ width: `${(usageCount / FREE_LIMIT) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="bg-[#6C47FF] text-white px-4 py-2 text-sm font-black uppercase tracking-widest border-4 border-[#1A1035] rounded-xl shadow-[4px_4px_0px_#1A1035]">✓ Unlimited Analyses</div>
          )}
        </div>

        {/* Upload Zone */}
        <div
          className={`bg-white border-4 border-dashed p-10 text-center cursor-pointer transition-all rounded-2xl ${fileName ? 'border-[#00C9A7] bg-[#F8F7FF] shadow-[6px_6px_0px_#00C9A7]' : 'border-[#1A1035]/30 hover:border-[#1A1035] hover:shadow-[6px_6px_0px_#1A1035]'}`}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
          {fileName ? (
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">📄</div>
              <div>
                <p className="text-lg font-black text-[#1A1035]">{fileName}</p>
                <p className="text-xs font-bold text-[#00C9A7] uppercase tracking-widest mt-2">Resume loaded · Click to change</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl opacity-60">📂</div>
              <div>
                <p className="text-lg font-black text-[#1A1035] uppercase tracking-tight">Drag & drop your resume here</p>
                <p className="text-xs font-bold text-[#1A1035]/60 uppercase tracking-widest mt-2 mb-4">Supports .txt, .pdf, .doc, .docx</p>
                <p className="text-[10px] font-bold text-[#1A1035] bg-[#F8F7FF] inline-block px-3 py-1 rounded border-2 border-[#1A1035]">Note: for best results, use .txt or copy-paste your resume text</p>
              </div>
            </div>
          )}
        </div>

        {/* Paste fallback */}
        {!fileName && (
          <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
            <p className="text-xs font-black text-[#1A1035] uppercase tracking-widest mb-4">Or paste your resume text directly:</p>
            <textarea
              value={resumeText}
              onChange={e => { setResumeText(e.target.value); setFileName(e.target.value ? 'Pasted text' : ''); }}
              className="w-full bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1035] outline-none focus:border-[#6C47FF] focus:shadow-[4px_4px_0px_#6C47FF] transition-all min-h-[160px] resize-y"
              placeholder="Paste your resume content here..."
            />
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !resumeText}
          className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-5 px-8 rounded-2xl border-4 border-[#1A1035] shadow-[6px_6px_0px_#00C9A7] hover:shadow-[8px_8px_0px_#00C9A7] hover:-translate-y-1 transition-all disabled:opacity-50 w-full text-lg"
        >
          {analyzing ? '🔍 Analyzing...' : `🔍 Analyze Resume${!isPro ? ` (${usesLeft} left)` : ''}`}
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Score cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#6C47FF] text-white border-4 border-[#1A1035] p-8 text-center rounded-2xl shadow-[6px_6px_0px_#1A1035] transform -rotate-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl -mr-10 -mt-10"></div>
                <p className="text-xs font-black text-white/80 uppercase tracking-widest mb-4">Overall Score</p>
                <div className="text-7xl font-black bg-white text-[#1A1035] border-4 border-[#1A1035] rounded-2xl inline-block px-6 py-2 shadow-[4px_4px_0px_#1A1035] transform rotate-2">
                  {result.overall_score}
                </div>
                <p className="text-white/60 text-sm font-bold mt-4 uppercase tracking-widest">/ 100</p>
              </div>
              <div className="bg-[#00C9A7] text-[#1A1035] border-4 border-[#1A1035] p-8 text-center rounded-2xl shadow-[6px_6px_0px_#1A1035] transform rotate-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-xl -mr-10 -mt-10"></div>
                <p className="text-xs font-black text-[#1A1035]/80 uppercase tracking-widest mb-4">ATS Compatibility</p>
                <div className="text-7xl font-black bg-white text-[#1A1035] border-4 border-[#1A1035] rounded-2xl inline-block px-6 py-2 shadow-[4px_4px_0px_#1A1035] transform -rotate-2">
                  {result.ats_score}
                </div>
                <p className="text-[#1A1035]/60 text-sm font-bold mt-4 uppercase tracking-widest">/ 100</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
                <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4 flex items-center gap-2"><span className="text-xl bg-[#00C9A7] rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#1A1035]">✓</span> Strengths</h3>
                <ul className="space-y-4">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-bold text-[#1A1035]/80">
                      <span className="text-[#00C9A7] font-black mt-0.5">▶</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
                <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4 flex items-center gap-2"><span className="text-xl bg-[#FFB347] rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#1A1035]">⚠️</span> Areas to Improve</h3>
                <ul className="space-y-4">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-bold text-[#1A1035]/80">
                      <span className="text-[#FFB347] font-black mt-0.5">▶</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing + Keyword gaps */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
                <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4 flex items-center gap-2"><span className="text-xl bg-[#FF4D6D] text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#1A1035]">✕</span> Missing Sections</h3>
                <div className="flex flex-wrap gap-3">
                  {result.missing_sections.length === 0
                    ? <p className="text-xs font-black text-[#1A1035] bg-[#00C9A7] px-3 py-2 rounded-xl border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">All key sections present! ✅</p>
                    : result.missing_sections.map((s, i) => (
                        <span key={i} className="bg-[#FF4D6D] text-white px-3 py-1.5 font-black uppercase tracking-widest text-[10px] rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">{s}</span>
                      ))}
                </div>
              </div>
              <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
                <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4 flex items-center gap-2"><span className="text-xl bg-[#6C47FF] text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#1A1035]">🔑</span> Keyword Gaps</h3>
                <div className="flex flex-wrap gap-3">
                  {result.keyword_gaps.map((k, i) => (
                    <span key={i} className="text-xs font-black text-[#1A1035] border-2 border-[#1A1035] bg-[#F8F7FF] px-3 py-1.5 rounded shadow-[2px_2px_0px_#1A1035] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1035] transition-all">+ {k}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#1A1035] text-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#00C9A7] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C9A7] rounded-full blur-3xl -mr-16 -mt-16 opacity-30"></div>
              <p className="text-xs font-black text-[#00C9A7] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-xl bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">💡</span> AI Assessment</p>
              <p className="text-sm font-bold text-white/90 leading-relaxed pl-10">{result.summary}</p>
            </div>

            {/* Recommended Courses */}
            {result.recommended_courses.length > 0 && (
              <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
                <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4 flex items-center gap-2"><span className="text-xl bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">📚</span> Recommended Courses</h3>
                <div className="space-y-4">
                  {result.recommended_courses.map((c, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <p className="text-base font-black text-[#1A1035]">{c.skill}</p>
                        <p className="text-xs font-bold text-[#1A1035]/60 mt-1">{c.reason}</p>
                      </div>
                      <span className="text-[10px] font-black text-[#1A1035] uppercase tracking-widest border-2 border-[#1A1035] bg-white px-2 py-1 rounded shrink-0 shadow-[2px_2px_0px_#1A1035]">{c.platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgrade && (
          <div className="fixed inset-0 bg-[#1A1035]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#1A1035] p-8 max-w-sm w-full text-center animate-fade-in rounded-2xl shadow-[12px_12px_0px_#6C47FF]">
              <div className="text-6xl mb-6 animate-bounce">🔒</div>
              <h2 className="text-2xl font-black text-[#1A1035] uppercase tracking-tight mb-2">Free Limit Reached</h2>
              <p className="text-sm font-bold text-[#1A1035]/70 mb-8 leading-relaxed">You&apos;ve used all <span className="bg-[#1A1035] text-white px-2 py-0.5 rounded border-2 border-[#1A1035]">{FREE_LIMIT}</span> free resume analyses. Upgrade to Pro for unlimited access.</p>
              <div className="space-y-4">
                <button className="bg-[#6C47FF] text-white font-black uppercase tracking-wider w-full py-4 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all" onClick={() => { setShowUpgrade(false); window.location.href = '/dashboard/admin/settings'; }}>
                  ⚡ Upgrade to Pro
                </button>
                <button className="bg-white text-[#1A1035] font-black uppercase tracking-wider w-full py-3 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all" onClick={() => setShowUpgrade(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
