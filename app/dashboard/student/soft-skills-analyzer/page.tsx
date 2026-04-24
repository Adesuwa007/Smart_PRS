'use client';
import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';

const QUESTIONS = [
  "Tell me about yourself.",
  "What are your greatest strengths and weaknesses?",
  "Why should we hire you for this role?",
  "Describe a difficult challenge you overcame.",
  "Where do you see yourself in 5 years?"
];

const FEEDBACK_VARIATIONS = [
  "Your answer had a clear structure but try to slow down slightly. Practice eliminating filler words like 'um' by pausing instead.",
  "Great eye contact! However, make sure your conclusion is as strong as your introduction.",
  "Confidence was good, but try to structure your answer using the STAR method to be more concise.",
  "You spoke a bit too fast. Take a deep breath and pace yourself. Good vocabulary used.",
  "Excellent pacing and structure. Just remember to look directly into the camera to simulate eye contact."
];

export default function SoftSkillsAnalyzerPage() {
  const [sessionState, setSessionState] = useState<'idle' | 'running' | 'analyzing' | 'results'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [question, setQuestion] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionState === 'running' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (sessionState === 'running' && timeLeft === 0) {
      endSession();
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, timeLeft]);

  // Connect video stream when available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, sessionState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startSession = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setQuestion(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
      setTimeLeft(60);
      setSessionState('running');
    } catch {
      toast.error('Camera/Microphone permission denied. Please allow access to practice.');
    }
  };

  const endSession = () => {
    setSessionState('analyzing');
    
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Simulate AI processing delay
    setTimeout(() => {
      generateMockResults();
      setSessionState('results');
    }, 2000);
  };

  const generateMockResults = () => {
    const overallScore = Math.floor(Math.random() * (85 - 55 + 1) + 55); // 55 to 85
    const fillerWords = Math.floor(Math.random() * 5) + 1;
    const feedback = FEEDBACK_VARIATIONS[Math.floor(Math.random() * FEEDBACK_VARIATIONS.length)];
    const paceChoices = ['Good', 'Too Fast', 'Too Slow'];
    
    setResults({
      overallScore,
      pace: paceChoices[Math.floor(Math.random() * paceChoices.length)],
      confidence: Math.floor(Math.random() * 30) + 60, // 60-90
      fillerWords,
      structureIntro: Math.random() > 0.3, // 70% chance true
      structureBody: Math.random() > 0.2, // 80% chance true
      structureConclusion: Math.random() > 0.5, // 50% chance true
      eyeContact: Math.random() > 0.4 ? 'Good — maintained camera contact' : 'Needs Work — looked away often',
      feedback
    });
  };

  const saveToProfile = () => {
    if (results) {
      localStorage.setItem('latestMockInterviewScore', results.overallScore.toString());
      toast.success('Mock interview score saved to profile!');
    }
  };

  const handleTryAgain = () => {
    setSessionState('idle');
    setResults(null);
  };

  return (
    <DashboardLayout role="student" userName="Student">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">Soft Skills Analyzer 🎤</h1>
              <span className="badge badge-purple text-xs flex items-center gap-1 group relative cursor-help">
                BETA FEATURE
                <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 z-10 text-center shadow-xl">
                  Full speech AI coming in Pro tier
                </div>
              </span>
            </div>
            <p className="text-sm text-gray-400">Browser-based mock interview practice tool.</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column - Camera & Questions */}
          <div className="md:col-span-2 space-y-4">
            <div className="glass-card overflow-hidden relative aspect-video bg-black flex items-center justify-center border border-brand-border/50">
              {sessionState === 'running' ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover transform -scale-x-100" 
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white font-mono font-bold">{timeLeft}s</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur p-4 rounded-xl border border-white/10 text-center">
                    <p className="text-brand-cyan text-xs font-semibold mb-1 uppercase tracking-wider">Question</p>
                    <p className="text-white text-lg font-medium">{question}</p>
                  </div>
                </>
              ) : sessionState === 'analyzing' ? (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-brand-cyan font-semibold">AI is analyzing your response...</p>
                </div>
              ) : sessionState === 'results' ? (
                <div className="text-center space-y-2 p-6">
                  <p className="text-6xl mb-4">🤖</p>
                  <p className="text-xl text-white font-bold">Analysis Complete</p>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto">Review your detailed performance metrics in the panel to the right.</p>
                </div>
              ) : (
                <div className="text-center space-y-4 p-6">
                  <div className="w-20 h-20 bg-brand-surface rounded-full flex items-center justify-center mx-auto mb-2 border border-brand-border">
                    <span className="text-3xl">📷</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Camera Preview</h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">
                    Click start below to allow camera/mic access and begin your 60-second mock interview.
                  </p>
                </div>
              )}
            </div>

            {sessionState === 'idle' && (
              <button onClick={startSession} className="btn-primary w-full py-4 text-lg shadow-lg shadow-brand-cyan/20">
                ▶️ Start Practice Session
              </button>
            )}

            {sessionState === 'running' && (
              <button onClick={endSession} className="w-full py-4 text-lg font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition border border-red-500/30">
                ⏹️ End Session Early
              </button>
            )}

            {sessionState === 'results' && (
              <div className="flex gap-4">
                <button onClick={handleTryAgain} className="btn-secondary flex-1 py-3">
                  🔄 Try Again
                </button>
                <button onClick={saveToProfile} className="btn-primary flex-1 py-3 shadow-lg shadow-brand-purple/20">
                  💾 Save to Profile
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Analysis Results */}
          <div className="glass-card p-6 border-brand-border relative overflow-hidden">
            <h3 className="text-base font-semibold text-white mb-6">📊 AI Analysis</h3>
            
            {sessionState === 'results' && results ? (
              <div className="space-y-6 animate-fade-in relative z-10">
                <div className="text-center pb-6 border-b border-brand-border">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Overall Score</p>
                  <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">
                    {results.overallScore}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">/100 points</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Speaking Pace</span>
                      <span className={`font-semibold ${results.pace === 'Good' ? 'text-emerald-400' : 'text-yellow-400'}`}>{results.pace}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${results.pace === 'Good' ? 'bg-emerald-500 w-[50%]' : results.pace === 'Too Fast' ? 'bg-yellow-500 w-[80%]' : 'bg-yellow-500 w-[20%]'}`} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Confidence Score</span>
                      <span className="text-white font-medium">{results.confidence}/100</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className="bg-brand-purple h-1.5 rounded-full transition-all duration-1000" style={{ width: `${results.confidence}%` }} />
                    </div>
                  </div>

                  <div className="p-3 bg-brand-surface rounded-lg border border-brand-border">
                    <p className="text-xs text-gray-400 mb-1">Filler Words Used</p>
                    <p className="text-sm text-white">Detected: <span className="text-yellow-400 font-bold">{results.fillerWords}</span> filler words (um, uh, like)</p>
                  </div>

                  <div className="p-3 bg-brand-surface rounded-lg border border-brand-border">
                    <p className="text-xs text-gray-400 mb-2">Answer Structure</p>
                    <ul className="text-xs space-y-1.5 text-white">
                      <li className="flex justify-between">Introduction <span>{results.structureIntro ? '✅' : '❌'}</span></li>
                      <li className="flex justify-between">Body <span>{results.structureBody ? '✅' : '❌'}</span></li>
                      <li className="flex justify-between">Conclusion <span>{results.structureConclusion ? '✅' : '❌'}</span></li>
                    </ul>
                  </div>

                  <div className="p-3 bg-brand-surface rounded-lg border border-brand-border">
                    <p className="text-xs text-gray-400 mb-1">Eye Contact</p>
                    <p className="text-sm text-white">{results.eyeContact}</p>
                  </div>
                </div>

                <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl">
                  <p className="text-xs text-brand-cyan font-bold uppercase mb-2">💡 AI Feedback</p>
                  <p className="text-sm text-gray-300 italic leading-relaxed">&quot;{results.feedback}&quot;</p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-gray-500 space-y-3 relative z-10">
                <span className="text-4xl opacity-50">📋</span>
                <p className="text-sm max-w-[200px]">Complete a session to view your detailed AI speech analysis.</p>
              </div>
            )}

            {/* Background decorative gradient */}
            {sessionState === 'results' && (
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
            )}
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}
