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


  return (
    <DashboardLayout role="student" userName={studentName}>
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <div>
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Soft Skills Analyzer 🎤</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">1 question · 45 seconds · voice only</p>
        </div>

        {/* ═══ IDLE ═══ */}
        {phase === 'idle' && (
          <div className="bg-white border-4 border-[#1A1035] p-8 sm:p-12 text-center rounded-2xl shadow-[8px_8px_0px_#1A1035] space-y-6">
            <div className="w-24 h-24 bg-[#F8F7FF] rounded-full flex items-center justify-center mx-auto border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035]">
              <span className="text-5xl animate-bounce">🎤</span>
            </div>
            <h2 className="text-2xl font-black text-[#1A1035] uppercase tracking-tight">Mock Interview</h2>
            <p className="text-sm font-bold text-[#1A1035]/70 max-w-md mx-auto leading-relaxed">
              Answer one interview question using your voice. Your camera and mic will activate. You have 45 seconds.
            </p>
            <div className="bg-[#1A1035] text-white border-4 border-[#1A1035] p-6 rounded-xl mx-auto max-w-md shadow-[6px_6px_0px_#00C9A7] transform -rotate-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C9A7] rounded-full blur-xl -mr-10 -mt-10 opacity-30"></div>
              <p className="text-[10px] font-black text-[#00C9A7] uppercase tracking-widest mb-2 relative z-10">Question</p>
              <p className="text-lg font-black text-white relative z-10 leading-relaxed">{QUESTION}</p>
            </div>
            <button onClick={startSession} className="bg-[#00C9A7] text-[#1A1035] font-black uppercase tracking-wider py-4 px-10 rounded-xl border-4 border-[#1A1035] shadow-[6px_6px_0px_#1A1035] hover:shadow-[8px_8px_0px_#1A1035] hover:-translate-y-1 transition-all text-lg mt-4 inline-block">
              🎬 Start Recording
            </button>
          </div>
        )}

        {/* ═══ RECORDING ═══ */}
        {phase === 'recording' && (
          <div className="space-y-6">
            {/* BIG Camera — centered, main element */}
            <div className="relative mx-auto bg-white border-4 border-[#1A1035] rounded-2xl shadow-[8px_8px_0px_#1A1035] p-2" style={{ maxWidth: '520px' }}>
              <div className="rounded-xl overflow-hidden bg-black relative border-2 border-[#1A1035]" style={{ height: '360px' }}>
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
                  <div className="flex items-center justify-center h-full text-white/50 text-sm font-bold text-center p-4">
                    {cameraError || '📷 Camera loading...'}
                  </div>
                )}
                {/* Recording indicator */}
                {isListening && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#1A1035] px-3 py-1.5 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#FF4D6D]">
                    <div className="w-3 h-3 rounded-full bg-[#FF4D6D] animate-pulse border border-white" />
                    <span className="text-xs text-white font-black uppercase tracking-widest">REC</span>
                  </div>
                )}
                {/* Timer overlay */}
                <div className="absolute top-4 right-4 bg-white border-2 border-[#1A1035] px-4 py-1.5 rounded shadow-[2px_2px_0px_#1A1035]">
                  <span className={`text-lg font-black ${timeLeft <= 10 ? 'text-[#FF4D6D]' : 'text-[#1A1035]'}`}>
                    {timeLeft}s
                  </span>
                </div>
                {/* Word count overlay */}
                <div className="absolute bottom-4 left-4 bg-white border-2 border-[#1A1035] px-3 py-1.5 rounded shadow-[2px_2px_0px_#1A1035]">
                  <span className={`text-xs font-black uppercase tracking-widest ${wordCount >= 20 ? 'text-[#00C9A7]' : wordCount >= 10 ? 'text-[#FFB347]' : 'text-[#FF4D6D]'}`}>
                    Words: {wordCount} {wordCount >= 20 ? '✓' : wordCount >= 10 ? '~' : '✕'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timer bar */}
            <div className="mx-auto" style={{ maxWidth: '520px' }}>
              <div className="h-3 bg-white border-2 border-[#1A1035] rounded-full overflow-hidden shadow-[2px_2px_0px_#1A1035]">
                <div
                  className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-[#FF4D6D]' : 'bg-[#6C47FF]'}`}
                  style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%` }}
                />
              </div>
            </div>

            {/* Question below camera */}
            <div className="bg-[#1A1035] text-white border-4 border-[#1A1035] p-6 rounded-xl mx-auto text-center shadow-[6px_6px_0px_#00C9A7] relative overflow-hidden" style={{ maxWidth: '520px' }}>
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C9A7] rounded-full blur-xl -mr-10 -mt-10 opacity-30"></div>
              <p className="text-[10px] font-black text-[#00C9A7] uppercase tracking-widest mb-2 relative z-10">Your Question</p>
              <p className="text-lg font-black text-white relative z-10 leading-relaxed">{QUESTION}</p>
            </div>

            {/* Live transcript */}
            <div className="bg-white border-4 border-[#1A1035] p-6 rounded-xl mx-auto shadow-[6px_6px_0px_#1A1035]" style={{ maxWidth: '520px' }}>
              <div className="flex items-center justify-between mb-4 border-b-4 border-[#1A1035]/10 pb-4">
                <div className="flex items-center gap-2">
                  {isListening ? (
                    <><div className="w-3 h-3 rounded-full bg-[#FF4D6D] border border-[#1A1035] animate-pulse" /><span className="text-xs font-black text-[#1A1035] uppercase tracking-widest">Listening...</span></>
                  ) : (
                    <><div className="w-3 h-3 rounded-full bg-[#1A1035]/30 border border-[#1A1035]" /><span className="text-xs font-black text-[#1A1035]/60 uppercase tracking-widest">Waiting...</span></>
                  )}
                </div>
                <span className={`text-xs font-black uppercase tracking-widest bg-[#F8F7FF] px-2 py-1 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] ${wordCount >= 20 ? 'text-[#00C9A7]' : wordCount >= 10 ? 'text-[#FFB347]' : 'text-[#FF4D6D]'}`}>
                  {wordCount} words {wordCount >= 20 ? '✓' : wordCount >= 10 ? '~' : '✕'}
                </span>
              </div>
              <div
                className="min-h-[80px] p-4 rounded-xl bg-[#F8F7FF] border-2 border-[#1A1035] text-sm font-bold leading-relaxed"
                style={{ color: liveText ? '#1A1035' : 'rgba(26, 16, 53, 0.4)' }}
              >
                {liveText || '🎤 Your words will appear here as you speak...'}
              </div>
            </div>

            {/* Generate Report button — appears after MIN_SECONDS_FOR_BUTTON */}
            <div className="mx-auto text-center mt-6" style={{ maxWidth: '520px' }}>
              {canGenerate ? (
                <button
                  onClick={generateReport}
                  className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-4 px-8 rounded-xl border-4 border-[#1A1035] shadow-[6px_6px_0px_#6C47FF] hover:shadow-[8px_8px_0px_#6C47FF] hover:-translate-y-1 transition-all w-full text-lg"
                >
                  📊 Generate Report →
                </button>
              ) : (
                <p className="text-[10px] font-black text-[#1A1035]/50 uppercase tracking-widest">
                  Keep speaking... button appears in <span className="bg-white text-[#1A1035] px-1 rounded border border-[#1A1035]">{Math.max(0, MIN_SECONDS_FOR_BUTTON - (TIMER_SECONDS - timeLeft))}s</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ ANALYZING ═══ */}
        {phase === 'analyzing' && (
          <div className="bg-white border-4 border-[#1A1035] p-12 text-center space-y-6 rounded-2xl shadow-[8px_8px_0px_#1A1035] max-w-md mx-auto">
            <div className="w-16 h-16 border-8 border-[#00C9A7] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xl font-black text-[#1A1035] uppercase tracking-tight">Analyzing your response...</p>
            <p className="text-sm font-bold text-[#1A1035]/60">Checking confidence, clarity, structure & filler words</p>
          </div>
        )}

        {/* ═══ ERROR — no speech detected ═══ */}
        {phase === 'error' && (
          <div className="bg-white border-4 border-[#1A1035] p-8 sm:p-12 text-center rounded-2xl shadow-[8px_8px_0px_#FF4D6D] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#FF4D6D]"></div>
            <div className="w-20 h-20 bg-[#FF4D6D] rounded-full flex items-center justify-center mx-auto border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035]">
              <span className="text-4xl">🎙️</span>
            </div>
            <h2 className="text-2xl font-black text-[#1A1035] uppercase tracking-tight">We couldn&apos;t detect your voice</h2>
            <p className="text-sm font-bold text-[#1A1035]/70 max-w-md mx-auto leading-relaxed">
              Please check mic permissions in<br />
              <span className="text-[#1A1035] font-black bg-[#F8F7FF] px-2 py-1 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] inline-block mt-2">Chrome → address bar → 🔒 icon → Allow microphone</span>
            </p>
            <div className="bg-[#F8F7FF] border-4 border-[#1A1035] p-6 mx-auto max-w-sm rounded-xl text-left shadow-[4px_4px_0px_#FFB347]">
              <p className="text-xs font-black text-[#1A1035] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-lg bg-[#FFB347] rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#1A1035]">💡</span> Tips</p>
              <ul className="text-xs font-bold text-[#1A1035]/70 space-y-3">
                <li className="flex items-start gap-2"><span className="text-[#00C9A7] font-black">▶</span> Make sure your mic is not muted</li>
                <li className="flex items-start gap-2"><span className="text-[#00C9A7] font-black">▶</span> Use Chrome or Edge for best results</li>
                <li className="flex items-start gap-2"><span className="text-[#00C9A7] font-black">▶</span> Speak clearly and at normal volume</li>
                <li className="flex items-start gap-2"><span className="text-[#00C9A7] font-black">▶</span> Check that no other app is using the mic</li>
              </ul>
            </div>
            <button onClick={handleRetry} className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-4 px-10 rounded-xl border-4 border-[#1A1035] shadow-[6px_6px_0px_#1A1035] hover:shadow-[8px_8px_0px_#1A1035] hover:-translate-y-1 transition-all text-base mt-4 inline-block">
              🔄 Try Again
            </button>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {phase === 'results' && results && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleRetry} className="flex-1 bg-white text-[#1A1035] font-black uppercase tracking-wider py-4 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all">🔄 Try Again</button>
              <button className="flex-1 bg-[#00C9A7] text-[#1A1035] font-black uppercase tracking-wider py-4 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] cursor-default text-center">PRS Updated ✅</button>
            </div>
            <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
              <h3 className="text-xl font-black text-[#1A1035] uppercase tracking-tight mb-8 border-b-4 border-[#1A1035]/10 pb-4">📊 Analysis Report</h3>
              <SoftSkillsReportView report={results} studentName={studentName} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
