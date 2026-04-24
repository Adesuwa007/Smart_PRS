'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SoftSkillsReportView from '@/components/dashboard/SoftSkillsReportView';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { analyzeSoftSkillResponses, type SoftSkillsReport } from '@/lib/soft-skills-engine';
import toast, { Toaster } from 'react-hot-toast';

const QUESTION = 'Tell me about yourself and your background.';
const TIMER_SECONDS = 45;
const MIN_SECONDS_FOR_BUTTON = 10; // Show "Generate Report" after 10s

/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any;

export default function SoftSkillsAnalyzerPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'recording' | 'analyzing' | 'results' | 'error'>('idle');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [results, setResults] = useState<SoftSkillsReport | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [canGenerate, setCanGenerate] = useState(false);

  const recRef = useRef<SR>(null);
  const finalRef = useRef('');
  // Accumulates fillers caught from interim STT (Chrome strips them from finals)
  const fillerSetRef = useRef<Set<string>>(new Set());
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const phaseRef = useRef<string>('idle');
  const generateReportRef = useRef<() => void>(() => {});

  const studentName = user?.name || 'Student';

  // Keep phase ref in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Cleanup on unmount
  useEffect(() => () => {
    stopEverything();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopEverything = useCallback(() => {
    if (recRef.current) { try { recRef.current.abort(); } catch {} recRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsListening(false);
  }, []);

  const wordCount = liveText.trim().split(/\s+/).filter(Boolean).length;

  // Generate report from captured speech
  const generateReport = useCallback(() => {
    const transcript = finalRef.current.trim() || liveText.trim();
    const wc = transcript.split(/\s+/).filter(Boolean).length;

    // Stop everything first
    if (recRef.current) { try { recRef.current.stop(); } catch {} recRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setIsListening(false);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);

    if (wc < 1) {
      setPhase('error');
      return;
    }

    setPhase('analyzing');
    // Snapshot fillers accumulated from interim results
    const preFillers = Array.from(fillerSetRef.current);
    setTimeout(() => {
      const responses = [{ question: QUESTION, answer: transcript }];
      const report = analyzeSoftSkillResponses(responses, preFillers);
      setResults(report);
      localStorage.setItem('latestMockInterviewScore', String(report.overallScore));
      toast.success(`✅ PRS Updated — Score: ${report.overallScore}`);
      if (user && !user.isDemo) {
        supabase.from('student_scores').update({ soft_skills: report.overallScore }).eq('student_id', user.id).then(() => {});
      }
      setPhase('results');
    }, 1500);
  }, [user, liveText]);

  // Keep ref in sync for timer callback
  useEffect(() => { generateReportRef.current = generateReport; }, [generateReport]);

  // When stream becomes available, attach to video element (handles async mount timing)
  useEffect(() => {
    if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Start session: ONE stream for both camera and mic
  const startSession = useCallback(async () => {
    // Reset state
    setLiveText(''); finalRef.current = ''; setResults(null);
    fillerSetRef.current = new Set(); // reset filler accumulator
    setCameraError(''); setCanGenerate(false);
    setTimeLeft(TIMER_SECONDS);

    try {
      // Single getUserMedia for both video + audio
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      // Attach immediately if ref already mounted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      setCameraActive(false);
      setCameraError('Camera/mic blocked. Click the 🔒 icon in address bar → Allow camera & mic.');
    }

    // Start speech recognition (uses browser's own mic access)
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.maxAlternatives = 1;

      // Filler regex — same patterns as engine, applied to raw STT before Chrome cleans it
      const INTERIM_FILLER_RE = /\b(um+|uh+|uhm+|umm+|hmm+|hm+|err+|erm|ah+|ahh+|ohh?|ouch|oops|ow|yikes|shoot|like|sort of|kind of|you know|i mean|basically|literally|okay so|right so|well so|actually|honestly|seriously|obviously|clearly|whatever|anyway|i guess|i suppose|to be honest|to be fair)\b/gi;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: SR) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalRef.current += t + ' ';
          } else {
            interim += t;
          }
          // Scan EVERY result (final + interim) for fillers BEFORE Chrome can clean them
          const fillerHits = t.match(INTERIM_FILLER_RE) || [];
          fillerHits.forEach((f: string) => fillerSetRef.current.add(f.toLowerCase()));
        }
        setLiveText(finalRef.current + interim);
      };
      rec.onerror = (e: SR) => {
        console.log('Speech error:', e.error);
        // Don't show errors to user — they see word count
      };
      rec.onend = () => {
        setIsListening(false);
        // Auto-restart if still recording
        if (phaseRef.current === 'recording') {
          setTimeout(() => {
            if (phaseRef.current === 'recording' && recRef.current === rec) {
              try { rec.start(); } catch { /* browser may block */ }
            }
          }, 300);
        }
      };

      recRef.current = rec;
      try { rec.start(); } catch { console.log('Could not start speech recognition'); }
    }

    setPhase('recording');

    // Start countdown
    let secondsElapsed = 0;
    countdownRef.current = setInterval(() => {
      secondsElapsed++;
      if (secondsElapsed >= MIN_SECONDS_FOR_BUTTON) {
        setCanGenerate(true);
      }
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          // Auto-generate when timer ends
          toast('⏱️ Time\'s up! Generating report...', { icon: '⏱️' });
          setTimeout(() => generateReportRef.current(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleRetry = () => {
    stopEverything();
    setPhase('idle'); setResults(null); setLiveText('');
    finalRef.current = ''; setCameraError(''); setCanGenerate(false);
    setTimeLeft(TIMER_SECONDS);
  };

  const wcColor = wordCount >= 20 ? 'text-emerald-400' : wordCount >= 10 ? 'text-yellow-400' : 'text-red-400';
  const wcIcon = wordCount >= 20 ? '✓' : wordCount >= 10 ? '~' : '✗';

  return (
    <DashboardLayout role="student" userName={studentName}>
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Soft Skills Analyzer 🎤</h1>
          <p className="text-sm text-gray-400 mt-1">1 question · 45 seconds · voice only</p>
        </div>

        {/* ═══ IDLE ═══ */}
        {phase === 'idle' && (
          <div className="glass-card p-8 text-center space-y-5">
            <div className="w-20 h-20 bg-brand-surface rounded-full flex items-center justify-center mx-auto border border-brand-border">
              <span className="text-4xl">🎤</span>
            </div>
            <h2 className="text-xl font-bold text-white">Mock Interview</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Answer one interview question using your voice. Your camera and mic will activate. You have 45 seconds.
            </p>
            <div className="glass-card p-4 mx-auto max-w-md border border-brand-cyan/20 bg-brand-cyan/5">
              <p className="text-xs text-brand-cyan font-bold uppercase tracking-wider mb-1">Question</p>
              <p className="text-base text-white font-semibold">{QUESTION}</p>
            </div>
            <button onClick={startSession} className="btn-primary py-4 px-10 text-lg shadow-lg shadow-brand-cyan/20">
              🎬 Start Recording
            </button>
          </div>
        )}

        {/* ═══ RECORDING ═══ */}
        {phase === 'recording' && (
          <div className="space-y-4">
            {/* BIG Camera — centered, main element */}
            <div className="relative mx-auto" style={{ maxWidth: '520px' }}>
              <div className="rounded-2xl overflow-hidden border-2 border-brand-cyan/50 bg-black relative" style={{ height: '360px' }}>
                {/* Video always rendered so ref is always mounted — hidden when no stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    display: cameraActive ? 'block' : 'none',
                  }}
                />
                {!cameraActive && (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm text-center p-4">
                    {cameraError || '📷 Camera loading...'}
                  </div>
                )}
                {/* Recording indicator */}
                {isListening && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-bold uppercase tracking-wider">REC</span>
                  </div>
                )}
                {/* Timer overlay */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className={`text-lg font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                    {timeLeft}s
                  </span>
                </div>
                {/* Word count overlay */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className={`text-sm font-bold ${wcColor}`}>
                    Words: {wordCount} {wcIcon}
                  </span>
                </div>
              </div>
            </div>

            {/* Timer bar */}
            <div className="mx-auto" style={{ maxWidth: '520px' }}>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-brand-cyan'}`}
                  style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%` }}
                />
              </div>
            </div>

            {/* Question below camera */}
            <div className="glass-card p-5 mx-auto text-center" style={{ maxWidth: '520px' }}>
              <p className="text-xs text-brand-cyan font-bold uppercase tracking-wider mb-2">Your Question</p>
              <p className="text-lg text-white font-semibold">{QUESTION}</p>
            </div>

            {/* Live transcript */}
            <div className="glass-card p-4 mx-auto" style={{ maxWidth: '520px' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isListening ? (
                    <><div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /><span className="text-xs text-red-400 font-semibold">Listening...</span></>
                  ) : (
                    <><div className="w-2.5 h-2.5 rounded-full bg-gray-600" /><span className="text-xs text-gray-500">Waiting...</span></>
                  )}
                </div>
                <span className={`text-sm font-bold ${wcColor}`}>
                  {wordCount} words {wcIcon}
                </span>
              </div>
              <div
                className="min-h-[60px] p-3 rounded-lg bg-black/30 border border-white/5 text-sm leading-relaxed font-mono"
                style={{ color: liveText ? '#fff' : '#555' }}
              >
                {liveText || '🎤 Your words will appear here as you speak...'}
              </div>
            </div>

            {/* Generate Report button — appears after MIN_SECONDS_FOR_BUTTON */}
            <div className="mx-auto text-center" style={{ maxWidth: '520px' }}>
              {canGenerate ? (
                <button
                  onClick={generateReport}
                  className="btn-primary py-3 px-8 text-base shadow-lg shadow-brand-cyan/20 w-full"
                >
                  📊 Generate Report →
                </button>
              ) : (
                <p className="text-xs text-gray-600">
                  Keep speaking... button appears in {Math.max(0, MIN_SECONDS_FOR_BUTTON - (TIMER_SECONDS - timeLeft))}s
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ ANALYZING ═══ */}
        {phase === 'analyzing' && (
          <div className="glass-card p-12 text-center space-y-4">
            <div className="w-14 h-14 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-brand-cyan font-semibold text-lg">Analyzing your response...</p>
            <p className="text-sm text-gray-500">Checking confidence, clarity, structure & filler words</p>
          </div>
        )}

        {/* ═══ ERROR — no speech detected ═══ */}
        {phase === 'error' && (
          <div className="glass-card p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
              <span className="text-3xl">🎙️</span>
            </div>
            <h2 className="text-xl font-bold text-white">We couldn&apos;t detect your voice</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Please check mic permissions in<br />
              <span className="text-white font-semibold">Chrome → address bar → 🔒 icon → Allow microphone</span>
            </p>
            <div className="glass-card p-4 mx-auto max-w-sm border border-yellow-500/20 bg-yellow-500/5">
              <p className="text-xs text-yellow-400 font-semibold mb-2">💡 Tips</p>
              <ul className="text-xs text-gray-400 space-y-1 text-left">
                <li>• Make sure your mic is not muted</li>
                <li>• Use Chrome or Edge for best results</li>
                <li>• Speak clearly and at normal volume</li>
                <li>• Check that no other app is using the mic</li>
              </ul>
            </div>
            <button onClick={handleRetry} className="btn-primary py-3 px-8 text-base shadow-lg shadow-brand-cyan/20">
              🔄 Try Again
            </button>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {phase === 'results' && results && (
          <>
            <div className="flex gap-3">
              <button onClick={handleRetry} className="btn-secondary flex-1 py-3">🔄 Try Again</button>
              <button className="btn-primary flex-1 py-3 cursor-default">PRS Updated ✅</button>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-5">📊 Analysis Report</h3>
              <SoftSkillsReportView report={results} studentName={studentName} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
