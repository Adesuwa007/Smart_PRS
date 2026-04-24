'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage, StudentScores } from '@/types';
import { generateCoachResponse } from '@/lib/ai-engine';

interface Props { scores: StudentScores; }

const QUICK_PROMPTS = [
  'Why is my PRS low?',
  'How do I get into product companies?',
  'Give me a 7-day improvement plan',
  'What should I study today?',
];

export default function SmartCoachChat({ scores }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    const response = generateCoachResponse(text, scores);
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
    setTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <>
      {/* FAB */}
      <button onClick={() => setOpen(!open)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-purple shadow-lg shadow-brand-cyan/20 flex items-center justify-center text-white text-xl hover:scale-105 transition-transform">
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] glass-card flex flex-col overflow-hidden animate-slide-up" style={{ borderRadius: '20px' }}>
          {/* Header */}
          <div className="p-4 border-b border-brand-border bg-gradient-to-r from-brand-cyan/10 to-brand-purple/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-sm font-semibold text-white">SmartCoach AI</p>
                <p className="text-[10px] text-brand-cyan flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span> Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">👋</p>
                <p className="text-sm text-gray-400 mb-4">Hi! I&apos;m your AI Placement Coach. Ask me anything about improving your scores.</p>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button key={i} onClick={() => sendMessage(prompt)} className="w-full text-left text-xs p-2.5 rounded-xl border border-brand-border hover:border-brand-cyan/40 hover:bg-brand-cyan/5 text-gray-300 transition-all">
                      💬 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-cyan/20 text-gray-200 rounded-br-md' : 'bg-brand-surface text-gray-300 rounded-bl-md border border-brand-border/50'}`}>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-brand-surface p-3 rounded-2xl rounded-bl-md border border-brand-border/50">
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-brand-border">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask SmartCoach..." className="input-dark flex-1 py-2 px-3 text-sm rounded-xl" />
              <button type="submit" className="btn-primary py-2 px-4 text-sm rounded-xl">→</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
