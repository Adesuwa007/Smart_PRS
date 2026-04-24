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
            <h1 className="text-2xl font-bold text-white">Resume Analyzer 🔍</h1>
            <p className="text-sm text-gray-400 mt-1">AI-powered resume feedback for campus placements.</p>
          </div>
          {!isPro ? (
            <div className="glass-card px-4 py-3 flex items-center gap-3 border border-brand-border">
              <div>
                <p className="text-xs text-gray-400">Free analyses used</p>
                <p className="text-base font-bold text-white">{usageCount} <span className="text-gray-500 font-normal">/ {FREE_LIMIT}</span></p>
              </div>
              <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-cyan rounded-full transition-all" style={{ width: `${(usageCount / FREE_LIMIT) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="badge badge-cyan">✓ Unlimited Analyses</div>
          )}
        </div>

        {/* Upload Zone */}
        <div
          className={`glass-card p-8 border-2 border-dashed text-center cursor-pointer transition-all ${fileName ? 'border-brand-cyan/40 bg-brand-cyan/5' : 'border-brand-border hover:border-brand-cyan/30'}`}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
          {fileName ? (
            <div className="space-y-2">
              <div className="text-3xl">📄</div>
              <p className="text-white font-semibold">{fileName}</p>
              <p className="text-xs text-brand-cyan">Resume loaded · Click to change</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl opacity-40">📂</div>
              <p className="text-gray-300 font-medium">Drag & drop your resume here</p>
              <p className="text-xs text-gray-500">Supports .txt, .pdf, .doc, .docx</p>
              <p className="text-xs text-gray-600 mt-2">Note: for best results, use .txt or copy-paste your resume text</p>
            </div>
          )}
        </div>

        {/* Paste fallback */}
        {!fileName && (
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 mb-2">Or paste your resume text directly:</p>
            <textarea
              value={resumeText}
              onChange={e => { setResumeText(e.target.value); setFileName(e.target.value ? 'Pasted text' : ''); }}
              className="input-dark w-full min-h-[120px] text-xs"
              placeholder="Paste your resume content here..."
            />
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !resumeText}
          className="btn-primary w-full py-4 text-base disabled:opacity-50 shadow-lg shadow-brand-cyan/10"
        >
          {analyzing ? '🔍 Analyzing...' : `🔍 Analyze Resume${!isPro ? ` (${usesLeft} left)` : ''}`}
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Score cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-6 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Overall Score</p>
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">
                  {result.overall_score}
                </div>
                <p className="text-gray-500 text-xs mt-1">/ 100</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">ATS Compatibility</p>
                <div className="text-5xl font-extrabold text-white">{result.ats_score}</div>
                <p className="text-gray-500 text-xs mt-1">/ 100</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-white mb-4">✅ Strengths</h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-400">
                      <span className="mt-0.5 shrink-0">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-white mb-4">⚠️ Areas to Improve</h3>
                <ul className="space-y-2">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-yellow-400">
                      <span className="mt-0.5 shrink-0">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing + Keyword gaps */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-white mb-4">🚫 Missing Sections</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missing_sections.length === 0
                    ? <p className="text-xs text-emerald-400">All key sections present! ✅</p>
                    : result.missing_sections.map((s, i) => (
                        <span key={i} className="badge badge-error text-xs">{s}</span>
                      ))}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-white mb-4">🔑 Keyword Gaps</h3>
                <div className="flex flex-wrap gap-2">
                  {result.keyword_gaps.map((k, i) => (
                    <span key={i} className="text-xs border border-brand-border px-2 py-1 rounded text-gray-400 hover:border-brand-cyan/40 transition">+ {k}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card p-6 border-brand-cyan/20 bg-brand-cyan/5">
              <p className="text-xs text-brand-cyan font-bold uppercase mb-2">💡 AI Assessment</p>
              <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Recommended Courses */}
            {result.recommended_courses.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-white mb-4">📚 Recommended Courses</h3>
                <div className="space-y-3">
                  {result.recommended_courses.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl bg-brand-dark/50 border border-brand-border flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">{c.skill}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.reason}</p>
                      </div>
                      <span className="text-[10px] text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded shrink-0">{c.platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgrade && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-sm w-full text-center animate-fade-in">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-white mb-2">Free Limit Reached</h2>
              <p className="text-sm text-gray-400 mb-6">You&apos;ve used all {FREE_LIMIT} free resume analyses. Upgrade to Pro for unlimited access.</p>
              <div className="space-y-3">
                <button className="btn-primary w-full py-3" onClick={() => { setShowUpgrade(false); window.location.href = '/dashboard/admin/settings'; }}>
                  ⚡ Upgrade to Pro
                </button>
                <button className="btn-secondary w-full py-2.5" onClick={() => setShowUpgrade(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
